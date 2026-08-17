const ACCESS_TOKEN_KEY = 'manage_money_access_token';
const REFRESH_TOKEN_KEY = 'manage_money_refresh_token';
const API_BASE_URL = (() => {
  const custom = window.API_BASE_URL;
  if (typeof custom === 'string' && custom.trim().length) {
    return custom.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
})();
const API_PREFIX = '/api/v1';

const EXPENSE_CATEGORY_TO_DB = {
  Food: 'Food & Dining',
  Transport: 'Transport',
  Bills: 'Bills & Utilities',
  Shopping: 'Shopping',
  Rent: 'Rent & Housing',
  Entertainment: 'Entertainment',
  Healthcare: 'Healthcare',
  Education: 'Education',
  Travel: 'Travel',
  Return: 'Return & Refunds',
  Other: 'Other',
};

const DB_EXPENSE_TO_UI = Object.fromEntries(
  Object.entries(EXPENSE_CATEGORY_TO_DB).map(([ui, db]) => [db, ui]),
);

const PAYMENT_METHOD_TO_API = {
  Cash: 'cash',
  'Credit Card': 'credit_card',
  'Debit Card': 'debit_card',
  'Bank Transfer': 'bank_transfer',
  Other: 'other',
};

const PAYMENT_METHOD_FROM_API = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  bank_transfer: 'Bank Transfer',
  mobile_payment: 'Other',
  other: 'Other',
};

/* ---------------------------------------------------------------------- */
/* Category / source metadata                                             */
/* ---------------------------------------------------------------------- */

const EXPENSE_CATEGORIES = {
  Food: { label: '🍔 Food & Dining', color: '#f97316' },
  Transport: { label: '🚗 Transport', color: '#0ea5e9' },
  Bills: { label: '📄 Bills & Utilities', color: '#64748b' },
  Shopping: { label: '🛍️ Shopping', color: '#ec4899' },
  Rent: { label: '🏠 Rent', color: '#8b5cf6' },
  Entertainment: { label: '🎬 Entertainment', color: '#f59e0b' },
  Healthcare: { label: '🏥 Healthcare', color: '#ef4444' },
  Education: { label: '🎓 Education', color: '#22c55e' },
  Travel: { label: '✈️ Travel', color: '#06b6d4' },
  Return: { label: '🔄 Return / Refund', color: '#14b8a6' },
  Other: { label: '📌 Other', color: '#94a3b8' },
};

const INCOME_SOURCES = {
  Salary: '💼 Salary',
  Freelance: '💻 Freelance',
  Business: '🏢 Business',
  Investments: '📈 Investments',
  Other: '💰 Other',
};

/* ---------------------------------------------------------------------- */
/* DOM references                                                         */
/* ---------------------------------------------------------------------- */

const authButton = document.getElementById('authButton');
const demoAuthButton = document.getElementById('demoAuthButton');
const emailAuthButton = document.getElementById('emailAuthButton');
const authModal = document.getElementById('authModal');
const closeAuthModal = document.getElementById('closeAuthModal');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authModalTitle = document.getElementById('authModalTitle');

const userInfo = document.getElementById('userInfo');
const headerUserName = document.getElementById('headerUserName');
const sidebar = document.getElementById('sidebar');
const messageEl = document.getElementById('message');

const totalBalanceEl = document.getElementById('totalBalance');
const monthlyIncomeEl = document.getElementById('monthlyIncome');
const monthlyExpensesEl = document.getElementById('monthlyExpenses');
const monthlySavingsEl = document.getElementById('monthlySavings');
const recentTransactionsEl = document.getElementById('recentTransactions');

const incomeListEl = document.getElementById('incomeList');
const expenseListEl = document.getElementById('expenseList');
const budgetsListEl = document.getElementById('budgetsList');
const allTransactionsListEl = document.getElementById('allTransactionsList');

const incomeModal = document.getElementById('incomeModal');
const incomeForm = document.getElementById('incomeForm');
const addIncomeBtn = document.getElementById('addIncomeBtn');
const closeIncomeModal = document.getElementById('closeIncomeModal');

const expenseModal = document.getElementById('expenseModal');
const expenseForm = document.getElementById('expenseForm');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const closeExpenseModal = document.getElementById('closeExpenseModal');
const receiptUploadInput = document.getElementById('receiptUpload');

const expenseGroupModal = document.getElementById('expenseGroupModal');
const closeExpenseGroupModal = document.getElementById('closeExpenseGroupModal');
const addExpenseGroupBtn = document.getElementById('addExpenseGroupBtn');
const expenseGroupForm = document.getElementById('expenseGroupForm');
const groupItemsContainer = document.getElementById('groupItemsContainer');
const addGroupItemBtn = document.getElementById('addGroupItemBtn');
const groupTotalDisplay = document.getElementById('groupTotalDisplay');
const expenseGroupsListEl = document.getElementById('expenseGroupsList');

const planModal = document.getElementById('planModal');
const closePlanModal = document.getElementById('closePlanModal');
const addPlanBtn = document.getElementById('addPlanBtn');
const planForm = document.getElementById('planForm');
const planItemsContainer = document.getElementById('planItemsContainer');
const addPlanItemBtn = document.getElementById('addPlanItemBtn');
const planTotalDisplay = document.getElementById('planTotalDisplay');
const plansListEl = document.getElementById('plansList');

const budgetModal = document.getElementById('budgetModal');
const closeBudgetModal = document.getElementById('closeBudgetModal');
const budgetForm = document.getElementById('budgetForm');
const budgetPeriodSelect = document.getElementById('budgetPeriod');
const budgetDateRow = document.getElementById('budgetDateRow');

let categoryChartInstance = null;
let incomeExpenseChartInstance = null;

const state = {
  categories: [],
  incomes: [],
  expenses: [],
  rawIncomes: [],
  rawExpenses: [],
  budgets: [],
  expenseGroups: [],
  plans: [],
  editingIncomeId: null,
  editingExpenseId: null,
  editingBudgetId: null,
  editingGroupId: null,
  editingPlanId: null,
  pendingReceiptDataUrl: null,
};

let groupFormItems = [];
let planFormItems = [];

/* ---------------------------------------------------------------------- */
/* Helpers                                                                */
/* ---------------------------------------------------------------------- */

function showMessage(text, type = 'info') {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = `toast ${type}`;
  setTimeout(() => {
    messageEl.className = 'toast hidden';
  }, 6000);
}

/* ---------------------------------------------------------------------- */
/* Currency Engine & Exchange Rates                                        */
/* ---------------------------------------------------------------------- */

const CURRENCIES = {
  USD: { symbol: '$', rate: 1.0, locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.92, locale: 'de-DE' },
  GBP: { symbol: '£', rate: 0.79, locale: 'en-GB' },
  PKR: { symbol: 'Rs ', rate: 278.5, locale: 'ur-PK' },
  INR: { symbol: '₹', rate: 83.5, locale: 'hi-IN' },
  AED: { symbol: 'AED ', rate: 3.67, locale: 'ar-AE' },
  SAR: { symbol: 'SAR ', rate: 3.75, locale: 'ar-SA' },
  CAD: { symbol: 'C$', rate: 1.36, locale: 'en-CA' },
  AUD: { symbol: 'A$', rate: 1.52, locale: 'en-AU' },
  JPY: { symbol: '¥', rate: 155.0, locale: 'ja-JP' },
  CHF: { symbol: 'CHF ', rate: 0.90, locale: 'de-CH' },
  CNY: { symbol: '¥', rate: 7.23, locale: 'zh-CN' },
  KGS: { symbol: 'сом ', rate: 87.5, locale: 'ky-KG' },
};

let currentBaseCurrency = localStorage.getItem('user_base_currency') || 'USD';

async function fetchLiveExchangeRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data?.rates) {
      Object.keys(CURRENCIES).forEach((code) => {
        if (data.rates[code]) {
          CURRENCIES[code].rate = data.rates[code];
        }
      });
    }
  } catch (_) {
    // Keep fallback offline exchange rates
  }
}

function convertAmount(amount, fromCurr = 'USD', toCurr = currentBaseCurrency) {
  const num = Number(amount) || 0;
  const fromRate = CURRENCIES[fromCurr]?.rate || 1.0;
  const toRate = CURRENCIES[toCurr]?.rate || 1.0;
  return (num / fromRate) * toRate;
}

