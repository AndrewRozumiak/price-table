/**
 * fetch.js — Лабораторна робота №06
 * Варіант 5: «Таблиця цін» — Fetch API, async/await, JSON
 *
 * Завдання 1: Завантажити тарифну таблицю з pricing.json (Fetch API)
 *             та відобразити картки у DOM
 * Завдання 2: Перемикання тарифів monthly/yearly — повторний fetch
 *             або використання кешованих даних
 * Завдання 3: Імітація обробки через setTimeout при виборі тарифу
 *
 * Продовження ЛР05 — зберігаємо логіку DOM-маніпуляцій,
 * делегування подій та Event Loop.
 */

'use strict';

/* ============================================================
   СТАН ЗАСТОСУНКУ
   ============================================================ */
let pricingData   = null;   // кешовані дані з JSON (щоб не робити повторний fetch)
let currentPeriod = 'monthly';
let activePlanId  = null;
let isLoading     = false;

/* ============================================================
   УТИЛІТА: JS-ЛОГ
   ============================================================ */
const log = (msg, type = 'info') => {
  const box = document.getElementById('js-log');
  const el  = document.createElement('p');
  el.className = `log-entry ${type}`;
  const t = new Date().toLocaleTimeString('uk-UA');
  el.textContent = `[${t}] ${msg}`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
};

/* ============================================================
   УТИЛІТА: overlay
   ============================================================ */
const setLoading = (visible, text = 'Обробка запиту...') => {
  const el = document.getElementById('loading-overlay');
  document.getElementById('loading-text').textContent = text;
  el.hidden = !visible;
  isLoading = visible;
};

/* ============================================================
   ЗАВДАННЯ 1: FETCH API + async/await
   Завантажуємо pricing.json і рендеримо картки у DOM
   ============================================================ */

/**
 * Виконує GET-запит до pricing.json через Fetch API.
 * Використовує async/await замість .then() — код виглядає
 * синхронно, але виконується асинхронно.
 *
 * @returns {Promise<Object>} — розпарсений JSON-об'єкт
 * @throws {Error} — при мережевій помилці або non-2xx статусі
 */
const fetchPricingData = async () => {
  log('[Fetch] fetch("pricing.json") → відправка GET-запиту...', 'fetch');

  // fetch() повертає Promise<Response>
  // await «розгортає» проміс — зупиняє виконання функції до отримання відповіді
  const response = await fetch('pricing.json');

  log(`[Fetch] Response отримано → status: ${response.status} ${response.ok ? '✅' : '❌'}`, 'fetch');

  // Перевіряємо HTTP-статус (fetch не кидає помилку при 404/500!)
  if (!response.ok) {
    throw new Error(`HTTP помилка: ${response.status} ${response.statusText}`);
  }

  // response.json() — ще один Promise, розпаровує тіло відповіді як JSON
  // JSON.parse виконується всередині — перетворює рядок на JS-об'єкт
  const data = await response.json();

  log(`[JSON] JSON.parse() виконано → отримано об'єкт з ключами: ${Object.keys(data).join(', ')}`, 'json');
  log(`[JSON] monthly: ${data.monthly.length} тарифів, yearly: ${data.yearly.length} тарифів`, 'json');

  return data;
};

/**
 * Головна функція ініціалізації — завантажує дані та рендерить сторінку.
 * async/await дозволяє писати асинхронний код у синхронному стилі.
 */
const init = async () => {
  log('🚀 fetch.js завантажено — DOMContentLoaded', 'info');
  log('[Async] init() → async функція, повертає Promise', 'info');

  try {
    // await зупиняє виконання init() до завершення fetchPricingData()
    // Але не блокує головний потік — інші події продовжують оброблятися
    pricingData = await fetchPricingData();

    // Сховати skeleton, показати реальні картки
    document.getElementById('skeleton-grid').hidden = true;
    document.getElementById('pricing-grid').hidden  = false;

    // Рендеримо картки з отриманих JSON-даних
    renderCards(pricingData[currentPeriod]);

    // Рендеримо таблицю порівняння
    renderCompareTable(pricingData[currentPeriod]);

    // Ініціалізуємо обробники подій (з ЛР05)
    initBillingToggle();
    initPlanSelection();

    log('✅ Дані завантажено та відображено', 'success');

  } catch (err) {
    // Обробка помилок fetch: мережева помилка або некоректний JSON
    handleFetchError(err);
  }
};

