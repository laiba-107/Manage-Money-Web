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
  Food: { label: '🍔 Food & Dining', color: '#b57e4c' },
  Transport: { label: '🚗 Transport', color: '#556b2f' },
  Bills: { label: '📄 Bills & Utilities', color: '#6b705c' },
  Shopping: { label: '🛍️ Shopping', color: '#c27d53' },
  Rent: { label: '🏠 Rent', color: '#4a3525' },
  Entertainment: { label: '🎬 Entertainment', color: '#c88d2d' },
  Healthcare: { label: '🏥 Healthcare', color: '#b24434' },
  Education: { label: '🎓 Education', color: '#3d6330' },
  Travel: { label: '✈️ Travel', color: '#8a572c' },
  Return: { label: '🔄 Return / Refund', color: '#5d8c47' },
  Other: { label: '📌 Other', color: '#8c7e6d' },
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
const totalBalanceLabelEl = document.getElementById('totalBalanceLabel');
const totalBalanceSubEl = document.getElementById('totalBalanceSub');
const monthlyIncomeLabelEl = document.getElementById('monthlyIncomeLabel');
const monthlyIncomeSubEl = document.getElementById('monthlyIncomeSub');
const monthlyExpensesLabelEl = document.getElementById('monthlyExpensesLabel');
const monthlyExpensesSubEl = document.getElementById('monthlyExpensesSub');
const monthlySavingsLabelEl = document.getElementById('monthlySavingsLabel');
const monthlySavingsSubEl = document.getElementById('monthlySavingsSub');

const dashboardMonthSelectEl = document.getElementById('dashboardMonthSelect');
const monthlyHistoryTableBodyEl = document.getElementById('monthlyHistoryTableBody');
const monthlyHistoryBadgeEl = document.getElementById('monthlyHistoryBadge');
const categoryChartSubtitleEl = document.getElementById('categoryChartSubtitle');

const incomeListEl = document.getElementById('incomeList');
const expenseListEl = document.getElementById('expenseList');
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

let categoryChartInstance = null;
let incomeExpenseChartInstance = null;

