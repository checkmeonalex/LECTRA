import BACKEND_URL from '@/constants/api';

export interface BiodataField { label: string; value: string; }
export interface Course { code: string; title: string; status: string; unit: string; }
export interface StudentData {
  fields: BiodataField[];
  courses: Course[];
  totalUnits: number | null;
  courseInfo: Record<string, string>;
  homeStatus: Record<string, string>;
}

export async function portalLogin(matricNumber: string, password: string): Promise<StudentData> {
  const res = await fetch(`${BACKEND_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matric_number: matricNumber, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Login failed.');
  return data as StudentData;
}
