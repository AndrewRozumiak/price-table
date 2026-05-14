/**
 * dom.js — Лабораторна робота №05
 * Варіант 5: «Таблиця цін» — DOM та Event Loop
 *
 * Завдання 1: Перемикання тарифів — маніпуляція DOM-елементами
 * Завдання 2: Делегування подій для вибору та підсвічування тарифу
 * Завдання 3: Імітація обробки запиту через Event Loop (setTimeout)
 */

'use strict';

/* ============================================================
   ДАНІ
   ============================================================ */
const PLANS = [
  { id: 'basic',      name: 'Базовий',        monthly: 0,    yearly: 0    },
  { id: 'pro',        name: 'Про',             monthly: 299,  yearly: 239  },
  { id: 'enterprise', name: 'Корпоративний',   monthly: 1499, yearly: 1199 },
];

/* ============================================================
   СТАН
   ============================================================ */
let currentPeriod   = 'monthly';
let activePlanId    = null;
let isLoading       = false;   // блокує повторні кліки під час setTimeout

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
   УТИЛІТА: показати / приховати overlay завантаження
   ============================================================ */
const setLoading = (visible, text = 'Обробка запиту...') => {
  const overlay = document.getElementById('loading-overlay');
  const label   = document.getElementById('loading-text');
  label.textContent = text;
  overlay.hidden = !visible;
  isLoading = visible;
};

/* ============================================================
   УТИЛІТА: помилка
   ============================================================ */
const showError = (msg) => {
  const box  = document.getElementById('error-box');
  const text = document.getElementById('error-text');
  text.textContent = msg;
  box.hidden = false;
};
const hideError = () => { document.getElementById('error-box').hidden = true; };

/* ============================================================
   ЗАВДАННЯ 1: Маніпуляція DOM — перемикання місячний / річний
   ============================================================ */

/**
 * Оновлює текст цін у DOM для всіх карток.
 * Використовує dataset атрибути (.price-amount[data-monthly], [data-yearly]).
 * @param {'monthly'|'yearly'} period
 */
const updatePricesInDOM = (period) => {
  // querySelectorAll — пошук усіх елементів ціни в DOM
  const priceEls = document.querySelectorAll('.price-amount');
  const periodEls = document.querySelectorAll('.price-period');

  log(`[Sync] querySelectorAll('.price-amount') → знайдено ${priceEls.length} елементів`, 'sync');

  priceEls.forEach((el) => {
    // Читаємо значення з data-атрибутів
    const val = period === 'yearly'
      ? el.dataset.yearly
      : el.dataset.monthly;

    // Анімація: додаємо клас → змінюємо текст → видаляємо клас
    el.classList.add('updating');

    // setTimeout → макрозадача (Event Loop)
    setTimeout(() => {
      // Маніпуляція DOM: змінюємо textContent
      el.textContent = val === '0' ? '₴0' : `₴${val}`;
      el.classList.remove('updating');
    }, 200);
  });

  periodEls.forEach((el) => {
    el.textContent = period === 'yearly' ? ' / міс (річна)' : ' / міс';
  });

  log(`[Sync] Ціни оновлено → period="${period}"`, 'sync');
};

/**
 * Ініціалізує перемикач місячний / річний.
 * Обробник події 'click' на кожній кнопці.
 */