function formatCurrency(amount, currencyCode = currentBaseCurrency) {
  const value = Number(amount) || 0;
  const info = CURRENCIES[currencyCode] || { symbol: currencyCode + ' ', locale: 'en-US' };
  try {
    return value.toLocaleString(info.locale || 'en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    });
  } catch (_) {
    return `${info.symbol || '$'}${value.toFixed(2)}`;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isSameMonth(dateStr, ref = new Date()) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function monthKey(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short' });
}

function formatApiDate(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function findCategoryByName(name, type) {
  if (!name) return undefined;
  const target = String(name).trim().toLowerCase();
  return state.categories.find(
    (c) => c.name.trim().toLowerCase() === target && (c.type === type || c.type === 'both'),
  );
}

function findExpenseCategoryId(uiCategory) {
  if (!uiCategory) return undefined;
  const dbName = EXPENSE_CATEGORY_TO_DB[uiCategory] || uiCategory;
  const targetDb = dbName.trim().toLowerCase();
  const targetUi = uiCategory.trim().toLowerCase();
  const cat = state.categories.find(
    (c) =>
      (c.name.trim().toLowerCase() === targetDb || c.name.trim().toLowerCase() === targetUi) &&
      (c.type === 'expense' || c.type === 'both'),
  );
  return cat?.id;
}

function findIncomeCategoryId(source) {
  if (!source) return undefined;
  const target = String(source).trim().toLowerCase();
  const cat = state.categories.find(
    (c) => c.name.trim().toLowerCase() === target && (c.type === 'income' || c.type === 'both'),
  );
  return cat?.id;
}

function normalizeIncome(transaction) {
  const rawAmount = Number(transaction.amount);
  const currency = transaction.currency || 'USD';
  const amountInBase = convertAmount(rawAmount, currency, currentBaseCurrency);

  return {
    id: transaction.id,
    rawAmount,
    currency,
    amount: amountInBase,
    date: formatApiDate(transaction.date),
    notes: transaction.notes,
    source: transaction.category?.name || transaction.title || 'Other',
    recurring: Boolean(transaction.isRecurring),
  };
}

function normalizeExpense(transaction) {
  const uiCategory = DB_EXPENSE_TO_UI[transaction.category?.name]
    || transaction.category?.name
    || transaction.title
    || 'Other';

  const rawAmount = Number(transaction.amount);
  const currency = transaction.currency || 'USD';
  const amountInBase = convertAmount(rawAmount, currency, currentBaseCurrency);

  return {
    id: transaction.id,
    rawAmount,
    currency,
    amount: amountInBase,
    date: formatApiDate(transaction.date),
    notes: transaction.notes,
    category: uiCategory,
    paymentMethod: PAYMENT_METHOD_FROM_API[transaction.paymentMethod] || 'Cash',
    receiptUrl: transaction.receiptUrl,
    receiptImage: transaction.receiptUrl,
  };
}

function normalizeBudget(budget) {
  const categoryName = budget.category?.name || budget.name?.replace(/ Budget$/, '') || 'Other';
  const uiCategory = DB_EXPENSE_TO_UI[categoryName] || categoryName;

  return {
    id: budget.id,
    category: uiCategory,
    name: budget.name,
    amount: Number(budget.amount),
    limit: Number(budget.amount),
    spent: Number(budget.spent ?? 0),
  };
}

function buildIncomePayload(form) {
  return {
    type: 'income',
    title: form.source,
    amount: form.amount,
    currency: form.currency || currentBaseCurrency,
    date: form.date,
    notes: form.notes,
    isRecurring: form.recurring,
    categoryId: findIncomeCategoryId(form.source),
  };
}

function buildExpensePayload(form) {
  return {
    type: 'expense',
    title: EXPENSE_CATEGORY_TO_DB[form.category] || form.category,
    amount: form.amount,
    currency: form.currency || currentBaseCurrency,
    date: form.date,
    notes: form.notes,
    paymentMethod: PAYMENT_METHOD_TO_API[form.paymentMethod] || 'other',
    categoryId: findExpenseCategoryId(form.category),
    receiptUrl: form.receiptImage,
  };
}

/* ---------------------------------------------------------------------- */
/* Auth / token handling                                                  */
/* ---------------------------------------------------------------------- */

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
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
  const url = `${API_BASE_URL}${API_PREFIX}${path}`;
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

  if (response.status === 204) return null;
  return response.json();
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
  openAuthModal('login');
}



function openAuthModal(defaultTab = 'login') {
  switchAuthTab(defaultTab);
  authModal?.classList.remove('hidden');
}

function switchAuthTab(tab) {
  if (tab === 'register') {
    if (authModalTitle) authModalTitle.textContent = 'Create Account';
    if (tabRegisterBtn) tabRegisterBtn.className = 'button button-small button-primary';
    if (tabLoginBtn) tabLoginBtn.className = 'button button-small button-ghost';
    loginForm?.classList.add('hidden');
    registerForm?.classList.remove('hidden');
  } else {
    if (authModalTitle) authModalTitle.textContent = 'Sign In';
    if (tabLoginBtn) tabLoginBtn.className = 'button button-small button-primary';
    if (tabRegisterBtn) tabRegisterBtn.className = 'button button-small button-ghost';
    registerForm?.classList.add('hidden');
    loginForm?.classList.remove('hidden');
  }
}

emailAuthButton?.addEventListener('click', () => openAuthModal('login'));
closeAuthModal?.addEventListener('click', () => authModal?.classList.add('hidden'));
authModal?.addEventListener('click', (e) => {
  if (e.target === authModal) authModal?.classList.add('hidden');
});
tabLoginBtn?.addEventListener('click', () => switchAuthTab('login'));
tabRegisterBtn?.addEventListener('click', () => switchAuthTab('register'));

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await apiRequest('POST', '/auth/login', { email, password });
    if (res?.data?.accessToken) {
      saveTokens(res.data.accessToken, res.data.refreshToken);
      showMessage('Signed in successfully.', 'success');
      authModal?.classList.add('hidden');
      await loadApp();
    }
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Sign in failed.', 'error');
  }
});

registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const displayName = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  try {
    const res = await apiRequest('POST', '/auth/register', { displayName, email, password });
    if (res?.data?.accessToken) {
      saveTokens(res.data.accessToken, res.data.refreshToken);
      showMessage('Account created successfully.', 'success');
      authModal?.classList.add('hidden');
      await loadApp();
    }
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Registration failed.', 'error');
  }
});

/* ---------------------------------------------------------------------- */
/* Page / nav switching & Landing logic                                   */
/* ---------------------------------------------------------------------- */

function switchPage(pageName) {
  if (pageName === 'features') {
    const featuresSection = document.getElementById('featuresSection');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }

  document.querySelectorAll('.page').forEach((el) => {
    el.classList.toggle('active', el.id === `page-${pageName}`);
  });

  document.querySelectorAll('#navMenu .nav-link').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });
}

// Advanced Navbar delegated listener
document.getElementById('navbarAdvanced')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (!btn) return;
  const page = btn.dataset.page;
  if (page) {
    switchPage(page);
    document.getElementById('navMenu')?.classList.remove('mobile-open');
  }
});

// Footer navigation links
document.getElementById('footerLinkHome')?.addEventListener('click', (e) => {
  e.preventDefault();
  switchPage('home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('footerLinkFeatures')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('featuresSection')?.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('footerLinkSignIn')?.addEventListener('click', (e) => {
  e.preventDefault();
  const container = document.getElementById('homeAuthContainer');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('homeLoginEmail')?.focus();
  }
});

// Home Page embedded auth tab switcher
const homeTabLoginBtn = document.getElementById('homeTabLoginBtn');
const homeTabRegisterBtn = document.getElementById('homeTabRegisterBtn');
const homeLoginForm = document.getElementById('homeLoginForm');
const homeRegisterForm = document.getElementById('homeRegisterForm');
const homeAuthTitle = document.getElementById('homeAuthTitle');
const homeAuthSubtitle = document.getElementById('homeAuthSubtitle');

homeTabLoginBtn?.addEventListener('click', () => {
  homeTabLoginBtn.classList.add('active');
  homeTabRegisterBtn?.classList.remove('active');
  homeLoginForm?.classList.remove('hidden');
  homeRegisterForm?.classList.add('hidden');
  if (homeAuthTitle) homeAuthTitle.textContent = 'Sign In';
  if (homeAuthSubtitle) homeAuthSubtitle.textContent = 'Access your personal financial manager';
});

homeTabRegisterBtn?.addEventListener('click', () => {
  homeTabRegisterBtn.classList.add('active');
  homeTabLoginBtn?.classList.remove('active');
  homeRegisterForm?.classList.remove('hidden');
  homeLoginForm?.classList.add('hidden');
  if (homeAuthTitle) homeAuthTitle.textContent = 'Create Account';
  if (homeAuthSubtitle) homeAuthSubtitle.textContent = 'Start tracking your money for free';
});

