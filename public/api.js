// public/api.js
// Purpose: Frontend helper functions for your admin.html and other pages.
// This version DOES NOT require supabase-js in the browser, so you will never get:
// "Uncaught ReferenceError: supabase is not defined".

function getToken() {
  return localStorage.getItem('token') || '';
}

async function request(path, { method = 'GET', body = null, headers = {} } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : null
  });

  // Try JSON first, fallback to text
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      (typeof data === 'string' && data) ||
      `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

/* -----------------------
   AUTH
----------------------- */

// If you already have /api/auth-login on backend, keep this.
// body example: { email, password }
export async function authLogin(email, password) {
  const data = await request('/api/auth-login', {
    method: 'POST',
    body: { email, password }
  });

  // Expect backend returns { token, user } or similar
  if (data?.token) localStorage.setItem('token', data.token);
  return data;
}

// Optional: get current user
export async function authMe() {
  return await request('/api/auth-me');
}

export async function logout() {
  localStorage.removeItem('token');
  // Keep any other localStorage keys if you want; if not:
  // localStorage.clear();
  window.location.href = 'login.html';
}

/* -----------------------
   ADMIN
----------------------- */

export async function adminCreateEmployee({ name, email, password }) {
  return await request('/api/admin-create-employee', {
    method: 'POST',
    body: { name, email, password }
  });
}

export async function adminSetRole({ user_id, role }) {
  // Your admin.html uses PATCH for admin-set-role
  return await request('/api/admin-set-role', {
    method: 'PATCH',
    body: { user_id, role }
  });
}

export async function adminPendingDoctors() {
  // Backend should return array
  return await request('/api/admin-pending-doctors');
}

export async function adminApproveDoctor(id) {
  return await request('/api/admin-approve-doctor', {
    method: 'POST',
    body: { id }
  });
}

export async function adminPendingDiagnostics() {
  return await request('/api/admin-pending-diagnostics');
}

export async function adminApproveDiagnostics(id) {
  return await request('/api/admin-approve-diagnostics', {
    method: 'POST',
    body: { id }
  });
}

/* -----------------------
   TEAM / TASKS
----------------------- */

export async function getTeam(role = 'employee') {
  return await request(`/api/team?role=${encodeURIComponent(role)}`);
}

export async function createTask(task) {
  // task: { assigned_to, title, description, priority, due_date, status }
  return await request('/api/tasks', {
    method: 'POST',
    body: task
  });
}