const initBillingToggle = () => {
  const btnMonthly = document.getElementById('btn-monthly');
  const btnYearly  = document.getElementById('btn-yearly');

  // addEventListener — реєстрація обробника події
  btnMonthly.addEventListener('click', () => {
    if (currentPeriod === 'monthly') return;
    currentPeriod = 'monthly';

    log('[Event] click → #btn-monthly', 'info');

    // Маніпуляція DOM: className, setAttribute
    btnMonthly.classList.add('active');
    btnMonthly.setAttribute('aria-pressed', 'true');
    btnYearly.classList.remove('active');
    btnYearly.setAttribute('aria-pressed', 'false');

    updatePricesInDOM('monthly');
    hideError();

    // Якщо є активний тариф — оновити підтвердження
    if (activePlanId) refreshConfirmation();
  });

  btnYearly.addEventListener('click', () => {
    if (currentPeriod === 'yearly') return;
    currentPeriod = 'yearly';

    log('[Event] click → #btn-yearly', 'info');

    btnYearly.classList.add('active');
    btnYearly.setAttribute('aria-pressed', 'true');
    btnMonthly.classList.remove('active');
    btnMonthly.setAttribute('aria-pressed', 'false');

    updatePricesInDOM('yearly');
    hideError();

    if (activePlanId) refreshConfirmation();
  });
};

/* ============================================================
   ЗАВДАННЯ 2: Делегування подій — вибір тарифу
   ============================================================ */

/**
 * Підсвічує активну колонку в таблиці порівняння.
 * @param {string|null} planId
 */
const highlightTableColumn = (planId) => {
  // Спершу прибираємо підсвічування з усіх комірок
  document.querySelectorAll('[data-col]').forEach(el => {
    el.classList.remove('col-active');
  });

  if (!planId) return;

  // Маніпуляція DOM: додаємо клас до комірок потрібної колонки
  document.querySelectorAll(`[data-col="${planId}"]`).forEach(el => {
    el.classList.add('col-active');
  });

  log(`[DOM] Підсвічено колонку таблиці: data-col="${planId}"`, 'sync');
};

/**
 * Знімає підсвічування з усіх карток і виділяє обрану.
 * @param {string} planId
 */
const highlightCard = (planId) => {
  document.querySelectorAll('.pricing-card').forEach(card => {
    card.classList.remove('active-plan');
  });

  const activeCard = document.querySelector(`.pricing-card[data-plan-id="${planId}"]`);
  if (activeCard) {
    // Маніпуляція DOM: classList.add
    activeCard.classList.add('active-plan');
    log(`[DOM] classList.add('active-plan') → картка "${planId}"`, 'sync');
  }
};

/**
 * ДЕЛЕГУВАННЯ ПОДІЙ:
 * Один обробник click на контейнері #pricing-grid
 * обробляє кліки по всіх кнопках .select-plan-btn всередині.
 *
 * Переваги:
 *  - один слухач замість трьох (по одному на кожну кнопку)
 *  - працює для динамічно доданих елементів
 *  - менше споживання пам'яті
 */
const initPlanSelection = () => {
  const grid = document.getElementById('pricing-grid');

  // Один обробник на батьківський контейнер
  grid.addEventListener('click', (event) => {
    // event.target — елемент, на якому стався клік
    // closest() — піднімається по DOM вгору до знайденого селектора
    const btn = event.target.closest('.select-plan-btn');
    if (!btn) return;           // клік не по кнопці — ігноруємо
    if (isLoading) return;      // йде обробка — блокуємо

    const planId = btn.dataset.planId;
    log(`[Event] click (делегування) → .select-plan-btn[data-plan-id="${planId}"]`, 'info');

    hideError();
    selectPlan(planId);
  });

  log('[Init] Делегування подій: grid.addEventListener("click", ...)', 'sync');
};

/**
 * Обробляє вибір тарифу:
 * 1. Підсвічує картку і колонку таблиці (синхронно)
 * 2. Показує overlay завантаження
 * 3. Через setTimeout (Event Loop) — відображає блок підтвердження
 * @param {string} planId
 */
