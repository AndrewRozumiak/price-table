/**
 * pricing.js — Лабораторна робота №04
 * Варіант 5: «Таблиця цін»
 *
 * Завдання 1: Перемикання тарифів (місячний / річний) через JS
 * Завдання 2: spread для створення нового масиву тарифів зі зміненими значеннями
 * Завдання 3: try...catch + throw для обробки помилки «тариф не знайдено»
 */

'use strict';

/* ============================================================
   ДАНІ ТАРИФІВ
   Масив об'єктів — єдине джерело правди для цін і назв.
   ============================================================ */
const PLANS = [
  {
    id: 'basic',
    name: 'Базовий',
    monthlyPrice: 0,
    yearlyPrice: 0,
    btnText: 'Почати безкоштовно',
    features: ['До 10 статей на місяць', 'Базовий доступ до архіву', 'Новини у стрічці'],
  },
  {
    id: 'pro',
    name: 'Про',
    monthlyPrice: 299,
    yearlyPrice: 239,
    btnText: 'Спробувати 14 днів',
    features: ['Необмежений доступ', 'Повний архів матеріалів', 'Без реклами', 'Преміум аналітика'],
  },
  {
    id: 'enterprise',
    name: 'Корпоративний',
    monthlyPrice: 1499,
    yearlyPrice: 1199,
    btnText: 'Зв\'язатися з нами',
    features: ['Усе з тарифу Про', 'До 25 акаунтів', 'API доступ'],
  },
];

/* ============================================================
   СТАН ЗАСТОСУНКУ
   ============================================================ */
let currentPeriod = 'monthly';   // 'monthly' | 'yearly'
let selectedPlanId = null;       // id обраного тарифу або null

/* ============================================================
   УТИЛІТИ
   ============================================================ */

/**
 * Додає рядок у JS-лог на сторінці.
 * @param {string} message — текст повідомлення
 * @param {'info'|'success'|'warn'|'error'} type — тип запису
 */
const log = (message, type = 'info') => {
  const logBox = document.getElementById('js-log');
  const hint = logBox.querySelector('.log-hint');
  if (hint) hint.remove();

  const entry = document.createElement('p');
  entry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString('uk-UA');
  entry.textContent = `[${time}] ${message}`;
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
};

/**
 * Показує повідомлення про помилку у UI-блоці.
 * @param {string} message
 */
const showError = (message) => {
  const box  = document.getElementById('error-box');
  const text = document.getElementById('error-text');
  text.textContent = message;
  box.hidden = false;
  log(`❌ Помилка: ${message}`, 'error');
};

const hideError = () => {
  document.getElementById('error-box').hidden = true;
};

/* ============================================================
   ЗАВДАННЯ 2: spread — створення нового масиву тарифів
   зі зміненими значеннями при переключенні на річну оплату.

   Для кожного тарифу створюється нова копія об'єкта через spread,
   де замінюється лише поточна ціна (currentPrice).
   Оригінальний масив PLANS залишається незмінним.
   ============================================================ */

/**
 * Повертає новий масив тарифів зі встановленим полем currentPrice
 * відповідно до обраного періоду.
 *
 * @param {'monthly'|'yearly'} period
 * @returns {Array} — новий масив об'єктів (не мутує PLANS)
 */
const buildPlansList = (period) => {
  // spread: { ...plan, currentPrice: ... } — копія з одним зміненим полем
  return PLANS.map(plan => ({
    ...plan,
    currentPrice: period === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
  }));
};

/* ============================================================
   ЗАВДАННЯ 3: Пошук тарифу з обробкою помилки через throw
   ============================================================ */

/**
 * Знаходить тариф за id. Якщо не знайдено — кидає помилку.
 *
 * @param {string} planId
 * @param {Array} plansList — масив тарифів (результат buildPlansList)
 * @returns {Object} — знайдений тариф
 * @throws {Error} — якщо тариф не знайдено
 */
const findPlan = (planId, plansList) => {
  const plan = plansList.find(p => p.id === planId);
  if (!plan) {
    throw new Error(`Тариф з id "${planId}" не знайдено у списку.`);
  }
  return plan;
};

/* ============================================================
   ЗАВДАННЯ 1: Оновлення цін на сторінці
   ============================================================ */

/**
 * Оновлює відображення ціни у всіх картках.
 * Анімація: ціна «зникає» вгору і з'являється знову.
 *
 * @param {'monthly'|'yearly'} period
 */
const updatePrices = (period) => {
  const plans = buildPlansList(period);
  log(`📦 spread: створено новий масив тарифів для періоду "${period === 'monthly' ? 'місячний' : 'річний'}"`, 'info');

  // Деструктуризація масиву — отримуємо деструктуровані об'єкти у forEach
  plans.forEach(({ id, currentPrice, name }) => {
    const card = document.querySelector(`[data-plan-id="${id}"]`);
    if (!card) return;

    const priceEl  = card.querySelector('.price-amount');
    const periodEl = card.querySelector('.price-period');

    // Анімація зникнення
    priceEl.classList.add('updating');

    setTimeout(() => {
      // Оновлення тексту
      priceEl.textContent = currentPrice === 0 ? '₴0' : `₴${currentPrice}`;
      periodEl.textContent = period === 'yearly' ? ' / міс (річна)' : ' / міс';

      // Анімація появи
      priceEl.classList.remove('updating');
    }, 200);
  });

  log(`✅ Ціни оновлено: ${plans.map(p => `${p.name}=₴${p.currentPrice}`).join(', ')}`, 'success');
};

