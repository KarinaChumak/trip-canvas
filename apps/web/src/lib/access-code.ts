// The code is a light gate for a demo, not a secret: remembering it in the browser
// means people type it once. Locally the server has no code and lets every call through.
const STORAGE_KEY = 'trip-canvas:access-code';
export const accessQueryKey = ['access'] as const;

export function readAccessCode(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeAccessCode(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Blocked storage: the chat will be rejected and the form shown again.
  }
}

/** Headers for every /api call; read per request so a new code applies at once. */
export function accessHeaders(): Record<string, string> {
  const code = readAccessCode();
  return code ? { Authorization: `Bearer ${code}` } : {};
}

/** True when the server accepts the code, false when it rejects it. */
export async function checkAccessCode(code: string): Promise<boolean> {
  const res = await fetch('/api/access', {
    headers: code ? { Authorization: `Bearer ${code}` } : {},
  });
  if (res.status === 401) return false;
  if (!res.ok) throw new Error(`Access check failed with ${res.status}`);
  return true;
}