const selectPlan = (planId) => {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) {
    showError(`Тариф "${planId}" не знайдено`);
    return;
  }

  activePlanId = planId;

  // --- СИНХРОННА ЧАСТИНА (Call Stack) ---
  log('--- Синхронна частина (Call Stack) ---', 'sync');
  log(`[Sync] activePlanId = "${planId}"`, 'sync');

  highlightCard(planId);
  highlightTableColumn(planId);

  // Показати overlay
  setLoading(true, `Перевірка доступності тарифу «${plan.name}»...`);
  log('[Sync] setLoading(true) — overlay показано', 'sync');

  // Очистити попередній блок підтвердження
  document.getElementById('confirmation-area').innerHTML = '';

  // --- ЗАВДАННЯ 3: Event Loop — setTimeout ---
  // setTimeout кладе колбек у чергу макрозадач (Task Queue).
  // Call Stack спершу виконає весь синхронний код,
  // після чого Event Loop «витягне» колбек із черги.
  log('[Async] setTimeout(callback, 1800) → Task Queue', 'async');

  setTimeout(() => {
    // Цей код виконається ПІСЛЯ того, як Call Stack звільниться
    log('--- Асинхронна частина (Task Queue → Call Stack) ---', 'async');
    log('[Async] Колбек setTimeout виконується через Event Loop', 'async');

    setLoading(false);
    log('[Async] setLoading(false) — overlay прибрано', 'async');

    renderConfirmation(plan);

  }, 1800);

  log('[Sync] Після setTimeout — синхронний код продовжується', 'sync');
  log('[Sync] Call Stack вільний, Event Loop чекає на таймер...', 'sync');
};

/* ============================================================
   ЗАВДАННЯ 3: Динамічне створення DOM-елементів
   Блок підтвердження будується через createElement
   ============================================================ */

/**
 * Створює блок підтвердження вибору тарифу через DOM API.
 * Демонструє: createElement, textContent, appendChild, insertAdjacentElement
 * @param {Object} plan
 */
const renderConfirmation = (plan) => {
  const price    = currentPeriod === 'yearly' ? plan.yearly : plan.monthly;
  const period   = currentPeriod === 'yearly' ? 'річна оплата (−20%)' : 'місячна оплата';
  const priceStr = price === 0 ? 'Безкоштовно' : `₴${price} / міс`;

  log(`[DOM] createElement → будуємо блок підтвердження для "${plan.name}"`, 'async');

  // --- createElement: ручне побудова DOM-дерева ---
  const block = document.createElement('div');
  block.className = 'confirmation-block';
  block.id = 'confirmation-block';

  const title = document.createElement('h3');
  title.textContent = `✅ Ви обрали тариф «${plan.name}»`;

  const desc = document.createElement('p');
  desc.textContent = `Ціна: ${priceStr} · ${period}. Підтвердіть вибір або оберіть інший тариф.`;

  const actions = document.createElement('div');
  actions.className = 'confirm-actions';

  const btnConfirm = document.createElement('button');
  btnConfirm.type = 'button';
  btnConfirm.className = 'btn-confirm';
  btnConfirm.textContent = '🚀 Підтвердити';

  const btnCancel = document.createElement('button');
  btnCancel.type = 'button';
  btnCancel.className = 'btn-cancel-confirm';
  btnCancel.textContent = 'Скасувати';

  // Збираємо дерево через appendChild
  actions.appendChild(btnConfirm);
  actions.appendChild(btnCancel);
  block.appendChild(title);
  block.appendChild(desc);
  block.appendChild(actions);

  // Вставляємо у DOM
  const area = document.getElementById('confirmation-area');
  area.innerHTML = '';
  area.appendChild(block);

  log(`[DOM] appendChild → #confirmation-area`, 'async');

  // Обробники на динамічно створених кнопках
  btnConfirm.addEventListener('click', () => confirmPlan(plan, price, period));
  btnCancel.addEventListener('click',  cancelSelection);
};

/**
 * Підтверджує вибір — знову через setTimeout (ще один цикл Event Loop).
 */
