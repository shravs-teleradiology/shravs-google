// api.js
export const supabaseUrl = 'https://xksqdjwbiojwyfllwtvh.supabase.co';
export const supabaseAnonKey = 'sb_publishable_zZe-aVVerbOt7joJQMt6QQ_bq3Ej7Ze';

export const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// Admin functions
export async function adminCreateEmployee(employeeData) {
  const { data, error } = await supabaseClient.functions.invoke('admin-create-employee', {
    body: employeeData
  });
  if (error) throw error;
  return data;
}

export async function getTeam(role = 'employee') {
  const { data, error } = await supabaseClient.functions.invoke('team', {
    body: { role }
  });
  if (error) throw error;
  return data.items || [];
}

export async function createTask(taskData) {
  const { data, error } = await supabaseClient.functions.invoke('tasks', {
    method: 'POST',
    body: taskData
  });
  if (error) throw error;
  return data;
}

export async function adminSetRole(userId, role) {
  const { data, error } = await supabaseClient.functions.invoke('admin-set-role', {
    body: { user_id: userId, role }
  });
  if (error) throw error;
  return data;
}

export async function adminPendingDoctors() {
  const { data, error } = await supabaseClient.functions.invoke('admin-pending-doctors');
  if (error) throw error;
  return data || [];
}

export async function adminApproveDoctor(id) {
  const { data, error } = await supabaseClient.functions.invoke('admin-approve-doctor', {
    body: { id }
  });
  if (error) throw error;
  return data;
}

export async function logout() {
  await supabaseClient.auth.signOut();
  localStorage.clear();
  window.location.href = 'login.html';
}
