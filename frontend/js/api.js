const API = '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }

function setAuth(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, role: data.role }));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch(e) {
    console.error('Non-JSON response:', text.substring(0, 200));
    throw new Error(`Server error (${res.status}): unexpected response`);
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function requireAuth(role) {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = role === 'admin' ? '/admin/login.html' : '/student/login.html';
    return false;
  }
  if (role && user.role !== role) {
    window.location.href = '/';
    return false;
  }
  return true;
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function showSuccess(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function formatDate(dt) {
  if (!dt) return '-';
  return new Date(dt).toLocaleString();
}