// Home Login Form Submit
homeLoginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('homeLoginEmail').value;
  const password = document.getElementById('homeLoginPassword').value;
  try {
    const res = await apiRequest('POST', '/auth/login', { email, password });
    if (res?.data?.accessToken) {
      saveTokens(res.data.accessToken, res.data.refreshToken);
      showMessage('Signed in successfully.', 'success');
      await loadApp();
    }
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Login failed.', 'error');
  }
});

// Home Register Form Submit
homeRegisterForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const displayName = document.getElementById('homeRegisterName').value;
  const email = document.getElementById('homeRegisterEmail').value;
  const password = document.getElementById('homeRegisterPassword').value;
  try {
    const res = await apiRequest('POST', '/auth/register', { displayName, email, password });
    if (res?.data?.accessToken) {
      saveTokens(res.data.accessToken, res.data.refreshToken);
      showMessage('Account created successfully.', 'success');
      await loadApp();
    }
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Registration failed.', 'error');
  }
});

// Hero Buttons
document.getElementById('heroGetStartedBtn')?.addEventListener('click', () => {
  const container = document.getElementById('homeAuthContainer');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('homeLoginEmail')?.focus();
  }
});

document.getElementById('heroDemoBtn')?.addEventListener('click', handleDemoLogin);

document.getElementById('heroExploreFeaturesBtn')?.addEventListener('click', () => {
  document.getElementById('featuresSection')?.scrollIntoView({ behavior: 'smooth' });
});

// Mobile menu toggle
const mobileNavToggle = document.getElementById('mobileNavToggle');
const navMenu = document.getElementById('navMenu');
mobileNavToggle?.addEventListener('click', () => {
  navMenu?.classList.toggle('mobile-open');
});

/* ---------------------------------------------------------------------- */
/* Data loading                                                           */
/* ---------------------------------------------------------------------- */

async function loadAllData() {
  await fetchLiveExchangeRates();

  const categoriesResult = await apiRequest('GET', '/categories').catch(() => ({ data: [] }));
  state.categories = Array.isArray(categoriesResult?.data) ? categoriesResult.data : [];

  const [incomesResult, expensesResult, budgetsResult] = await Promise.all([
    apiRequest('GET', '/transactions?type=income&limit=500&sortOrder=DESC').catch(() => ({ data: [] })),
    apiRequest('GET', '/transactions?type=expense&limit=500&sortOrder=DESC').catch(() => ({ data: [] })),
    apiRequest('GET', '/budgets').catch(() => ({ data: [] })),
  ]);

  state.rawIncomes = Array.isArray(incomesResult?.data) ? incomesResult.data : [];
  state.rawExpenses = Array.isArray(expensesResult?.data) ? expensesResult.data : [];

  await loadExpenseGroups();
  await loadPlans();

  state.incomes = state.rawIncomes.map(normalizeIncome);

  // Combine standalone expenses with all line items from Expense Groups
  const groupLineItems = [];
  state.expenseGroups.forEach((g) => {
    (g.items || []).forEach((item) => {
      groupLineItems.push({
        id: item.id || `${g.id}-${Date.now()}`,
        amount: item.amount,
        currency: item.currency || 'USD',
        date: item.date || g.startDate,
        notes: `[Group: ${g.name}] ${item.notes || ''}`,
        title: item.title || g.name,
        category: { name: EXPENSE_CATEGORY_TO_DB[item.category] || item.category },
        paymentMethod: 'cash',
      });
    });
  });

  const combinedRawExpenses = [...state.rawExpenses, ...groupLineItems];
  state.expenses = combinedRawExpenses.map(normalizeExpense);
  state.budgets = (Array.isArray(budgetsResult?.data) ? budgetsResult.data : []).map(normalizeBudget);
}

async function loadApp() {
  emailAuthButton?.addEventListener('click', () => openAuthModal('login'));
  const userBaseCurrencySelect = document.getElementById('userBaseCurrency');
  if (userBaseCurrencySelect) {
    userBaseCurrencySelect.value = currentBaseCurrency;
    userBaseCurrencySelect.onchange = (e) => {
      currentBaseCurrency = e.target.value;
      localStorage.setItem('user_base_currency', currentBaseCurrency);
      if (state.rawIncomes) {
        state.incomes = state.rawIncomes.map(normalizeIncome);
        state.expenses = state.rawExpenses.map(normalizeExpense);
      }
      renderDashboard();
      renderIncomeList();
      renderExpenseList();
      renderBudgets();
      renderAllTransactions();
      showMessage(`Base currency changed to ${currentBaseCurrency}`, 'info');
    };
  }

  const token = getAccessToken();
  const guestNavLinks = document.querySelectorAll('#navMenu .guest-nav-only');
  const appNavLinks = document.querySelectorAll('#navMenu .app-nav-only');

  if (!token) {
    emailAuthButton?.classList.remove('hidden');
    authButton?.classList.add('hidden');
    userInfo?.classList.add('hidden');
    guestNavLinks.forEach((el) => el.classList.remove('hidden'));
    appNavLinks.forEach((el) => el.classList.add('hidden'));

    switchPage('home');
    return;
  }

  emailAuthButton?.classList.add('hidden');
  if (authButton) {
    authButton.textContent = 'Sign out';
    authButton.onclick = handleLogout;
    authButton.classList.remove('hidden');
  }
  guestNavLinks.forEach((el) => el.classList.add('hidden'));
  appNavLinks.forEach((el) => el.classList.remove('hidden'));

  try {
    const profileResult = await apiRequest('GET', '/auth/me').catch(() => null);
    const user = profileResult?.data || { displayName: 'User Profile' };

    headerUserName.textContent = user.displayName || user.email || 'User Profile';
    const avatarMark = document.getElementById('userAvatarMark');
    if (avatarMark) {
      const name = user.displayName || user.email || 'D';
      avatarMark.textContent = name.charAt(0).toUpperCase();
    }
    userInfo?.classList.remove('hidden');

    await loadAllData();
    renderDashboard();
    renderIncomeList();
    renderExpenseList();
    renderBudgets();
    renderExpenseGroupsList();
    renderPlansList();
    renderAllTransactions();

    switchPage('dashboard');
  } catch (error) {
    console.warn('Dashboard load fallback:', error);
    switchPage('dashboard');
  }
}

/* ---------------------------------------------------------------------- */
/* Dashboard                                                              */
/* ---------------------------------------------------------------------- */

function computeDashboardStats() {
  const now = new Date();
  const totalIncome = state.incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalExpenses = state.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const monthlyIncome = state.incomes
    .filter((i) => isSameMonth(i.date, now))
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const monthlyExpenses = state.expenses
    .filter((e) => isSameMonth(e.date, now))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalBalance = totalIncome - totalExpenses;
  const monthlySavings = monthlyIncome - monthlyExpenses;

  return { totalBalance, monthlyIncome, monthlyExpenses, monthlySavings };
}

function setFormattedCardValue(el, value) {
  if (!el) return;
  const formatted = formatCurrency(value);
  el.textContent = formatted;
  el.title = formatted;
  if (formatted.length > 14) {
    el.style.fontSize = '1.15rem';
  } else if (formatted.length > 11) {
    el.style.fontSize = '1.35rem';
  } else {
    el.style.fontSize = '';
  }
}

function renderDashboard() {
  const stats = computeDashboardStats();
  setFormattedCardValue(totalBalanceEl, stats.totalBalance);
  setFormattedCardValue(monthlyIncomeEl, stats.monthlyIncome);
  setFormattedCardValue(monthlyExpensesEl, stats.monthlyExpenses);
  setFormattedCardValue(monthlySavingsEl, stats.monthlySavings);

  renderRecentTransactions();
  renderCategoryChart();
  renderIncomeExpenseChart();
}

