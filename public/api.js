// public/api.js
function getToken() {
  return localStorage.getItem('token') || '';
}

async function request(path, { method = 'GET', body = null } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {})
    },
    body: body ? JSON.stringify(body) : null
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = (data && data.error) || (data && data.message) || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Used by admin.html only for logout right now
export function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// (Optional exports if you want to use later)
export async function adminPendingDoctors() { return request('/api/admin-pending-doctors'); }
export async function adminApproveDoctor(id) { return request('/api/admin-approve-doctor', { method: 'POST', body: { id } }); }
