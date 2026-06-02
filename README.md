# LECTRA — Mobile App (React Native / Expo)

A student-facing mobile app built with React Native and Expo for the LECTRA platform.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for testing on device)

### Installation

```bash
git clone <repo-url>
cd LECTRA
npm install
npm start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

---

## Project Structure

```
src/
├── app/                        # Expo Router entry & layout
│   ├── _layout.tsx             # Root stack layout
│   └── index.tsx               # App entry point
│
├── screens/                    # All app screens grouped by navigation type
│   ├── auth/
│   │   ├── Splash/             # Splash / loading screen
│   │   └── Login/              # Login screen
│   ├── tabs/
│   │   ├── Home/               # Home screen — today's classes + greeting
│   │   ├── Timetable/          # Weekly timetable view
│   │   ├── Notifications/      # Notifications list
│   │   └── Profile/            # Student profile + logout
│   └── stack/
│       └── ClassDetail/        # Class detail screen (navigated to from Home/Timetable)
│
├── components/
│   └── ClassCard/              # Reusable class card component
│
├── navigation/
│   └── index.tsx               # AppNavigator — Stack + Bottom Tab setup
│
├── services/
│   └── api.ts                  # Axios instance (base URL + JWT injection)
│
├── constants/
│   ├── api.ts                  # API base URL — update this for your environment
│   └── theme.ts                # Colors, spacing
│
└── hooks/                      # Custom React hooks
```

---

## Team Collaboration Rules

> **Read this before writing a single line of code.**

### 1. Own Your Folder
Each developer is assigned specific screens or components. You work **only inside your assigned folder(s)**. Do not touch files or folders that belong to someone else.

| Area | Folder |
|---|---|
| Auth screens | `src/screens/auth/` |
| Home screen | `src/screens/tabs/Home/` |
| Timetable screen | `src/screens/tabs/Timetable/` |
| Notifications screen | `src/screens/tabs/Notifications/` |
| Profile screen | `src/screens/tabs/Profile/` |
| Class Detail screen | `src/screens/stack/ClassDetail/` |
| Shared component | `src/components/ClassCard/` |
| Navigation wiring | `src/navigation/` |
| API / services | `src/services/` |

### 2. Ask Before Touching Someone Else's Code
If your work requires a change in another developer's file or folder, **stop and ask for permission first** — via the team chat or a GitHub Issue/PR comment. Never silently edit another person's work.

### 3. Leave a Comment When You Do Touch Someone Else's Code
If permission is granted and you make a change to a file you don't own, **always leave a comment** at the exact line(s) you changed, explaining what you did and why:

```tsx
// [YourName] — changed prop name from `classInfo` to `classData` to match API response shape
```

This makes it easy for the original author to find the change and understand the intent.

### 4. Working with AI Assistants
If you are using an AI coding assistant (Claude, Copilot, ChatGPT, etc.) to help write or review code:

- **Show the AI this README first** so it understands the project structure and team rules.
- Make sure the AI is aware of the **own-your-folder rule** — it must not suggest edits outside your assigned area.
- If your AI tool has a memory or configuration file (e.g., `CLAUDE.md`), **add a note in that file** instructing it to respect team ownership boundaries and always ask before modifying files outside your folder.
- Review every AI suggestion before committing — AI tools do not know who owns what, so the responsibility is yours.

### 5. Commit Message Format
Keep commit messages clear and scoped:

```
[Screen/Area] Short description of what changed

Examples:
[Home] Add today's classes list with API integration
[ClassCard] Fix time formatting for 24h display
[API] Update base URL to production endpoint
```

### 6. Pull Before You Push
Always pull the latest changes before starting work and before pushing:

```bash
git pull origin main
```

Resolve merge conflicts carefully — never discard someone else's code to fix a conflict.

---

## API Reference

Base URL is set in `src/constants/api.ts`. Update it to point to your backend environment.

| Endpoint | Method | Description |
|---|---|---|
| `/api/mobile/timetable` | GET | Fetch timetable (filter by `department`, `date`) |
| `/api/mobile/notifications` | GET | Fetch notifications (`?last_checked=timestamp`) |
| `/api/mobile/announcements` | GET | Fetch emergency announcements |

All authenticated requests automatically include the JWT `Bearer` token via the Axios interceptor in `src/services/api.ts`.

---

Happy coding. Respect the structure, respect your teammates.