/* ============================================================
   ЗАВДАННЯ 1: Обробник перемикача місячний / річний
   ============================================================ */
const initBillingToggle = () => {
  const btnMonthly = document.getElementById('btn-monthly');
  const btnYearly  = document.getElementById('btn-yearly');

  /**
   * Стрілкова функція-обробник перемикача.
   * @param {'monthly'|'yearly'} period
   */
  const switchPeriod = (period) => {
    if (period === currentPeriod) return;

    currentPeriod = period;
    hideError();

    // Оновлення стану кнопок
    btnMonthly.classList.toggle('active', period === 'monthly');
    btnMonthly.setAttribute('aria-pressed', String(period === 'monthly'));
    btnYearly.classList.toggle('active', period === 'yearly');
    btnYearly.setAttribute('aria-pressed', String(period === 'yearly'));

    log(`🔄 Переключено на: ${period === 'monthly' ? 'місячну' : 'річну'} оплату`, 'info');

    // Оновлення цін
    updatePrices(period);

    // Якщо є обраний тариф — оновити блок з інформацією
    if (selectedPlanId !== null) {
      try {
        const plans = buildPlansList(period);
        // Деструктуризація об'єкта тарифу
        const { name, currentPrice } = findPlan(selectedPlanId, plans);
        updateSelectedPlanInfo(name, currentPrice, period);
      } catch (err) {
        showError(err.message);
      }
    }
  };

  btnMonthly.addEventListener('click', () => switchPeriod('monthly'));
  btnYearly.addEventListener('click',  () => switchPeriod('yearly'));
};

/* ============================================================
   Оновлення блоку «Обраний тариф»
   ============================================================ */
const updateSelectedPlanInfo = (name, price, period) => {
  const infoBox    = document.getElementById('selected-plan-info');
  const nameEl     = document.getElementById('selected-plan-name');
  const detailsEl  = document.getElementById('selected-plan-details');

  const periodLabel = period === 'yearly' ? 'річна оплата' : 'місячна оплата';
  const priceLabel  = price === 0 ? 'Безкоштовно' : `₴${price} / міс (${periodLabel})`;

  nameEl.textContent    = name;
  detailsEl.textContent = `Ціна: ${priceLabel}`;
  infoBox.hidden = false;
};

/* ============================================================
   Обробники кнопок «Обрати тариф»
   ============================================================ */
const initSelectButtons = () => {
  document.querySelectorAll('.select-plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const planId = btn.dataset.planId;
      hideError();

      /* ЗАВДАННЯ 3: try...catch + throw */
      try {
        const plans = buildPlansList(currentPeriod);

        // Може кинути Error, якщо planId некоректний
        const plan = findPlan(planId, plans);

        // Деструктуризація об'єкта плану
        const { id, name, currentPrice, features } = plan;

        selectedPlanId = id;

        // Видалити виділення з усіх карток
        document.querySelectorAll('.pricing-card').forEach(c => {
          c.classList.remove('selected');
        });

        // Виділити обрану картку
        const card = document.querySelector(`.pricing-card[data-plan-id="${id}"]`);
        if (card) card.classList.add('selected');

        // Оновити інфо-блок
        updateSelectedPlanInfo(name, currentPrice, currentPeriod);

        log(`🎯 Обрано тариф: "${name}" | Ціна: ₴${currentPrice} | Функції: ${features.join(', ')}`, 'success');

      } catch (err) {
        // Обробка помилки: тариф не знайдено
        showError(err.message);
        log(`throw → catch: ${err.message}`, 'error');
      }
    });
  });

  // Кнопка «Скасувати вибір»
  document.getElementById('cancel-btn').addEventListener('click', () => {
    selectedPlanId = null;
    document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('selected-plan-info').hidden = true;
    log('↩️ Вибір тарифу скасовано', 'warn');
  });
};

/* ============================================================
   Демонстрація throw + catch з некоректним id (у консоль і лог)
   ============================================================ */
const demoErrorHandling = () => {
  log('--- Демонстрація обробки помилок ---', 'warn');

  try {
    const plans = buildPlansList('monthly');
    // Навмисно передаємо неіснуючий id
    const plan = findPlan('gold', plans);  // викличе throw
    log(`Знайдено: ${plan.name}`, 'success');
  } catch (err) {
    // err.message — повідомлення з throw new Error(...)
    log(`throw → catch: "${err.message}"`, 'error');
    console.error('[Lab04] Перехоплена помилка:', err);
  }
};

/* ============================================================
   JS-лог: кнопка очищення
   ============================================================ */
const initClearLog = () => {
  document.getElementById('clear-log').addEventListener('click', () => {
    const logBox = document.getElementById('js-log');
    logBox.innerHTML = '<p class="log-hint">Тут відображатимуться дії JavaScript...</p>';
  });
};

/* ============================================================
   ІНІЦІАЛІЗАЦІЯ
   ============================================================ */
const init = () => {
  log('🚀 Скрипт pricing.js завантажено', 'info');
  log(`📋 PLANS (const): ${PLANS.map(p => p.name).join(', ')}`, 'info');

  initBillingToggle();
  initSelectButtons();
  initClearLog();

  // Демонстрація обробки помилки при старті
  demoErrorHandling();

  log('✅ Ініціалізацію завершено. Оберіть тариф або переключіть період.', 'success');
};

// Запуск після завантаження DOM
document.addEventListener('DOMContentLoaded', init);