/* ============================================================
   РЕНДЕР КАРТОК ІЗ JSON-ДАНИХ
   ============================================================ */

/**
 * Динамічно будує картки тарифів із JSON-масиву.
 * Повністю замінює попередній вміст контейнера.
 * @param {Array} plans — масив тарифів з pricing.json
 */
const renderCards = (plans) => {
  const grid = document.getElementById('pricing-grid');
  grid.innerHTML = '';   // очищаємо попередній вміст

  log(`[DOM] renderCards() → createElement × ${plans.length} карток`, 'json');

  plans.forEach((plan) => {
    // Будуємо картку через createElement (як у ЛР05)
    const article = document.createElement('article');
    article.className = `pricing-card plan-${plan.id}${plan.badge ? ' featured' : ''}`;
    article.dataset.planId = plan.id;
    // CSS-змінна --accent-color через inline style
    article.style.setProperty('--accent-color', plan.accent);

    // --- Заголовок ---
    const header = document.createElement('div');
    header.className = 'card-header';

    if (plan.badge) {
      const badge = document.createElement('div');
      badge.className = 'plan-badge';
      badge.textContent = plan.badge;
      header.appendChild(badge);
    }

    const name = document.createElement('div');
    name.className = 'plan-name';
    name.textContent = plan.plan;

    const price = document.createElement('div');
    price.className = 'plan-price';
    // JSON → DOM: значення з JSON відображаємо у textContent
    price.innerHTML = plan.price === 0
      ? '₴0 <small>/ міс</small>'
      : `₴${plan.price} <small>/ міс</small>`;

    const desc = document.createElement('div');
    desc.className = 'plan-desc';
    desc.textContent = plan.desc;

    header.append(name, price, desc);

    // --- Тіло: список функцій ---
    const body = document.createElement('div');
    body.className = 'card-body';

    const ul = document.createElement('ul');
    ul.className = 'feature-list';

    // Ітеруємо масив features з JSON
    plan.features.forEach(({ text, included }) => {
      const li = document.createElement('li');
      if (!included) li.className = 'disabled';
      li.textContent = text;
      ul.appendChild(li);
    });

    body.appendChild(ul);

    // --- Підвал: кнопка ---
    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'select-plan-btn';
    btn.dataset.planId = plan.id;
    btn.textContent = plan.btnText;

    footer.appendChild(btn);
    article.append(header, body, footer);
    grid.appendChild(article);
  });
};

/**
 * Динамічно будує таблицю порівняння з JSON-даних.
 * @param {Array} plans
 */