const confirmPlan = (plan, price, period) => {
  log('[Event] click → .btn-confirm', 'info');
  log('[Async] setTimeout(callback, 900) → Task Queue (імітація запиту)', 'async');

  const area = document.getElementById('confirmation-area');
  area.innerHTML = '';

  setLoading(true, 'Активація тарифу...');

  setTimeout(() => {
    setLoading(false);

    // Динамічно будуємо success-блок
    const success = document.createElement('div');
    success.className = 'success-block';

    const h = document.createElement('h3');
    h.textContent = `🎉 Тариф «${plan.name}» успішно активовано!`;

    const p1 = document.createElement('p');
    p1.textContent = `Ціна: ${price === 0 ? 'Безкоштовно' : `₴${price} / міс`} · ${period}`;

    const p2 = document.createElement('p');
    p2.textContent = `ID транзакції: TXN-${Date.now()}`;

    success.appendChild(h);
    success.appendChild(p1);
    success.appendChild(p2);
    area.appendChild(success);

    log('[Async] DOM оновлено → success-block створено та вставлено', 'async');
    log(`[Done] Транзакція TXN-${Date.now()} підтверджена`, 'success');
  }, 900);
};

/**
 * Скасовує вибір тарифу — прибирає підсвічування і блок підтвердження.
 */
const cancelSelection = () => {
  log('[Event] click → .btn-cancel-confirm', 'info');

  activePlanId = null;

  // Маніпуляція DOM: видалення класів, очищення innerHTML
  document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('active-plan'));
  highlightTableColumn(null);

  document.getElementById('confirmation-area').innerHTML = '';

  log('[DOM] classList.remove("active-plan") з усіх карток', 'sync');
  log('[DOM] innerHTML = "" → блок підтвердження видалено', 'sync');
};

/**
 * Оновлює ціну в блоці підтвердження при зміні периоду.
 */
const refreshConfirmation = () => {
  if (!activePlanId) return;
  const plan = PLANS.find(p => p.id === activePlanId);
  if (!plan) return;

  const block = document.getElementById('confirmation-block');
  if (!block) return;

  const price  = currentPeriod === 'yearly' ? plan.yearly : plan.monthly;
  const period = currentPeriod === 'yearly' ? 'річна оплата (−20%)' : 'місячна оплата';
  const desc   = block.querySelector('p');
  if (desc) {
    desc.textContent = `Ціна: ${price === 0 ? 'Безкоштовно' : `₴${price} / міс`} · ${period}. Підтвердіть вибір або оберіть інший тариф.`;
    log(`[DOM] textContent оновлено у блоці підтвердження`, 'sync');
  }
};

/* ============================================================
   ДЕМОНСТРАЦІЯ EVENT LOOP (при завантаженні)
   ============================================================ */
const demoEventLoop = () => {
  log('=== Демонстрація Event Loop ===', 'warn');

  // 1. Синхронний код — виконується першим
  log('[1] Sync: початок demoEventLoop()', 'sync');

  // 2. Реєструємо макрозадачу (setTimeout 0ms)
  setTimeout(() => {
    log('[4] Async (macro): setTimeout(0) → виконується ПІСЛЯ синхронного коду', 'async');
  }, 0);

  // 3. Реєструємо мікрозадачу (Promise.resolve)
  Promise.resolve().then(() => {
    log('[3] Async (micro): Promise.then → виконується після sync, але ДО macro', 'async');
  });

  // 4. Синхронний код — виконується другим
  log('[2] Sync: кінець demoEventLoop() — Call Stack звільняється', 'sync');
};

/* ============================================================
   ІНІЦІАЛІЗАЦІЯ
   ============================================================ */
const init = () => {
  log('🚀 dom.js завантажено — DOMContentLoaded', 'info');

  initBillingToggle();
  initPlanSelection();

  document.getElementById('clear-log').addEventListener('click', () => {
    document.getElementById('js-log').innerHTML = '';
  });

  document.getElementById('error-close').addEventListener('click', hideError);

  // Демо Event Loop
  demoEventLoop();

  log('✅ Ініціалізацію завершено. Оберіть тариф.', 'success');
};

document.addEventListener('DOMContentLoaded', init);
