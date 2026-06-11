export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  return JSON.parse(localStorage.getItem('user') || 'null');
}

export function setAuth(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify({
    id: data.id,
    name: data.name,
    role: data.role,
  }));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function isAuthenticated(role) {
  const user = getUser();
  const token = getToken();
  if (!user || !token) return false;
  if (role && user.role !== role) return false;
  return true;
}
