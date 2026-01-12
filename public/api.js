export function getToken() {
  return localStorage.getItem('token') || '';
}

export async function request(path, { method = 'GET', body = null } = {}) {
  const headers = {};

  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      (typeof data === 'string' ? data : '') ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// Optional helper (safe)
export async function getTeam(role = 'employee') {
  return request(`/api/team?role=${encodeURIComponent(role)}`);
}
