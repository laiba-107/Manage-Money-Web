const ACCESS_TOKEN_KEY = 'manage_money_access_token';
const REFRESH_TOKEN_KEY = 'manage_money_refresh_token';
const API_BASE_URL = (() => {
  const custom = window.API_BASE_URL;
  if (typeof custom === 'string' && custom.trim().length) {
    return custom.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
})();
const API_PREFIX = '/api/v1';

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

let categoryChartInstance = null;
let incomeExpenseChartInstance = null;

const state = {
  incomes: [],
  expenses: [],
  budgets: [],
  editingIncomeId: null,
  editingExpenseId: null,
  pendingReceiptDataUrl: null,
};

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

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
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
  window.location.href = `${API_BASE_URL}${API_PREFIX}/auth/google?target=web`;
}

/* ---------------------------------------------------------------------- */
/* Page / nav switching                                                   */
/* ---------------------------------------------------------------------- */

function switchPage(pageName) {
  document.querySelectorAll('.page').forEach((el) => {
    el.classList.toggle('active', el.id === `page-${pageName}`);
  });
  sidebar?.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });
}

sidebar?.addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-item');
  if (!btn) return;
  switchPage(btn.dataset.page);
});

/* ---------------------------------------------------------------------- */
/* Data loading                                                           */
/* ---------------------------------------------------------------------- */

async function loadAllData() {
  const [incomesResult, expensesResult, budgetsResult] = await Promise.all([
    apiRequest('GET', '/incomes').catch(() => ({ data: [] })),
    apiRequest('GET', '/expenses').catch(() => ({ data: [] })),
    apiRequest('GET', '/budgets').catch(() => ({ data: [] })),
  ]);

  state.incomes = Array.isArray(incomesResult?.data) ? incomesResult.data : [];
  state.expenses = Array.isArray(expensesResult?.data) ? expensesResult.data : [];
  state.budgets = Array.isArray(budgetsResult?.data) ? budgetsResult.data : [];
}