function transactionRowHtml(t, isIncome, { editable = false } = {}) {
  const label = isIncome ? (INCOME_SOURCES[t.source] || t.source || 'Income') : (EXPENSE_CATEGORIES[t.category]?.label || t.category || 'Expense');
  const receipt = !isIncome && (t.receiptImage || t.receiptUrl)
    ? `<img class="receipt-thumb" src="${t.receiptImage || t.receiptUrl}" alt="Receipt" />`
    : '';
  const recurringBadge = isIncome && t.recurring ? '<span class="badge">Recurring</span>' : '';
  const foreignBadge = t.currency && t.currency !== currentBaseCurrency
    ? `<small style="display:block;font-size:0.75rem;opacity:0.75;text-align:right;">${t.rawAmount} ${t.currency}</small>`
    : '';
  const actions = editable ? `
    <div class="tx-actions">
      <button class="button button-small button-ghost" data-edit="${t.id}" data-kind="${isIncome ? 'income' : 'expense'}">Edit</button>
      <button class="button button-small button-danger" data-delete="${t.id}" data-kind="${isIncome ? 'income' : 'expense'}">Delete</button>
    </div>` : '';
  return `
    <div class="tx-row">
      <div class="tx-meta">
        <span>${label} ${recurringBadge}</span>
        <small>${formatDate(t.date)}${t.notes ? ` · ${t.notes}` : ''}</small>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:center;">
        <div style="display:flex;align-items:center;">
          <span class="tx-amount ${isIncome ? 'positive' : 'negative'}">${isIncome ? '+' : '-'}${formatCurrency(t.amount)}</span>
          ${receipt}
        </div>
        ${foreignBadge}
      </div>
      ${actions}
    </div>`;
}

function renderRecentTransactions() {
  const merged = [
    ...state.incomes.map((i) => ({ ...i, kind: 'income' })),
    ...state.expenses.map((e) => ({ ...e, kind: 'expense' })),
  ]
    .filter((t) => t.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  if (!merged.length) {
    recentTransactionsEl.innerHTML = '<p class="placeholder">No transactions yet.</p>';
    return;
  }
  recentTransactionsEl.innerHTML = merged.map((t) => transactionRowHtml(t, t.kind === 'income')).join('');
}

function renderAllTransactions() {
  const merged = [
    ...state.incomes.map((i) => ({ ...i, kind: 'income' })),
    ...state.expenses.map((e) => ({ ...e, kind: 'expense' })),
  ]
    .filter((t) => t.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!merged.length) {
    allTransactionsListEl.innerHTML = '<p class="placeholder">No transactions yet.</p>';
    return;
  }
  allTransactionsListEl.innerHTML = merged.map((t) => transactionRowHtml(t, t.kind === 'income')).join('');
}

function renderCategoryChart() {
  const now = new Date();
  const byCategory = {};

  let targetExpenses = state.expenses.filter((e) => isSameMonth(e.date, now));
  if (!targetExpenses.length && state.expenses.length) {
    targetExpenses = state.expenses;
  }

  targetExpenses.forEach((e) => {
    const key = e.category || 'Other';
    byCategory[key] = (byCategory[key] || 0) + (Number(e.amount) || 0);
  });

  const labels = Object.keys(byCategory);
  const canvas = document.getElementById('categoryChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const container = canvas.parentElement;

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
    categoryChartInstance = null;
  }

  const oldEmpty = container?.querySelector('.chart-empty-state');
  if (oldEmpty) oldEmpty.remove();

  if (!labels.length) {
    canvas.style.display = 'none';
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'chart-empty-state';
    emptyDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;min-height:200px;text-align:center;padding:24px 16px;background:rgba(248,250,252,0.6);border-radius:14px;border:1px dashed #cbd5e1;margin-top:8px;';
    emptyDiv.innerHTML = `
      <div style="width:48px;height:48px;border-radius:14px;background:#eef2ff;display:grid;place-items:center;font-size:24px;margin-bottom:10px;">📊</div>
      <strong style="color:#1e293b;font-size:0.95rem;">No spending recorded yet</strong>
      <small style="color:#64748b;margin-top:4px;max-width:260px;font-size:0.82rem;">Add your first expense to generate an interactive spending category breakdown!</small>
    `;
    container?.appendChild(emptyDiv);
    return;
  }

  canvas.style.display = 'block';

  categoryChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels.map((k) => EXPENSE_CATEGORIES[k]?.label || k),
      datasets: [{
        data: labels.map((k) => byCategory[k]),
        backgroundColor: labels.map((k) => EXPENSE_CATEGORIES[k]?.color || '#94a3b8'),
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 14, font: { family: 'Plus Jakarta Sans', weight: '600' } },
        },
      },
    },
  });
}

function renderIncomeExpenseChart() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const incomeByMonth = {};
  state.incomes.forEach((i) => {
    const key = monthKey(i.date);
    incomeByMonth[key] = (incomeByMonth[key] || 0) + (Number(i.amount) || 0);
  });
  const expenseByMonth = {};
  state.expenses.forEach((e) => {
    const key = monthKey(e.date);
    expenseByMonth[key] = (expenseByMonth[key] || 0) + (Number(e.amount) || 0);
  });

  const hasData = months.some((m) => (incomeByMonth[m] || 0) > 0 || (expenseByMonth[m] || 0) > 0);

  const canvas = document.getElementById('incomeExpenseChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const container = canvas.parentElement;

  if (incomeExpenseChartInstance) {
    incomeExpenseChartInstance.destroy();
    incomeExpenseChartInstance = null;
  }

  const oldEmpty = container?.querySelector('.chart-empty-state');
  if (oldEmpty) oldEmpty.remove();

  if (!hasData) {
    canvas.style.display = 'none';
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'chart-empty-state';
    emptyDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;min-height:200px;text-align:center;padding:24px 16px;background:rgba(248,250,252,0.6);border-radius:14px;border:1px dashed #cbd5e1;margin-top:8px;';
    emptyDiv.innerHTML = `
      <div style="width:48px;height:48px;border-radius:14px;background:#eef2ff;display:grid;place-items:center;font-size:24px;margin-bottom:10px;">📈</div>
      <strong style="color:#1e293b;font-size:0.95rem;">No income or expense trends yet</strong>
      <small style="color:#64748b;margin-top:4px;max-width:260px;font-size:0.82rem;">Log income or expenses to track monthly financial trends over time!</small>
    `;
    container?.appendChild(emptyDiv);
    return;
  }

  canvas.style.display = 'block';

  incomeExpenseChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months.map(monthLabel),
      datasets: [
        { label: 'Income', data: months.map((m) => incomeByMonth[m] || 0), backgroundColor: '#4f46e5', borderRadius: 6 },
        { label: 'Expenses', data: months.map((m) => expenseByMonth[m] || 0), backgroundColor: '#f43f5e', borderRadius: 6 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 14, font: { family: 'Plus Jakarta Sans', weight: '600' } },
        },
      },
    },
  });
}

/* ---------------------------------------------------------------------- */
/* Income                                                                 */
/* ---------------------------------------------------------------------- */

function renderIncomeList() {
  if (!state.incomes.length) {
    incomeListEl.innerHTML = '<p class="placeholder">No income records yet.</p>';
    return;
  }
  const sorted = [...state.incomes].sort((a, b) => new Date(b.date) - new Date(a.date));
  incomeListEl.innerHTML = sorted.map((i) => transactionRowHtml(i, true, { editable: true })).join('');
}

function openIncomeModal(income = null) {
  incomeForm.reset();
  state.editingIncomeId = income?.id || null;
  document.querySelector('#incomeModal .modal-header h2').textContent = income ? 'Edit Income' : 'Add Income';
  document.querySelector('#incomeForm button[type="submit"]').textContent = income ? 'Save Income' : 'Add Income';
  document.getElementById('incomeAmount').value = income?.rawAmount ?? income?.amount ?? '';
  document.getElementById('incomeCurrency').value = income?.currency || currentBaseCurrency;
  document.getElementById('incomeSource').value = income?.source || '';
  document.getElementById('incomeDate').value = income?.date ? income.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  document.getElementById('incomeNotes').value = income?.notes || '';
  document.getElementById('incomeRecurring').checked = Boolean(income?.recurring);
  incomeModal.classList.remove('hidden');
}

addIncomeBtn?.addEventListener('click', () => openIncomeModal());
closeIncomeModal?.addEventListener('click', () => incomeModal.classList.add('hidden'));
incomeModal?.addEventListener('click', (e) => {
  if (e.target === incomeModal) incomeModal.classList.add('hidden');
});

incomeListEl?.addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit][data-kind="income"]');
  const deleteBtn = e.target.closest('[data-delete][data-kind="income"]');
  if (editBtn) {
    const income = state.incomes.find((i) => String(i.id) === String(editBtn.dataset.edit));
    if (income) openIncomeModal(income);
  }
  if (deleteBtn) deleteIncome(deleteBtn.dataset.delete);
});

incomeForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    amount: Number(document.getElementById('incomeAmount').value),
    currency: document.getElementById('incomeCurrency').value,
    source: document.getElementById('incomeSource').value,
    date: document.getElementById('incomeDate').value,
    notes: document.getElementById('incomeNotes').value || undefined,
    recurring: document.getElementById('incomeRecurring').checked,
  };
  try {
    const apiPayload = buildIncomePayload(payload);
    if (state.editingIncomeId) {
      await apiRequest('PUT', `/transactions/${state.editingIncomeId}`, apiPayload);
      showMessage('Income updated.', 'success');
    } else {
      await apiRequest('POST', '/transactions', apiPayload);
      showMessage('Income added.', 'success');
    }
    incomeModal.classList.add('hidden');
    await loadAllData();
    renderIncomeList();
    renderDashboard();
    renderAllTransactions();
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Unable to save income.', 'error');
  }
});

async function deleteIncome(id) {
  if (!window.confirm('Delete this income entry?')) return;
  try {
    await apiRequest('DELETE', `/transactions/${id}`);
    showMessage('Income deleted.', 'success');
    await loadAllData();
    renderIncomeList();
    renderDashboard();
    renderAllTransactions();
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Unable to delete income.', 'error');
  }
}

/* ---------------------------------------------------------------------- */
/* Expenses                                                               */
/* ---------------------------------------------------------------------- */

function renderExpenseList() {
  if (!state.expenses.length) {
    expenseListEl.innerHTML = '<p class="placeholder">No expenses yet.</p>';
    return;
  }
  const sorted = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  expenseListEl.innerHTML = sorted.map((e) => transactionRowHtml(e, false, { editable: true })).join('');
}

function openExpenseModal(expense = null) {
  expenseForm.reset();
  state.editingExpenseId = expense?.id || null;
  state.pendingReceiptDataUrl = expense?.receiptImage || null;
  document.querySelector('#expenseModal .modal-header h2').textContent = expense ? 'Edit Expense' : 'Add Expense';
  document.querySelector('#expenseForm button[type="submit"]').textContent = expense ? 'Save Expense' : 'Add Expense';
  document.getElementById('expenseAmount').value = expense?.rawAmount ?? expense?.amount ?? '';
  document.getElementById('expenseCurrency').value = expense?.currency || currentBaseCurrency;
  document.getElementById('expenseCategory').value = expense?.category || '';
  document.getElementById('expenseDate').value = expense?.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  document.getElementById('paymentMethod').value = expense?.paymentMethod || 'Cash';
  document.getElementById('expenseNotes').value = expense?.notes || '';
  expenseModal.classList.remove('hidden');
}

addExpenseBtn?.addEventListener('click', () => openExpenseModal());
closeExpenseModal?.addEventListener('click', () => expenseModal.classList.add('hidden'));
expenseModal?.addEventListener('click', (e) => {
  if (e.target === expenseModal) expenseModal.classList.add('hidden');
});

expenseListEl?.addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit][data-kind="expense"]');
  const deleteBtn = e.target.closest('[data-delete][data-kind="expense"]');
  if (editBtn) {
    const expense = state.expenses.find((x) => String(x.id) === String(editBtn.dataset.edit));
    if (expense) openExpenseModal(expense);
  }
  if (deleteBtn) deleteExpense(deleteBtn.dataset.delete);
});

receiptUploadInput?.addEventListener('change', () => {
  const file = receiptUploadInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.pendingReceiptDataUrl = reader.result;
  };
  reader.readAsDataURL(file);
});

expenseForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    amount: Number(document.getElementById('expenseAmount').value),
    currency: document.getElementById('expenseCurrency').value,
    category: document.getElementById('expenseCategory').value,
    date: document.getElementById('expenseDate').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    notes: document.getElementById('expenseNotes').value || undefined,
    receiptImage: state.pendingReceiptDataUrl || undefined,
  };
  try {
    const apiPayload = buildExpensePayload(payload);
    if (state.editingExpenseId) {
      await apiRequest('PUT', `/transactions/${state.editingExpenseId}`, apiPayload);
      showMessage('Expense updated.', 'success');
    } else {
      await apiRequest('POST', '/transactions', apiPayload);
      showMessage('Expense added.', 'success');
    }
    expenseModal.classList.add('hidden');
    await loadAllData();
    renderExpenseList();
    renderDashboard();
    renderAllTransactions();
    renderBudgets();
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Unable to save expense.', 'error');
  }
});

async function deleteExpense(id) {
  if (!window.confirm('Delete this expense entry?')) return;
  try {
    await apiRequest('DELETE', `/transactions/${id}`);
    showMessage('Expense deleted.', 'success');
    await loadAllData();
    renderExpenseList();
    renderDashboard();
    renderAllTransactions();
    renderBudgets();
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Unable to delete expense.', 'error');
  }
}

/* ---------------------------------------------------------------------- */
/* Budgets (read-only progress view; add flow uses a simple prompt         */
/* since no budget form exists yet in the markup)                         */
/* ---------------------------------------------------------------------- */

/* ---------------------------------------------------------------------- */
/* Flexible Budgets                                                       */
/* ---------------------------------------------------------------------- */

function computeBudgetProgress() {
  const now = new Date();
  return state.budgets.map((budget) => {
    const limit = Number(budget.amount ?? budget.limit ?? 0);
    const category = budget.category || budget.name || 'Other';
    const period = budget.period || 'monthly';
    const startDate = budget.startDate;
    const endDate = budget.endDate;

    const matchingExpenses = state.expenses.filter((e) => {
      if (category && category !== 'Other' && (e.category || 'Other') !== category) {
        return false;
      }
      const eDate = new Date(e.date);
      if (period === 'daily') {
        const ref = startDate ? new Date(startDate) : now;
        return eDate.toDateString() === ref.toDateString();
      }
      if (period === 'weekly') {
        const ref = startDate ? new Date(startDate) : now;
        const diffDays = Math.abs((eDate - ref) / (1000 * 3600 * 24));
        return diffDays <= 7;
      }
      if (period === 'trip' || period === 'custom') {
        if (!startDate || !endDate) return true;
        return eDate >= new Date(startDate) && eDate <= new Date(endDate);
      }
      return isSameMonth(e.date, now);
    });

    const spent = matchingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    return { ...budget, category, limit, spent, pct, period };
  });
}

function renderBudgets() {
  const budgets = computeBudgetProgress();
  if (!budgets.length) {
    budgetsListEl.innerHTML = '<p class="placeholder">No budgets yet. Use "+ Add Budget" to create one.</p>';
    return;
  }
  budgetsListEl.innerHTML = budgets.map((b) => {
    const meta = EXPENSE_CATEGORIES[b.category] || { label: b.category };
    const fillClass = b.pct >= 100 ? 'danger' : b.pct >= 80 ? 'warning' : '';
    const periodLabel = b.period ? `(${b.period.toUpperCase()})` : '';
    return `
      <div class="budget-card">
        <div class="budget-card-top">
          <span>${meta.label} <small style="font-size:0.75rem;opacity:0.75;">${periodLabel}</small></span>
          <span>${Math.round(b.pct)}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill ${fillClass}" style="width:${b.pct}%"></div></div>
        <div class="budget-card-amounts"><span>${formatCurrency(b.spent)} spent</span><span>of ${formatCurrency(b.limit)}</span></div>
        <div class="tx-actions">
          <button class="button button-small button-ghost" data-edit-budget="${b.id}">Edit</button>
          <button class="button button-small button-danger" data-delete-budget="${b.id}">Delete</button>
        </div>
      </div>`;
  }).join('');
}

function openBudgetModal(budget = null) {
  budgetForm?.reset();
  state.editingBudgetId = budget?.id || null;
  const header = document.querySelector('#budgetModal .modal-header h2');
  if (header) header.textContent = budget ? 'Edit Budget' : 'Add Budget';

  const titleInput = document.getElementById('budgetName');
  if (titleInput) titleInput.value = budget?.name || '';
  const catInput = document.getElementById('budgetCategory');
  if (catInput) catInput.value = budget?.category || '';
  const amtInput = document.getElementById('budgetAmount');
  if (amtInput) amtInput.value = budget?.limit ?? budget?.amount ?? '';
  const periodInput = document.getElementById('budgetPeriod');
  if (periodInput) periodInput.value = budget?.period || 'monthly';

  if (budget?.period === 'trip' || budget?.period === 'custom') {
    budgetDateRow?.classList.remove('hidden');
    document.getElementById('budgetStartDate').value = budget.startDate || '';
    document.getElementById('budgetEndDate').value = budget.endDate || '';
  } else {
    budgetDateRow?.classList.add('hidden');
  }

  budgetModal?.classList.remove('hidden');
}