const state = {
  categories: [],
  incomes: [],
  expenses: [],
  rawIncomes: [],
  rawExpenses: [],
  expenseGroups: [],
  plans: [],
  selectedMonthKey: null,
  editingIncomeId: null,
  editingExpenseId: null,
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

const WORLD_CURRENCIES = [
  // Popular / Major
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79, locale: 'en-GB' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs ', rate: 278.5, locale: 'ur-PK' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.5, locale: 'hi-IN' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED ', rate: 3.67, locale: 'ar-AE' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR ', rate: 3.75, locale: 'ar-SA' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.36, locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.52, locale: 'en-AU' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 155.0, locale: 'ja-JP' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.23, locale: 'zh-CN' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF ', rate: 0.90, locale: 'de-CH' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.35, locale: 'en-SG' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.65, locale: 'en-NZ' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.82, locale: 'zh-HK' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM ', rate: 4.72, locale: 'ms-MY' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 36.8, locale: 'th-TH' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp ', rate: 16100, locale: 'id-ID' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', rate: 57.5, locale: 'fil-PH' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 117.0, locale: 'bn-BD' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs ', rate: 302.0, locale: 'si-LK' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 32.2, locale: 'tr-TR' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R ', rate: 18.3, locale: 'en-ZA' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 5.15, locale: 'pt-BR' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', rate: 16.8, locale: 'es-MX' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR ', rate: 3.64, locale: 'ar-QA' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD ', rate: 0.31, locale: 'ar-KW' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD ', rate: 0.38, locale: 'ar-BH' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR ', rate: 0.385, locale: 'ar-OM' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD ', rate: 0.71, locale: 'ar-JO' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£ ', rate: 47.5, locale: 'ar-EG' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 1450, locale: 'en-NG' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh ', rate: 132.0, locale: 'sw-KE' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵ ', rate: 14.5, locale: 'ak-GH' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1370, locale: 'ko-KR' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', rate: 32.4, locale: 'zh-TW' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', rate: 25400, locale: 'vi-VN' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr ', rate: 10.8, locale: 'sv-SE' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr ', rate: 10.7, locale: 'nb-NO' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr ', rate: 6.9, locale: 'da-DK' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł ', rate: 3.95, locale: 'pl-PL' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč ', rate: 23.0, locale: 'cs-CZ' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft ', rate: 360.0, locale: 'hu-HU' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei ', rate: 4.6, locale: 'ro-RO' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв ', rate: 1.8, locale: 'bg-BG' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', rate: 3.7, locale: 'he-IL' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', rate: 91.0, locale: 'ru-RU' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', rate: 39.8, locale: 'uk-UA' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', rate: 445.0, locale: 'kk-KZ' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: "so'm ", rate: 12700, locale: 'uz-UZ' },
  { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'сом ', rate: 87.5, locale: 'ky-KG' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD ', rate: 10.0, locale: 'ar-MA' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA ', rate: 134.0, locale: 'ar-DZ' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT ', rate: 3.12, locale: 'ar-TN' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'IQD ', rate: 1310, locale: 'ar-IQ' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'L£ ', rate: 89500, locale: 'ar-LB' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs ', rate: 133.5, locale: 'ne-NP' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', rate: 71.0, locale: 'ps-AF' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K ', rate: 2100, locale: 'my-MM' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', rate: 4100, locale: 'km-KH' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', rate: 21500, locale: 'lo-LA' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr ', rate: 139.0, locale: 'is-IS' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'din. ', rate: 108.0, locale: 'sr-RS' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', rate: 2.7, locale: 'ka-GE' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', rate: 1.7, locale: 'az-AZ' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', rate: 388.0, locale: 'hy-AM' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br ', rate: 3.27, locale: 'be-BY' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', rate: 885.0, locale: 'es-AR' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', rate: 3850, locale: 'es-CO' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', rate: 935.0, locale: 'es-CL' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/. ', rate: 3.73, locale: 'es-PE' },
  { code: 'CRC', name: 'Costa Rican Colon', symbol: '₡', rate: 515.0, locale: 'es-CR' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$ ', rate: 59.0, locale: 'es-DO' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q ', rate: 7.78, locale: 'es-GT' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L ', rate: 24.7, locale: 'es-HN' },
  { code: 'NIO', name: 'Nicaraguan Cordoba', symbol: 'C$ ', rate: 36.8, locale: 'es-NI' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/. ', rate: 1.0, locale: 'es-PA' },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲', rate: 7500, locale: 'es-PY' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U ', rate: 38.6, locale: 'es-UY' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs. ', rate: 6.91, locale: 'es-BO' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$ ', rate: 156.0, locale: 'en-JM' },
  { code: 'TTD', name: 'Trinidad & Tobago Dollar', symbol: 'TT$ ', rate: 6.78, locale: 'en-TT' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$ ', rate: 2.0, locale: 'en-BB' },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$ ', rate: 1.0, locale: 'en-BS' },
  { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$ ', rate: 2.0, locale: 'en-BZ' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA ', rate: 605.0, locale: 'fr-SN' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA ', rate: 605.0, locale: 'fr-CM' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh ', rate: 2600, locale: 'sw-TZ' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh ', rate: 3800, locale: 'en-UG' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF ', rate: 1300, locale: 'rw-RW' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br ', rate: 57.5, locale: 'am-ET' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT ', rate: 63.9, locale: 'pt-MZ' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz ', rate: 855.0, locale: 'pt-AO' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK ', rate: 26.5, locale: 'en-ZM' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P ', rate: 13.7, locale: 'en-BW' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$ ', rate: 18.3, locale: 'en-NA' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: 'Rs ', rate: 46.2, locale: 'en-MU' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$ ', rate: 2.26, locale: 'en-FJ' },
];

const CURRENCIES = {};
WORLD_CURRENCIES.forEach((c) => {
  CURRENCIES[c.code] = {
    symbol: c.symbol,
    rate: c.rate,
    locale: c.locale || 'en-US',
    name: c.name,
  };
});

let currentBaseCurrency = localStorage.getItem('user_base_currency') || 'USD';

function populateCurrencyDropdown(selectEl, selectedValue = currentBaseCurrency) {
  if (!selectEl) return;
  const currentVal = selectedValue || selectEl.value || currentBaseCurrency;
  const isNavbarSelect = selectEl.id === 'userBaseCurrency';
  selectEl.innerHTML = '';

  const popularGroup = document.createElement('optgroup');
  popularGroup.label = '⭐ Popular Currencies';

  const popularCodes = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'TRY', 'BRL', 'SGD', 'MYR'];
  popularCodes.forEach((code) => {
    const c = CURRENCIES[code];
    if (c) {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = isNavbarSelect
        ? `${code} (${c.symbol.trim()})`
        : `${code} (${c.symbol.trim()}) · ${c.name}`;
      popularGroup.appendChild(opt);
    }
  });

  const allGroup = document.createElement('optgroup');
  allGroup.label = '🌐 All World Currencies (A-Z)';
  const sorted = [...WORLD_CURRENCIES].sort((a, b) => a.code.localeCompare(b.code));
  sorted.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = isNavbarSelect
      ? `${c.code} (${c.symbol.trim()})`
      : `${c.code} (${c.symbol.trim()}) · ${c.name}`;
    allGroup.appendChild(opt);
  });

  selectEl.appendChild(popularGroup);
  selectEl.appendChild(allGroup);
  selectEl.value = CURRENCIES[currentVal] ? currentVal : 'USD';
}

function populateAllCurrencySelects() {
  const ids = ['userBaseCurrency', 'incomeCurrency', 'expenseCurrency', 'groupBaseCurrency', 'planCurrency'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) populateCurrencyDropdown(el);
  });
}

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
    // Keep fallback exchange rates
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

function parseDateParts(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === 'string') {
    const match = dateStr.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1,
        day: match[3] ? parseInt(match[3], 10) : 1,
      };
    }
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parts = parseDateParts(dateStr);
  if (!parts) return String(dateStr);
  const d = new Date(parts.year, parts.month, parts.day);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isSameMonth(dateStr, ref = new Date()) {
  const parts = parseDateParts(dateStr);
  if (!parts) return false;
  return parts.year === ref.getFullYear() && parts.month === ref.getMonth();
}