const renderCompareTable = (plans) => {
  const section = document.getElementById('compare-section');
  const wrap    = document.getElementById('compare-table-wrap');
  wrap.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'compare-table';

  // Заголовок таблиці
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  const thFeature = document.createElement('th');
  thFeature.scope = 'col';
  thFeature.textContent = 'Функція';
  headerRow.appendChild(thFeature);

  plans.forEach(plan => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.dataset.col = plan.id;
    th.textContent = plan.plan;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Тіло таблиці — рядки з features[0..n]
  const tbody = document.createElement('tbody');
  const featureCount = plans[0].features.length;

  for (let i = 0; i < featureCount; i++) {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = plans[0].features[i].text;
    tr.appendChild(tdName);

    plans.forEach(plan => {
      const td = document.createElement('td');
      td.dataset.col = plan.id;
      if (plan.features[i].included) {
        td.className = 'check';
        td.textContent = '✓';
      } else {
        td.className = 'cross';
        td.textContent = '✕';
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);

  section.hidden = false;
  log('[DOM] renderCompareTable() → таблиця побудована з JSON', 'json');
};

/* ============================================================
   ЗАВДАННЯ 2: Перемикання місячний / річний
   Використовуємо кешовані pricingData — без повторного fetch
   ============================================================ */
const initBillingToggle = () => {
  const btnMonthly = document.getElementById('btn-monthly');
  const btnYearly  = document.getElementById('btn-yearly');

  const switchPeriod = async (period) => {
    if (period === currentPeriod) return;
    currentPeriod = period;

    log(`[Event] Перемикання → "${period}"`, 'info');

    // Оновлюємо кнопки
    btnMonthly.classList.toggle('active', period === 'monthly');
    btnMonthly.setAttribute('aria-pressed', String(period === 'monthly'));
    btnYearly.classList.toggle('active', period === 'yearly');
    btnYearly.setAttribute('aria-pressed', String(period === 'yearly'));

    // Показуємо skeleton під час «перемикання» (імітація)
    document.getElementById('pricing-grid').hidden  = true;
    document.getElementById('skeleton-grid').hidden = false;

    log('[Async] setTimeout(500) → імітація перезавантаження даних...', 'fetch');

    // Завдання 3: setTimeout — імітація затримки обробки
    await delay(500);

    // Беремо дані з кешу pricingData (JSON вже завантажено)
    log(`[JSON] pricingData["${period}"] → дані з кешу (без повторного fetch)`, 'json');
    renderCards(pricingData[period]);
    renderCompareTable(pricingData[period]);

    document.getElementById('skeleton-grid').hidden = true;
    document.getElementById('pricing-grid').hidden  = false;

    // Якщо є активний тариф — відновити підсвічування
    if (activePlanId) {
      highlightCard(activePlanId);
      highlightTableColumn(activePlanId);
    }

    log(`✅ Відображено тарифи для "${period}"`, 'success');
  };

  btnMonthly.addEventListener('click', () => switchPeriod('monthly'));
  btnYearly.addEventListener('click',  () => switchPeriod('yearly'));
};

/* ============================================================
   ЗАВДАННЯ 2+3: Делегування подій + setTimeout при виборі тарифу
   (успадковано з ЛР05 та розширено)
   ============================================================ */
const initPlanSelection = () => {
  const grid = document.getElementById('pricing-grid');

  // Делегування подій — один обробник на контейнері
  grid.addEventListener('click', async (event) => {
    const btn = event.target.closest('.select-plan-btn');
    if (!btn || isLoading) return;

    const planId = btn.dataset.planId;
    log(`[Event] click (делегування) → planId="${planId}"`, 'info');

    await selectPlan(planId);
  });
};

/**
 * Вибір тарифу з асинхронною імітацією обробки запиту.
 * Завдання 3: setTimeout через Promise (функція delay).
 * @param {string} planId
 */
const selectPlan = async (planId) => {
  const plan = pricingData[currentPeriod].find(p => p.id === planId);
  if (!plan) {
    log(`[Error] Тариф "${planId}" не знайдено у JSON`, 'error');
    return;
  }

  activePlanId = planId;

  // --- Синхронна частина (з ЛР05) ---
  highlightCard(planId);
  highlightTableColumn(planId);
  document.getElementById('confirmation-area').innerHTML = '';
  setLoading(true, `Перевірка тарифу «${plan.plan}»...`);

  log(`[Sync] Картку підсвічено, overlay показано`, 'info');
  log('[Async] delay(1800) → Promise + setTimeout → Task Queue', 'fetch');

  // Завдання 3: імітація серверної обробки через Promise + setTimeout
  await delay(1800);

  setLoading(false);
  log('[Async] delay завершено → рендер підтвердження', 'fetch');

  renderConfirmation(plan);
};

/**
 * Допоміжна функція: обгортає setTimeout у Promise.
 * Дозволяє використовувати await delay(ms) замість вкладених колбеків.
 *
 * Це стандартний патерн «promisified timeout».
 * @param {number} ms
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ============================================================
   РЕНДЕР ПІДТВЕРДЖЕННЯ (з ЛР05, розширено даними з JSON)
   ============================================================ */
const renderConfirmation = (plan) => {
  const price  = plan.price;
  const period = currentPeriod === 'yearly' ? 'річна (−20%)' : 'місячна';
  const area   = document.getElementById('confirmation-area');

  const block  = document.createElement('div');
  block.className = 'confirmation-block';
  block.id = 'confirmation-block';

  const title = document.createElement('h3');
  title.textContent = `✅ Ви обрали тариф «${plan.plan}»`;

  const desc = document.createElement('p');
  desc.textContent = `Ціна: ${price === 0 ? 'Безкоштовно' : `₴${price} / міс`} · ${period}. Підтвердіть вибір.`;

  const actions = document.createElement('div');
  actions.className = 'confirm-actions';

  const btnOk  = document.createElement('button');
  btnOk.type = 'button';
  btnOk.className = 'btn-confirm';
  btnOk.textContent = '🚀 Підтвердити';

  const btnNo  = document.createElement('button');
  btnNo.type = 'button';
  btnNo.className = 'btn-cancel-confirm';
  btnNo.textContent = 'Скасувати';

  actions.append(btnOk, btnNo);
  block.append(title, desc, actions);
  area.innerHTML = '';
  area.appendChild(block);

  log(`[DOM] Блок підтвердження побудовано з JSON-даних`, 'json');

  btnOk.addEventListener('click', () => confirmPlan(plan));
  btnNo.addEventListener('click', cancelSelection);
};

/**
 * Підтвердження — ще один асинхронний крок з delay().
 */
const confirmPlan = async (plan) => {
  log('[Event] click → .btn-confirm', 'info');

  document.getElementById('confirmation-area').innerHTML = '';
  setLoading(true, 'Активація тарифу...');

  log('[Async] await delay(900) → імітація POST-запиту', 'fetch');
  await delay(900);

  setLoading(false);

  // Успішний блок
  const area    = document.getElementById('confirmation-area');
  const success = document.createElement('div');
  success.className = 'success-block';

  const h = document.createElement('h3');
  h.textContent = `🎉 Тариф «${plan.plan}» успішно активовано!`;

  const p1 = document.createElement('p');
  p1.textContent = `Ціна: ${plan.price === 0 ? 'Безкоштовно' : `₴${plan.price} / міс`}`;

  const p2 = document.createElement('p');
  // JSON.stringify — серіалізація JS-об'єкта назад у JSON-рядок
  const summary = { plan: plan.plan, price: plan.price, period: currentPeriod, txn: `TXN-${Date.now()}` };
  p2.textContent = `JSON: ${JSON.stringify(summary)}`;

  success.append(h, p1, p2);
  area.appendChild(success);

  log(`[JSON] JSON.stringify(summary) → ${JSON.stringify(summary)}`, 'json');
  log(`✅ Транзакція підтверджена`, 'success');
};

const cancelSelection = () => {
  activePlanId = null;
  document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('active-plan'));
  highlightTableColumn(null);
  document.getElementById('confirmation-area').innerHTML = '';
  log('[DOM] Вибір скасовано', 'info');
};

/* ============================================================
   DOM-УТИЛІТИ (з ЛР05)
   ============================================================ */
const highlightCard = (planId) => {
  document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('active-plan'));
  const card = document.querySelector(`.pricing-card[data-plan-id="${planId}"]`);
  if (card) card.classList.add('active-plan');
};

const highlightTableColumn = (planId) => {
  document.querySelectorAll('[data-col]').forEach(el => el.classList.remove('col-active'));
  if (planId) {
    document.querySelectorAll(`[data-col="${planId}"]`).forEach(el => el.classList.add('col-active'));
  }
};

/* ============================================================
   ОБРОБКА ПОМИЛОК FETCH
   ============================================================ */
const handleFetchError = (err) => {
  document.getElementById('skeleton-grid').hidden = true;

  const box  = document.getElementById('fetch-error');
  const text = document.getElementById('fetch-error-text');
  text.textContent = `❌ Помилка завантаження: ${err.message}`;
  box.hidden = false;

  log(`[Error] ${err.message}`, 'error');
  log('[Info] Щоб Fetch API працював, відкривай через Live Server у VS Code', 'info');

  // Кнопка «Повторити запит»
  document.getElementById('btn-retry').addEventListener('click', () => {
    box.hidden = true;
    document.getElementById('skeleton-grid').hidden = false;
    log('[Fetch] Повторний запит...', 'fetch');
    init();
  }, { once: true });
};

/* ============================================================
   ДЕМОНСТРАЦІЯ: Promise ланцюжок vs async/await
   ============================================================ */
const demoPromiseVsAwait = () => {
  log('--- Демонстрація: Promise.then() vs async/await ---', 'info');

  // Варіант 1: .then() ланцюжок (старий стиль)
  fetch('pricing.json')
    .then(res => {
      log('[Promise.then] .then(res => res.json())', 'fetch');
      return res.json();
    })
    .then(data => {
      log(`[Promise.then] дані отримано: ${Object.keys(data).join(', ')}`, 'json');
    })
    .catch(err => {
      log(`[Promise.catch] помилка: ${err.message}`, 'error');
    });

  log('[Sync] Після fetch().then() — цей рядок виконується ОДРАЗУ', 'info');
};

/* ============================================================
   ЗАПУСК
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('clear-log').addEventListener('click', () => {
    document.getElementById('js-log').innerHTML = '';
  });

  // Демо через 2 секунди після завантаження
  setTimeout(() => demoPromiseVsAwait(), 2000);
});
