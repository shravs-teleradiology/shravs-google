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
  try { data = text ?