function monthKey(dateStr) {
  const parts = parseDateParts(dateStr);
  if (!parts || Number.isNaN(parts.year) || Number.isNaN(parts.month)) return 'unknown';
  return `${parts.year}-${String(parts.month + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  if (!key || key === 'unknown') return '—';
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function formatApiDate(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch (_) {
    return String(value);
  }
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
  let target = String(source).trim().toLowerCase();
  if (target === 'other') target = 'other income';
  const cat = state.categories.find(
    (c) =>
      (c.name.trim().toLowerCase() === target ||
        c.name.trim().toLowerCase() === String(source).trim().toLowerCase()) &&
      (c.type === 'income' || c.type === 'both'),
  );
  return cat?.id;
}

function normalizeIncome(transaction) {
  const rawAmount = Number(transaction.amount);
  const currency = transaction.currency || 'USD';
  const amountInBase = convertAmount(rawAmount, currency, currentBaseCurrency);
  let source = transaction.category?.name || transaction.title || 'Other';
  if (source === 'Other Income') source = 'Other';

  return {
    id: transaction.id,
    rawAmount,
    currency,
    amount: amountInBase,
    date: formatApiDate(transaction.date),
    notes: transaction.notes,
    source,
    recurring: Boolean(transaction.isRecurring),
  };
}

function normalizeExpense(transaction) {
  const catCandidate = transaction.category?.name || transaction.title || 'Other';
  const uiCategory =
    DB_EXPENSE_TO_UI[catCandidate] ||
    (EXPENSE_CATEGORIES[catCandidate] ? catCandidate : null) ||
    (transaction.category?.name ? DB_EXPENSE_TO_UI[transaction.category.name] : null) ||
    (transaction.title ? DB_EXPENSE_TO_UI[transaction.title] : null) ||
    (transaction.category?.name && EXPENSE_CATEGORIES[transaction.category.name] ? transaction.category.name : null) ||
    (transaction.title && EXPENSE_CATEGORIES[transaction.title] ? transaction.title : null) ||
    'Other';

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
  const token = getAccessToken();

  // If user is logged in, any attempt to visit home or guest features goes straight to dashboard
  if (token && (pageName === 'home' || pageName === 'features')) {
    pageName = 'dashboard';
  }

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

  document.querySelectorAll('#mobileBottomNav .bottom-nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });

  if (pageName === 'dashboard') {
    renderDashboard();
  }
}

// Advanced Navbar delegated listener
document.getElementById('navbarAdvanced')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (!btn) return;
  const page = btn.dataset.page;
  if (page) {
    switchPage(page);
  }
});

// Mobile Bottom Navigation delegated listener
document.getElementById('mobileBottomNav')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (!btn) return;
  const page = btn.dataset.page;
  if (page) {
    switchPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Brand Logo navigation listener
document.getElementById('navLogo')?.addEventListener('click', (e) => {
  e.preventDefault();
  const token = getAccessToken();
  switchPage(token ? 'dashboard' : 'home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Footer navigation links
document.getElementById('footerLinkHome')?.addEventListener('click', (e) => {
  e.preventDefault();
  const token = getAccessToken();
  switchPage(token ? 'dashboard' : 'home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('footerLinkFeatures')?.addEventListener('click', (e) => {
  e.preventDefault();
  const token = getAccessToken();
  if (token) {
    switchPage('dashboard');
  } else {
    document.getElementById('featuresSection')?.scrollIntoView({ behavior: 'smooth' });
  }
});

document.getElementById('footerLinkSignIn')?.addEventListener('click', (e) => {
  e.preventDefault();
  const token = getAccessToken();
  if (token) {
    switchPage('dashboard');
    return;
  }
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



document.getElementById('heroExploreFeaturesBtn')?.addEventListener('click', () => {
  document.getElementById('featuresSection')?.scrollIntoView({ behavior: 'smooth' });
});



/* ---------------------------------------------------------------------- */
/* Data loading                                                           */
/* ---------------------------------------------------------------------- */

function refreshNormalizedTransactions() {
  state.incomes = (state.rawIncomes || []).map(normalizeIncome);

  // Combine standalone expenses with all line items from Expense Groups
  const groupLineItems = [];
  (state.expenseGroups || []).forEach((g) => {
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

  const combinedRawExpenses = [...(state.rawExpenses || []), ...groupLineItems];
  state.expenses = combinedRawExpenses.map(normalizeExpense);
}

async function loadAllData() {
  await fetchLiveExchangeRates();

  const categoriesResult = await apiRequest('GET', '/categories').catch(() => ({ data: [] }));
  state.categories = Array.isArray(categoriesResult?.data) ? categoriesResult.data : [];

  const [incomesResult, expensesResult] = await Promise.all([
    apiRequest('GET', '/transactions?type=income&limit=500&sortOrder=DESC').catch(() => ({ data: [] })),
    apiRequest('GET', '/transactions?type=expense&limit=500&sortOrder=DESC').catch(() => ({ data: [] })),
  ]);

  state.rawIncomes = Array.isArray(incomesResult?.data) ? incomesResult.data : [];
  state.rawExpenses = Array.isArray(expensesResult?.data) ? expensesResult.data : [];

  await loadExpenseGroups();
  await loadPlans();

  refreshNormalizedTransactions();
}

async function loadApp() {
  populateAllCurrencySelects();

  emailAuthButton?.addEventListener('click', () => openAuthModal('login'));
  const userBaseCurrencySelect = document.getElementById('userBaseCurrency');
  if (userBaseCurrencySelect) {
    userBaseCurrencySelect.value = currentBaseCurrency;
    userBaseCurrencySelect.onchange = (e) => {
      currentBaseCurrency = e.target.value;
      localStorage.setItem('user_base_currency', currentBaseCurrency);
      refreshNormalizedTransactions();
      renderDashboard();
      renderIncomeList();
      renderExpenseList();
      renderExpenseGroupsList();
      renderAllTransactions();
      showMessage(`Base currency changed to ${currentBaseCurrency}`, 'info');
    };
  }

  const token = getAccessToken();
  const guestNavLinks = document.querySelectorAll('#navMenu .guest-nav-only');
  const appNavLinks = document.querySelectorAll('#navMenu .app-nav-only');
  const homeAuthContainer = document.getElementById('homeAuthContainer');
  const pageHome = document.getElementById('page-home');
  const navLogo = document.getElementById('navLogo');
  const appShell = document.getElementById('appShell');

  if (!token) {
    appShell?.classList.remove('is-logged-in');
    document.getElementById('mobileBottomNav')?.classList.add('hidden');
    emailAuthButton?.classList.remove('hidden');
    authButton?.classList.add('hidden');
    userInfo?.classList.add('hidden');
    guestNavLinks.forEach((el) => el.classList.remove('hidden'));
    appNavLinks.forEach((el) => el.classList.add('hidden'));
    if (homeAuthContainer) homeAuthContainer.classList.remove('hidden');
    if (pageHome) pageHome.classList.remove('hidden');
    if (navLogo) navLogo.dataset.page = 'home';

    switchPage('home');
    return;
  }

  // User is Logged In:
  appShell?.classList.add('is-logged-in');
  document.getElementById('mobileBottomNav')?.classList.remove('hidden');
  emailAuthButton?.classList.add('hidden');
  if (homeAuthContainer) homeAuthContainer.classList.add('hidden');
  if (pageHome) pageHome.classList.add('hidden');
  if (navLogo) navLogo.dataset.page = 'dashboard';

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
/* Dashboard & Monthly Financial History                                  */
/* ---------------------------------------------------------------------- */

function computeMonthlyFinancialHistory() {
  const incomes = state.incomes || [];
  const expenses = state.expenses || [];

  const monthMap = new Map();

  function getOrInitMonth(key) {
    if (!monthMap.has(key)) {
      const [yStr, mStr] = key.split('-');
      const year = parseInt(yStr, 10);
      const month = parseInt(mStr, 10) - 1;
      const d = new Date(year, month, 1);
      monthMap.set(key, {
        key,
        year,
        month,
        label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        shortLabel: d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        income: 0,
        expenses: 0,
        savings: 0,
        balance: 0,
      });
    }
    return monthMap.get(key);
  }

  // Ensure current month is always present
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  getOrInitMonth(currentMonthKey);

  incomes.forEach((i) => {
    const key = monthKey(i.date);
    if (key !== 'unknown') {
      const entry = getOrInitMonth(key);
      entry.income += (Number(i.amount) || 0);
    }
  });

  expenses.forEach((e) => {
    const key = monthKey(e.date);
    if (key !== 'unknown') {
      const entry = getOrInitMonth(key);
      entry.expenses += (Number(e.amount) || 0);
    }
  });

  const sortedAscKeys = Array.from(monthMap.keys()).sort();

  let runningBalance = 0;
  let allTimeIncome = 0;
  let allTimeExpenses = 0;

  sortedAscKeys.forEach((key) => {
    const entry = monthMap.get(key);
    entry.savings = entry.income - entry.expenses;
    runningBalance += entry.savings;
    entry.balance = runningBalance;
    allTimeIncome += entry.income;
    allTimeExpenses += entry.expenses;
  });

  const allTimeSavings = allTimeIncome - allTimeExpenses;
  const allTimeBalance = runningBalance;

  // History in reverse chronological order (most recent first)
  const historyDesc = sortedAscKeys.map((k) => monthMap.get(k)).reverse();

  return {
    historyDesc,
    currentMonthKey,
    allTimeIncome,
    allTimeExpenses,
    allTimeSavings,
    allTimeBalance,
  };
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

function populateDashboardMonthSelect(historyDesc, currentMonthKey) {
  if (!dashboardMonthSelectEl) return;

  const previousSelection = state.selectedMonthKey;
  dashboardMonthSelectEl.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = '🌟 All-Time Overview';
  dashboardMonthSelectEl.appendChild(allOpt);

  historyDesc.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.key;
    const isCurrent = m.key === currentMonthKey;
    opt.textContent = `${m.label}${isCurrent ? ' (Current Month)' : ''}`;
    dashboardMonthSelectEl.appendChild(opt);
  });

  if (previousSelection && (previousSelection === 'all' || historyDesc.some((m) => m.key === previousSelection))) {
    state.selectedMonthKey = previousSelection;
  } else {
    state.selectedMonthKey = currentMonthKey;
  }
  dashboardMonthSelectEl.value = state.selectedMonthKey;
}

function selectDashboardMonth(key) {
  state.selectedMonthKey = key;
  if (dashboardMonthSelectEl) {
    dashboardMonthSelectEl.value = key;
  }
  renderDashboard();
  const cardsGrid = document.querySelector('.cards-grid');
  if (cardsGrid) {
    cardsGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function renderDashboard() {
  const historyData = computeMonthlyFinancialHistory();
  const { historyDesc, currentMonthKey, allTimeIncome, allTimeExpenses, allTimeSavings, allTimeBalance } = historyData;

  populateDashboardMonthSelect(historyDesc, currentMonthKey);

  const selectedKey = state.selectedMonthKey;

  if (selectedKey === 'all') {
    setFormattedCardValue(totalBalanceEl, allTimeBalance);
    setFormattedCardValue(monthlyIncomeEl, allTimeIncome);
    setFormattedCardValue(monthlyExpensesEl, allTimeExpenses);
    setFormattedCardValue(monthlySavingsEl, allTimeSavings);

    if (totalBalanceLabelEl) totalBalanceLabelEl.textContent = 'Total Balance';
    if (totalBalanceSubEl) totalBalanceSubEl.textContent = 'All-time cumulative balance';

    if (monthlyIncomeLabelEl) monthlyIncomeLabelEl.textContent = 'Total Income';
    if (monthlyIncomeSubEl) monthlyIncomeSubEl.textContent = 'All time from all sources';

    if (monthlyExpensesLabelEl) monthlyExpensesLabelEl.textContent = 'Total Expenses';
    if (monthlyExpensesSubEl) monthlyExpensesSubEl.textContent = 'All-time total spending';

    if (monthlySavingsLabelEl) monthlySavingsLabelEl.textContent = 'Total Savings';
    const rate = allTimeIncome > 0 ? ((allTimeSavings / allTimeIncome) * 100).toFixed(1) : 0;
    if (monthlySavingsSubEl) monthlySavingsSubEl.textContent = `${rate}% all-time savings rate`;
  } else {
    const monthItem = historyDesc.find((m) => m.key === selectedKey) || historyDesc[0] || {
      key: currentMonthKey,
      label: 'Current Month',
      shortLabel: 'Current Month',
      income: 0,
      expenses: 0,
      savings: 0,
      balance: 0,
    };

    // Previous Savings = cumulative savings of all months BEFORE the selected month
    const previousSavings = historyDesc
      .filter((m) => m.key < selectedKey)
      .reduce((sum, m) => sum + m.savings, 0);

    setFormattedCardValue(totalBalanceEl, monthItem.balance);
    setFormattedCardValue(monthlyIncomeEl, monthItem.income);
    setFormattedCardValue(monthlyExpensesEl, monthItem.expenses);
    setFormattedCardValue(monthlySavingsEl, previousSavings);

    if (totalBalanceLabelEl) totalBalanceLabelEl.textContent = 'Total Balance';
    if (totalBalanceSubEl) totalBalanceSubEl.textContent = `As of ${monthItem.shortLabel}`;

    if (monthlyIncomeLabelEl) monthlyIncomeLabelEl.textContent = 'Monthly Income';
    if (monthlyIncomeSubEl) monthlyIncomeSubEl.textContent = `Earned in ${monthItem.shortLabel}`;

    if (monthlyExpensesLabelEl) monthlyExpensesLabelEl.textContent = 'Monthly Expenses';
    if (monthlyExpensesSubEl) monthlyExpensesSubEl.textContent = `Spent in ${monthItem.shortLabel}`;

    if (monthlySavingsLabelEl) monthlySavingsLabelEl.textContent = 'Previous Savings';
    const prevMonthCount = historyDesc.filter((m) => m.key < selectedKey).length;
    if (monthlySavingsSubEl) {
      monthlySavingsSubEl.textContent = prevMonthCount > 0
        ? `Saved across ${prevMonthCount} prior month${prevMonthCount !== 1 ? 's' : ''}`
        : 'No prior month data';
    }
  }

  renderCategoryChart(selectedKey);
  renderIncomeExpenseChart();
  renderMonthlyFinancialHistory(historyData);
}

function renderCategoryChart(selectedMonthKey = state.selectedMonthKey) {
  const canvas = document.getElementById('categoryChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const container = canvas.parentElement;

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
    categoryChartInstance = null;
  }

  const oldEmpty = container?.querySelector('.chart-empty-state');
  if (oldEmpty) oldEmpty.remove();

  let targetExpenses = state.expenses || [];
  let periodTitle = 'All Time';

  if (selectedMonthKey && selectedMonthKey !== 'all') {
    targetExpenses = (state.expenses || []).filter((e) => monthKey(e.date) === selectedMonthKey);
    const [y, m] = selectedMonthKey.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    periodTitle = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }

  if (categoryChartSubtitleEl) {
    categoryChartSubtitleEl.textContent = periodTitle;
  }

  const byCategory = {};
  targetExpenses.forEach((e) => {
    let key = e.category || 'Other';
    if (DB_EXPENSE_TO_UI[key]) key = DB_EXPENSE_TO_UI[key];
    byCategory[key] = (byCategory[key] || 0) + (Number(e.amount) || 0);
  });

  const labels = Object.keys(byCategory).filter((k) => (byCategory[k] || 0) > 0);

  if (!labels.length) {
    canvas.style.display = 'none';
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'chart-empty-state';
    emptyDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;min-height:220px;text-align:center;padding:24px 16px;background:rgba(248,250,252,0.6);border-radius:14px;border:1px dashed #cbd5e1;margin-top:8px;';
    emptyDiv.innerHTML = `
      <div style="width:48px;height:48px;border-radius:14px;background:#eef2ff;display:grid;place-items:center;font-size:24px;margin-bottom:10px;">📊</div>
      <strong style="color:#1e293b;font-size:0.95rem;">No spending recorded for ${periodTitle}</strong>
      <small style="color:#64748b;margin-top:4px;max-width:260px;font-size:0.82rem;">Add expenses for this period to generate an interactive spending category breakdown!</small>
    `;
    container?.appendChild(emptyDiv);
    return;
  }

  canvas.style.display = 'block';

  const fallbackColors = ['#b57e4c', '#556b2f', '#6b705c', '#c27d53', '#4a3525', '#c88d2d', '#b24434', '#3d6330', '#8a572c', '#5d8c47', '#8c7e6d', '#0284c7', '#7c3aed', '#db2777'];

  categoryChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels.map((k) => EXPENSE_CATEGORIES[k]?.label || k),
      datasets: [{
        data: labels.map((k) => byCategory[k]),
        backgroundColor: labels.map((k, idx) => EXPENSE_CATEGORIES[k]?.color || fallbackColors[idx % fallbackColors.length]),
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
          labels: { boxWidth: 12, padding: 12, font: { family: 'Plus Jakarta Sans', weight: '600' } },
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${formatCurrency(val)} (${pct}%)`;
            }
          }
        }
      },
    },
  });
}

