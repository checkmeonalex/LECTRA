const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const PORTAL = 'https://portal.yabatech.edu.ng/portalplus';
const UA = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36';

// ── helpers ────────────────────────────────────────────────────────────────

function extractSession(cookieHeader) {
  if (!cookieHeader) return '';
  const raw = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
  const m = raw.match(/PHPSESSID=([^;,\s]+)/);
  return m ? `PHPSESSID=${m[1]}` : '';
}

function extractFormToken(html) {
  const m = html.match(/name=["']form_token["'][^>]*value=["']([^"']+)["']/i)
    || html.match(/value=["']([^"']+)["'][^>]*name=["']form_token["']/i);
  return m ? m[1] : '';
}

function extractCsrfToken(html) {
  const m = html.match(/<meta[^>]*name=["']csrf-token["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/content=["']([^"']+)["'][^>]*name=["']csrf-token["']/i);
  return m ? m[1] : '';
}

function cleanText(raw) {
  return raw.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&ensp;/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── biodata parser ─────────────────────────────────────────────────────────
// Handles the ?pg=biodata page — rows of <td>label</td><th>value</th>

function parseBiodata(html) {
  const fields = [];
  const seen = new Set();
  const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  for (const row of rows) {
    const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    if (cells.length < 2) continue;
    const vals = cells.map(cleanText).filter(Boolean);
    if (vals.length < 2) continue;
    const label = vals[0];
    const value = vals[1];
    if (label === value || /^\d+$/.test(label) || seen.has(label)) continue;
    seen.add(label);
    fields.push({ label, value });
  }

  // fallback: positional <th> values
  const thValues = (html.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [])
    .map(cleanText).filter(Boolean);

  return { fields, thValues };
}

// ── home page status parser ────────────────────────────────────────────────
// Reads the ?pg=home sidebar: <small>Label</small> ... <b>Value</b> blocks

function parseHomeStatus(html) {
  const status = {};
  const blocks = html.match(/<div>\s*<small>[\s\S]*?<\/div>/gi) || [];
  for (const block of blocks) {
    const labelM = block.match(/<small>([^<]+)<\/small>/i);
    const valueM = block.match(/<b>([\s\S]*?)<\/b>/i);
    if (!labelM || !valueM) continue;
    const label = labelM[1].replace(':', '').trim();
    const value = cleanText(valueM[1]);
    if (label && value) status[label] = value;
  }
  return status;
}

// ── semester link extractor ────────────────────────────────────────────────
// Reads the ?pg=print-courses-registered table and returns the href of the
// most recent semester (first row in the table).

function extractFirstCourseLink(html) {
  const m = html.match(/href=['"]([^'"]*pg=print-out-course-reg[^'"]*)['"]/i);
  if (!m) return null;
  // href is relative like ?pg=print-out-course-reg&session=...&semester=...
  return PORTAL + '/' + m[1];
}

// ── course page parser ─────────────────────────────────────────────────────
// Reads the ?pg=print-out-course-reg page.
// Courses are <td class='bio'> cells in groups of 4:
//   COURSE CODE | COURSE TITLE | STATUS | UNIT

function parseCourseRegPage(html) {
  // extract all bio cells
  const cells = (html.match(/<td class='bio'[^>]*>([\s\S]*?)<\/td>/gi) || [])
    .map(cleanText)
    .filter(Boolean);

  const courses = [];
  for (let i = 0; i + 4 <= cells.length; i += 4) {
    courses.push({
      code:   cells[i],
      title:  cells[i + 1],
      status: cells[i + 2] === 'C' ? 'Compulsory' : cells[i + 2] === 'E' ? 'Elective' : cells[i + 2],
      unit:   cells[i + 3],
    });
  }

  // total units
  const totalMatch = html.match(/TOTAL UNITS[:\s]*(\d+)/i);
  const totalUnits = totalMatch ? Number(totalMatch[1]) : null;

  // semester info from the print page header table
  const infoFields = {};
  const infoRows = html.match(/<li class="bio_print">([^<]+)<\/td>[\s\S]*?<b class="bio_print">([^<]+)<\/b>/gi) || [];
  for (const row of infoRows) {
    const labelM = row.match(/<li class="bio_print">([^<]+)<\/td>/i);
    const valueM = row.match(/<b class="bio_print">([^<]+)<\/b>/i);
    if (labelM && valueM) {
      infoFields[labelM[1].replace(':', '').trim()] = valueM[1].trim();
    }
  }

  return { courses, totalUnits, infoFields };
}

// ── route ──────────────────────────────────────────────────────────────────

app.post('/login', async (req, res) => {
  const { matric_number, password } = req.body;
  if (!matric_number || !password)
    return res.status(400).json({ message: 'matric_number and password are required.' });

  try {
    // Step 1 — get login page
    const pageRes = await axios.get(`${PORTAL}/`, { headers: { 'User-Agent': UA } });
    let session = extractSession(pageRes.headers['set-cookie']);
    const formToken = extractFormToken(pageRes.data);
    const csrfToken = extractCsrfToken(pageRes.data);

    // Step 2 — POST credentials
    const params = new URLSearchParams({ matric_number, password });
    if (formToken) params.append('form_token', formToken);

    const loginRes = await axios.post(`${PORTAL}/controller/Login.php`, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        ...(session ? { Cookie: session } : {}),
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
      },
      maxRedirects: 5, validateStatus: () => true,
    });

    const newSession = extractSession(loginRes.headers['set-cookie']);
    if (newSession) session = newSession;

    if (loginRes.data?.error)
      return res.status(401).json({ message: loginRes.data.error });
    if (JSON.stringify(loginRes.data).includes('"success":false'))
      return res.status(401).json({ message: 'Invalid matric number or password.' });
    if (!session)
      return res.status(401).json({ message: 'Login failed — no session returned.' });

    // Step 3 — fetch biodata + home + course list page in parallel
    const headers = { 'User-Agent': UA, Cookie: session };
    const [bioRes, homeRes, semListRes] = await Promise.all([
      axios.get(`${PORTAL}/?pg=biodata`, { headers, validateStatus: () => true }),
      axios.get(`${PORTAL}/?pg=home`, { headers, validateStatus: () => true }),
      axios.get(`${PORTAL}/?pg=print-courses-registered`, { headers, validateStatus: () => true }),
    ]);

    // Step 4 — parse home status
    const homeStatus = parseHomeStatus(homeRes.data);

    // Step 4b — parse biodata
    const { fields, thValues } = parseBiodata(bioRes.data);
    let biodataFields = fields;
    if (biodataFields.length === 0 && thValues.length >= 3) {
      const knownLabels = [
        'Full Name', 'Department', 'Status', 'Matric Number', 'Level',
        'Programme', 'Mode of Entry', 'Gender', 'Date of Birth',
        'State of Origin', 'LGA', 'Phone', 'Email',
      ];
      biodataFields = thValues.map((value, i) => ({
        label: knownLabels[i] || `Field ${i + 1}`, value,
      }));
    }

    if (biodataFields.length === 0)
      return res.status(502).json({
        message: 'Logged in but could not read biodata.',
        raw_sample: bioRes.data.slice(0, 800),
      });

    // Step 5 — follow the most recent semester link to get actual courses
    const courseLink = extractFirstCourseLink(semListRes.data);
    let courses = [];
    let totalUnits = null;
    let courseInfo = {};

    if (courseLink) {
      const coursePageRes = await axios.get(courseLink, { headers, validateStatus: () => true });
      const parsed = parseCourseRegPage(coursePageRes.data);
      courses = parsed.courses;
      totalUnits = parsed.totalUnits;
      courseInfo = parsed.infoFields;
    }

    console.log('FIELDS:', biodataFields.map(f => `${f.label}: ${f.value}`));
    console.log('COURSEINFO:', courseInfo);
    return res.json({ fields: biodataFields, courses, totalUnits, courseInfo, homeStatus });

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: err.message });
  }
});

// ── news ───────────────────────────────────────────────────────────────────

const NEWS_BASE = 'https://yabatech.edu.ng';
let newsCache = { data: null, at: 0 };
const NEWS_TTL = 10 * 60 * 1000; // 10 minutes

function parseNews(html) {
  const items = [];
  const liBlocks = html.match(/<li>[\s\S]*?<\/li>/gi) || [];

  for (const li of liBlocks) {
    // href from image anchor
    const hrefM = li.match(/href=["'](yabatechnews\.php[^"']+)["']/i);
    if (!hrefM) continue;
    const href = `${NEWS_BASE}/${hrefM[1]}`;

    // title is in <p> inside latest-research-content
    const titleM = li.match(/<p>([\s\S]*?)<\/p>/i);
    if (!titleM) continue;
    const title = titleM[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!title) continue;

    // date is in <h4>
    const dateM = li.match(/<h4>([\s\S]*?)<\/h4>/i);
    const date  = dateM ? dateM[1].trim() : '';

    // image src
    const imgM  = li.match(/<img[^>]+src=["']([^"']+)["']/i);
    const image = imgM
      ? (imgM[1].startsWith('http') ? imgM[1] : `${NEWS_BASE}/${imgM[1].replace(/^\//, '')}`)
      : null;

    items.push({ title, date, href, image });
  }

  return items;
}

app.get('/news', async (req, res) => {
  try {
    const now = Date.now();
    if (newsCache.data && now - newsCache.at < NEWS_TTL) {
      return res.json(newsCache.data);
    }

    const r = await axios.get(`${NEWS_BASE}/yabatechallnews.php`, {
      headers: { 'User-Agent': UA },
      validateStatus: () => true,
      timeout: 10000,
    });

    const items = parseNews(r.data);
    if (!items.length) return res.status(502).json({ message: 'No news parsed.' });

    newsCache = { data: items, at: now };
    return res.json(items);
  } catch (err) {
    console.error('News fetch error:', err.message);
    return res.status(500).json({ message: err.message });
  }
});

// ── single article ─────────────────────────────────────────────────────────
// GET /article?url=https://yabatech.edu.ng/yabatechnews.php?id=...

app.get('/article', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ message: 'url param required.' });

  try {
    const r = await axios.get(url, {
      headers: { 'User-Agent': UA },
      validateStatus: () => true,
      timeout: 10000,
    });
    const html = r.data;

    // title
    const h1M  = html.match(/<h1>([\s\S]*?)<\/h1>/i);
    const title = h1M ? h1M[1].replace(/<[^>]+>/g, '').trim() : '';

    // date — text after fa-clock icon
    const clockM = html.match(/fa-clock[^<]*<\/i>([\s\S]*?)<\/a>/i);
    const date   = clockM ? clockM[1].replace(/<[^>]+>/g, '').trim() : '';

    // category — text after fa-tags icon
    const tagM    = html.match(/fa-tags[^<]*<\/i>([\s\S]*?)<\/a>/i);
    const category = tagM ? tagM[1].replace(/<[^>]+>/g, '').trim() : '';

    // image — first img inside news-img-holder
    const imgHolderM = html.match(/<div class="news-img-holder">([\s\S]*?)<\/div>/i);
    let image = null;
    if (imgHolderM) {
      const imgM = imgHolderM[1].match(/src=["']([^"']+)["']/i);
      if (imgM) image = imgM[1].startsWith('http') ? imgM[1] : `${NEWS_BASE}/${imgM[1].replace(/^\//, '')}`;
    }

    // body — the outer <p> inside news-details-page-inner that contains nested <p> tags
    const outerPM = html.match(/news-comments">([\s\S]*?)<div class="fb-share/i);
    let paragraphs = [];
    if (outerPM) {
      const rawParas = outerPM[1].match(/<p>([\s\S]*?)<\/p>/gi) || [];
      paragraphs = rawParas
        .map(p => p.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(p => p.length > 2);
    }

    return res.json({ title, date, category, image, paragraphs, url });
  } catch (err) {
    console.error('Article fetch error:', err.message);
    return res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lectra backend running on:`);
  console.log(`  Web:      http://localhost:${PORT}`);
  console.log(`  Expo Go:  http://172.29.152.146:${PORT}`);
});