budgetPeriodSelect?.addEventListener('change', (e) => {
  const p = e.target.value;
  if (p === 'trip' || p === 'custom') {
    budgetDateRow?.classList.remove('hidden');
  } else {
    budgetDateRow?.classList.add('hidden');
  }
});

const addBudgetBtn = document.getElementById('addBudgetBtn');
addBudgetBtn?.addEventListener('click', () => openBudgetModal());
closeBudgetModal?.addEventListener('click', () => budgetModal?.classList.add('hidden'));
budgetModal?.addEventListener('click', (e) => {
  if (e.target === budgetModal) budgetModal?.classList.add('hidden');
});

budgetForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('budgetName').value;
  const category = document.getElementById('budgetCategory').value;
  const period = document.getElementById('budgetPeriod').value;
  const amount = Number(document.getElementById('budgetAmount').value);
  const startDate = document.getElementById('budgetStartDate').value;
  const endDate = document.getElementById('budgetEndDate').value;

  if (!category || !amount || amount <= 0) {
    showMessage('Please select a category and valid amount.', 'error');
    return;
  }
  try {
    const dbCategory = EXPENSE_CATEGORY_TO_DB[category] || category;
    const payload = {
      name: name || `${dbCategory} ${period.toUpperCase()} Budget`,
      amount,
      period,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      categoryId: findExpenseCategoryId(category),
    };

    if (state.editingBudgetId) {
      await apiRequest('PUT', `/budgets/${state.editingBudgetId}`, payload);
      showMessage('Budget updated.', 'success');
    } else {
      await apiRequest('POST', '/budgets', payload);
      showMessage('Budget added.', 'success');
    }
    budgetModal?.classList.add('hidden');
    await loadAllData();
    renderBudgets();
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Unable to save budget.', 'error');
  }
});

budgetsListEl?.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit-budget]');
  const deleteBtn = e.target.closest('[data-delete-budget]');
  if (editBtn) {
    const budget = state.budgets.find((b) => String(b.id) === String(editBtn.dataset.editBudget));
    if (budget) openBudgetModal(budget);
  }
  if (deleteBtn) {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await apiRequest('DELETE', `/budgets/${deleteBtn.dataset.deleteBudget}`);
      showMessage('Budget deleted.', 'success');
      await loadAllData();
      renderBudgets();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Unable to delete budget.', 'error');
    }
  }
});

/* ---------------------------------------------------------------------- */
/* Expense Groups & Trips                                                 */
/* ---------------------------------------------------------------------- */

async function loadExpenseGroups() {
  try {
    const res = await apiRequest('GET', '/settings/expense_groups');
    if (res?.data?.value) {
      state.expenseGroups = JSON.parse(res.data.value);
      return;
    }
  } catch (_) {}
  const local = localStorage.getItem('user_expense_groups');
  state.expenseGroups = local ? JSON.parse(local) : [];
}

async function saveExpenseGroups() {
  localStorage.setItem('user_expense_groups', JSON.stringify(state.expenseGroups));
  try {
    await apiRequest('POST', '/settings', {
      key: 'expense_groups',
      value: JSON.stringify(state.expenseGroups),
    });
  } catch (_) {}
}

function computeGroupTotal(group) {
  return (group.items || []).reduce((sum, item) => {
    const converted = convertAmount(item.amount, item.currency || 'USD', currentBaseCurrency);
    return sum + converted;
  }, 0);
}

function renderGroupItemRows() {
  if (!groupItemsContainer) return;
  if (!groupFormItems.length) {
    groupItemsContainer.innerHTML = '<p class="placeholder" style="margin:6px 0;font-size:0.85rem;">No line items in group yet. Click "+ Add Line Item" above.</p>';
    if (groupTotalDisplay) groupTotalDisplay.textContent = formatCurrency(0);
    return;
  }

  let total = 0;
  groupItemsContainer.innerHTML = groupFormItems.map((item, idx) => {
    const itemConverted = convertAmount(item.amount || 0, item.currency || currentBaseCurrency, currentBaseCurrency);
    total += itemConverted;

    return `
      <div class="form-row" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;background:#fff;padding:8px;border-radius:8px;border:1px solid var(--border);">
        <select data-item-idx="${idx}" data-field="category" style="width:130px;padding:6px;font-size:0.82rem;">
          <option value="Food" ${item.category === 'Food' ? 'selected' : ''}>🍔 Food</option>
          <option value="Transport" ${item.category === 'Transport' ? 'selected' : ''}>🚗 Transport</option>
          <option value="Bills" ${item.category === 'Bills' ? 'selected' : ''}>📄 Bills</option>
          <option value="Shopping" ${item.category === 'Shopping' ? 'selected' : ''}>🛍️ Shopping</option>
          <option value="Rent" ${item.category === 'Rent' ? 'selected' : ''}>🏠 Rent</option>
          <option value="Entertainment" ${item.category === 'Entertainment' ? 'selected' : ''}>🎬 Entertainment</option>
          <option value="Healthcare" ${item.category === 'Healthcare' ? 'selected' : ''}>🏥 Healthcare</option>
          <option value="Education" ${item.category === 'Education' ? 'selected' : ''}>🎓 Education</option>
          <option value="Travel" ${item.category === 'Travel' ? 'selected' : ''}>✈️ Travel</option>
          <option value="Return" ${item.category === 'Return' ? 'selected' : ''}>🔄 Return</option>
          <option value="Other" ${!item.category || item.category === 'Other' ? 'selected' : ''}>📌 Other</option>
        </select>
        <input type="text" data-item-idx="${idx}" data-field="title" placeholder="Item description" value="${item.title || ''}" style="flex:2;padding:6px;font-size:0.82rem;" required />
        <input type="number" data-item-idx="${idx}" data-field="amount" placeholder="0.00" step="0.01" value="${item.amount ?? ''}" style="width:90px;padding:6px;font-size:0.82rem;" required />
        <select data-item-idx="${idx}" data-field="currency" style="width:85px;padding:6px;font-size:0.82rem;">
          <option value="USD" ${item.currency === 'USD' ? 'selected' : ''}>USD</option>
          <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>EUR</option>
          <option value="GBP" ${item.currency === 'GBP' ? 'selected' : ''}>GBP</option>
          <option value="PKR" ${item.currency === 'PKR' ? 'selected' : ''}>PKR</option>
          <option value="INR" ${item.currency === 'INR' ? 'selected' : ''}>INR</option>
          <option value="AED" ${item.currency === 'AED' ? 'selected' : ''}>AED</option>
          <option value="SAR" ${item.currency === 'SAR' ? 'selected' : ''}>SAR</option>
          <option value="CAD" ${item.currency === 'CAD' ? 'selected' : ''}>CAD</option>
          <option value="AUD" ${item.currency === 'AUD' ? 'selected' : ''}>AUD</option>
          <option value="JPY" ${item.currency === 'JPY' ? 'selected' : ''}>JPY</option>
          <option value="KGS" ${item.currency === 'KGS' ? 'selected' : ''}>KGS</option>
        </select>
        <button type="button" class="button button-small button-danger" data-remove-group-item="${idx}" style="padding:4px 8px;">✕</button>
      </div>`;
  }).join('');

  if (groupTotalDisplay) groupTotalDisplay.textContent = formatCurrency(total);
}

groupItemsContainer?.addEventListener('change', (e) => {
  const target = e.target;
  const idx = target.dataset.itemIdx;
  const field = target.dataset.field;
  if (idx != null && field != null && groupFormItems[idx]) {
    groupFormItems[idx][field] = field === 'amount' ? Number(target.value) : target.value;
    renderGroupItemRows();
  }
});

groupItemsContainer?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove-group-item]');
  if (btn) {
    const idx = Number(btn.dataset.removeGroupItem);
    groupFormItems.splice(idx, 1);
    renderGroupItemRows();
  }
});

addGroupItemBtn?.addEventListener('click', () => {
  groupFormItems.push({
    category: 'Food',
    title: '',
    amount: '',
    currency: currentBaseCurrency,
    date: document.getElementById('groupStartDate')?.value || new Date().toISOString().slice(0, 10),
  });
  renderGroupItemRows();
});

function openExpenseGroupModal(group = null) {
  expenseGroupForm?.reset();
  state.editingGroupId = group?.id || null;
  const titleEl = document.getElementById('groupModalTitle');
  if (titleEl) titleEl.textContent = group ? 'Edit Expense Group' : 'Create Expense Group';
  const nameEl = document.getElementById('groupName');
  if (nameEl) nameEl.value = group?.name || '';
  const typeEl = document.getElementById('groupType');
  if (typeEl) typeEl.value = group?.type || 'trip';
  const today = new Date().toISOString().slice(0, 10);
  const startEl = document.getElementById('groupStartDate');
  if (startEl) startEl.value = group?.startDate || today;
  const endEl = document.getElementById('groupEndDate');
  if (endEl) endEl.value = group?.endDate || today;
  const notesEl = document.getElementById('groupNotes');
  if (notesEl) notesEl.value = group?.notes || '';

  groupFormItems = group?.items ? JSON.parse(JSON.stringify(group.items)) : [];
  renderGroupItemRows();
  expenseGroupModal?.classList.remove('hidden');
}