function renderIncomeExpenseChart() {
  const canvas = document.getElementById('incomeExpenseChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const container = canvas.parentElement;

  if (incomeExpenseChartInstance) {
    incomeExpenseChartInstance.destroy();
    incomeExpenseChartInstance = null;
  }

  const oldEmpty = container?.querySelector('.chart-empty-state');
  if (oldEmpty) oldEmpty.remove();

  const historyData = computeMonthlyFinancialHistory();
  const chronologicalMonths = [...historyData.historyDesc].reverse();
  const displayMonths = chronologicalMonths.slice(-12);

  const labels = displayMonths.map((m) => m.shortLabel || monthLabel(m.key));
  const incomeData = displayMonths.map((m) => m.income);
  const expenseData = displayMonths.map((m) => m.expenses);

  const hasData = displayMonths.some((m) => m.income > 0 || m.expenses > 0);

  if (!hasData) {
    canvas.style.display = 'none';
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'chart-empty-state';
    emptyDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;min-height:220px;text-align:center;padding:24px 16px;background:rgba(248,250,252,0.6);border-radius:14px;border:1px dashed #cbd5e1;margin-top:8px;';
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
      labels: labels,
      datasets: [
        { label: 'Income', data: incomeData, backgroundColor: '#556b2f', borderRadius: 6 },
        { label: 'Expenses', data: expenseData, backgroundColor: '#b24434', borderRadius: 6 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(val) {
              return formatCurrency(val);
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 14, font: { family: 'Plus Jakarta Sans', weight: '600' } },
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
    },
  });
}

function renderMonthlyFinancialHistory(historyData = computeMonthlyFinancialHistory()) {
  if (!monthlyHistoryTableBodyEl) return; // section removed from DOM, skip gracefully

  const { historyDesc, currentMonthKey } = historyData;

  if (monthlyHistoryBadgeEl) {
    const count = historyDesc.length;
    monthlyHistoryBadgeEl.textContent = `${count} ${count === 1 ? 'Month' : 'Months'} Tracked`;
  }

  if (!historyDesc.length) {
    monthlyHistoryTableBodyEl.innerHTML = '<tr><td colspan="6" class="placeholder">No monthly financial history recorded yet. Add your first transaction to get started!</td></tr>';
    return;
  }

  const selectedKey = state.selectedMonthKey || currentMonthKey;

  monthlyHistoryTableBodyEl.innerHTML = historyDesc.map((m) => {
    const isCurrent = m.key === currentMonthKey;
    const isSelected = m.key === selectedKey;
    const activeClass = isSelected ? 'active-selected-month' : '';
    const currentBadge = isCurrent ? '<span class="month-badge-current">Current</span>' : '';

    const savingsPct = m.income > 0 ? ((m.savings / m.income) * 100).toFixed(1) : null;
    const savingsClass = m.savings >= 0 ? 'positive' : 'negative';
    const savingsSign = m.savings >= 0 ? '+' : '';
    const savingsSub = savingsPct !== null
      ? `<span class="savings-badge ${savingsClass}">${savingsPct}% saved</span>`
      : '';

    const incomeFormatted = m.income > 0 ? `+${formatCurrency(m.income)}` : formatCurrency(m.income);
    const expensesFormatted = m.expenses > 0 ? `-${formatCurrency(m.expenses)}` : formatCurrency(m.expenses);
    const balanceClass = m.balance >= 0 ? 'positive' : 'negative';

    return `
      <tr class="${activeClass}" data-month-key="${m.key}">
        <td>
          <strong>${m.label}</strong>${currentBadge}
        </td>
        <td class="text-right positive" style="font-weight:600;">${incomeFormatted}</td>
        <td class="text-right negative" style="font-weight:600;">${expensesFormatted}</td>
        <td class="text-right">
          <span class="${savingsClass}" style="font-weight:700;">${savingsSign}${formatCurrency(m.savings)}</span>
          ${savingsSub}
        </td>
        <td class="text-right">
          <strong class="${balanceClass}" style="font-size:0.95rem;">${formatCurrency(m.balance)}</strong>
        </td>
        <td class="text-center">
          <button class="button button-small ${isSelected ? 'button-primary' : 'button-ghost'} view-month-btn" data-select-month="${m.key}">
            ${isSelected ? '✓ Viewing' : 'View Month'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
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

function renderAllTransactions() {
  const merged = [
    ...state.incomes.map((i) => ({ ...i, kind: 'income' })),
    ...state.expenses.map((e) => ({ ...e, kind: 'expense' })),
  ]
    .filter((t) => t.date)
    .sort((a, b) => {
      const partsA = parseDateParts(a.date);
      const partsB = parseDateParts(b.date);
      const timeA = partsA ? new Date(partsA.year, partsA.month, partsA.day).getTime() : 0;
      const timeB = partsB ? new Date(partsB.year, partsB.month, partsB.day).getTime() : 0;
      return timeB - timeA;
    });

  if (!merged.length) {
    allTransactionsListEl.innerHTML = '<p class="placeholder">No transactions yet.</p>';
    return;
  }
  allTransactionsListEl.innerHTML = merged.map((t) => transactionRowHtml(t, t.kind === 'income', { editable: true })).join('');
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
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Unable to delete expense.', 'error');
  }
}

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
      <div class="line-item-row">
        <div class="line-item-field line-item-cat">
          <select data-item-idx="${idx}" data-field="category" class="line-item-select">
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
        </div>
        <div class="line-item-field line-item-desc">
          <input type="text" data-item-idx="${idx}" data-field="title" placeholder="Item description" value="${item.title || ''}" required />
        </div>
        <div class="line-item-field line-item-amt">
          <input type="number" data-item-idx="${idx}" data-field="amount" placeholder="0.00" step="0.01" value="${item.amount ?? ''}" required />
        </div>
        <div class="line-item-field line-item-curr">
          <select data-item-idx="${idx}" data-field="currency" class="currency-select line-item-select">
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
        </div>
        <div class="line-item-actions">
          <button type="button" class="button button-small button-danger line-item-del-btn" data-remove-group-item="${idx}">✕</button>
        </div>
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
    expenseGroupsListEl.innerHTML = '<p class="placeholder">No expense groups yet. Click "+ Create Expense Group / Trip" to bundle expenses for trips or events!</p>';
    return;
  }

  // Display expense groups in reverse chronological order (most recent first)
  const sortedGroups = [...state.expenseGroups].sort((a, b) => {
    const parseGroupDate = (g) => {
      const dStr = g.startDate || g.endDate || g.createdAt;
      const parts = parseDateParts(dStr);
      return parts ? new Date(parts.year, parts.month, parts.day).getTime() : 0;
    };
    return parseGroupDate(b) - parseGroupDate(a);
  });

  expenseGroupsListEl.innerHTML = sortedGroups.map((g) => {
    const total = computeGroupTotal(g);
    const typeBadges = { trip: '✈️ Trip', day: '📅 Single Day', week: '🗓️ Week', custom: '📆 Custom' };
    const badgeText = typeBadges[g.type] || '📦 Group';

    // Display line-item expenses in reverse chronological order (most recent first)
    const sortedItems = [...(g.items || [])].sort((a, b) => {
      const dStrA = a.date || g.startDate;
      const dStrB = b.date || g.startDate;
      const partsA = parseDateParts(dStrA);
      const partsB = parseDateParts(dStrB);
      const timeA = partsA ? new Date(partsA.year, partsA.month, partsA.day).getTime() : 0;
      const timeB = partsB ? new Date(partsB.year, partsB.month, partsB.day).getTime() : 0;
      return timeB - timeA;
    });

    const itemsHtml = sortedItems.map((item) => `
      <tr>
        <td style="padding:8px 6px;font-size:0.82rem;">${EXPENSE_CATEGORIES[item.category]?.label || item.category}</td>
        <td style="padding:8px 6px;font-size:0.82rem;font-weight:600;">${item.title || 'Item'}</td>
        <td style="padding:8px 6px;font-size:0.82rem;text-align:right;font-weight:600;">
          ${formatCurrency(convertAmount(item.amount, item.currency || 'USD', currentBaseCurrency))}
          ${item.currency && item.currency !== currentBaseCurrency ? `<small style="opacity:0.7;display:block;">${item.amount} ${item.currency}</small>` : ''}
        </td>
      </tr>`).join('');

    return `
      <div class="card budget-card-item" style="margin-bottom:16px;">
        <div class="card-top-flex">
          <div>
            <h3 style="margin:0 0 4px 0;">${g.name} <span class="badge" style="background:#e0f2fe;color:#0369a1;margin-left:6px;">${badgeText}</span></h3>
            <small style="color:var(--muted);">${formatDate(g.startDate)} ${g.startDate !== g.endDate ? `— ${formatDate(g.endDate)}` : ''}</small>
          </div>
          <div class="card-total-badge">
            <span style="font-size:1.25rem;font-weight:700;color:var(--danger);">${formatCurrency(total)}</span>
            <small style="display:block;color:var(--muted);">${(g.items || []).length} line items</small>
          </div>
        </div>

        ${g.notes ? `<p style="font-size:0.85rem;color:var(--muted);margin:8px 0;">${g.notes}</p>` : ''}

        <details style="margin-top:10px;background:#f8fafc;padding:8px 12px;border-radius:12px;border:1px solid var(--border);">
          <summary style="font-size:0.85rem;font-weight:600;cursor:pointer;">View Line-Item Breakdown (${(g.items || []).length})</summary>
          <div class="table-responsive" style="margin-top:8px;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:1px solid #cbd5e1;text-align:left;font-size:0.75rem;color:var(--muted);">
                  <th>Category</th><th>Item</th><th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsHtml || '<tr><td colspan="3" style="padding:8px 6px;font-size:0.8rem;">No items</td></tr>'}</tbody>
            </table>
          </div>
        </details>

        <div class="tx-actions" style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
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

// Month selector change listener
dashboardMonthSelectEl?.addEventListener('change', (e) => {
  selectDashboardMonth(e.target.value);
});

// Monthly history table row/button click delegation
monthlyHistoryTableBodyEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-select-month]');
  const tr = e.target.closest('tr[data-month-key]');
  const key = btn ? btn.dataset.selectMonth : (tr ? tr.dataset.monthKey : null);
  if (key) {
    selectDashboardMonth(key);
  }
});

