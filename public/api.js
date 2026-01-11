function getToken() {
  return localStorage.getItem('token') || '';
}

async function request(path, { method = 'GET', body = null } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (getToken()) headers['Authorization'] = `Bearer ${getToken()}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const text = await res.text();
  let data;
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

// Optional helpers (not required, but safe)
export async function getTeam(role = 'employee') {
  return request(`/api/team?role=${encodeURIComponent(role)}`);
}
export async function adminPendingDoctors() {
  return request('/api/admin-pending-doctors');
}
export async function adminPendingDiagnostics() {
  return request('/api/admin-pending-diagnostics');
}
