const ACCESS_TOKEN_KEY = 'manage_money_access_token';
const REFRESH_TOKEN_KEY = 'manage_money_refresh_token';
const API_BASE_URL = (() => {
  const custom = window.API_BASE_URL;
  if (typeof custom === 'string' && custom.trim().length) {
    return custom.replace(/\/$/, '') + '/api/v1';
  }
  return window.location.origin.replace(/\/$/, '') + '/api/v1';
})();

const authButton = document.getElementById('authButton');
const contentSection = document.getElementById('content');
const messageEl = document.getElementById('message');
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const budgetCountEl = document.getElementById('budgetCount');
const categoryCountEl = document.getElementById('categoryCount');
const transactionCountEl = document.getElementById('transactionCount');
const categoryListEl = document.getElementById('categoryList');

function showMessage(text, type = 'info') {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = `toast ${type}`;
  setTimeout(() => {
    messageEl.className = 'toast hidden';
  }, 6000);
}

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function saveTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function apiRequest(method, path, data) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const accessToken = getAccessToken();

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'omit',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || response.statusText || 'API request failed';
    throw new Error(message);
  }

  return response.json();
}

function buildCategoryItem(category) {
  return `<li><strong>${category.name || category.title || 'Untitled'}</strong> <span>${category.type || ''}</span></li>`;
}

async function handleLogout() {
  try {
    await apiRequest('POST', '/auth/logout');
  } catch (_) {
    // ignore errors during logout
  }
  clearTokens();
  window.location.reload();
}

function handleLogin() {
  window.location.href = `${API_BASE_URL}/auth/google?target=web`;
}

async function loadApp() {
  const token = getAccessToken();
  if (!token) {
    authButton.textContent = 'Sign in';
    authButton.onclick = handleLogin;
    contentSection?.classList.add('hidden');
    return;
  }

  authButton.textContent = 'Sign out';
  authButton.onclick = handleLogout;
  contentSection?.classList.remove('hidden');

  try {
    const profileResult = await apiRequest('GET', '/auth/me');
    const categoriesResult = await apiRequest('GET', '/categories');
    const budgetsResult = await apiRequest('GET', '/budgets');
    const transactionSummaryResult = await apiRequest('GET', '/transactions/summary');

    const user = profileResult?.data || {};
    const categories = Array.isArray(categoriesResult?.data) ? categoriesResult.data : [];
    const budgets = Array.isArray(budgetsResult?.data) ? budgetsResult.data : [];
    const transactionSummary = transactionSummaryResult?.data || {};

    userNameEl.textContent = user.displayName || user.email || 'Your profile';
    userEmailEl.textContent = user.email || '—';
    budgetCountEl.textContent = String(budgets.length);
    categoryCountEl.textContent = String(categories.length);
    transactionCountEl.textContent = String(transactionSummary.total || transactionSummary.count || '—');

    categoryListEl.innerHTML = categories.slice(0, 6).map(buildCategoryItem).join('') || '<li>No categories available</li>';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load dashboard.';
    showMessage(message, 'error');
    if (message.toLowerCase().includes('unauthorized')) {
      clearTokens();
      authButton.textContent = 'Sign in';
      authButton.onclick = handleLogin;
      contentSection?.classList.add('hidden');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadApp();
});