// All transactions list edit/delete delegation
allTransactionsListEl?.addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const deleteBtn = e.target.closest('[data-delete]');
  if (editBtn) {
    const id = editBtn.dataset.edit;
    const kind = editBtn.dataset.kind;
    if (kind === 'income') {
      const inc = state.incomes.find((i) => String(i.id) === String(id));
      if (inc) openIncomeModal(inc);
    } else {
      const exp = state.expenses.find((x) => String(x.id) === String(id));
      if (exp) openExpenseModal(exp);
    }
  }
  if (deleteBtn) {
    const id = deleteBtn.dataset.delete;
    const kind = deleteBtn.dataset.kind;
    if (kind === 'income') deleteIncome(id);
    else deleteExpense(id);
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
      <div class="line-item-row">
        <div class="line-item-field line-item-cat">
          <select data-plan-idx="${idx}" data-field="category" class="line-item-select">
            <option value="Education" ${item.category === 'Education' ? 'selected' : ''}>🎓 Education</option>
            <option value="Travel" ${item.category === 'Travel' ? 'selected' : ''}>✈️ Travel</option>
            <option value="Shopping" ${item.category === 'Shopping' ? 'selected' : ''}>🛍️ Shopping</option>
            <option value="Rent" ${item.category === 'Rent' ? 'selected' : ''}>🏠 Rent / Housing</option>
            <option value="Bills" ${item.category === 'Bills' ? 'selected' : ''}>📄 Bills & Setup</option>
            <option value="Other" ${!item.category || item.category === 'Other' ? 'selected' : ''}>📌 Other</option>
          </select>
        </div>
        <div class="line-item-field line-item-desc">
          <input type="text" data-plan-idx="${idx}" data-field="title" placeholder="Estimated cost description" value="${item.title || ''}" required />
        </div>
        <div class="line-item-field line-item-amt">
          <input type="number" data-plan-idx="${idx}" data-field="amount" placeholder="0.00" step="0.01" value="${item.amount ?? ''}" required />
        </div>
        <div class="line-item-field line-item-curr">
          <select data-plan-idx="${idx}" data-field="currency" class="currency-select line-item-select">
            <option value="USD" ${item.currency === 'USD' ? 'selected' : ''}>USD</option>
            <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>EUR</option>
            <option value="GBP" ${item.currency === 'GBP' ? 'selected' : ''}>GBP</option>
            <option value="PKR" ${item.currency === 'PKR' ? 'selected' : ''}>PKR</option>
            <option value="INR" ${item.currency === 'INR' ? 'selected' : ''}>INR</option>
            <option value="AED" ${item.currency === 'AED' ? 'selected' : ''}>AED</option>
            <option value="SAR" ${item.currency === 'SAR' ? 'selected' : ''}>SAR</option>
            <option value="KGS" ${item.currency === 'KGS' ? 'selected' : ''}>KGS</option>
          </select>
        </div>
        <div class="line-item-actions">
          <button type="button" class="button button-small button-danger line-item-del-btn" data-remove-plan-item="${idx}">✕</button>
        </div>
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
      <tr>
        <td style="padding:8px 6px;font-size:0.82rem;">${EXPENSE_CATEGORIES[item.category]?.label || item.category}</td>
        <td style="padding:8px 6px;font-size:0.82rem;font-weight:600;">${item.title || 'Item'}</td>
        <td style="padding:8px 6px;font-size:0.82rem;text-align:right;font-weight:600;color:var(--success);">
          ${formatCurrency(convertAmount(item.amount, item.currency || 'USD', currentBaseCurrency))}
        </td>
      </tr>`).join('');

    return `
      <div class="card budget-card-item" style="margin-bottom:16px;border-left:4px solid var(--success);">
        <div class="card-top-flex">
          <div>
            <h3 style="margin:0 0 4px 0;">🚀 ${p.name}</h3>
            <small style="color:var(--muted);">Target Date: ${formatDate(p.targetDate)}</small>
          </div>
          <div class="card-total-badge">
            <span style="font-size:1.25rem;font-weight:700;color:var(--success);">${formatCurrency(total)}</span>
            <small style="display:block;color:var(--muted);">Estimated Plan Cost</small>
          </div>
        </div>

        ${p.notes ? `<p style="font-size:0.85rem;color:var(--muted);margin:8px 0;">${p.notes}</p>` : ''}

        <details style="margin-top:10px;background:#f8fafc;padding:8px 12px;border-radius:12px;border:1px solid var(--border);" open>
          <summary style="font-size:0.85rem;font-weight:600;cursor:pointer;">Estimated Line-Item Costs (${(p.items || []).length})</summary>
          <div class="table-responsive" style="margin-top:8px;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:1px solid #cbd5e1;text-align:left;font-size:0.75rem;color:var(--muted);">
                  <th>Category</th><th>Item Description</th><th style="text-align:right;">Estimated Cost</th>
                </tr>
              </thead>
              <tbody>${itemsHtml || '<tr><td colspan="3" style="padding:8px 6px;font-size:0.8rem;">No items added</td></tr>'}</tbody>
            </table>
          </div>
        </details>

        <div class="tx-actions" style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
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