async function loadApp() {
  const token = getAccessToken();
  if (!token) {
    authButton.textContent = 'Sign in';
    authButton.onclick = handleLogin;
    sidebar?.classList.add('hidden');
    userInfo?.classList.add('hidden');
    return;
  }

  authButton.textContent = 'Sign out';
  authButton.onclick = handleLogout;
  sidebar?.classList.remove('hidden');

  try {
    const profileResult = await apiRequest('GET', '/auth/me');
    const user = profileResult?.data || {};
    headerUserName.textContent = user.displayName || user.email || 'Your profile';
    userInfo?.classList.remove('hidden');

    await loadAllData();
    renderDashboard();
    renderIncomeList();
    renderExpenseList();
    renderBudgets();
    renderAllTransactions();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load dashboard.';
    showMessage(message, 'error');
    if (message.toLowerCase().includes('unauthorized')) {
      clearTokens();
      authButton.textContent = 'Sign in';
      authButton.onclick = handleLogin;
      sidebar?.classList.add('hidden');
      userInfo?.classList.add('hidden');
    }
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

function renderDashboard() {
  const stats = computeDashboardStats();
  totalBalanceEl.textContent = formatCurrency(stats.totalBalance);
  monthlyIncomeEl.textContent = formatCurrency(stats.monthlyIncome);
  monthlyExpensesEl.textContent = formatCurrency(stats.monthlyExpenses);
  monthlySavingsEl.textContent = formatCurrency(stats.monthlySavings);

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
      <div style="display:flex;align-items:center;">
        <span class="tx-amount ${isIncome ? 'positive' : 'negative'}">${isIncome ? '+' : '-'}${formatCurrency(t.amount)}</span>
        ${receipt}
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
  state.expenses.filter((e) => isSameMonth(e.date, now)).forEach((e) => {
    const key = e.category || 'Other';
    byCategory[key] = (byCategory[key] || 0) + (Number(e.amount) || 0);
  });

  const labels = Object.keys(byCategory);
  const canvas = document.getElementById('categoryChart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (categoryChartInstance) categoryChartInstance.destroy();
  if (!labels.length) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  categoryChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels.map((k) => EXPENSE_CATEGORIES[k]?.label || k),
      datasets: [{
        data: labels.map((k) => byCategory[k]),
        backgroundColor: labels.map((k) => EXPENSE_CATEGORIES[k]?.color || '#94a3b8'),
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } } },
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

  const canvas = document.getElementById('incomeExpenseChart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (incomeExpenseChartInstance) incomeExpenseChartInstance.destroy();

  incomeExpenseChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months.map(monthLabel),
      datasets: [
        { label: 'Income', data: months.map((m) => incomeByMonth[m] || 0), backgroundColor: '#4338ca', borderRadius: 6 },
        { label: 'Expenses', data: months.map((m) => expenseByMonth[m] || 0), backgroundColor: '#f97316', borderRadius: 6 },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } } },
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
  document.getElementById('incomeAmount').value = income?.amount ?? '';
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
    source: document.getElementById('incomeSource').value,
    date: document.getElementById('incomeDate').value,
    notes: document.getElementById('incomeNotes').value || undefined,
    recurring: document.getElementById('incomeRecurring').checked,
  };
  try {
    if (state.editingIncomeId) {
      await apiRequest('PATCH', `/incomes/${state.editingIncomeId}`, payload);
      showMessage('Income updated.', 'success');
    } else {
      await apiRequest('POST', '/incomes', payload);
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
    await apiRequest('DELETE', `/incomes/${id}`);
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
  document.getElementById('expenseAmount').value = expense?.amount ?? '';
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
    category: document.getElementById('expenseCategory').value,
    date: document.getElementById('expenseDate').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    notes: document.getElementById('expenseNotes').value || undefined,
    receiptImage: state.pendingReceiptDataUrl || undefined,
  };
  try {
    if (state.editingExpenseId) {
      await apiRequest('PATCH', `/expenses/${state.editingExpenseId}`, payload);
      showMessage('Expense updated.', 'success');
    } else {
      await apiRequest('POST', '/expenses', payload);
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
    await apiRequest('DELETE', `/expenses/${id}`);
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

function computeBudgetProgress() {
  const now = new Date();
  return state.budgets.map((budget) => {
    const limit = Number(budget.amount ?? budget.limit ?? 0);
    const category = budget.category || budget.name || 'Other';
    const explicitSpent = budget.spent != null ? Number(budget.spent) : null;
    const spent = explicitSpent != null
      ? explicitSpent
      : state.expenses
        .filter((e) => (e.category || 'Other') === category && isSameMonth(e.date, now))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    return { ...budget, category, limit, spent, pct };
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
    return `
      <div class="budget-card">
        <div class="budget-card-top"><span>${meta.label}</span><span>${Math.round(b.pct)}%</span></div>
        <div class="progress-track"><div class="progress-fill ${fillClass}" style="width:${b.pct}%"></div></div>
        <div class="budget-card-amounts"><span>${formatCurrency(b.spent)} spent</span><span>of ${formatCurrency(b.limit)}</span></div>
        <div class="tx-actions">
          <button class="button button-small button-ghost" data-edit-budget="${b.id}">Edit</button>
          <button class="button button-small button-danger" data-delete-budget="${b.id}">Delete</button>
        </div>
      </div>`;
  }).join('');
}

const addBudgetBtn = document.getElementById('addBudgetBtn');
addBudgetBtn?.addEventListener('click', async () => {
  const category = window.prompt('Category (Food, Transport, Bills, Shopping, Rent, Entertainment, Healthcare, Education, Travel, Other):', 'Food');
  if (!category) return;
  const amountStr = window.prompt(`Monthly budget limit for ${category}:`, '200');
  const amount = Number(amountStr);
  if (!amountStr || Number.isNaN(amount) || amount <= 0) {
    showMessage('Enter a valid budget amount.', 'error');
    return;
  }
  try {
    await apiRequest('POST', '/budgets', { category, amount });
    showMessage('Budget added.', 'success');
    await loadAllData();
    renderBudgets();
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Unable to add budget.', 'error');
  }
});

budgetsListEl?.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit-budget]');
  const deleteBtn = e.target.closest('[data-delete-budget]');
  if (editBtn) {
    const budget = state.budgets.find((b) => String(b.id) === String(editBtn.dataset.editBudget));
    if (!budget) return;
    const amountStr = window.prompt(`New monthly limit for ${budget.category || budget.name}:`, String(budget.amount ?? budget.limit ?? ''));
    const amount = Number(amountStr);
    if (!amountStr || Number.isNaN(amount) || amount <= 0) return;
    try {
      await apiRequest('PATCH', `/budgets/${budget.id}`, { amount });
      showMessage('Budget updated.', 'success');
      await loadAllData();
      renderBudgets();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Unable to update budget.', 'error');
    }
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
/* Init                                                                    */
/* ---------------------------------------------------------------------- */

window.addEventListener('DOMContentLoaded', () => {
  loadApp();
});