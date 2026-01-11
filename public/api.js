// public/api.js
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
    const msg = (data && data.error) || (data && data.message) || (typeof data === 'string' ? data : '') || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// If you want to use these helpers later:
export async function getTeam(role = 'employee') {
  return request(`/api/team?role=${encodeURIComponent(role)}`);
}

export async function createTask(payload) {
  return request('/api/tasks', { method: 'POST', body: payload });
}

export async function adminCreateEmployee(payload) {
  return request('/api/admin-create-employee', { method: 'POST', body: payload });
}

export async function adminSetRole(payload) {
  return request('/api/admin-set-role', { method: 'PATCH', body: payload });
}

// Logout used by admin.html
export function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}