addExpenseGroupBtn?.addEventListener('click', () => openExpenseGroupModal());
closeExpenseGroupModal?.addEventListener('click', () => expenseGroupModal?.classList.add('hidden'));
expenseGroupModal?.addEventListener('click', (e) => {
  if (e.target === expenseGroupModal) expenseGroupModal?.classList.add('hidden');
});

expenseGroupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('groupName').value;
  const type = document.getElementById('groupType').value;
  const startDate = document.getElementById('groupStartDate').value;
  const endDate = document.getElementById('groupEndDate').value;
  const notes = document.getElementById('groupNotes').value;

  const groupData = {
    id: state.editingGroupId || `group_${Date.now()}`,
    name,
    type,
    startDate,
    endDate,
    notes,
    items: groupFormItems,
  };

  if (state.editingGroupId) {
    const idx = state.expenseGroups.findIndex((g) => String(g.id) === String(state.editingGroupId));
    if (idx !== -1) state.expenseGroups[idx] = groupData;
  } else {
    state.expenseGroups.push(groupData);
  }

  await saveExpenseGroups();
  expenseGroupModal?.classList.add('hidden');
  showMessage(state.editingGroupId ? 'Expense Group updated.' : 'Expense Group created.', 'success');
  await loadAllData();
  renderExpenseGroupsList();
  renderDashboard();
});

