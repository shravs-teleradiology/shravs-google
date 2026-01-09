// js/api.js - All API calls
const API_BASE = "/api";

async function request(path, opts = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : null
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Auth
export async function login(email, password) {
  const data = await request("/auth-login", { method: "POST", body: { email, password } });
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function getMe() {
  return await request("/auth-me");
}

// Profiles
export async function updateProfile({ name, photo_url }) {
  return await request("/profiles", { method: "PATCH", body: { name, photo_url } });
}

// Tasks
export async function getTasks() {
  return (await request("/tasks")).tasks || [];
}

export async function setTaskStatus(id, status) {
  return await request("/tasks", { method: "PATCH", body: { id, status } });
}

// Chat
export async function createDmRoom(peer_id) {
  return (await request("/dm-room", { method: "POST", body: { peer_id } })).room;
}

export async function getMessages({ room_type, dm_room_id, limit = 50 }) {
  const params = new URLSearchParams({ room_type, limit: String(limit) });
  if (dm_room_id) params.set("dm_room_id", dm_room_id);
  return (await request(`/messages?${params}`)).messages || [];
}

export async function sendMessage({ room_type, dm_room_id, text }) {
  return await request("/messages", {
    method: "POST",
    body: { room_type, dm_room_id, text }
  });
}

// Doctor queries
export async function createDoctorQuery({ type, name, designation, email, phone, message }) {
  return await request("/doctor-queries", {
    method: "POST",
    body: { type, name, designation, email, phone, message }
  });
}

// Admin approvals
export async function adminApproveDoctor(doctor_id) {
  return await request("/admin-approve-doctor", {
    method: "POST",
    body: { doctor_id }
  });
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Update profile with all fields
export async function updateProfile(data) {
  return await request("/profile", { 
    method: "PATCH", 
    body: data 
  });
}