function renderExpenseGroupsList() {
  if (!expenseGroupsListEl) return;
  if (!state.expenseGroups.length) {
    expenseGroupsListEl.innerHTML = '<p class="placeholder">No expense groups yet. Click "+ Create Expense Group" to bundle expenses for trips or events!</p>';
    return;
  }

  expenseGroupsListEl.innerHTML = state.expenseGroups.map((g) => {
    const total = computeGroupTotal(g);
    const typeBadges = { trip: '✈️ Trip', day: '📅 Single Day', week: '🗓️ Week', custom: '📆 Custom' };
    const badgeText = typeBadges[g.type] || '📦 Group';

    const itemsHtml = (g.items || []).map((item) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:6px;font-size:0.82rem;">${EXPENSE_CATEGORIES[item.category]?.label || item.category}</td>
        <td style="padding:6px;font-size:0.82rem;font-weight:600;">${item.title || 'Item'}</td>
        <td style="padding:6px;font-size:0.82rem;text-align:right;font-weight:600;">
          ${formatCurrency(convertAmount(item.amount, item.currency || 'USD', currentBaseCurrency))}
          ${item.currency && item.currency !== currentBaseCurrency ? `<small style="opacity:0.7;display:block;">${item.amount} ${item.currency}</small>` : ''}
        </td>
      </tr>`).join('');

    return `
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h3 style="margin:0 0 4px 0;">${g.name} <span class="badge" style="background:#e0f2fe;color:#0369a1;margin-left:6px;">${badgeText}</span></h3>
            <small style="color:var(--muted);">${formatDate(g.startDate)} ${g.startDate !== g.endDate ? `— ${formatDate(g.endDate)}` : ''}</small>
          </div>
          <div style="text-align:right;">
            <span style="font-size:1.25rem;font-weight:700;color:var(--danger);">${formatCurrency(total)}</span>
            <small style="display:block;color:var(--muted);">${(g.items || []).length} line items</small>
          </div>
        </div>

        ${g.notes ? `<p style="font-size:0.85rem;color:var(--muted);margin:8px 0;">${g.notes}</p>` : ''}

        <details style="margin-top:10px;background:#f8fafc;padding:8px 12px;border-radius:8px;border:1px solid var(--border);">
          <summary style="font-size:0.85rem;font-weight:600;cursor:pointer;">View Line-Item Breakdown (${(g.items || []).length})</summary>
          <table style="width:100%;margin-top:8px;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid #cbd5e1;text-align:left;font-size:0.75rem;color:var(--muted);">
                <th>Category</th><th>Item</th><th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsHtml || '<tr><td colspan="3" style="padding:6px;font-size:0.8rem;">No items</td></tr>'}</tbody>
          </table>
        </details>

        <div class="tx-actions" style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
          <button class="button button-small button-outline" data-add-item-group="${g.id}">+ Add Item</button>
          <button class="button button-small button-ghost" data-edit-group="${g.id}">Edit</button>
          <button class="button button-small button-danger" data-delete-group="${g.id}">Delete</button>
        </div>
      </div>`;
  }).join('');
}

expenseGroupsListEl?.addEventListener('click', async (e) => {
  const addBtn = e.target.closest('[data-add-item-group]');
  const editBtn = e.target.closest('[data-edit-group]');
  const deleteBtn = e.target.closest('[data-delete-group]');

  if (addBtn) {
    const group = state.expenseGroups.find((g) => String(g.id) === String(addBtn.dataset.addItemGroup));
    if (group) {
      openExpenseGroupModal(group);
      groupFormItems.push({ category: 'Food', title: '', amount: '', currency: currentBaseCurrency, date: group.startDate });
      renderGroupItemRows();
    }
  }
  if (editBtn) {
    const group = state.expenseGroups.find((g) => String(g.id) === String(editBtn.dataset.editGroup));
    if (group) openExpenseGroupModal(group);
  }
  if (deleteBtn) {
    if (!window.confirm('Delete this expense group?')) return;
    state.expenseGroups = state.expenseGroups.filter((g) => String(g.id) !== String(deleteBtn.dataset.deleteGroup));
    await saveExpenseGroups();
    showMessage('Expense group deleted.', 'success');
    await loadAllData();
    renderExpenseGroupsList();
    renderDashboard();
  }
});

/* ---------------------------------------------------------------------- */
/* Expenses View Tabs (Individual vs Group)                              */
/* ---------------------------------------------------------------------- */

const tabIndividualExpensesBtn = document.getElementById('tabIndividualExpensesBtn');
const tabGroupExpensesBtn = document.getElementById('tabGroupExpensesBtn');
const individualExpensesView = document.getElementById('individualExpensesView');
const groupExpensesView = document.getElementById('groupExpensesView');

function switchExpenseTab(tab) {
  if (tab === 'group') {
    tabGroupExpensesBtn?.classList.add('active');
    tabIndividualExpensesBtn?.classList.remove('active');
    individualExpensesView?.classList.add('hidden');
    groupExpensesView?.classList.remove('hidden');
  } else {
    tabIndividualExpensesBtn?.classList.add('active');
    tabGroupExpensesBtn?.classList.remove('active');
    groupExpensesView?.classList.add('hidden');
    individualExpensesView?.classList.remove('hidden');
  }
}

tabIndividualExpensesBtn?.addEventListener('click', () => switchExpenseTab('individual'));
tabGroupExpensesBtn?.addEventListener('click', () => switchExpenseTab('group'));

/* ---------------------------------------------------------------------- */
/* Future Plans                                                           */
/* ---------------------------------------------------------------------- */

async function loadPlans() {
  try {
    const res = await apiRequest('GET', '/settings/future_plans');
    if (res?.data?.value) {
      state.plans = JSON.parse(res.data.value);
      return;
    }
  } catch (_) {}
  const local = localStorage.getItem('user_future_plans');
  state.plans = local ? JSON.parse(local) : [];
}

async function savePlans() {
  localStorage.setItem('user_future_plans', JSON.stringify(state.plans));
  try {
    await apiRequest('POST', '/settings', {
      key: 'future_plans',
      value: JSON.stringify(state.plans),
    });
  } catch (_) {}
}

function computePlanTotal(plan) {
  return (plan.items || []).reduce((sum, item) => {
    const converted = convertAmount(item.amount, item.currency || 'USD', currentBaseCurrency);
    return sum + converted;
  }, 0);
}

function renderPlanItemRows() {
  if (!planItemsContainer) return;
  if (!planFormItems.length) {
    planItemsContainer.innerHTML = '<p class="placeholder" style="margin:6px 0;font-size:0.85rem;">No estimated items added yet. Click "+ Add Estimated Item" above.</p>';
    if (planTotalDisplay) planTotalDisplay.textContent = formatCurrency(0);
    return;
  }

  let total = 0;
  planItemsContainer.innerHTML = planFormItems.map((item, idx) => {
    const itemConverted = convertAmount(item.amount || 0, item.currency || currentBaseCurrency, currentBaseCurrency);
    total += itemConverted;

    return `
      <div class="form-row" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;background:#fff;padding:8px;border-radius:8px;border:1px solid var(--border);">
        <select data-plan-idx="${idx}" data-field="category" style="width:130px;padding:6px;font-size:0.82rem;">
          <option value="Education" ${item.category === 'Education' ? 'selected' : ''}>🎓 Education</option>
          <option value="Travel" ${item.category === 'Travel' ? 'selected' : ''}>✈️ Travel</option>
          <option value="Shopping" ${item.category === 'Shopping' ? 'selected' : ''}>🛍️ Shopping</option>
          <option value="Rent" ${item.category === 'Rent' ? 'selected' : ''}>🏠 Rent / Housing</option>
          <option value="Bills" ${item.category === 'Bills' ? 'selected' : ''}>📄 Bills & Setup</option>
          <option value="Other" ${!item.category || item.category === 'Other' ? 'selected' : ''}>📌 Other</option>
        </select>
        <input type="text" data-plan-idx="${idx}" data-field="title" placeholder="Estimated cost description" value="${item.title || ''}" style="flex:2;padding:6px;font-size:0.82rem;" required />
        <input type="number" data-plan-idx="${idx}" data-field="amount" placeholder="0.00" step="0.01" value="${item.amount ?? ''}" style="width:95px;padding:6px;font-size:0.82rem;" required />
        <select data-plan-idx="${idx}" data-field="currency" style="width:85px;padding:6px;font-size:0.82rem;">
          <option value="USD" ${item.currency === 'USD' ? 'selected' : ''}>USD</option>
          <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>EUR</option>
          <option value="GBP" ${item.currency === 'GBP' ? 'selected' : ''}>GBP</option>
          <option value="PKR" ${item.currency === 'PKR' ? 'selected' : ''}>PKR</option>
          <option value="INR" ${item.currency === 'INR' ? 'selected' : ''}>INR</option>
          <option value="AED" ${item.currency === 'AED' ? 'selected' : ''}>AED</option>
          <option value="SAR" ${item.currency === 'SAR' ? 'selected' : ''}>SAR</option>
          <option value="KGS" ${item.currency === 'KGS' ? 'selected' : ''}>KGS</option>
        </select>
        <button type="button" class="button button-small button-danger" data-remove-plan-item="${idx}" style="padding:4px 8px;">✕</button>
      </div>`;
  }).join('');

  if (planTotalDisplay) planTotalDisplay.textContent = formatCurrency(total);
}

planItemsContainer?.addEventListener('change', (e) => {
  const target = e.target;
  const idx = target.dataset.planIdx;
  const field = target.dataset.field;
  if (idx != null && field != null && planFormItems[idx]) {
    planFormItems[idx][field] = field === 'amount' ? Number(target.value) : target.value;
    renderPlanItemRows();
  }
});

planItemsContainer?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove-plan-item]');
  if (btn) {
    const idx = Number(btn.dataset.removePlanItem);
    planFormItems.splice(idx, 1);
    renderPlanItemRows();
  }
});

addPlanItemBtn?.addEventListener('click', () => {
  planFormItems.push({
    category: 'Education',
    title: '',
    amount: '',
    currency: currentBaseCurrency,
  });
  renderPlanItemRows();
});

function openPlanModal(plan = null) {
  planForm?.reset();
  state.editingPlanId = plan?.id || null;
  const titleEl = document.getElementById('planModalTitle');
  if (titleEl) titleEl.textContent = plan ? 'Edit Future Plan' : 'Create Future Plan';
  const nameEl = document.getElementById('planName');
  if (nameEl) nameEl.value = plan?.name || '';
  const dateEl = document.getElementById('planTargetDate');
  if (dateEl) dateEl.value = plan?.targetDate || new Date().toISOString().slice(0, 10);
  const notesEl = document.getElementById('planNotes');
  if (notesEl) notesEl.value = plan?.notes || '';

  planFormItems = plan?.items ? JSON.parse(JSON.stringify(plan.items)) : [];
  renderPlanItemRows();
  planModal?.classList.remove('hidden');
}

addPlanBtn?.addEventListener('click', () => openPlanModal());
closePlanModal?.addEventListener('click', () => planModal?.classList.add('hidden'));
planModal?.addEventListener('click', (e) => {
  if (e.target === planModal) planModal?.classList.add('hidden');
});

planForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('planName').value;
  const targetDate = document.getElementById('planTargetDate').value;
  const notes = document.getElementById('planNotes').value;

  const planData = {
    id: state.editingPlanId || `plan_${Date.now()}`,
    name,
    targetDate,
    notes,
    items: planFormItems,
  };

  if (state.editingPlanId) {
    const idx = state.plans.findIndex((p) => String(p.id) === String(state.editingPlanId));
    if (idx !== -1) state.plans[idx] = planData;
  } else {
    state.plans.push(planData);
  }

  await savePlans();
  planModal?.classList.add('hidden');
  showMessage(state.editingPlanId ? 'Future Plan updated.' : 'Future Plan created.', 'success');
  renderPlansList();
});

function renderPlansList() {
  if (!plansListEl) return;
  if (!state.plans.length) {
    plansListEl.innerHTML = '<p class="placeholder">No future plans created yet. Click "+ Create Future Plan" to estimate upcoming costs!</p>';
    return;
  }

  plansListEl.innerHTML = state.plans.map((p) => {
    const total = computePlanTotal(p);
    const itemsHtml = (p.items || []).map((item) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:6px;font-size:0.82rem;">${EXPENSE_CATEGORIES[item.category]?.label || item.category}</td>
        <td style="padding:6px;font-size:0.82rem;font-weight:600;">${item.title || 'Item'}</td>
        <td style="padding:6px;font-size:0.82rem;text-align:right;font-weight:600;color:var(--success);">
          ${formatCurrency(convertAmount(item.amount, item.currency || 'USD', currentBaseCurrency))}
        </td>
      </tr>`).join('');

    return `
      <div class="card" style="margin-bottom:16px;border-left:4px solid var(--success);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h3 style="margin:0 0 4px 0;">🚀 ${p.name}</h3>
            <small style="color:var(--muted);">Target Date: ${formatDate(p.targetDate)}</small>
          </div>
          <div style="text-align:right;">
            <span style="font-size:1.25rem;font-weight:700;color:var(--success);">${formatCurrency(total)}</span>
            <small style="display:block;color:var(--muted);">Estimated Plan Cost</small>
          </div>
        </div>

        ${p.notes ? `<p style="font-size:0.85rem;color:var(--muted);margin:8px 0;">${p.notes}</p>` : ''}

        <details style="margin-top:10px;background:#f8fafc;padding:8px 12px;border-radius:8px;border:1px solid var(--border);" open>
          <summary style="font-size:0.85rem;font-weight:600;cursor:pointer;">Estimated Line-Item Costs (${(p.items || []).length})</summary>
          <table style="width:100%;margin-top:8px;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid #cbd5e1;text-align:left;font-size:0.75rem;color:var(--muted);">
                <th>Category</th><th>Item Description</th><th style="text-align:right;">Estimated Cost</th>
              </tr>
            </thead>
            <tbody>${itemsHtml || '<tr><td colspan="3" style="padding:6px;font-size:0.8rem;">No items added</td></tr>'}</tbody>
          </table>
        </details>

        <div class="tx-actions" style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
          <button class="button button-small button-ghost" data-edit-plan="${p.id}">Edit Plan</button>
          <button class="button button-small button-danger" data-delete-plan="${p.id}">Delete</button>
        </div>
      </div>`;
  }).join('');
}

plansListEl?.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit-plan]');
  const deleteBtn = e.target.closest('[data-delete-plan]');

  if (editBtn) {
    const plan = state.plans.find((p) => String(p.id) === String(editBtn.dataset.editPlan));
    if (plan) openPlanModal(plan);
  }
  if (deleteBtn) {
    if (!window.confirm('Delete this future plan?')) return;
    state.plans = state.plans.filter((p) => String(p.id) !== String(deleteBtn.dataset.deletePlan));
    await savePlans();
    showMessage('Future Plan deleted.', 'success');
    renderPlansList();
  }
});

/* ---------------------------------------------------------------------- */
/* Init                                                                    */
/* ---------------------------------------------------------------------- */

window.addEventListener('DOMContentLoaded', () => {
  loadApp();
});