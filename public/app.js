// ======================================
// BEAUTY PASS - MAIN APPLICATION (COMPLETE FINAL)
// ======================================

// Global state
let currentUser = null;
let currentLanguage = localStorage.getItem("lang") || "ka";
let userDataRefreshInterval = null;

// ======================================
// SEAMLESS EXPERIENCE - AUTO REFRESH USER DATA
// ======================================

// Автоматическое обновление данных пользователя без перезагрузки страницы
async function refreshUserDataSilently() {
  const token = localStorage.getItem("token");
  if (!token || !currentUser) return;
  
  try {
    const response = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const userData = await response.json();
      
      // Проверяем изменения и обновляем UI без перезагрузки
      const balanceChanged = currentUser.balance !== userData.balance;
      const bpChanged = currentUser.beautyPoints !== userData.beautyPoints;
      
      // Обновляем глобальные данные
      currentUser = userData;
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Обновляем UI элементы если что-то изменилось
      if (balanceChanged || bpChanged) {
        updateUserUIElements(userData);
        console.log('✨ Данные пользователя обновлены автоматически');
      }
    }
  } catch (error) {
    // Тихо игнорируем ошибки при фоновом обновлении
    console.log('Background refresh skipped:', error.message);
  }
}

// Обновление UI элементов без перезагрузки страницы
function updateUserUIElements(user) {
  // Баланс в профиле
  const balanceEl = document.getElementById("userBalance");
  if (balanceEl) {
    const newBalance = (user.balance || 0) + "₾";
    if (balanceEl.textContent !== newBalance) {
      balanceEl.textContent = newBalance;
      balanceEl.classList.add('value-updated');
      setTimeout(() => balanceEl.classList.remove('value-updated'), 1000);
    }
  }
  
  // Beauty Points
  const bpEl = document.getElementById("userBP");
  if (bpEl) {
    const newBP = (user.beautyPoints || 0) + " BP";
    if (bpEl.textContent !== newBP) {
      bpEl.textContent = newBP;
      bpEl.classList.add('value-updated');
      setTimeout(() => bpEl.classList.remove('value-updated'), 1000);
    }
  }
  
  // Баланс в хедере (мобильный)
  const headerBalance = document.querySelector('.mobile-bp-compact');
  if (headerBalance && !user.salonName) {
    headerBalance.textContent = `${user.beautyPoints || 0} BP | ${user.balance || 0}₾`;
  }
  
  // Обновляем имя пользователя
  const nameEl = document.getElementById("profileName");
  if (nameEl) nameEl.textContent = user.firstName || user.login || "მომხმარებელი";
}

// Запуск автоматического обновления данных
function startUserDataRefresh() {
  // Очищаем предыдущий интервал если есть
  if (userDataRefreshInterval) {
    clearInterval(userDataRefreshInterval);
  }
  
  // Обновляем каждые 10 секунд
  userDataRefreshInterval = setInterval(refreshUserDataSilently, 10000);
  console.log('🔄 Seamless data refresh started');
}

// Остановка автоматического обновления
function stopUserDataRefresh() {
  if (userDataRefreshInterval) {
    clearInterval(userDataRefreshInterval);
    userDataRefreshInterval = null;
    console.log('⏹️ Data refresh stopped');
  }
}

// ======================================
// АВТООБНОВЛЕНИЕ СТАТИСТИКИ САЙТА
// ======================================

let statsRefreshInterval = null;

// Получение и отображение статистики с базы данных
async function fetchAndUpdateStats() {
  try {
    const response = await fetch('/api/public-stats');
    if (response.ok) {
      const data = await response.json();
      animateStatNumber('stat-clients', data.clients || 0, 'progress-clients');
      animateStatNumber('stat-salons', data.salons || 0, 'progress-salons');
      animateStatNumber('stat-bookings', data.bookings || 0, 'progress-bookings');
      console.log('📊 Статистика обновлена:', data);
    }
  } catch (error) {
    console.log('Stats fetch error:', error.message);
  }
}

// Анимация обновления числа
function animateStatNumber(elementId, targetValue, progressId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const currentValue = parseInt(element.textContent) || 0;
  if (currentValue === targetValue) return;
  
  // Анимация счетчика
  const duration = 1500;
  const startTime = Date.now();
  
  function updateNumber() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing функция для плавности
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(currentValue + (targetValue - currentValue) * easeOut);
    
    element.textContent = current;
    element.setAttribute('data-count', targetValue);
    
    // Обновляем прогресс-бар
    if (progressId) {
      const progressBar = document.getElementById(progressId);
      if (progressBar) {
        // Прогресс относительно цели (100 = 100%)
        const progressPercent = Math.min((targetValue / 100) * 100, 100);
        progressBar.style.width = (progressPercent * easeOut) + '%';
        progressBar.setAttribute('data-progress', Math.floor(progressPercent));
      }
    }
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }
  
  requestAnimationFrame(updateNumber);
}

// Запуск автообновления статистики
function startStatsRefresh() {
  // Первоначальная загрузка
  fetchAndUpdateStats();
  
  // Обновляем каждые 30 секунд
  if (statsRefreshInterval) clearInterval(statsRefreshInterval);
  statsRefreshInterval = setInterval(fetchAndUpdateStats, 30000);
  console.log('📊 Stats auto-refresh started');
}

// ======================================
// ГЕНЕРАЦИЯ УНИКАЛЬНОГО РЕФЕРАЛЬНОГО КОДА
// ======================================

// Генерирует уникальный реферальный код на основе email (неизменяемый)
function generateReferralCode(email) {
  // Простой хеш email для генерации уникального кода
  let hash = 0;
  const str = email.toLowerCase();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Преобразуем в положительное число и берем 6 символов
  const code = Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
  return `BP-${code.padEnd(6, 'X')}`;
}

// ======================================
// СИСТЕМА УВЕДОМЛЕНИЙ (TOASTS & MODALS)
// ======================================

// Красивое уведомление (Toast)
function showToast(message, type = "success") {
  const container = document.getElementById('toastContainer');
  if (!container) {
    console.error("Toast container not found!");
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : '⚠️';
  
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  }, 4000);
}

// Кастомное модальное окно подтверждения (Вместо confirm)
function showConfirm(message, callback) {
  // Создаем затемнение фона
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  
  // Создаем модальное окно
  const modal = document.createElement('div');
  modal.className = 'confirm-modal';
  
  // HTML содержимое
  modal.innerHTML = `
    <h3>დადასტურება</h3>
    <p>${message}</p>
    <div class="confirm-actions">
      <button class="confirm-btn confirm-btn-no" id="confirmNo">გაუქმება</button>
      <button class="confirm-btn confirm-btn-yes" id="confirmYes">დიახ</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Функция очистки
  const cleanup = () => {
    overlay.remove();
  };
  
  // Обработчики кнопок
  const btnYes = document.getElementById('confirmYes');
  const btnNo = document.getElementById('confirmNo');

  if (btnNo) btnNo.onclick = cleanup;
  
  if (btnYes) {
    btnYes.onclick = () => {
      cleanup();
      if (typeof callback === 'function') {
        callback(); // Выполняем действие, если нажали Да
      }
    };
  }
  
  // Закрытие при клике на фон
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      cleanup();
    }
  };
}

// ======================================
// ИНИЦИАЛИЗАЦИЯ
// ======================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Beauty Pass loading...");
  
  try {
    applyLanguage(); // Apply saved language first
    checkAuthStatus();
    updateAuthUI();
    setupEventListeners();
    await loadHomepageData();
    navigateFromHash();
    hideLoadingScreen();
    initPromoCarousel(); // Initialize promo carousel
    startStatsRefresh(); // Start stats auto-update from database
    console.log("App loaded successfully");
  } catch (error) {
    console.error("Error loading app:", error);
    hideLoadingScreen();
  }
});

function hideLoadingScreen() {
  const loader = document.getElementById("loadingScreen");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.style.display = "none", 300);
  }
}

function checkAuthStatus() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  
  if (token && user) {
    try {
      currentUser = JSON.parse(user);
      
      // Синхронизируем с глобальным state для payment-system.js
      if (typeof state !== 'undefined') {
        state.user = currentUser;
        state.isLoggedIn = true;
      }
      
      console.log("User logged in:", currentUser.email);
    } catch (e) {
      console.error("Error parsing user:", e);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      currentUser = null;
      
      if (typeof state !== 'undefined') {
        state.user = null;
        state.isLoggedIn = false;
      }
    }
  }
}

// ======================================
// НАВИГАЦИЯ
// ======================================

// Прокрутка к карте
function scrollToMap() {
  console.log("Scrolling to map...");
  showSection("home");
  setTimeout(() => {
    const mapEl = document.getElementById("tbilisiMap") || document.querySelector(".map-section");
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: "smooth", block: "start" });
      console.log("Scrolled to map section");
    }
  }, 100);
  history.pushState(null, null, "#salons");
}

function navigate(sectionId) {
  console.log("Navigating to:", sectionId);

  if (sectionId && sectionId.startsWith('#')) {
    sectionId = sectionId.substring(1);
  }
  
  // ==========================================
  // ИСПРАВЛЕНИЕ: О нас -> Скролл на Главной странице
  // ==========================================
  if (sectionId === "about") {
    // 1. Показываем главную страницу
    showSection("home");
    
    // 2. Ждем небольшую задержку, чтобы DOM обновился
    setTimeout(() => {
      // Ищем блок с описанием компании внутри Home
      const aboutEl = document.querySelector("#home .about-section") || document.querySelector(".about-section");
      
      if (aboutEl) {
        // Плавно прокручиваем к нему
        aboutEl.scrollIntoView({ behavior: "smooth", block: "start" });
        console.log("Scrolled to About section");
      } else {
        console.warn("About section not found on homepage!");
      }
    }, 100);
    
    // Обновляем URL без перезагрузки
    history.pushState(null, null, "#" + sectionId);
    return; // Останавливаем выполнение функции
  }

  // Скролл внутри главной страницы (Тарифы, Услуги, Салоны)
  const scrollTargets = ["tariffs", "services", "salons"];
  if (scrollTargets.includes(sectionId)) {
    showSection("home");
    setTimeout(() => {
      // Для салонов ищем salonsGrid
      const el = sectionId === 'salons' 
        ? (document.getElementById('salonsGrid') || document.getElementById(sectionId))
        : document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        console.warn("Element not found for scroll:", sectionId);
      }
    }, 100);
    history.pushState(null, null, "#" + sectionId);
    return;
  }

  // Спец. случай для Контактов (Скролл вниз)
  if (sectionId === "contact") {
    showSection("home");
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
    history.pushState(null, null, "#" + sectionId);
    return;
  }

  // Обычные секции (Профиль, Дашборд и т.д.)
  const targetSection = document.getElementById(sectionId);
  
  if (targetSection) {
    showSection(sectionId);
    history.pushState(null, null, "#" + sectionId);
  } else {
    console.error("Section not found:", sectionId, "Redirecting to home.");
    showSection("home");
  }
}

function showSection(sectionId) {
  // Скрываем все секции
  document.querySelectorAll(".page-section").forEach(s => {
    s.classList.remove("active");
    s.style.display = "none";
  });
  
  // Показываем нужную секцию
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add("active");
    section.style.display = "block";

    // Если это Главная, убедимся, что внутри всё видно (фикс для старых багов)
    if (sectionId === "home") {
       const aboutInner = section.querySelector('.about-section');
       if(aboutInner) {
         aboutInner.style.display = 'block';
         aboutInner.style.visibility = 'visible';
       }
    }
    
    // Скролл наверх, если не главная
    if (sectionId !== "home") {
        window.scrollTo(0,0);
    }
  }
  
  if (sectionId === "client") {
    if (currentUser && currentUser.userType === "client") {
      showClientProfile();
    } else {
      showClientLogin();
    }
  } else if (sectionId === "salon") {
    if (currentUser && currentUser.userType === "salon") {
      showSalonDashboard();
    } else {
      showSalonLogin();
    }
  } else if (sectionId === "adminPanel") {
    // Если пользователь уже залогинен и является админом - сразу показываем dashboard
    if (currentUser && currentUser.isAdmin) {
      showAdminDashboard(currentUser);
    }
    // Иначе показывается форма логина (по умолчанию в HTML)
  }
  
  toggleMobileMenu(false);
}

function navigateFromHash() {
  const hash = window.location.hash.substring(1);
  if (hash) {
    navigate(hash);
  } else {
    navigate("home");
  }
}

window.addEventListener("hashchange", navigateFromHash);

// ======================================
// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ======================================

function updateAuthUI() {
  const authActions = document.getElementById("authActions");
  const mobileAuth = document.getElementById("mobileAuthActions");
  const adminPanelLink = document.getElementById("adminPanelLink");
  
  // Проверяем также localStorage для салонов
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const activeUser = currentUser || storedUser;
  
  if (activeUser) {
    const name = activeUser.salonName || activeUser.firstName || activeUser.login || "User";
    const isSalon = activeUser.userType === 'salon';
    
    if (authActions) {
      // Имя как кнопка перехода в профиль
      const profilePage = isSalon ? 'salon' : 'client';
      const logoutFn = isSalon ? 'logoutSalon()' : 'logout()';
      authActions.innerHTML = `
        <button class="btn btn-outline" style="border:none; color: var(--primary); font-weight: 600; padding-right: 12px;" onclick="navigate('${profilePage}')">
          ${isSalon ? '🏢' : '👋'} ${name}
        </button>
        <button class="btn btn-primary" onclick="${logoutFn}">გამოსვლა</button>
      `;
    }
    if (mobileAuth) {
      const profilePage = isSalon ? 'salon' : 'client';
      mobileAuth.innerHTML = `
        <div class="mobile-profile-compact" onclick="navigate('${profilePage}'); toggleMobileMenu();">
          <div class="user-avatar-compact">${(name.charAt(0) || 'U').toUpperCase()}</div>
          <div class="mobile-profile-text">
            <span class="mobile-user-name-compact">${name}</span>
            <span class="mobile-bp-compact">${isSalon ? '🏢 სალონი' : (activeUser.beautyPoints || 0) + ' BP | ' + (activeUser.balance || 0) + '₾'}</span>
          </div>
        </div>
      `;
    }
    
    // Показываем кнопку админ-панели только для админов
    if (adminPanelLink) {
      adminPanelLink.style.display = activeUser.isAdmin ? 'block' : 'none';
    }
  } else {
    if (authActions) {
      authActions.innerHTML = `
        <button class="btn btn-outline" onclick="showLoginForm()">შესვლა</button>
        <button class="btn btn-primary" onclick="showRegisterForm()">რეგისტრაცია</button>
      `;
    }
    if (mobileAuth) {
      mobileAuth.innerHTML = `
        <div class="mobile-auth-buttons-compact">
          <button class="btn btn-outline btn-sm" onclick="showLoginForm(); toggleMobileMenu();">Login</button>
          <button class="btn btn-primary btn-sm" onclick="showRegisterForm(); toggleMobileMenu();">Register</button>
        </div>
      `;
    }
    
    // Скрываем кнопку админ-панели для незалогиненных
    if (adminPanelLink) {
      adminPanelLink.style.display = 'none';
    }
  }
}

function setupEventListeners() {
  const hamburger = document.querySelector(".hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", () => toggleMobileMenu());
  }
  
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      switchLanguage(lang);
    });
  });
}

function toggleMobileMenu(show) {
  const menu = document.getElementById("mobileMenu");
  const hamburger = document.querySelector(".hamburger");
  const overlay = document.getElementById("mobileMenuOverlay");
  
  if (menu && hamburger) {
    const isActive = typeof show === "boolean" ? show : !menu.classList.contains("active");
    
    if (isActive) {
      menu.classList.add("active");
      hamburger.classList.add("active");
      if(overlay) overlay.classList.add("active");
      document.body.style.overflow = 'hidden';
    } else {
      menu.classList.remove("active");
      hamburger.classList.remove("active");
      if(overlay) overlay.classList.remove("active");
      document.body.style.overflow = '';
    }
  }
}

function switchLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("lang", lang);
  
  // Update language buttons
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
  });
  
  // Apply translations to all elements with data-ka/data-en attributes
  document.querySelectorAll('[data-ka][data-en]').forEach(el => {
    const text = el.getAttribute(`data-${lang}`);
    if (text) {
      // Check if it's an input element
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        // Use innerHTML to preserve HTML tags like <strong>
        el.innerHTML = text;
      }
    }
  });
  
  // Update BeautyBot suggestions if bot exists
  if (typeof BeautyBot !== 'undefined' && BeautyBot.updateSuggestionsLanguage) {
    BeautyBot.updateSuggestionsLanguage(lang);
  }
  
  console.log("Language switched to:", lang);
}

// Apply saved language on page load
function applyLanguage() {
  const savedLang = localStorage.getItem("lang") || "ka";
  currentLanguage = savedLang;
  
  // Update buttons
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === savedLang);
  });
  
  // Apply translations
  document.querySelectorAll('[data-ka][data-en]').forEach(el => {
    const text = el.getAttribute(`data-${savedLang}`);
    if (text) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        // Use innerHTML to preserve HTML tags like <strong>
        el.innerHTML = text;
      }
    }
  });
}

// ======================================
// ДАННЫЕ ГЛАВНОЙ СТРАНИЦЫ
// ======================================

async function loadHomepageData() {
  console.log("Loading homepage data...");
  
  try {
    const packages = await fetchPackages();
    const tariffsGrid = document.getElementById("tariffsGrid");
    if (tariffsGrid) {
      if (packages.length > 0) {
        const tierIcons = ['🌸', '🦋', '👑'];
        tariffsGrid.innerHTML = packages.map((pkg, index) => `
          <div class="card tariff-card ${pkg.popular ? 'popular' : ''}" data-tier="${index}">
            ${pkg.popular ? '<div class="popular-badge">⭐ პოპულარული</div>' : ''}
            <div class="tariff-tier-icon">${tierIcons[index] || '🌟'}</div>
            <div class="tariff-plan-title">${pkg.plan}</div>
            <div class="tariff-price-block">
              <span class="tariff-price-value">${pkg.price}</span>
              <span class="tariff-price-currency">₾</span>
            </div>
            <div class="tariff-bp-badge">
              <span class="bp-icon">💎</span>
              <span class="bp-value">${pkg.tokens} BP</span>
            </div>
            <p class="tariff-description">${pkg.description || ''}</p>
            <div class="tariff-actions">
              <button class="btn btn-primary btn-block tariff-btn" onclick="selectTariff('${pkg.plan}', ${pkg.price})">
                არჩევა
              </button>
            </div>
          </div>
        `).join('');
      } else {
        tariffsGrid.innerHTML = '<p class="text-center text-muted">ტარიფები იტვირთება...</p>';
      }
    }
    
    const salons = await fetchSalons();
    const salonsGrid = document.getElementById("salonsGrid");
    if (salonsGrid) {
      if (salons.length > 0) {
        salonsGrid.innerHTML = salons.map(salon => `
          <div class="card salon-card" onclick="openSalonPage('${salon._id}', '${encodeURIComponent(salon.name)}')">
            <h4 class="salon-name">${salon.name}</h4>
            <p class="salon-location">📍 ${salon.address || salon.location || ''}</p>
            <p>⭐ ${salon.rating || 'N/A'}</p>
            <div class="salon-services">
              ${(salon.services || []).slice(0, 3).map(s => `<span class="service-tag">${s}</span>`).join('')}
            </div>
          </div>
        `).join('');
      } else {
        salonsGrid.innerHTML = '<p class="text-center text-muted">სალონები იტვირთება...</p>';
      }
    }
    
    const services = await fetchServices();
    const servicesGrid = document.getElementById("servicesGrid");
    if (servicesGrid) {
      if (services.length > 0) {
        servicesGrid.innerHTML = services.map(service => `
          <div class="card service-card">
            <div class="service-info">
              <h4>${service.name}</h4>
              <span class="service-category">${service.cat || service.category || ''}</span>
            </div>
            <span class="service-price">${service.bp || service.bpPrice} BP</span>
          </div>
        `).join('');
      } else {
        servicesGrid.innerHTML = '<p class="text-center text-muted">სერვისები იტვირთება...</p>';
      }
    }
    
    console.log("Homepage data loaded");
  } catch (error) {
    console.error("Error loading homepage:", error);
  }
}

// ======================================
// ФОРМЫ АВТОРИЗАЦИИ
// ======================================

window.showRegisterForm = function() {
  // Показываем секцию клиента напрямую, без вызова showClientLogin
  document.querySelectorAll('.page-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  
  const clientSection = document.getElementById('client');
  if (clientSection) {
    clientSection.classList.add('active');
    clientSection.style.display = 'block';
  }
  
  // Скрываем все карточки
  const loginCard = document.getElementById('loginFormCard');
  const registerCard = document.getElementById('registerFormCard');
  const forgotCard = document.getElementById('forgotPasswordCard');
  const resetCard = document.getElementById('resetPasswordCard');
  const twofaCard = document.getElementById('twofaCard');
  const profileCard = document.getElementById('clientProfile');
  
  if (loginCard) loginCard.style.display = 'none';
  if (forgotCard) forgotCard.style.display = 'none';
  if (resetCard) resetCard.style.display = 'none';
  if (twofaCard) twofaCard.style.display = 'none';
  if (profileCard) profileCard.style.display = 'none';
  
  // Показываем форму регистрации
  if (registerCard) {
    registerCard.style.display = 'block';
    console.log('Форма регистрации показана');
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.pushState(null, null, '#client');
};

window.showLoginForm = function() {
  // Показываем секцию клиента напрямую, без вызова showClientLogin
  document.querySelectorAll('.page-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  
  const clientSection = document.getElementById('client');
  if (clientSection) {
    clientSection.classList.add('active');
    clientSection.style.display = 'block';
  }
  
  // Скрываем все карточки
  const loginCard = document.getElementById('loginFormCard');
  const registerCard = document.getElementById('registerFormCard');
  const forgotCard = document.getElementById('forgotPasswordCard');
  const resetCard = document.getElementById('resetPasswordCard');
  const twofaCard = document.getElementById('twofaCard');
  const profileCard = document.getElementById('clientProfile');
  
  if (registerCard) registerCard.style.display = 'none';
  if (forgotCard) forgotCard.style.display = 'none';
  if (resetCard) resetCard.style.display = 'none';
  if (twofaCard) twofaCard.style.display = 'none';
  if (profileCard) profileCard.style.display = 'none';
  
  // Показываем форму входа
  if (loginCard) {
    loginCard.style.display = 'block';
    console.log('Форма входа показана');
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.pushState(null, null, '#client');
};

window.showForgotPasswordForm = function() {
  navigate('client');
  setTimeout(() => {
    const loginCard = document.getElementById('loginFormCard');
    const forgotCard = document.getElementById('forgotPasswordCard');
    
    if (loginCard) loginCard.style.display = 'none';
    if (forgotCard) {
      forgotCard.style.display = 'block';
    } else {
      showToast("ფუნქცია მალე დამატება!", "error");
    }
  }, 50);
};

function showClientLogin() {
  showLoginForm();
}

// ======================================
// АВТОРИЗАЦИЯ КЛИЕНТА
// ======================================

function show2FACard() {
  console.log("Showing 2FA Card...");
  
  // Скрываем карточки Входа и Регистрации (ПРИНУДИТЕЛЬНО)
  const loginCard = document.getElementById('loginFormCard');
  const registerCard = document.getElementById('registerFormCard');
  
  if (loginCard) {
    loginCard.style.display = 'none'; 
    loginCard.classList.add("is-hidden");
  }
  
  if (registerCard) {
    registerCard.style.display = 'none'; 
    registerCard.classList.add("is-hidden");
  }
  
  // ПОКАЗЫВАЕМ карточку 2FA (ПРИНУДИТЕЛЬНО - FIX FOR HIDDEN INPUTS)
  const twofaCard = document.getElementById('twofaCard');
  
  if (twofaCard) {
    console.log("Found 2FA Card element, forcing display block");
    twofaCard.style.display = 'block'; // Гарантированно показываем
    twofaCard.classList.remove("is-hidden");
    twofaCard.classList.add("is-visible");
    
    // Убираем все стили, которые могут мешать
    twofaCard.style.visibility = 'visible';
    twofaCard.style.opacity = '1';
  } else {
    console.error("ОШИБКА: Элемент с ID 'twofaCard' НЕ НАЙДЕН в HTML!");
    alert("Ошибка: Форма ввода кода не найдена. Проверьте HTML.");
  }

  // Скрываем профиль (если был открыт)
  const profile = document.getElementById("clientProfile");
  if (profile) {
    profile.style.display = 'none';
    profile.classList.remove("is-visible");
  }
  
  startOTPTimer();
}

window.registerClient = async function() {
  const name = document.getElementById("registerName")?.value?.trim();
  const email = document.getElementById("registerEmail")?.value?.trim();
  const phone = document.getElementById("registerPhone")?.value?.trim();
  const password = document.getElementById("registerPassword")?.value;
  const birthDateInput = document.getElementById("registerBirthDate")?.value;
  const referralCode = document.getElementById("registerReferral")?.value?.trim();
  
  // === ВАЛИДАЦИЯ ИМЕНИ ===
  if (!name || name.length < 2) {
    showToast("სახელი უნდა იყოს მინიმუმ 2 სიმბოლო", "error");
    return;
  }
  
  // === ВАЛИДАЦИЯ EMAIL ===
  if (!email) {
    showToast("შეიყვანეთ ელ-ფოსტა", "error");
    return;
  }
  
  // Проверка формата email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    showToast("არასწორი ელ-ფოსტის ფორმატი", "error");
    return;
  }
  
  // Блокировка временных/одноразовых email
  const blockedDomains = ['tempmail.com', 'throwaway.com', 'mailinator.com', 'guerrillamail.com', 'temp-mail.org', '10minutemail.com', 'fakeinbox.com', 'trashmail.com'];
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (blockedDomains.includes(emailDomain)) {
    showToast("დროებითი ელ-ფოსტა არ არის დაშვებული", "error");
    return;
  }
  
  // === ВАЛИДАЦИЯ ТЕЛЕФОНА ===
  if (!phone) {
    showToast("შეიყვანეთ ტელეფონის ნომერი", "error");
    return;
  }
  
  // Проверка грузинского номера
  const phoneClean = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+995|995)?5\d{8}$/;
  if (!phoneRegex.test(phoneClean)) {
    showToast("არასწორი ტელეფონის ნომერი (მაგ: 5XX XXX XXX)", "error");
    return;
  }
  
  // === ВАЛИДАЦИЯ ДАТЫ РОЖДЕНИЯ ===
  if (birthDateInput) {
    const birthDate = new Date(birthDateInput);
    const today = new Date();
    const minAge = 13; // Минимальный возраст
    const maxAge = 120; // Максимальный возраст
    
    // Проверка корректности даты
    if (isNaN(birthDate.getTime())) {
      showToast("არასწორი დაბადების თარიღი", "error");
      return;
    }
    
    // Проверка что дата не в будущем
    if (birthDate > today) {
      showToast("დაბადების თარიღი არ შეიძლება იყოს მომავალში", "error");
      return;
    }
    
    // Проверка минимального возраста
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < minAge) {
      showToast(`მინიმალური ასაკი: ${minAge} წელი`, "error");
      return;
    }
    
    // Проверка максимального возраста
    if (age > maxAge) {
      showToast("არასწორი დაბადების თარიღი", "error");
      return;
    }
  }
  
  // === ВАЛИДАЦИЯ ПАРОЛЯ ===
  if (!password) {
    showToast("შეიყვანეთ პაროლი", "error");
    return;
  }
  
  if (password.length < 8) {
    showToast("პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო", "error");
    return;
  }
  
  // Проверка сложности пароля (хотя бы одна цифра и спецсимвол)
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasNumber || !hasSpecial) {
    showToast("პაროლი უნდა შეიცავდეს ციფრს და სპეცსიმბოლოს", "error");
    return;
  }
  
  try {
    const result = await registerUser({
      firstName: name,
      login: email,
      email: email,
      phone: phoneClean,
      password: password,
      birthDate: birthDateInput || null,
      userType: "client",
      referredByCode: referralCode || null
    });
    
    showToast(result.message || "რეგისტრაცია წარმატებით დასრულდა!", "success");
    show2FACard();
  } catch (error) {
    showToast("შეცდომა: " + error.message, "error");
  }
};

window.loginClient = async function() {
  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;
  
  if (!email || !password) {
    showToast("შეიყვანეთ ელ-ფოსტა და პაროლი", "error");
    return;
  }
  
  try {
    const result = await loginUser({ email, password });
    showToast(result.message || "კოდი გაგზავნილია თქვენს ელ-ფოსტაზე", "success");
    show2FACard();
  } catch (error) {
    showToast("შეცდომა: " + error.message, "error");
  }
};

window.submit2FACode = async function() {
  const email = document.getElementById("loginEmail")?.value || document.getElementById("registerEmail")?.value;
  const code = document.getElementById("otpCode")?.value;
  
  if (!email || !code) {
    showToast("შეიყვანეთ ელ-ფოსტა და კოდი", "error");
    return;
  }
  
  try {
    const result = await verify2FA(email, code);
    
    if (result.token && result.user) {
      currentUser = result.user;
      
      // Синхронизируем с глобальным state для payment-system.js
      if (typeof state !== 'undefined') {
        state.user = result.user;
        state.isLoggedIn = true;
      }
      
      updateAuthUI();
      
      if (currentUser.userType === "salon") {
        navigate("salon");
      } else {
        await showClientProfile();
      }
      
      showToast("წარმატებით შეხვედით!", "success");
    }
  } catch (error) {
    showToast("შეცდომა: " + error.message, "error");
  }
};

window.resend2FA = async function() {
  const email = document.getElementById("loginEmail")?.value || document.getElementById("registerEmail")?.value;
  if (!email) {
    showToast("შეიყვანეთ ელ-ფოსტა", "error");
    return;
  }
  
  try {
    const result = await resendVerificationCode(email);
    showToast(result.message || "ახალი კოდი გაგზავნილია", "success");
    startOTPTimer();
  } catch (error) {
    showToast("შეცდომა: " + error.message, "error");
  }
};

function startOTPTimer() {
  let timeLeft = 600;
  const timerEl = document.getElementById("otpTimer");
  if (!timerEl) return;
  
  if (window.otpInterval) clearInterval(window.otpInterval);
  
  window.otpInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(window.otpInterval);
      timerEl.textContent = "კოდი ვადაგასულია";
      return;
    }
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerEl.textContent = `⏰ დარჩა: ${mins}:${secs.toString().padStart(2, '0')}`;
    timeLeft--;
  }, 1000);
}

window.logout = function() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  currentUser = null;
  
  // Останавливаем автоматическое обновление
  stopUserDataRefresh();
  
  // Синхронизируем с глобальным state
  if (typeof state !== 'undefined') {
    state.user = null;
    state.isLoggedIn = false;
  }
  
  updateAuthUI();
  navigate("home");
  showToast("გამოსვლა წარმატებით!", "success");
};

// ======================================
// ПРОФИЛЬ КЛИЕНТА
// ======================================

async function showClientProfile() {
  const loginCard = document.getElementById('loginFormCard');
  const registerCard = document.getElementById('registerFormCard');
  const twofaCard = document.getElementById('twofaCard');
  const forgotCard = document.getElementById('forgotPasswordCard');
  const resetCard = document.getElementById('resetPasswordCard');

  if (loginCard) loginCard.style.display = 'none';
  if (registerCard) registerCard.style.display = 'none';
  if (twofaCard) twofaCard.style.display = 'none';
  if (forgotCard) forgotCard.style.display = 'none';
  if (resetCard) resetCard.style.display = 'none';

  const profile = document.getElementById("clientProfile");
  if (profile) {
    profile.style.display = "block";
    profile.classList.remove("is-hidden");
    profile.classList.add("is-visible");
  }
  
  // Сбрасываем форму редактирования - показываем режим просмотра
  const viewInfo = document.getElementById('viewProfileInfo');
  const editForm = document.getElementById('editProfileCard');
  if (viewInfo) viewInfo.style.display = 'block';
  if (editForm) editForm.style.display = 'none';
  
  window.scrollTo(0, 0);

  // Запускаем автоматическое обновление данных (Seamless Experience)
  startUserDataRefresh();

  try {
    const user = await fetchProfile();
    currentUser = user;
    localStorage.setItem("user", JSON.stringify(user));
    
    // Базовая информация
    const nameEl = document.getElementById("profileName");
    const emailEl = document.getElementById("profileEmail");
    const balanceEl = document.getElementById("userBalance");
    const bpEl = document.getElementById("userBP");
    
    if (nameEl) nameEl.textContent = user.firstName || user.login || "მომხმარებელი";
    if (emailEl) emailEl.textContent = user.email || "";
    
    // GEL баланс (лари) - для пополнения и покупки пакетов
    if (balanceEl) balanceEl.textContent = (user.balance || 0) + "₾";
    
    // Beauty Points (BP) - для оплаты услуг
    if (bpEl) bpEl.textContent = (user.beautyPoints || 0) + " BP";
    
    // Активный пакет
    const activePlanEl = document.getElementById("userActivePlan");
    if (activePlanEl) {
      if (user.activePlan && user.activePlan.name) {
        const expiresAt = new Date(user.activePlan.expiresAt);
        const now = new Date();
        const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        
        if (daysLeft > 0) {
          activePlanEl.innerHTML = `
            <span class="plan-name">${user.activePlan.name}</span>
            <span class="plan-expires">${daysLeft} დღე დარჩა</span>
          `;
          activePlanEl.classList.add('has-plan');
        } else {
          activePlanEl.innerHTML = '<span class="no-plan">პაკეტი არ არის</span>';
          activePlanEl.classList.remove('has-plan');
        }
      } else {
        activePlanEl.innerHTML = '<span class="no-plan">პაკეტი არ არის</span>';
        activePlanEl.classList.remove('has-plan');
      }
    }
    
    // РЕФЕРАЛЬНЫЙ КОД (уникальный, неизменяемый, привязан к email)
    const referralCodeEl = document.getElementById("referralCode");
    if (referralCodeEl && user.email) {
      // Используем код из базы или генерируем на основе email
      const uniqueCode = user.referralCode || generateReferralCode(user.email);
      referralCodeEl.textContent = uniqueCode;
    }

    // Детальная информация (Автозаполнение)
    const clientIdEl = document.getElementById("profileClientId");
    const fullNameEl = document.getElementById("profileFullName");
    const phoneEl = document.getElementById("profilePhone");
    const birthDateEl = document.getElementById("profileBirthDate");
    const sinceEl = document.getElementById("profileSince");

    if (clientIdEl) clientIdEl.textContent = user._id || "-";

    if (fullNameEl) {
      const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      fullNameEl.textContent = full || "-";
    }

    if (phoneEl) phoneEl.textContent = user.phone || "-";

    if (birthDateEl) {
      if (user.birthDate) {
        birthDateEl.textContent = new Date(user.birthDate).toLocaleDateString();
      } else {
        birthDateEl.textContent = "-";
      }
    }

    if (sinceEl) {
      if (user.createdAt) {
        sinceEl.textContent = new Date(user.createdAt).toLocaleDateString();
      } else {
        sinceEl.textContent = "-";
      }
    }
    
    // ===== GAMIFICATION STATS =====
    updateGamificationStats(user);
    
    await loadActiveTariffs(user.purchases);
    await loadUserBookings();
    await initSlotsDateFilter();
    await loadAvailableSlots();
  } catch (error) {
    console.error("Profile load error:", error);
    showToast("პროფილის ჩატვირვის შეცდომა", "error");
  }
}

// Обновление gamification статистики
function updateGamificationStats(user) {
  // Level - основан на реальном опыте (XP), не на Beauty Points
  const levelEl = document.getElementById("userLevel");
  const levelNameEl = document.getElementById("levelName");
  const levelProgressEl = document.getElementById("levelProgress");
  const levelProgressTextEl = document.getElementById("levelProgressText");
  const nextRewardEl = document.getElementById("nextReward");
  
  // XP начисляется за активность: бронирования, отзывы, streak и т.д.
  // НЕ путаем с beautyPoints (валюта для услуг)
  const xp = user.xp || 0;
  const xpPerLevel = 100; // Сколько XP нужно для следующего уровня
  const level = Math.floor(xp / xpPerLevel) + 1;
  const xpInLevel = xp % xpPerLevel;
  
  const levelNames = ['Beginner', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];
  const levelName = levelNames[Math.min(level - 1, levelNames.length - 1)];
  
  if (levelEl) levelEl.textContent = level;
  if (levelNameEl) levelNameEl.textContent = levelName;
  if (levelProgressEl) levelProgressEl.style.width = `${(xpInLevel / xpPerLevel) * 100}%`;
  if (levelProgressTextEl) levelProgressTextEl.textContent = `${xpInLevel} / ${xpPerLevel} XP`;
  
  // Показываем ближайшую награду за уровень (каждый 5-й уровень)
  if (nextRewardEl) {
    const nextRewardLevel = Math.ceil(level / 5) * 5;
    if (nextRewardLevel === level && level % 5 === 0) {
      // Уже на награждаемом уровне
      nextRewardEl.textContent = `🎁 +${nextRewardLevel * 10} BP მიღებულია!`;
    } else {
      const xpNeeded = (nextRewardLevel - 1) * xpPerLevel - xp;
      nextRewardEl.textContent = `🎁 Level ${nextRewardLevel}: +${nextRewardLevel * 10} BP (${xpNeeded} XP-მდე)`;
    }
  }
  
  // Streak
  const streakEl = document.getElementById("userStreak");
  if (streakEl) streakEl.textContent = user.streak || 0;
  
  // Total Bookings
  const totalBookingsEl = document.getElementById("totalBookings");
  if (totalBookingsEl) totalBookingsEl.textContent = user.totalBookings || 0;
  
  // Achievements
  const achievementCountEl = document.getElementById("achievementCount");
  const achievements = user.achievements || [];
  if (achievementCountEl) achievementCountEl.textContent = achievements.length;
  
  // Render achievements
  renderAchievements(achievements, user);
}

// Рендер достижений
function renderAchievements(achievements, user) {
  const container = document.getElementById("achievementsList");
  if (!container) return;
  
  // Определяем возможные достижения
  const allAchievements = [
    { id: 'first_booking', icon: '🎯', name: 'პირველი ჯავშანი', desc: 'First booking completed', unlocked: (user.totalBookings || 0) >= 1 },
    { id: 'loyal_5', icon: '⭐', name: 'ლოიალური', desc: '5 bookings completed', unlocked: (user.totalBookings || 0) >= 5 },
    { id: 'loyal_10', icon: '🌟', name: 'სუპერ ლოიალური', desc: '10 bookings completed', unlocked: (user.totalBookings || 0) >= 10 },
    { id: 'streak_3', icon: '🔥', name: '3 დღიანი სტრიქი', desc: '3-day streak', unlocked: (user.streak || 0) >= 3 },
    { id: 'streak_7', icon: '💪', name: 'კვირის სტრიქი', desc: '7-day streak', unlocked: (user.streak || 0) >= 7 },
    { id: 'referral', icon: '👯', name: 'მეგობარი მოწვეული', desc: 'Invited a friend', unlocked: (user.referralCount || 0) >= 1 },
    { id: 'premium', icon: '💎', name: 'პრემიუმ მომხმარებელი', desc: 'Purchased premium package', unlocked: user.activePlan && user.activePlan.name },
    { id: 'early_adopter', icon: '🚀', name: 'ადრეული მომხმარებელი', desc: 'Joined in 2026', unlocked: user.createdAt && new Date(user.createdAt).getFullYear() === 2026 }
  ];
  
  container.innerHTML = allAchievements.map(a => `
    <div class="achievement-badge ${a.unlocked ? 'unlocked' : 'locked'}">
      <span class="achievement-icon">${a.icon}</span>
      <span class="achievement-name">${a.name}</span>
      ${!a.unlocked ? '<span class="lock-icon">🔒</span>' : ''}
    </div>
  `).join('');
}

// --- ПРОФИЛЬ: РЕДАКТИРОВАНИЕ ---

// Открывает форму редактирования
window.showEditProfile = function() {
  // Скрываем блок "Только просмотр"
  const viewInfo = document.getElementById('viewProfileInfo');
  if (viewInfo) viewInfo.style.display = 'none';

  // Показываем блок "Редактирование"
  const editForm = document.getElementById('editProfileCard');
  if (editForm) {
    editForm.style.display = 'block';
    // Прокрутка к форме редактирования
    editForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Заполняем поля текущими данными из currentUser
  if (currentUser) {
    const firstNameEl = document.getElementById('editFirstName');
    const lastNameEl = document.getElementById('editLastName');
    const phoneEl = document.getElementById('editPhone');
    const birthDateEl = document.getElementById('editBirthDate');

    if (firstNameEl) firstNameEl.value = currentUser.firstName || '';
    if (lastNameEl) lastNameEl.value = currentUser.lastName || '';
    if (phoneEl) phoneEl.value = currentUser.phone || '';
    
    // Формат даты для input type="date" (YYYY-MM-DD)
    if (currentUser.birthDate && birthDateEl) {
      birthDateEl.value = new Date(currentUser.birthDate).toISOString().split('T')[0];
    }
  }
};

// Отменяет редактирование (возвращает к просмотру)
window.cancelEditProfile = function() {
  const viewInfo = document.getElementById('viewProfileInfo');
  if (viewInfo) viewInfo.style.display = 'block';

  const editForm = document.getElementById('editProfileCard');
  if (editForm) editForm.style.display = 'none';
};

// Сохраняет изменения
window.saveProfile = async function() {
  const firstName = document.getElementById('editFirstName')?.value;
  const lastName = document.getElementById('editLastName')?.value;
  const phone = document.getElementById('editPhone')?.value;
  const birthDate = document.getElementById('editBirthDate')?.value;

  if (!firstName) {
    showToast("სახელი სავალდებულია!", "error");
    return;
  }

  try {
    // Отправка запроса на сервер
    const token = localStorage.getItem("token");
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ firstName, lastName, phone, birthDate })
    });

    if (!response.ok) {
      throw new Error("Ошибка сохранения");
    }

    const updatedUser = await response.json();
    
    // Обновляем данные и UI
    currentUser = updatedUser; // Локально тоже обновляем
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
    showToast("პროფილი წარმატებულია!", "success");
    
    // Обновляем вид профиля
    await showClientProfile();
    
    // Возвращаемся в режим просмотра
    cancelEditProfile();
  } catch (error) {
    console.error(error);
    showToast("შეცდომა: " + error.message, "error");
  }
};

// ------------------------------------------

async function loadActiveTariffs(purchases) {
  const container = document.getElementById("activeTariffs");
  if (!container) return;
  
  if (!purchases || purchases.length === 0) {
    container.innerHTML = '<p class="text-muted">აქტიური ტარიფები არ არის</p>';
    return;
  }
  
  const active = purchases.filter(p => 
    p.type === "tariff" && new Date(p.valid_until) > new Date()
  );
  
  if (active.length === 0) {
    container.innerHTML = '<p class="text-muted">აქტიური ტარიფები არ არის</p>';
  } else {
    container.innerHTML = active.map(t => `
      <div class="card">
        <h4>${t.plan}</h4>
        <p>შეძენა: ${new Date(t.ts).toLocaleDateString()}</p>
        <p>ვადა: ${new Date(t.valid_until).toLocaleDateString()}</p>
        <p>ფასი: ${t.price}₾</p>
      </div>
    `).join('');
  }
}

async function loadUserBookings() {
  const container = document.getElementById("userBookings");
  if (!container) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/booking/my-bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const bookings = await response.json();
    
    if (!bookings || bookings.length === 0) {
      container.innerHTML = '<p class="text-muted">ჯავშნები არ არის</p>';
      return;
    }
    
    container.innerHTML = bookings.map(b => {
      // Проверяем сколько дней осталось до бронирования
      const bookingDate = new Date(b.dateTime || `${b.date}T${b.time}`);
      const now = new Date();
      const daysLeft = Math.ceil((bookingDate - now) / (1000 * 60 * 60 * 24));
      
      // Кнопки доступны только для активных бронирований
      const isActive = b.status === "pending" || b.status === "confirmed" || b.status === "booked";
      const canModify = isActive && daysLeft >= 2; // И изменение и отмена доступны если >= 2 дней
      
      let buttonsHtml = '';
      if (isActive) {
        if (canModify) {
          buttonsHtml += `<button class="btn btn-outline btn-sm" onclick="changeMyBooking('${b._id}', '${b.salonId}')">✏️ შეცვლა</button> `;
          buttonsHtml += `<button class="btn btn-danger btn-sm" onclick="cancelMyBooking('${b._id}', ${daysLeft})">❌ გაუქმება</button>`;
        } else {
          buttonsHtml = `<p class="text-muted" style="font-size: 0.85rem; margin-top: 8px;">⚠️ ცვლილება/გაუქმება აღარ არის შესაძლებელი (საჭიროა 2+ დღე)</p>`;
        }
      }
      
      return `
        <div class="card booking-item">
          <div class="booking-header">
            <span class="booking-code">${b.bookingCode}</span>
            <span class="status-badge status-${b.status}">${getClientBookingStatusText(b.status)}</span>
          </div>
          <h4>${b.serviceName}</h4>
          <p>
            🏢 ${b.salonName}
            <button class="chat-btn-mini" onclick="startChatWithSalon('${b.salonId}', '${b.salonName}')" title="მიწერა სალონს">
              💬
            </button>
          </p>
          <p>📅 ${b.date} | 🕐 ${b.time}</p>
          <p>💰 ${b.bpPrice} BP</p>
          <div class="booking-actions" style="margin-top: 12px;">
            ${buttonsHtml}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Load bookings error:', error);
    container.innerHTML = '<p class="text-muted">შეცდომა ჯავშნების ჩატვირთვისას</p>';
  }
}

function getClientBookingStatusText(status) {
  const map = {
    pending: "📅 მოლოდინში",
    confirmed: "✅ დადასტურებული",
    booked: "✅ დადასტურებული",
    completed: "✨ დასრულებული",
    cancelled: "❌ გაუქმებული",
    'no-show': "⚠️ არ გამოცხადდა"
  };
  return map[status] || status;
}

// ===== ДОСТУПНЫЕ СЛОТЫ =====

// Инициализация фильтра дат (следующие 14 дней)
async function initSlotsDateFilter() {
  const select = document.getElementById('slotsDateFilter');
  if (!select) return;
  
  const today = new Date();
  const options = ['<option value="">ყველა თარიღი</option>'];
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('ka-GE', { weekday: 'short', day: 'numeric', month: 'short' });
    options.push(`<option value="${dateStr}">${dayName}</option>`);
  }
  
  select.innerHTML = options.join('');
}

// Загрузка доступных слотов
window.loadAvailableSlots = async function() {
  const container = document.getElementById('availableSlotsContainer');
  if (!container) return;
  
  const dateFilter = document.getElementById('slotsDateFilter')?.value || '';
  const categoryFilter = document.getElementById('slotsCategoryFilter')?.value || '';
  
  try {
    let url = '/api/available-slots?limit=30';
    if (dateFilter) url += `&date=${dateFilter}`;
    if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
    
    const response = await fetch(url);
    const slots = await response.json();
    
    if (!slots || slots.length === 0) {
      container.innerHTML = '<p class="text-muted">სლოტები არ მოიძებნა</p>';
      return;
    }
    
    // Группируем по дате
    const grouped = {};
    slots.forEach(slot => {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push(slot);
    });
    
    let html = '';
    for (const date of Object.keys(grouped).sort()) {
      const dateObj = new Date(date);
      const dateStr = dateObj.toLocaleDateString('ka-GE', { weekday: 'long', day: 'numeric', month: 'long' });
      
      html += `<div class="slots-date-group" style="margin-bottom: 16px;">
        <h4 style="font-size: 0.95rem; color: var(--primary); margin-bottom: 8px;">📅 ${dateStr}</h4>
        <div class="slots-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">`;
      
      for (const slot of grouped[date]) {
        const specName = slot.specialist?.name || slot.specialistName || 'სპეციალისტი';
        const specPhoto = slot.specialist?.photo || '';
        const salonName = slot.salonName || 'სალონი';
        const service = slot.serviceName || slot.specialist?.services?.[0]?.name || 'პროცედურა';
        const bpPrice = slot.bpPrice || 10;
        
        html += `
          <div class="slot-card-mini" style="background: var(--white); border-radius: 12px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; gap: 12px; align-items: center;">
            <div class="slot-avatar" style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; flex-shrink: 0; overflow: hidden;">
              ${specPhoto ? `<img src="${specPhoto}" style="width: 100%; height: 100%; object-fit: cover;">` : '👤'}
            </div>
            <div class="slot-info" style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${specName}</div>
              <div style="font-size: 0.8rem; color: #666;">🏢 ${salonName}</div>
              <div style="font-size: 0.85rem; margin-top: 4px;">
                <span style="color: var(--primary); font-weight: 600;">🕐 ${slot.time}</span>
                <span style="margin-left: 8px; color: var(--gold);">💰 ${bpPrice} BP</span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="bookSlotDirect('${slot._id}')" style="flex-shrink: 0;">
              ჯავშანი
            </button>
          </div>
        `;
      }
      
      html += '</div></div>';
    }
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Load slots error:', error);
    container.innerHTML = '<p class="text-muted">შეცდომა სლოტების ჩატვირთვისას</p>';
  }
}

// Быстрое бронирование слота
window.bookSlotDirect = async function(slotId) {
  if (!currentUser) {
    showToast("გთხოვთ შეხვიდეთ სისტემაში", "error");
    navigate("client");
    return;
  }
  
  showConfirm("გსურთ ამ სლოტის დაჯავშნა?", async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/booking/slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ slotId })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showToast("🎉 ჯავშანი წარმატებით დადასტურდა!", "success");
        
        if (result.newBalance !== undefined) {
          currentUser.beautyPoints = result.newBalance;
          localStorage.setItem('user', JSON.stringify(currentUser));
          updateAuthUI();
        }
        
        loadAvailableSlots();
        loadUserBookings();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      showToast("შეცდომა: " + error.message, "error");
    }
  });
}

window.cancelMyBooking = async function(id, daysLeft) {
  // Текст предупреждения
  let confirmText = "ნამდვილად გსურთ ჯავშნის გაუქმება?";
  
  showConfirm(confirmText, async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/booking/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showToast(result.message || "ჯავშანი გაუქმდა", "success");
        
        // Обновляем баланс
        if (result.newBalance !== undefined) {
          currentUser.beautyPoints = result.newBalance;
          localStorage.setItem('user', JSON.stringify(currentUser));
          updateAuthUI();
        }
        
        loadUserBookings();
        loadAvailableSlots(); // Обновляем список доступных слотов
        showClientProfile();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      showToast("შეცდომა: " + error.message, "error");
    }
  });
};

// Функция изменения бронирования
window.changeMyBooking = async function(bookingId, salonOwnerId) {
  // Сохраняем ID бронирования для изменения
  window.bookingToChange = bookingId;
  
  // Показываем сообщение
  showToast("აირჩიეთ ახალი თარიღი და დრო", "info");
  
  // Ищем салон по ownerId в загруженных салонах TbilisiMap
  if (typeof TbilisiMap !== 'undefined') {
    // Находим салон где ownerId совпадает с salonId из бронирования
    const salon = TbilisiMap.salons.find(s => {
      // Проверяем разные варианты ID
      return s.ownerId === salonOwnerId || 
             s.id === salonOwnerId || 
             (s.ownerId && s.ownerId._id === salonOwnerId);
    });
    
    if (salon) {
      TbilisiMap.openSalonModal(salon.id);
    } else {
      // Если не нашли по ownerId, пробуем напрямую
      TbilisiMap.openSalonModal(salonOwnerId);
    }
  } else {
    showToast("შეცდომა: მოდული ვერ მოიძებნა", "error");
  }
};

window.selectTariff = function(plan, price) {
  if (!currentUser) {
    navigate("client");
    return;
  }
  
  showConfirm(`გსურთ "${plan}" ტარიფის შეძენა ${price}₾-ად?`, () => {
    buyPackage(plan, price).then(result => {
      showToast(result.message || "ტარიფი შეძენილია!", "success");
      showClientProfile();
    }).catch(error => {
      showToast("შეცდომა: " + error.message, "error");
    });
  });
};

// Модальное окно выбора пакетов
window.showPackagesModal = async function() {
  try {
    const response = await fetch('/api/packages');
    const packages = await response.json();
    
    let modal = document.getElementById('packagesModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'packagesModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    
    const packagesHTML = packages.map(pkg => `
      <div class="package-card ${pkg.plan === 'Premium' ? 'featured' : ''}" style="
        background: ${pkg.plan === 'Basic' ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 
                      pkg.plan === 'Premium' ? 'linear-gradient(135deg, #a855f7, #c084fc)' : 
                      'linear-gradient(135deg, #f59e0b, #fbbf24)'};
        padding: 24px;
        border-radius: 16px;
        color: white;
        text-align: center;
        position: relative;
        ${pkg.plan === 'Premium' ? 'transform: scale(1.05); box-shadow: 0 8px 32px rgba(168,85,247,0.4);' : ''}
      ">
        ${pkg.plan === 'Premium' ? '<span style="position: absolute; top: -10px; right: 20px; background: #fbbf24; color: #000; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">⭐ პოპულარული</span>' : ''}
        <h3 style="font-size: 24px; margin-bottom: 8px;">${pkg.plan}</h3>
        <div style="font-size: 36px; font-weight: bold; margin: 16px 0;">${pkg.price}₾</div>
        <div style="font-size: 18px; margin-bottom: 16px;">${pkg.tokens} BP</div>
        <p style="opacity: 0.9; margin-bottom: 20px; font-size: 14px;">${pkg.description || '30 დღე მოქმედების ვადა'}</p>
        <button onclick="selectTariff('${pkg.plan}', ${pkg.price}); closePackagesModal();" style="
          background: rgba(255,255,255,0.2);
          border: 2px solid white;
          color: white;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
        " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
          შეძენა
        </button>
      </div>
    `).join('');
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 900px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 20px; padding: 32px;">
        <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: white; font-size: 24px;">💎 აირჩიეთ პაკეტი</h2>
          <button class="modal-close" onclick="closePackagesModal()" style="color: white; font-size: 24px; background: none; border: none; cursor: pointer;">✕</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
          ${packagesHTML}
        </div>
        <p style="text-align: center; color: rgba(255,255,255,0.6); margin-top: 24px; font-size: 14px;">
          ℹ️ BP (Beauty Points) გამოიყენება სერვისების დასაჯავშნად
        </p>
      </div>
    `;
    
    modal.style.display = 'flex';
    modal.onclick = (e) => {
      if (e.target === modal) closePackagesModal();
    };
  } catch (error) {
    console.error('Error loading packages:', error);
    showToast('შეცდომა პაკეტების ჩატვირთვისას', 'error');
  }
};

window.closePackagesModal = function() {
  const modal = document.getElementById('packagesModal');
  if (modal) modal.style.display = 'none';
};

// ======================================
// НОВАЯ СИСТЕМА БРОНИРОВАНИЯ С QR-КОДАМИ
// ======================================

// Глобальные переменные для бронирования
let selectedSalonForBooking = null;
let selectedSlotForBooking = null;
let availableSlotsData = [];

// ========================================
// სალონის გვერდის გახსნა სპეციალისტებით
// ========================================
window.openSalonPage = async function(salonId, salonNameEncoded) {
  // Используем модальное окно из TbilisiMap для единообразия
  if (typeof TbilisiMap !== 'undefined' && TbilisiMap.openSalonModal) {
    TbilisiMap.openSalonModal(salonId);
    return;
  }
  
  // Fallback если TbilisiMap не загружен
  const salonName = decodeURIComponent(salonNameEncoded);
  
  let modal = document.getElementById('salonPageModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'salonPageModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="modal-content salon-page-modal" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header" style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white;">
        <h2>🏢 ${salonName}</h2>
        <button class="modal-close" onclick="closeSalonPage()" style="color: white;">✕</button>
      </div>
      
      <div class="modal-body" style="padding: 0;">
        <!-- სალონის ინფო -->
        <div id="salonPageInfo" style="padding: 24px; background: #f8f4ff;">
          <p class="loading">იტვირთება...</p>
        </div>
        
        <!-- გალერეა -->
        <div id="salonGallerySection" style="display: none; padding: 0 24px 24px;">
          <h3 style="margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">📸</span>
            გალერეა
          </h3>
          <div id="salonPublicGallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
          </div>
        </div>
        
        <!-- სპეციალისტები -->
        <div style="padding: 24px;">
          <h3 style="margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">👥</span>
            სპეციალისტები
          </h3>
          <div id="salonSpecialistsList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
            <p class="loading">იტვირთება...</p>
          </div>
        </div>
        
        <!-- ჯავშანის ღილაკი -->
        <div style="padding: 24px; text-align: center; border-top: 1px solid #e0e0e0;">
          <button class="btn btn-primary btn-lg" onclick="closeSalonPage(); selectSalon('${salonName}')" style="padding: 16px 48px; font-size: 18px;">
            🗓️ დაჯავშნა
          </button>
        </div>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  
  // ჩავტვირთოთ სალონის ინფო და გალერეა
  await loadSalonPageInfo(salonId, salonName);
  
  // ჩავტვირთოთ გალერეა
  await loadSalonPublicGallery(salonId);
  
  // ჩავტვირთოთ სპეციალისტები
  await loadSalonSpecialists(salonId);
};

window.closeSalonPage = function() {
  const modal = document.getElementById('salonPageModal');
  if (modal) modal.style.display = 'none';
};

async function loadSalonPageInfo(salonId, salonName) {
  const container = document.getElementById('salonPageInfo');
  if (!container) return;
  
  try {
    // ვცდით API-დან წამოვიღოთ
    const response = await fetch(`/api/salons-with-owners`);
    const salons = await response.json();
    const salon = salons.find(s => s._id === salonId || s.name === salonName);
    
    if (salon) {
      container.innerHTML = `
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <p style="margin: 0 0 8px 0;"><strong>📍 მისამართი:</strong> ${salon.address || 'მითითებული არ არის'}</p>
            <p style="margin: 0 0 8px 0;"><strong>📞 ტელეფონი:</strong> ${salon.phone || 'მითითებული არ არის'}</p>
            <p style="margin: 0;"><strong>🕐 სამუშაო საათები:</strong> ${salon.workingHours || '10:00 - 20:00'}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 24px;">⭐ ${salon.rating || 'N/A'}</p>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `<p>${salonName}</p>`;
    }
  } catch (error) {
    container.innerHTML = `<p>${salonName}</p>`;
  }
}

async function loadSalonSpecialists(salonId) {
  const container = document.getElementById('salonSpecialistsList');
  if (!container) return;
  
  try {
    const response = await fetch(`/api/salon/${salonId}/specialists`);
    
    if (!response.ok) {
      container.innerHTML = '<p style="color: #666; text-align: center;">სპეციალისტები ჯერ არ არის დამატებული</p>';
      return;
    }
    
    const specialists = await response.json();
    
    if (!specialists || specialists.length === 0) {
      container.innerHTML = '<p style="color: #666; text-align: center;">სპეციალისტები ჯერ არ არის დამატებული</p>';
      return;
    }
    
    const categoryIcons = {
      nails: '💅',
      hair: '💇',
      face: '✨',
      body: '💆',
      makeup: '💄',
      other: '🎨'
    };
    
    container.innerHTML = specialists.map(spec => `
      <div class="card" style="padding: 16px; border-radius: 12px;">
        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
          ${spec.photoUrl ? 
            `<img src="${spec.photoUrl}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">` :
            `<div style="width: 60px; height: 60px; border-radius: 50%; background: #f0e6ff; display: flex; align-items: center; justify-content: center; font-size: 28px;">👤</div>`
          }
          <div>
            <h4 style="margin: 0;">${spec.name}</h4>
            ${spec.position ? `<p style="margin: 4px 0 0 0; color: #7c3aed; font-size: 14px;">${spec.position}</p>` : ''}
          </div>
        </div>
        ${spec.description ? `<p style="font-size: 13px; color: #666; margin: 0 0 12px 0;">${spec.description}</p>` : ''}
        ${spec.services && spec.services.length > 0 ? `
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${spec.services.map(s => `
              <span style="background: #f8f4ff; border: 1px solid #e9d5ff; padding: 4px 10px; border-radius: 12px; font-size: 12px;">
                ${categoryIcons[s.category] || '🎨'} ${s.name} - ${s.bpPrice} BP
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Load salon specialists error:', error);
    container.innerHTML = '<p style="color: #666; text-align: center;">სპეციალისტები ჯერ არ არის დამატებული</p>';
  }
}

// Load salon gallery for public view
async function loadSalonPublicGallery(salonId) {
  const section = document.getElementById('salonGallerySection');
  const container = document.getElementById('salonPublicGallery');
  if (!section || !container) return;
  
  try {
    const response = await fetch(`/api/salon/${salonId}/gallery`);
    
    if (!response.ok) {
      section.style.display = 'none';
      return;
    }
    
    const gallery = await response.json();
    
    if (!gallery || gallery.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    
    container.innerHTML = gallery.map(item => `
      <div style="position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 1; cursor: pointer;" onclick="previewGalleryMedia('${item.url}', '${item.type}')">
        ${item.type === 'video' ? `
          <video src="${item.url}" style="width: 100%; height: 100%; object-fit: cover;"></video>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;">
            <span style="font-size: 36px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">▶️</span>
          </div>
        ` : `
          <img src="${item.url}" style="width: 100%; height: 100%; object-fit: cover;">
        `}
        ${item.caption ? `
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 16px 8px 8px; color: white; font-size: 12px;">
            ${item.caption}
          </div>
        ` : ''}
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Load salon gallery error:', error);
    section.style.display = 'none';
  }
}

// Открыть модальное окно бронирования
window.selectSalon = async function(salonName) {
  if (!currentUser) {
    showToast("გთხოვთ შეხვიდეთ სისტემაში", "error");
    navigate("client");
    return;
  }
  
  // Показываем модальное окно выбора слота
  showBookingModal(salonName);
};

// Открыть модальное окно бронирования со всеми салонами
window.openBookingModal = async function() {
  if (!currentUser) {
    showToast("გთხოვთ შეხვიდეთ სისტემაში", "error");
    navigate("client");
    return;
  }
  
  // Используем новую красивую модалку из TbilisiMap
  if (typeof TbilisiMap !== 'undefined' && TbilisiMap.openBookingFromProfile) {
    TbilisiMap.openBookingFromProfile();
  } else {
    // Fallback на старую модалку если TbilisiMap не доступен
    showBookingModal();
  }
};

// Показать модальное окно бронирования
async function showBookingModal(preSelectedSalon = null) {
  // Создаем модальное окно
  let modal = document.getElementById('bookingModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'bookingModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="modal-content booking-modal">
      <div class="modal-header">
        <h2>🗓️ ჯავშანი</h2>
        <button class="modal-close" onclick="closeBookingModal()">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="booking-steps">
          <div class="step active" id="step1Indicator">1. სალონი</div>
          <div class="step" id="step2Indicator">2. სლოტი</div>
          <div class="step" id="step3Indicator">3. დადასტურება</div>
        </div>
        
        <!-- Шаг 1: Выбор салона -->
        <div id="bookingStep1" class="booking-step">
          <h3>აირჩიეთ სალონი</h3>
          <div id="salonsList" class="salons-list">
            <p class="loading">იტვირთება...</p>
          </div>
        </div>
        
        <!-- Шаг 2: Выбор слота -->
        <div id="bookingStep2" class="booking-step" style="display: none;">
          <h3>აირჩიეთ თარიღი და დრო</h3>
          <div class="selected-salon-info" id="selectedSalonInfo"></div>
          
          <div class="date-filter">
            <label>თარიღი:</label>
            <input type="date" id="bookingDateFilter" onchange="filterSlotsByDate()">
          </div>
          
          <div id="availableSlots" class="slots-grid">
            <p class="loading">იტვირთება...</p>
          </div>
          
          <button class="btn btn-outline" onclick="goToBookingStep(1)">← უკან</button>
        </div>
        
        <!-- Шаг 3: Подтверждение -->
        <div id="bookingStep3" class="booking-step" style="display: none;">
          <h3>დადასტურება</h3>
          <div id="bookingConfirmation" class="confirmation-details"></div>
          
          <div class="booking-actions">
            <button class="btn btn-outline" onclick="goToBookingStep(2)">← უკან</button>
            <button class="btn btn-primary" onclick="confirmBooking()">დაჯავშნა</button>
          </div>
        </div>
        
        <!-- Успешное бронирование -->
        <div id="bookingSuccess" class="booking-step" style="display: none;">
          <div class="success-content">
            <div class="success-icon">✅</div>
            <h3>ჯავშანი წარმატებით შეიქმნა!</h3>
            <div id="bookingSuccessDetails"></div>
            <p class="qr-info">📧 QR კოდი გაგზავნილია თქვენს ელ-ფოსტაზე</p>
            <button class="btn btn-primary" onclick="closeBookingModal()">დახურვა</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  
  // Загружаем салоны
  await loadSalonsForBooking(preSelectedSalon);
}

// Загрузить список салонов для бронирования
async function loadSalonsForBooking(preSelectedSalon = null) {
  const container = document.getElementById('salonsList');
  
  try {
    const response = await fetch('/api/salons-with-owners');
    const salons = await response.json();
    
    if (!salons || salons.length === 0) {
      container.innerHTML = '<p class="no-data">სალონები არ მოიძებნა</p>';
      return;
    }
    
    container.innerHTML = salons.map(salon => `
      <div class="salon-option ${preSelectedSalon === salon.name ? 'selected' : ''}" 
           onclick="selectSalonForBooking('${salon._id}', '${salon.name}')">
        <div class="salon-option-info">
          <h4>${salon.name}</h4>
          <p>📍 ${salon.address || 'მისამართი არ არის მითითებული'}</p>
          ${salon.phone ? `<p>📞 ${salon.phone}</p>` : ''}
        </div>
        <span class="select-arrow">→</span>
      </div>
    `).join('');
    
    // Если салон предвыбран - автоматически переходим к следующему шагу
    if (preSelectedSalon) {
      const salon = salons.find(s => s.name === preSelectedSalon);
      if (salon) {
        selectSalonForBooking(salon._id, salon.name);
      }
    }
  } catch (error) {
    console.error('Load salons error:', error);
    container.innerHTML = '<p class="error">შეცდომა სალონების ჩატვირთვისას</p>';
  }
}

// Выбрать салон для бронирования
window.selectSalonForBooking = async function(salonId, salonName) {
  selectedSalonForBooking = { id: salonId, name: salonName };
  
  // Подсветить выбранный салон
  document.querySelectorAll('.salon-option').forEach(el => el.classList.remove('selected'));
  event?.target?.closest('.salon-option')?.classList.add('selected');
  
  // Переход на шаг 2
  goToBookingStep(2);
  
  // Загружаем слоты
  await loadAvailableSlots(salonId);
}

// Загрузить доступные слоты салона
async function loadAvailableSlots(salonId) {
  const container = document.getElementById('availableSlots');
  const infoEl = document.getElementById('selectedSalonInfo');
  
  if (infoEl) {
    infoEl.innerHTML = `<strong>📍 ${selectedSalonForBooking.name}</strong>`;
  }
  
  container.innerHTML = '<p class="loading">იტვირთება...</p>';
  
  try {
    const response = await fetch(`/api/salon/${salonId}/available-slots`);
    const slots = await response.json();
    
    availableSlotsData = slots;
    
    if (!slots || slots.length === 0) {
      container.innerHTML = `
        <div class="no-slots">
          <p>🕐 ხელმისაწვდომი სლოტები არ არის</p>
          <p class="hint">სალონს ჯერ არ დაუმატებია სლოტები</p>
        </div>
      `;
      return;
    }
    
    renderAvailableSlots(slots);
  } catch (error) {
    console.error('Load slots error:', error);
    container.innerHTML = '<p class="error">შეცდომა სლოტების ჩატვირთვისას</p>';
  }
}

// Рендер слотов
function renderAvailableSlots(slots) {
  const container = document.getElementById('availableSlots');
  
  // Группируем по дате
  const groupedByDate = {};
  slots.forEach(slot => {
    if (!groupedByDate[slot.date]) {
      groupedByDate[slot.date] = [];
    }
    groupedByDate[slot.date].push(slot);
  });
  
  let html = '';
  Object.keys(groupedByDate).sort().forEach(date => {
    const dateSlots = groupedByDate[date];
    const formattedDate = new Date(date).toLocaleDateString('ka-GE', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    
    html += `
      <div class="date-group">
        <h4 class="date-header">📅 ${formattedDate}</h4>
        <div class="time-slots">
          ${dateSlots.map(slot => `
            <div class="slot-card ${selectedSlotForBooking?._id === slot._id ? 'selected' : ''}" 
                 onclick="selectSlot('${slot._id}')">
              <div class="slot-time">🕐 ${slot.time}</div>
              <div class="slot-service">${slot.serviceName}</div>
              <div class="slot-price">${slot.bpPrice} BP</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html || '<p class="no-data">სლოტები არ მოიძებნა</p>';
}

// Фильтр слотов по дате
window.filterSlotsByDate = function() {
  const dateFilter = document.getElementById('bookingDateFilter')?.value;
  
  if (dateFilter) {
    const filtered = availableSlotsData.filter(s => s.date === dateFilter);
    renderAvailableSlots(filtered);
  } else {
    renderAvailableSlots(availableSlotsData);
  }
}

// Выбрать слот
window.selectSlot = function(slotId) {
  const slot = availableSlotsData.find(s => s._id === slotId);
  if (!slot) return;
  
  selectedSlotForBooking = slot;
  
  // Подсветить выбранный слот
  document.querySelectorAll('.slot-card').forEach(el => el.classList.remove('selected'));
  event?.target?.closest('.slot-card')?.classList.add('selected');
  
  // Переход на шаг 3
  goToBookingStep(3);
  
  // Показываем детали для подтверждения
  showBookingConfirmation();
}

// Показать детали бронирования для подтверждения
function showBookingConfirmation() {
  const container = document.getElementById('bookingConfirmation');
  const slot = selectedSlotForBooking;
  
  const formattedDate = new Date(slot.date).toLocaleDateString('ka-GE', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
  
  container.innerHTML = `
    <div class="confirmation-card">
      <div class="conf-item">
        <span class="conf-label">📍 სალონი:</span>
        <span class="conf-value">${selectedSalonForBooking.name}</span>
      </div>
      <div class="conf-item">
        <span class="conf-label">💅 პროცედურა:</span>
        <span class="conf-value">${slot.serviceName}</span>
      </div>
      <div class="conf-item">
        <span class="conf-label">📅 თარიღი:</span>
        <span class="conf-value">${formattedDate}</span>
      </div>
      <div class="conf-item">
        <span class="conf-label">🕐 დრო:</span>
        <span class="conf-value">${slot.time}</span>
      </div>
      <div class="conf-item">
        <span class="conf-label">⏱️ ხანგრძლივობა:</span>
        <span class="conf-value">${slot.duration || 30} წუთი</span>
      </div>
      <div class="conf-item price">
        <span class="conf-label">💰 ფასი:</span>
        <span class="conf-value">${slot.bpPrice} BP</span>
      </div>
      <div class="conf-balance">
        <span>თქვენი ბალანსი: <strong>${currentUser?.beautyPoints || 0} BP</strong></span>
        ${(currentUser?.beautyPoints || 0) < slot.bpPrice 
          ? '<span class="warning">⚠️ არასაკმარისი BP</span>' 
          : '<span class="ok">✓ საკმარისია</span>'
        }
      </div>
    </div>
  `;
}

// Переключение шагов
window.goToBookingStep = function(step) {
  // Скрываем все шаги
  document.querySelectorAll('.booking-step').forEach(el => el.style.display = 'none');
  
  // Показываем нужный шаг
  const stepEl = document.getElementById(`bookingStep${step}`);
  if (stepEl) stepEl.style.display = 'block';
  
  // Обновляем индикаторы
  document.querySelectorAll('.booking-steps .step').forEach((el, i) => {
    el.classList.toggle('active', i < step);
    el.classList.toggle('current', i === step - 1);
  });
}

// Подтвердить бронирование
window.confirmBooking = async function() {
  if (!selectedSlotForBooking) {
    showToast('აირჩიეთ სლოტი', 'error');
    return;
  }
  
  const token = localStorage.getItem('token');
  
  // Проверяем, это изменение существующего бронирования или новое
  if (window.bookingToChange) {
    // ИЗМЕНЕНИЕ существующего бронирования
    try {
      const response = await fetch(`/api/booking/${window.bookingToChange}/change`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newSlotId: selectedSlotForBooking._id
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Change failed');
      }
      
      // Очищаем флаг изменения
      window.bookingToChange = null;
      
      // Показываем успех
      showToast(result.message || 'ჯავშანი შეიცვალა!', 'success');
      closeBookingModal();
      loadUserBookings();
      
    } catch (error) {
      console.error('Change booking error:', error);
      showToast('შეცდომა: ' + error.message, 'error');
    }
    return;
  }
  
  // НОВОЕ бронирование
  // Проверка баланса
  if ((currentUser?.beautyPoints || 0) < selectedSlotForBooking.bpPrice) {
    showToast('არასაკმარისი BP. შეიძინეთ პაკეტი.', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/booking/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        slotId: selectedSlotForBooking._id
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Booking failed');
    }
    
    // Обновляем баланс пользователя
    if (result.newBalance !== undefined) {
      currentUser.beautyPoints = result.newBalance;
      localStorage.setItem('user', JSON.stringify(currentUser));
      updateAuthUI();
    }
    
    // Показываем успех
    showBookingSuccess(result.booking);
    
  } catch (error) {
    console.error('Booking error:', error);
    showToast('შეცდომა: ' + error.message, 'error');
  }
}

// Показать успешное бронирование
function showBookingSuccess(booking) {
  // Скрываем все шаги
  document.querySelectorAll('.booking-step').forEach(el => el.style.display = 'none');
  
  // Показываем успех
  const successEl = document.getElementById('bookingSuccess');
  if (successEl) successEl.style.display = 'block';
  
  const detailsEl = document.getElementById('bookingSuccessDetails');
  if (detailsEl) {
    detailsEl.innerHTML = `
      <div class="success-details">
        <p><strong>კოდი:</strong> <span class="booking-code">${booking.bookingCode}</span></p>
        <p><strong>სალონი:</strong> ${booking.salonName}</p>
        <p><strong>პროცედურა:</strong> ${booking.serviceName}</p>
        <p><strong>თარიღი:</strong> ${booking.date}</p>
        <p><strong>დრო:</strong> ${booking.time}</p>
      </div>
    `;
  }
  
  // Сбрасываем выбор
  selectedSalonForBooking = null;
  selectedSlotForBooking = null;
  availableSlotsData = [];
}

// Закрыть модальное окно бронирования
window.closeBookingModal = function() {
  const modal = document.getElementById('bookingModal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  selectedSalonForBooking = null;
  selectedSlotForBooking = null;
  availableSlotsData = [];
  
  // Обновляем профиль если открыт
  if (currentUser) {
    showClientProfile();
  }
}

// ======================================
// QR-СКАНЕР ДЛЯ САЛОНОВ
// ======================================

// Открыть QR сканер с камерой
window.openQRScanner = function() {
  let modal = document.getElementById('qrScannerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'qrScannerModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="modal-content qr-scanner-modal" style="max-width: 500px;">
      <div class="modal-header">
        <h2>📷 QR სკანერი</h2>
        <button class="modal-close" onclick="closeQRScanner()">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- კამერის სექცია -->
        <div id="cameraSection" style="margin-bottom: 20px;">
          <div id="qrVideoContainer" style="position: relative; width: 100%; max-width: 400px; margin: 0 auto; background: #000; border-radius: 12px; overflow: hidden;">
            <video id="qrVideo" style="width: 100%; display: block;" playsinline></video>
            <div id="qrScanOverlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 200px; height: 200px; border: 3px solid #22c55e; border-radius: 12px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);"></div>
          </div>
          <p style="text-align: center; margin-top: 12px; color: #666; font-size: 14px;">მიანიშნეთ კამერა QR კოდზე</p>
          <div id="cameraError" style="display: none; text-align: center; padding: 20px; color: #dc2626;"></div>
        </div>
        
        <!-- ან ხელით შეყვანა -->
        <div style="text-align: center; margin: 16px 0; color: #94a3b8; font-size: 14px;">ან შეიყვანეთ კოდი ხელით:</div>
        
        <div class="qr-input-section" style="display: flex; gap: 8px;">
          <input type="text" id="manualBookingCode" class="form-input" placeholder="BP-XXXXXX-XXXXXX" style="flex: 1; text-transform: uppercase;" oninput="this.value = this.value.toUpperCase()">
          <button class="btn btn-primary" onclick="verifyBookingCode()">შემოწმება</button>
        </div>
        
        <div id="qrVerificationResult" class="verification-result" style="margin-top: 20px;"></div>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  
  // დავიწყოთ კამერის სკანირება
  startQRScanning();
};

// QR სკანირების დაწყება
let qrScannerStream = null;
let qrScanInterval = null;

async function startQRScanning() {
  const video = document.getElementById('qrVideo');
  const errorDiv = document.getElementById('cameraError');
  const container = document.getElementById('qrVideoContainer');
  
  if (!video) return;
  
  try {
    // მოვთხოვოთ კამერაზე წვდომა
    qrScannerStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } // უკანა კამერა მობილურზე
    });
    
    video.srcObject = qrScannerStream;
    await video.play();
    
    // დავიწყოთ სკანირება
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    qrScanInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // გამოვიყენოთ jsQR ბიბლიოთეკა
        if (typeof jsQR !== 'undefined') {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            // QR კოდი ნაპოვნია!
            handleScannedQR(code.data);
          }
        }
      }
    }, 200); // ყოველ 200ms სკანირება
    
  } catch (error) {
    console.error('Camera error:', error);
    if (errorDiv) {
      errorDiv.style.display = 'block';
      errorDiv.innerHTML = `
        <p>📵 კამერაზე წვდომა ვერ მოხერხდა</p>
        <p style="font-size: 12px; margin-top: 8px;">გთხოვთ შეიყვანოთ კოდი ხელით ქვემოთ</p>
      `;
    }
    if (container) container.style.display = 'none';
  }
}

// QR კოდის დამუშავება
function handleScannedQR(data) {
  console.log('QR Scanned:', data);
  
  // შევაჩეროთ სკანირება
  stopQRScanning();
  
  // ამოვიღოთ კოდი URL-დან თუ არის
  let bookingCode = data;
  
  // თუ URL არის, ამოვიღოთ კოდი
  if (data.includes('/api/booking/verify/')) {
    const parts = data.split('/api/booking/verify/');
    bookingCode = parts[1] || data;
  } else if (data.includes('BP-')) {
    // თუ პირდაპირ კოდია
    const match = data.match(/BP-[A-Z0-9-]+/i);
    if (match) bookingCode = match[0];
  }
  
  // ჩავსვათ input-ში
  const input = document.getElementById('manualBookingCode');
  if (input) {
    input.value = bookingCode.toUpperCase();
  }
  
  // ვიზუალური უკუკავშირი
  showToast('✅ QR კოდი ამოცნობილია!', 'success');
  
  // ავტომატურად შევამოწმოთ
  setTimeout(() => {
    verifyBookingCode();
  }, 500);
}

// სკანირების შეჩერება
function stopQRScanning() {
  if (qrScanInterval) {
    clearInterval(qrScanInterval);
    qrScanInterval = null;
  }
  if (qrScannerStream) {
    qrScannerStream.getTracks().forEach(track => track.stop());
    qrScannerStream = null;
  }
}

// მოდალის დახურვა
window.closeQRScanner = function() {
  stopQRScanning();
  const modal = document.getElementById('qrScannerModal');
  if (modal) modal.style.display = 'none';
};

// Проверить код бронирования
window.verifyBookingCode = async function() {
  const code = document.getElementById('manualBookingCode')?.value?.trim();
  const resultEl = document.getElementById('qrVerificationResult');
  
  if (!code) {
    showToast('შეიყვანეთ კოდი', 'error');
    return;
  }
  
  resultEl.innerHTML = '<p class="loading">მოწმდება...</p>';
  
  try {
    const response = await fetch(`/api/booking/verify/${code}`);
    const result = await response.json();
    
    if (result.valid) {
      resultEl.innerHTML = `
        <div class="verification-success">
          <div class="result-icon">✅</div>
          <h3>ჯავშანი მოქმედია!</h3>
          <div class="client-info">
            <p><strong>კლიენტი:</strong> ${result.booking.clientName}</p>
            <p><strong>ელ-ფოსტა:</strong> ${result.booking.clientEmail}</p>
            <p><strong>ტელეფონი:</strong> ${result.booking.clientPhone || '-'}</p>
            <p><strong>პროცედურა:</strong> ${result.booking.serviceName}</p>
            <p><strong>დრო:</strong> ${result.booking.time}</p>
          </div>
          <button class="btn btn-success" onclick="confirmBookingBySalon('${result.booking.bookingCode}')">
            დადასტურება
          </button>
        </div>
      `;
    } else {
      resultEl.innerHTML = `
        <div class="verification-error">
          <div class="result-icon">❌</div>
          <h3>${result.message}</h3>
        </div>
      `;
    }
  } catch (error) {
    console.error('Verification error:', error);
    resultEl.innerHTML = '<p class="error">შეცდომა შემოწმებისას</p>';
  }
}

// Подтвердить бронирование салоном
window.confirmBookingBySalon = async function(bookingCode) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/confirm-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookingCode })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showToast('ჯავშანი დადასტურებულია! ✅', 'success');
      
      const resultEl = document.getElementById('qrVerificationResult');
      if (resultEl) {
        resultEl.innerHTML = `
          <div class="verification-success confirmed">
            <div class="result-icon">✅</div>
            <h3>დადასტურებულია!</h3>
            <p>კლიენტი: ${result.booking.clientName}</p>
            <p>პროცედურა: ${result.booking.serviceName}</p>
            <button class="btn btn-outline" onclick="completeBookingBySalon('${bookingCode}')">
              პროცედურა დასრულდა
            </button>
          </div>
        `;
      }
    } else {
      showToast(result.message || 'შეცდომა', 'error');
    }
  } catch (error) {
    console.error('Confirm error:', error);
    showToast('შეცდომა: ' + error.message, 'error');
  }
}

// Завершить бронирование (услуга оказана)
window.completeBookingBySalon = async function(bookingCode) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/complete-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookingCode })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showToast('პროცედურა დასრულდა! ✅', 'success');
      closeQRScanner();
      
      // Обновляем таблицу бронирований
      if (typeof loadSalonBookings === 'function') {
        loadSalonBookings();
      }
    } else {
      showToast(result.message || 'შეცდომა', 'error');
    }
  } catch (error) {
    console.error('Complete error:', error);
    showToast('შეცდომა: ' + error.message, 'error');
  }
}

// Закрыть QR сканер
window.closeQRScanner = function() {
  const modal = document.getElementById('qrScannerModal');
  if (modal) modal.style.display = 'none';
}

window.copyReferralCode = function() {
  const codeEl = document.getElementById("referralCode");
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.textContent);
    showToast("კოდი დაკოპირებულია!", "success");
  }
};

// ======================================
// ВЛАДЕЛЕЦ САЛОНА
// ======================================

function showSalonLogin() {
  document.getElementById("salonLoginCard")?.style.setProperty("display", "block");
  document.getElementById("salonDashboard")?.style.setProperty("display", "none");
}

async function showSalonDashboard() {
  document.getElementById("salonLoginCard")?.style.setProperty("display", "none");
  document.getElementById("salon2FACard")?.style.setProperty("display", "none");
  document.getElementById("salonDashboard")?.style.setProperty("display", "block");
  
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const nameEl = document.getElementById("dashboardSalonName");
    const emailEl = document.getElementById("dashboardSalonEmail");
    
    if (nameEl) nameEl.textContent = '🏢 ' + (user.salonName || user.firstName || "სალონი");
    if (emailEl) emailEl.textContent = user.email || "";
    
    // Инициализируем первый таб
    const content = document.getElementById('salonTabContent');
    if (content && typeof renderSalonSlotsTabNew === 'function') {
      renderSalonSlotsTabNew(content);
    }
    
    await loadSalonSlots();
    await loadSalonBookings();
    await loadSalonStats();
  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

async function loadSalonSlots() {
  const tbody = document.querySelector("#salonSlotsTable tbody");
  if (!tbody) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/my-slots', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const slots = await response.json();
    
    if (!slots || slots.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">სლოტები არ არის</td></tr>';
      return;
    }
    
    tbody.innerHTML = slots.map(slot => `
      <tr>
        <td>${slot.serviceName}</td>
        <td>${slot.date}</td>
        <td>${slot.time}</td>
        <td>${slot.bpPrice} BP</td>
        <td>
          <span class="status-badge ${slot.isBooked ? 'status-booked' : 'status-available'}">
            ${slot.isBooked ? 'დაჯავშნილი' : 'თავისუფალი'}
          </span>
        </td>
        <td>
          ${!slot.isBooked ? `<button class="btn-icon btn-danger" onclick="deleteSalonSlot('${slot._id}')">🗑️</button>` : '-'}
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Load slots error:', error);
    tbody.innerHTML = '<tr><td colspan="6">შეცდომა</td></tr>';
  }
}

async function loadSalonBookings() {
  const tbody = document.querySelector("#salonBookingsTable tbody");
  if (!tbody) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/my-bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const bookings = await response.json();
    
    if (!bookings || bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">ჯავშნები არ არის</td></tr>';
      return;
    }
    
    // კოდი არ ჩანს სალონისთვის - მხოლოდ კლიენტს აქვს
    tbody.innerHTML = bookings.map(b => {
      // userId შეიძლება იყოს populated ობიექტი ან სტრინგი
      const clientId = b.userId?._id || b.userId;
      const clientName = b.clientName || (b.userId?.firstName ? `${b.userId.firstName} ${b.userId.lastName || ''}` : 'კლიენტი');
      const clientPhone = b.clientPhone || b.userId?.phone || '-';
      return `
      <tr>
        <td>${b.date}</td>
        <td>${b.time}</td>
        <td>${b.serviceName}</td>
        <td>
          ${clientName}
          <button class="chat-btn-mini" onclick="startChatWithClient('${clientId}', '${clientName.replace(/'/g, '')}')" title="მიწერა">
            💬
          </button>
        </td>
        <td>${clientPhone}</td>
        <td><span class="status-badge status-${b.status}">${getBookingStatusText(b.status)}</span></td>
      </tr>
    `;
    }).join('');
  } catch (error) {
    console.error('Load bookings error:', error);
    tbody.innerHTML = '<tr><td colspan="6">შეცდომა</td></tr>';
  }
}

// სალონიდან კლიენტთან ჩატის დაწყება
window.startChatWithClient = function(clientId, clientName) {
  if (!clientId) {
    showToast('კლიენტის ID ვერ მოიძებნა', 'error');
    return;
  }
  
  // შევქმნათ მესენჯერის პანელი თუ არ არსებობს
  if (!document.getElementById('messengerPanel')) {
    if (typeof createMessengerPanel === 'function') {
      createMessengerPanel();
    } else if (typeof createMessengerButton === 'function') {
      createMessengerButton();
    }
  }
  
  // გავხსნათ მესენჯერი და ჩატი
  if (typeof toggleMessenger === 'function') {
    const messengerPanel = document.getElementById('messengerPanel');
    if (!messengerPanel || !messengerPanel.classList.contains('open')) {
      toggleMessenger();
    }
    setTimeout(() => {
      if (typeof openChat === 'function') {
        openChat(clientId, clientName.replace(/'/g, ''), '');
      }
    }, 400);
  } else {
    showToast('მესენჯერი მიუწვდომელია', 'error');
  }
};

// კლიენტიდან სალონთან ჩატის დაწყება
window.startChatWithSalon = function(salonId, salonName) {
  if (!salonId) {
    showToast('სალონის ID ვერ მოიძებნა', 'error');
    return;
  }
  
  // შევქმნათ მესენჯერის პანელი თუ არ არსებობს
  if (!document.getElementById('messengerPanel')) {
    if (typeof createMessengerPanel === 'function') {
      createMessengerPanel();
    } else if (typeof createMessengerButton === 'function') {
      createMessengerButton();
    }
  }
  
  // გავხსნათ მესენჯერი და ჩატი
  if (typeof toggleMessenger === 'function') {
    const messengerPanel = document.getElementById('messengerPanel');
    if (!messengerPanel || !messengerPanel.classList.contains('open')) {
      toggleMessenger();
    }
    setTimeout(() => {
      if (typeof openChat === 'function') {
        openChat(salonId, salonName.replace(/'/g, ''), '');
      }
    }, 400);
  } else {
    showToast('მესენჯერი მიუწვდომელია', 'error');
  }
};

function getBookingStatusText(status) {
  const map = {
    pending: "მოლოდინში",
    confirmed: "დადასტურებული",
    completed: "დასრულებული",
    cancelled: "გაუქმებული",
    'no-show': "არ გამოცხადდა"
  };
  return map[status] || status;
}

async function loadSalonStats() {
  const stats = await fetchSalonStatistics();
  
  const el_statTotalSlots = document.getElementById("statTotalSlots"); if (el_statTotalSlots) el_statTotalSlots.textContent = stats.totalSlots || 0;
  const el_statBookedSlots = document.getElementById("statBookedSlots"); if (el_statBookedSlots) el_statBookedSlots.textContent = stats.bookedSlots || 0;
  const el_statTotalBookings = document.getElementById("statTotalBookings"); if (el_statTotalBookings) el_statTotalBookings.textContent = stats.totalBookings || 0;
  const el_statTotalBP = document.getElementById("statTotalBP"); if (el_statTotalBP) el_statTotalBP.textContent = (stats.totalBPSpent || 0) + " BP";
}

window.addSlots = async function() {
  const serviceName = document.getElementById("slotServiceName")?.value;
  const serviceCategory = document.getElementById("slotCategory")?.value;
  const date = document.getElementById("slotDate")?.value;
  const times = document.getElementById("slotTimes")?.value;
  const bpPrice = document.getElementById("slotBpPrice")?.value || 10;
  
  // Специалист (опционально)
  const specialistSelect = document.getElementById("slotSpecialist");
  const specialistId = specialistSelect?.value || null;
  const specialistName = specialistSelect?.selectedOptions[0]?.dataset?.name || null;
  
  if (!serviceName || !date || !times) {
    showToast("შეავსეთ ყველა ველი", "error");
    return;
  }
  
  // Валидация категории
  if (!serviceCategory) {
    showToast("აირჩიეთ კატეგორია", "error");
    return;
  }
  
  // Валидация даты - не в прошлом
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slotDate = new Date(date);
  slotDate.setHours(0, 0, 0, 0);
  
  if (slotDate < today) {
    showToast("წარსული თარიღის სლოტის შექმნა შეუძლებელია", "error");
    return;
  }
  
  const timesArray = times.split(",").map(t => t.trim()).filter(t => t);
  
  if (timesArray.length === 0) {
    showToast("შეიყვანეთ დრო (მაგ: 10:00, 11:00, 12:00)", "error");
    return;
  }
  
  showConfirm(`დაემატოს ${timesArray.length} სლოტი ${date} თარიღზე?`, async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/salon-owner/add-slots-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceName,
          serviceCategory,
          date,
          times: timesArray,
          bpPrice: parseInt(bpPrice),
          specialistId,
          specialistName
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showToast(result.message || "სლოტები დამატებულია", "success");
        
        // Очищаем форму
        document.getElementById("slotServiceName").value = "";
        document.getElementById("slotCategory").value = "";
        document.getElementById("slotDate").value = "";
        document.getElementById("slotTimes").value = "";
        document.getElementById("slotBpPrice").value = "10";
        if (specialistSelect) specialistSelect.value = "";
        
        loadSalonSlots();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      showToast("შეცდომა: " + error.message, "error");
    }
  });
};

window.deleteSalonSlot = async function(id) {
  showConfirm("ნამდვილად წაშლა სლოტი?", async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/salon-owner/slots/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showToast(result.message || "სლოტი წაშლილია", "success");
        loadSalonSlots();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      showToast("შეცდომა: " + error.message, "error");
    }
  });
};

window.loginSalon = async function() {
  const email = document.getElementById("salonEmail")?.value?.trim();
  const password = document.getElementById("salonPassword")?.value;
  
  if (!email || !password) {
    showToast("შეიყვანეთ ელ-ფოსტა და პაროლი", "error");
    return;
  }
  
  try {
    const result = await loginUser({ email, password });
    showToast(result.message || "კოდი გაგზავნილია თქვენს ელ-ფოსტაზე", "success");
    
    // Show 2FA card
    const twoFACard = document.getElementById("salon2FACard");
    if (twoFACard) {
      twoFACard.style.display = "block";
    }
  } catch (error) {
    showToast("შეცდომა: " + error.message, "error");
  }
};

window.verifySalon2FA = async function() {
  const email = document.getElementById("salonEmail")?.value?.trim();
  const code = document.getElementById("salon2FACode")?.value?.trim();
  
  if (!email || !code) {
    showToast("შეიყვანეთ კოდი", "error");
    return;
  }
  
  try {
    const result = await verify2FA(email, code);
    if (result.token && result.user) {
      // Проверяем что это салон
      if (result.user.userType !== 'salon') {
        showToast("ეს ანგარიში არ არის სალონის ანგარიში", "error");
        return;
      }
      
      currentUser = result.user;
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      updateAuthUI();
      showSalonDashboard();
      showToast("წარმატებით შეხვედით!", "success");
    }
  } catch (error) {
    showToast("შეცდომა: " + error.message, "error");
  }
};

window.logoutSalon = function() {
  // წავშალოთ ყველა ტოკენი და მომხმარებლის მონაცემები
  localStorage.removeItem("token");
  localStorage.removeItem("salonToken");
  localStorage.removeItem("user");
  localStorage.removeItem("currentUser");
  currentUser = null;
  
  // განვაახლოთ UI
  updateAuthUI();
  
  // გამოვაჩინოთ ლოგინის ფორმა
  const loginCard = document.getElementById("salonLoginCard");
  const dashboard = document.getElementById("salonDashboard");
  
  if (loginCard) loginCard.style.display = "block";
  if (dashboard) dashboard.style.display = "none";
  
  // გავასუფთავოთ ველები
  const salonEmail = document.getElementById("salonEmail");
  const salonPassword = document.getElementById("salonPassword");
  const salon2FACode = document.getElementById("salon2FACode");
  const salon2FACard = document.getElementById("salon2FACard");
  
  if (salonEmail) salonEmail.value = "";
  if (salonPassword) salonPassword.value = "";
  if (salon2FACode) salon2FACode.value = "";
  if (salon2FACard) salon2FACard.style.display = "none";
  
  showToast("გამოსვლა წარმატებით!", "success");
};

// ======================================
// УТИЛИТЫ
// ======================================

window.closeModal = function() {
  document.querySelectorAll(".modal").forEach(m => {
    m.style.display = "none";
    m.classList.remove("active");
  });
};

window.showContact = function() {
  showToast("📧 Email: info@beautypass.ge\n📞 ტელეფონი: +995 XXX XX XX XX\n📍 მისამართი: თბილისი, საქართველო", "success");
};

// ===== МОДАЛЬНЫЕ ФУНКЦИИ =====

window.showAboutModal = function() {
  const modal = document.getElementById('aboutModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
};

window.closeAboutModal = function() {
  const modal = document.getElementById('aboutModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
};

window.backToLogin = function() {
  showLoginForm();
};

// ======================================
// АДМИН ПАНЕЛЬ
// ======================================

// Текущий таб админки
let adminCurrentTab = 'stats';

// API вызов с токеном
async function adminApiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API Error');
  }
  
  return data;
}

// Логин админа
window.loginAdmin = async function() {
  const email = document.getElementById('adminEmail')?.value;
  const password = document.getElementById('adminPassword')?.value;
  
  if (!email || !password) {
    showToast('შეიყვანეთ ელფოსტა და პაროლი', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    showToast('კოდი გაგზავნილია თქვენს ელფოსტაზე', 'success');
    
    // Показываем 2FA input
    showAdmin2FAInput(email);
    
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Показать 2FA input для админа
function showAdmin2FAInput(email) {
  const loginCard = document.getElementById('adminLoginCard');
  if (!loginCard) return;
  
  loginCard.innerHTML = `
    <div class="card-header">
      <h2>👑 Admin Panel</h2>
      <p>შეიყვანეთ 2FA კოდი</p>
    </div>
    <div class="auth-form">
      <div class="form-group">
        <input type="text" id="admin2FACode" class="form-input text-center" 
               placeholder="123456" maxlength="6" inputmode="numeric" 
               style="font-size: 1.5rem; letter-spacing: 0.5rem; text-align: center;">
      </div>
      <div class="form-actions">
        <button class="btn btn-primary btn-block" onclick="verifyAdmin2FA('${email}')">
          დადასტურება / Verify
        </button>
      </div>
    </div>
  `;
}

// Верификация 2FA кода админа
window.verifyAdmin2FA = async function(email) {
  const code = document.getElementById('admin2FACode')?.value;
  
  if (!code || code.length !== 6) {
    showToast('შეიყვანეთ 6-ციფრიანი კოდი', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/confirm-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    // Проверяем является ли пользователь админом
    if (!data.user?.isAdmin) {
      showToast('თქვენ არ ხართ ადმინისტრატორი', 'error');
      return;
    }
    
    // Сохраняем токен и юзера
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    currentUser = data.user;
    
    showToast('წარმატებით შეხვედით!', 'success');
    
    // Показываем dashboard
    showAdminDashboard(data.user);
    
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Показать dashboard админа
function showAdminDashboard(user) {
  const loginCard = document.getElementById('adminLoginCard');
  const dashboard = document.getElementById('adminDashboard');
  
  if (loginCard) loginCard.style.display = 'none';
  if (dashboard) {
    dashboard.style.display = 'block';
    
    // Обновляем email админа
    const emailDisplay = dashboard.querySelector('#adminEmailDisplay');
    if (emailDisplay) {
      emailDisplay.textContent = user?.email || 'Admin';
    }
  }
  
  // Загружаем статистику по умолчанию
  switchAdminTab('stats');
}

// Выход админа
window.logoutAdmin = function() {
  localStorage.removeItem('adminUser');
  
  const loginCard = document.getElementById('adminLoginCard');
  const dashboard = document.getElementById('adminDashboard');
  
  if (dashboard) dashboard.style.display = 'none';
  if (loginCard) {
    loginCard.style.display = 'block';
    loginCard.innerHTML = `
      <div class="card-header">
        <h2>👑 Admin Panel</h2>
        <p>ადმინისტრატორის პანელი / Administrator Panel</p>
      </div>
      <form class="auth-form" id="adminAuthForm" onsubmit="return false;">
        <div class="form-group">
          <label for="adminEmail">Email</label>
          <input type="email" id="adminEmail" class="form-input" placeholder="admin@beautypass.ge" required>
        </div>
        <div class="form-group">
          <label for="adminPassword">Password</label>
          <input type="password" id="adminPassword" class="form-input" placeholder="••••••••" required>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-primary btn-block" onclick="loginAdmin()">Sign In</button>
        </div>
      </form>
    `;
  }
  
  showToast('გამოსვლა წარმატებით!', 'success');
};

// Переключение табов
window.switchAdminTab = async function(tab) {
  adminCurrentTab = tab;
  
  // Обновляем кнопки табов
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.admin-tab[onclick*="${tab}"]`)?.classList.add('active');
  
  const content = document.getElementById('adminTabContent');
  if (!content) return;
  
  content.innerHTML = '<div class="loading-spinner">იტვირთება...</div>';
  
  try {
    switch (tab) {
      case 'stats':
        await loadAdminStats(content);
        break;
      case 'users':
        await loadAdminUsers(content);
        break;
      case 'salons':
        await loadAdminSalons(content);
        break;
      case 'salonFinance':
        await loadAdminSalonFinance(content);
        break;
      case 'services':
        await loadAdminServices(content);
        break;
      case 'bookings':
        await loadAdminBookings(content);
        break;
      case 'tariffs':
        await loadAdminTariffs(content);
        break;
      default:
        content.innerHTML = '<p>Tab not found</p>';
    }
  } catch (error) {
    console.error('Tab load error:', error);
    content.innerHTML = `<p class="error" style="color: #e74c3c; padding: 20px;">შეცდომა: ${error.message}</p>`;
  }
};

// Загрузка статистики
async function loadAdminStats(container) {
  const stats = await adminApiCall('/api/admin/stats');
  
  container.innerHTML = `
    <div class="admin-stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${stats.totalUsers || 0}</div>
        <div class="stat-label">სულ მომხმარებელი</div>
        <div class="stat-sub">+${stats.newUsersThisWeek || 0} ამ კვირაში</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏢</div>
        <div class="stat-value">${stats.totalSalons || 0}</div>
        <div class="stat-label">სალონები</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${stats.totalBookings || 0}</div>
        <div class="stat-label">ჯავშნები</div>
        <div class="stat-sub">+${stats.bookingsThisWeek || 0} ამ კვირაში</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💅</div>
        <div class="stat-value">${stats.totalServices || 0}</div>
        <div class="stat-label">სერვისები</div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-icon">💰</div>
        <div class="stat-value">${stats.totalRevenue || 0}₾</div>
        <div class="stat-label">შემოსავალი</div>
      </div>
    </div>
  `;
}

// Загрузка пользователей
async function loadAdminUsers(container) {
  const users = await adminApiCall('/api/admin/users');
  
  container.innerHTML = `
    <div class="admin-table-header">
      <h3>👥 მომხმარებლები (${users.length})</h3>
      <div class="admin-actions">
        <input type="text" id="userSearch" placeholder="ძებნა..." class="admin-search" oninput="filterAdminUsers()">
      </div>
    </div>
    <div class="admin-table-wrapper">
      <table class="admin-table" id="usersTable">
        <thead>
          <tr>
            <th>სახელი</th>
            <th>ელფოსტა</th>
            <th>ტელეფონი</th>
            <th>ტიპი</th>
            <th>ბალანსი</th>
            <th>სტატუსი</th>
            <th>მოქმედება</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr data-id="${u._id}" class="${u.isBanned ? 'banned' : ''}">
              <td>${u.firstName || ''} ${u.lastName || ''}</td>
              <td>${u.email}</td>
              <td>${u.phone || '-'}</td>
              <td><span class="badge badge-${u.userType}">${u.userType}</span></td>
              <td>${u.balance || 0}₾</td>
              <td>
                ${u.isAdmin ? '<span class="badge badge-admin">Admin</span>' : ''}
                ${u.isBanned ? '<span class="badge badge-banned">Banned</span>' : '<span class="badge badge-active">Active</span>'}
              </td>
              <td>
                <button class="btn btn-sm btn-outline" onclick="editAdminUser('${u._id}')">✏️</button>
                ${!u.isAdmin ? `
                  <button class="btn btn-sm ${u.isBanned ? 'btn-success' : 'btn-warning'}" onclick="toggleBanUser('${u._id}')">
                    ${u.isBanned ? '✅' : '🚫'}
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deleteAdminUser('${u._id}')">🗑️</button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Фильтр пользователей
window.filterAdminUsers = function() {
  const search = document.getElementById('userSearch')?.value.toLowerCase();
  const rows = document.querySelectorAll('#usersTable tbody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
};

// Редактирование пользователя
window.editAdminUser = async function(userId) {
  try {
    const users = await adminApiCall('/api/admin/users');
    const user = users.find(u => u._id === userId);
    
    if (!user) {
      showToast('მომხმარებელი ვერ მოიძებნა', 'error');
      return;
    }
    
    showAdminModal('მომხმარებლის რედაქტირება', `
      <form id="editUserForm">
        <div class="form-group">
          <label>სახელი</label>
          <input type="text" name="firstName" value="${user.firstName || ''}" class="form-input">
        </div>
        <div class="form-group">
          <label>გვარი</label>
          <input type="text" name="lastName" value="${user.lastName || ''}" class="form-input">
        </div>
        <div class="form-group">
          <label>ტელეფონი</label>
          <input type="tel" name="phone" value="${user.phone || ''}" class="form-input">
        </div>
        <div class="form-group">
          <label>ბალანსი (₾)</label>
          <input type="number" name="balance" value="${user.balance || 0}" class="form-input">
        </div>
        <div class="form-group">
          <label>ტიპი</label>
          <select name="userType" class="form-input">
            <option value="client" ${user.userType === 'client' ? 'selected' : ''}>Client</option>
            <option value="salon" ${user.userType === 'salon' ? 'selected' : ''}>Salon</option>
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="isAdmin" ${user.isAdmin ? 'checked' : ''}> ადმინისტრატორი
          </label>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="saveAdminUser('${userId}')">შენახვა</button>
          <button type="button" class="btn btn-outline" onclick="closeAdminModal()">გაუქმება</button>
        </div>
      </form>
    `);
    
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Сохранение пользователя
window.saveAdminUser = async function(userId) {
  try {
    const form = document.getElementById('editUserForm');
    const formData = new FormData(form);
    
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      balance: parseFloat(formData.get('balance')) || 0,
      userType: formData.get('userType'),
      isAdmin: form.querySelector('[name="isAdmin"]').checked
    };
    
    await adminApiCall(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    showToast('მომხმარებელი განახლდა!', 'success');
    closeAdminModal();
    loadAdminUsers(document.getElementById('adminTabContent'));
    
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Бан/разбан пользователя
window.toggleBanUser = async function(userId) {
  if (!confirm('დარწმუნებული ხართ?')) return;
  
  try {
    await adminApiCall(`/api/admin/users/${userId}/toggle-ban`, { method: 'PUT' });
    showToast('სტატუსი შეიცვალა!', 'success');
    loadAdminUsers(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Удаление пользователя
window.deleteAdminUser = async function(userId) {
  if (!confirm('დარწმუნებული ხართ? ეს მოქმედება შეუქცევადია!')) return;
  
  try {
    await adminApiCall(`/api/admin/users/${userId}`, { method: 'DELETE' });
    showToast('მომხმარებელი წაიშალა!', 'success');
    loadAdminUsers(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Загрузка салонов
async function loadAdminSalons(container) {
  const salons = await adminApiCall('/api/admin/salons');
  let salonUsers = [];
  try {
    salonUsers = await adminApiCall('/api/admin/salon-users');
  } catch (e) {
    console.log('Could not load salon users');
  }
  
  container.innerHTML = `
    <div class="admin-table-header">
      <h3>🏢 სალონები (${salons.length})</h3>
      <div class="admin-actions">
        <button class="btn btn-primary" onclick="showCreateSalonUserForm()">+ სალონის მომხმარებლის შექმნა</button>
        <button class="btn btn-outline" onclick="showAddSalonForm()">+ სალონის დამატება</button>
      </div>
    </div>
    
    <!-- Форма создания салона-пользователя (скрыта по умолчанию) -->
    <div id="createSalonUserForm" class="admin-form-card" style="display: none; margin-bottom: 24px; padding: 24px; background: #f8f9fa; border-radius: 12px; border: 2px dashed #ddd;">
      <h4 style="margin-bottom: 16px;">🏢 ახალი სალონის მომხმარებლის შექმნა</h4>
      <p style="color: #666; margin-bottom: 16px;">შექმენით სალონი ელ-ფოსტით და პაროლით, რომ მათ შეეძლოთ შესვლა</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
        <div class="form-group">
          <label>ელ-ფოსტა *</label>
          <input type="email" id="newSalonEmail" class="form-input" placeholder="salon@example.com">
        </div>
        <div class="form-group">
          <label>პაროლი *</label>
          <input type="password" id="newSalonPassword" class="form-input" placeholder="მინ. 8 სიმბოლო">
        </div>
        <div class="form-group">
          <label>სალონის სახელი *</label>
          <input type="text" id="newSalonName" class="form-input" placeholder="მაგ: Beauty Studio">
        </div>
        <div class="form-group">
          <label>მისამართი</label>
          <input type="text" id="newSalonAddress" class="form-input" placeholder="თბილისი, ...">
        </div>
        <div class="form-group">
          <label>ტელეფონი</label>
          <input type="tel" id="newSalonPhone" class="form-input" placeholder="+995 5XX XXX XXX">
        </div>
        <div class="form-group">
          <label>აღწერა</label>
          <input type="text" id="newSalonDescription" class="form-input" placeholder="მოკლე აღწერა">
        </div>
      </div>
      <div style="margin-top: 16px; display: flex; gap: 12px;">
        <button class="btn btn-primary" onclick="createSalonUser()">შექმნა</button>
        <button class="btn btn-outline" onclick="document.getElementById('createSalonUserForm').style.display='none'">გაუქმება</button>
      </div>
    </div>
    
    <!-- Таблица салонов-пользователей -->
    ${salonUsers.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">👤 სალონის მომხმარებლები (შესასვლელით)</h4>
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>სახელი</th>
              <th>ელ-ფოსტა</th>
              <th>ტელეფონი</th>
              <th>მისამართი</th>
              <th>შექმნილია</th>
            </tr>
          </thead>
          <tbody>
            ${salonUsers.map(s => `
              <tr>
                <td><strong>${s.salonName || '-'}</strong></td>
                <td>${s.email || '-'}</td>
                <td>${s.phone || '-'}</td>
                <td>${s.address || '-'}</td>
                <td>${s.createdAt ? new Date(s.createdAt).toLocaleDateString('ka-GE') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}
    
    <!-- Таблица салонов -->
    <h4 style="margin-bottom: 12px;">🏪 რეგისტრირებული სალონები</h4>
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>სახელი</th>
            <th>მისამართი</th>
            <th>ტელეფონი</th>
            <th>კოორდინატები</th>
            <th>მფლობელი</th>
            <th>მოქმედება</th>
          </tr>
        </thead>
        <tbody>
          ${salons.map(s => `
            <tr>
              <td>${s.name || '-'}</td>
              <td>${s.address || '-'}</td>
              <td>${s.phone || '-'}</td>
              <td>${s.coordinates ? `${s.coordinates.lat}, ${s.coordinates.lng}` : '-'}</td>
              <td>${s.ownerId?.email || '-'}</td>
              <td>
                <button class="btn btn-sm btn-outline" onclick="editAdminSalon('${s._id}')">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAdminSalon('${s._id}')">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Показать форму создания салона-пользователя
window.showCreateSalonUserForm = function() {
  const form = document.getElementById('createSalonUserForm');
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }
};

// Создать пользователя-салон
window.createSalonUser = async function() {
  const email = document.getElementById('newSalonEmail')?.value?.trim();
  const password = document.getElementById('newSalonPassword')?.value;
  const salonName = document.getElementById('newSalonName')?.value?.trim();
  const address = document.getElementById('newSalonAddress')?.value?.trim();
  const phone = document.getElementById('newSalonPhone')?.value?.trim();
  const salonDescription = document.getElementById('newSalonDescription')?.value?.trim();
  
  if (!email || !password || !salonName) {
    showToast('შეავსეთ ელ-ფოსტა, პაროლი და სახელი', 'error');
    return;
  }
  
  if (password.length < 8) {
    showToast('პაროლი მინ. 8 სიმბოლო', 'error');
    return;
  }
  
  try {
    const result = await adminApiCall('/api/admin/create-salon-user', {
      method: 'POST',
      body: JSON.stringify({ email, password, salonName, address, phone, salonDescription })
    });
    
    showToast('სალონი შექმნილია! ' + salonName, 'success');
    
    // Очищаем форму
    document.getElementById('newSalonEmail').value = '';
    document.getElementById('newSalonPassword').value = '';
    document.getElementById('newSalonName').value = '';
    document.getElementById('newSalonAddress').value = '';
    document.getElementById('newSalonPhone').value = '';
    document.getElementById('newSalonDescription').value = '';
    document.getElementById('createSalonUserForm').style.display = 'none';
    
    // Обновляем таблицу
    loadAdminSalons(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Загрузка сервисов
async function loadAdminServices(container) {
  const services = await adminApiCall('/api/admin/services');
  
  container.innerHTML = `
    <div class="admin-table-header">
      <h3>💅 სერვისები (${services.length})</h3>
      <button class="btn btn-primary" onclick="showAddServiceForm()">+ დამატება</button>
    </div>
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>სახელი</th>
            <th>კატეგორია</th>
            <th>ფასი (BP)</th>
            <th>ხანგრძლივობა</th>
            <th>აღწერა</th>
            <th>მოქმედება</th>
          </tr>
        </thead>
        <tbody>
          ${services.map(s => `
            <tr>
              <td>${s.name || '-'}</td>
              <td>${s.category || '-'}</td>
              <td>${s.bpPrice || 0} BP</td>
              <td>${s.duration || 30} წთ</td>
              <td>${(s.description || '-').substring(0, 50)}...</td>
              <td>
                <button class="btn btn-sm btn-outline" onclick="editAdminService('${s._id}')">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAdminService('${s._id}')">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Загрузка бронирований
async function loadAdminBookings(container) {
  const bookings = await adminApiCall('/api/admin/bookings');
  
  container.innerHTML = `
    <div class="admin-table-header">
      <h3>📅 ჯავშნები (${bookings.length})</h3>
    </div>
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>თარიღი</th>
            <th>სალონი</th>
            <th>კლიენტი</th>
            <th>სერვისი</th>
            <th>სტატუსი</th>
            <th>მოქმედება</th>
          </tr>
        </thead>
        <tbody>
          ${bookings.map(b => `
            <tr class="status-${b.status}">
              <td>${new Date(b.dateTime || b.createdAt).toLocaleString('ka-GE')}</td>
              <td>${b.salonName || '-'}</td>
              <td>${b.userId?.firstName || ''} ${b.userId?.lastName || ''}</td>
              <td>${b.serviceName || '-'}</td>
              <td><span class="badge badge-${b.status}">${b.status || 'scheduled'}</span></td>
              <td>
                ${b.status === 'scheduled' ? `
                  <button class="btn btn-sm btn-danger" onclick="cancelAdminBooking('${b._id}')">გაუქმება</button>
                ` : '-'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Загрузка тарифов
async function loadAdminTariffs(container) {
  const packages = await adminApiCall('/api/admin/packages');
  
  container.innerHTML = `
    <div class="admin-table-header">
      <h3>💎 ტარიფები (${packages.length})</h3>
      <button class="btn btn-primary" onclick="showAddPackageForm()">+ დამატება</button>
    </div>
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>სახელი</th>
            <th>ფასი</th>
            <th>BP (tokens)</th>
            <th>აღწერა</th>
            <th>პოპულარული</th>
            <th>მოქმედება</th>
          </tr>
        </thead>
        <tbody>
          ${packages.map(p => `
            <tr>
              <td>${p.plan || '-'}</td>
              <td>${p.price || 0}₾</td>
              <td>${p.tokens || 0} BP</td>
              <td>${(p.description || '-').substring(0, 40)}...</td>
              <td>${p.popular ? '⭐' : '-'}</td>
              <td>
                <button class="btn btn-sm btn-outline" onclick="editAdminPackage('${p._id}')">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAdminPackage('${p._id}')">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ======================================
// АДМИН: ФИНАНСОВАЯ АНАЛИТИКА САЛОНОВ
// ======================================

async function loadAdminSalonFinance(container) {
  try {
    container.innerHTML = '<div class="loading-spinner">იტვირთება...</div>';
    
    const response = await adminApiCall('/api/admin/salon-analytics');
    
    // API აბრუნებს { success, totalStats, salons }
    const totalStats = response.totalStats || { totalRevenue: 0, totalPending: 0, totalWithdrawn: 0, totalBookings: 0, totalCompleted: 0 };
    const salons = response.salons || [];
    
    console.log('Salon analytics loaded:', { totalStats, salonsCount: salons.length });
    
    container.innerHTML = `
      <div class="admin-section">
        <h3>💰 სალონების ფინანსები და ანალიტიკა</h3>
        
        <!-- სტატისტიკა -->
        <div class="admin-stats-grid" style="margin-bottom: 30px;">
          <div class="stat-card" style="background: linear-gradient(135deg, #10b981, #059669);">
            <div class="stat-icon">💵</div>
            <div class="stat-value">${totalStats.totalRevenue || 0} BP</div>
            <div class="stat-label">მთლიანი შემოსავალი</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
            <div class="stat-icon">⏳</div>
            <div class="stat-value">${totalStats.totalPending || 0} BP</div>
            <div class="stat-label">Escrow-ში</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
            <div class="stat-icon">📤</div>
            <div class="stat-value">${totalStats.totalWithdrawn || 0} BP</div>
            <div class="stat-label">გატანილი</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-value">${totalStats.totalBookings || 0}</div>
            <div class="stat-label">სულ ჯავშნები</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #22c55e, #16a34a);">
            <div class="stat-icon">✓</div>
            <div class="stat-value">${totalStats.totalCompleted || 0}</div>
            <div class="stat-label">დასრულებული</div>
          </div>
        </div>
        
        <!-- სალონების ცხრილი -->
        <div class="admin-table-header">
          <h4>🏢 სალონები (${salons.length})</h4>
          <input type="text" id="salonFinanceSearch" placeholder="ძებნა..." class="admin-search" oninput="filterSalonFinanceTable()">
        </div>
        
        <div class="admin-table-wrapper">
          <table class="admin-table" id="salonFinanceTable">
            <thead>
              <tr>
                <th>სალონი</th>
                <th>📞 ტელეფონი</th>
                <th>📅 ვიზიტები</th>
                <th>💰 შემოსავალი (BP)</th>
                <th>❌ გაუქმებული</th>
                <th>მოქმედება</th>
              </tr>
            </thead>
            <tbody>
              ${salons.length === 0 ? `
                <tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">სალონები არ არის რეგისტრირებული</td></tr>
              ` : salons.map(s => `
                <tr data-id="${s._id}">
                  <td>
                    <strong>${s.salonName || 'უსახელო'}</strong>
                    <br><small style="color: gray;">${s.email || ''}</small>
                  </td>
                  <td>${s.salonPhone || '-'}</td>
                  <td style="font-weight: bold; color: #16a34a;">${s.completedBookings || 0}</td>
                  <td style="font-weight: bold; color: #7c3aed;">${s.totalRevenue || 0} BP</td>
                  <td style="color: #dc2626;">${s.cancelledBookings || 0}</td>
                  <td>
                    <button class="btn btn-sm btn-outline" onclick="viewSalonDetails('${s._id}')">👁️</button>
                    ${(s.availableForWithdrawal || 0) > 0 ? `
                      <button class="btn btn-sm btn-success" onclick="processSalonPayout('${s._id}', '${(s.salonName || '').replace(/'/g, '')}', ${s.availableForWithdrawal})">💸</button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Salon finance error:', error);
    container.innerHTML = `
      <div class="admin-section">
        <h3>❌ შეცდომა</h3>
        <p>მონაცემების ჩატვირთვა ვერ მოხერხდა: ${error.message}</p>
        <button class="btn btn-primary" onclick="loadAdminSalonFinance(document.getElementById('adminTabContent'))">🔄 სცადეთ თავიდან</button>
      </div>
    `;
  }
}

// Фильтрация таблицы салонов
window.filterSalonFinanceTable = function() {
  const search = document.getElementById('salonFinanceSearch')?.value?.toLowerCase() || '';
  const rows = document.querySelectorAll('#salonFinanceTable tbody tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
};

// Просмотр деталей салона
window.viewSalonDetails = async function(salonId) {
  try {
    const data = await adminApiCall(`/api/admin/salon-analytics/${salonId}`);
    const { salon, recentBookings, monthlyStats } = data;
    
    showAdminModal(`📊 ${salon.salonName} - დეტალები`, `
      <div style="max-height: 500px; overflow-y: auto;">
        <!-- Кнопка экспорта -->
        <div style="margin-bottom: 15px;">
          <button class="btn btn-success" onclick="exportSalonExcel('${salonId}')">
            📥 ჩამოტვირთე Excel
          </button>
        </div>
        
        <!-- Финансы -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${salon.totalRevenue} BP</div>
            <div style="color: #166534;">მთლიანი შემოსავალი</div>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #d97706;">${salon.pendingRevenue} BP</div>
            <div style="color: #92400e;">Escrow-ში</div>
          </div>
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${salon.availableForWithdrawal} BP</div>
            <div style="color: #1e40af;">გასატანი</div>
          </div>
          <div style="background: #f3e8ff; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${salon.withdrawnRevenue} BP</div>
            <div style="color: #5b21b6;">გატანილი</div>
          </div>
        </div>
        
        <!-- Статистика -->
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0;">📈 ჯავშნების სტატისტიკა</h4>
          <div style="display: flex; justify-content: space-around;">
            <div>📋 სულ: <strong>${salon.totalBookings}</strong></div>
            <div style="color: #16a34a;">✓ დადასტურებული: <strong>${salon.completedBookings}</strong></div>
            <div style="color: #dc2626;">✗ გაუქმებული: <strong>${salon.cancelledBookings}</strong></div>
          </div>
        </div>
        
        <!-- Последние бронирования -->
        <div>
          <h4>📜 ბოლო ჯავშნები</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 8px; text-align: left;">კოდი</th>
                <th style="padding: 8px; text-align: left;">კლიენტი</th>
                <th style="padding: 8px; text-align: left;">სერვისი</th>
                <th style="padding: 8px; text-align: left;">BP</th>
                <th style="padding: 8px; text-align: left;">სტატუსი</th>
              </tr>
            </thead>
            <tbody>
              ${recentBookings.slice(0, 10).map(b => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px; font-family: monospace;">${b.bookingCode}</td>
                  <td style="padding: 8px;">${b.userId?.firstName || ''} ${b.userId?.lastName || ''}</td>
                  <td style="padding: 8px;">${b.serviceName}</td>
                  <td style="padding: 8px;">${b.bpPrice || 0}</td>
                  <td style="padding: 8px;">
                    <span style="padding: 2px 6px; border-radius: 4px; font-size: 11px; 
                      background: ${b.status === 'confirmed' || b.status === 'completed' ? '#dcfce7' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7'};
                      color: ${b.status === 'confirmed' || b.status === 'completed' ? '#16a34a' : b.status === 'cancelled' ? '#dc2626' : '#d97706'};">
                      ${b.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Обработка выплаты салону
window.processSalonPayout = function(salonId, salonName, maxAmount) {
  showAdminModal(`💸 გადახდა - ${salonName}`, `
    <form onsubmit="submitSalonPayout('${salonId}'); return false;">
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <div style="font-size: 14px; color: #166534;">ხელმისაწვდომი თანხა</div>
        <div style="font-size: 28px; font-weight: bold; color: #16a34a;">${maxAmount} BP</div>
      </div>
      
      <div class="form-group">
        <label>გადახდის თანხა (BP)</label>
        <input type="number" id="payoutAmount" class="form-input" min="1" max="${maxAmount}" value="${maxAmount}" required>
      </div>
      
      <div class="form-group">
        <label>გადახდის მეთოდი</label>
        <select id="payoutMethod" class="form-input">
          <option value="bank_transfer">საბანკო გადარიცხვა</option>
          <option value="cash">ნაღდი ფული</option>
          <option value="other">სხვა</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>შენიშვნები (არასავალდებულო)</label>
        <textarea id="payoutNotes" class="form-input" rows="2" placeholder="დამატებითი ინფორმაცია..."></textarea>
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button type="button" class="btn btn-outline" onclick="closeAdminModal()">გაუქმება</button>
        <button type="submit" class="btn btn-success" style="flex: 1;">💸 დადასტურება</button>
      </div>
    </form>
  `);
};

// Отправка выплаты
window.submitSalonPayout = async function(salonId) {
  const amount = parseInt(document.getElementById('payoutAmount')?.value) || 0;
  const paymentMethod = document.getElementById('payoutMethod')?.value || 'bank_transfer';
  const notes = document.getElementById('payoutNotes')?.value || '';
  
  if (amount <= 0) {
    showToast('მიუთითეთ თანხა', 'error');
    return;
  }
  
  if (!confirm(`დარწმუნებული ხართ რომ გსურთ ${amount} BP-ის გადახდა?`)) return;
  
  try {
    await adminApiCall(`/api/admin/salon-payout/${salonId}`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod, notes })
    });
    
    closeAdminModal();
    showToast(`✅ გადახდა ${amount} BP წარმატებით დარეგისტრირდა`, 'success');
    loadAdminSalonFinance(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Экспорт аналитики в Excel
window.exportAnalyticsExcel = function(period = 'all') {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('არ ხართ ავტორიზებული', 'error');
    return;
  }
  
  showToast('⏳ იტვირთება Excel ფაილი...', 'info');
  
  // Открываем ссылку для скачивания
  const url = `${API_BASE}/api/admin/export-analytics?period=${period}`;
  
  fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(response => {
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  })
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beautypass_analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    showToast('✅ Excel ფაილი ჩამოტვირთულია', 'success');
  })
  .catch(error => {
    console.error('Export error:', error);
    showToast('შეცდომა ექსპორტისას', 'error');
  });
};

// Экспорт конкретного салона в Excel
window.exportSalonExcel = function(salonId) {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('არ ხართ ავტორიზებული', 'error');
    return;
  }
  
  showToast('⏳ იტვირთება...', 'info');
  
  fetch(`${API_BASE}/api/admin/export-salon/${salonId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(response => {
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  })
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salon_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    showToast('✅ Excel ფაილი ჩამოტვირთულია', 'success');
  })
  .catch(error => {
    console.error('Export error:', error);
    showToast('შეცდომა ექსპორტისას', 'error');
  });
};

// Удаление элементов
window.deleteAdminSalon = async function(id) {
  if (!confirm('დარწმუნებული ხართ?')) return;
  try {
    await adminApiCall(`/api/admin/salons/${id}`, { method: 'DELETE' });
    showToast('სალონი წაიშალა!', 'success');
    loadAdminSalons(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

window.deleteAdminService = async function(id) {
  if (!confirm('დარწმუნებული ხართ?')) return;
  try {
    await adminApiCall(`/api/admin/services/${id}`, { method: 'DELETE' });
    showToast('სერვისი წაიშალა!', 'success');
    loadAdminServices(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

window.deleteAdminPackage = async function(id) {
  if (!confirm('დარწმუნებული ხართ?')) return;
  try {
    await adminApiCall(`/api/admin/packages/${id}`, { method: 'DELETE' });
    showToast('ტარიფი წაიშალა!', 'success');
    loadAdminTariffs(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

window.cancelAdminBooking = async function(id) {
  if (!confirm('გაუქმდეს ჯავშანი?')) return;
  try {
    await adminApiCall(`/api/admin/bookings/${id}/cancel`, { method: 'PUT' });
    showToast('ჯავშანი გაუქმდა!', 'success');
    loadAdminBookings(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// მოდალური ფანჯრის ჩვენება
function showAdminModal(title, content) {
  // წავშალოთ ძველი მოდალი თუ არსებობს
  let modal = document.getElementById('adminEditModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminEditModal';
    modal.className = 'admin-modal-overlay';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3 id="adminModalTitle">Edit</h3>
          <button class="admin-modal-close" onclick="closeAdminModal()">✕</button>
        </div>
        <div class="admin-modal-body" id="adminModalBody"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  const modalTitle = document.getElementById('adminModalTitle');
  const modalBody = document.getElementById('adminModalBody');
  
  if (modalTitle) modalTitle.textContent = title;
  if (modalBody) modalBody.innerHTML = content;
  
  modal.style.display = 'flex';
}

// მოდალის დახურვა
window.closeAdminModal = function() {
  const modal = document.getElementById('adminEditModal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// ======================================
// ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ СЕРВИСОВ
// ======================================

window.showAddServiceForm = function() {
  showAdminModal('სერვისის დამატება / Add Service', `
    <form id="addServiceForm">
      <div class="form-row">
        <div class="form-group">
          <label>სახელი (ქართ.)</label>
          <input type="text" name="name" class="form-input" placeholder="მანიკური" required>
        </div>
        <div class="form-group">
          <label>Name (Eng)</label>
          <input type="text" name="nameEn" class="form-input" placeholder="Manicure">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>კატეგორია / Category</label>
          <select name="category" class="form-input" required>
            <option value="nails">💅 ფრჩხილები / Nails</option>
            <option value="hair">💇 თმა / Hair</option>
            <option value="face">🧖 სახე / Face</option>
            <option value="body">💆 სხეული / Body</option>
            <option value="makeup">💄 მაკიაჟი / Makeup</option>
            <option value="spa">🧘 SPA</option>
            <option value="other">სხვა / Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>ფასი BP / Price BP</label>
          <input type="number" name="bpPrice" class="form-input" value="10" min="1" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>ხანგრძლივობა (წთ) / Duration (min)</label>
          <input type="number" name="duration" class="form-input" value="30" min="15" step="15">
        </div>
        <div class="form-group">
          <label>სურათის URL / Image URL</label>
          <input type="text" name="imageUrl" class="form-input" placeholder="https://...">
        </div>
      </div>
      <div class="form-group">
        <label>აღწერა (ქართ.) / Description</label>
        <textarea name="description" class="form-input" rows="2" placeholder="სერვისის აღწერა..."></textarea>
      </div>
      <div class="form-group">
        <label>Description (Eng)</label>
        <textarea name="descriptionEn" class="form-input" rows="2" placeholder="Service description..."></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-primary" onclick="saveNewService()">დამატება / Add</button>
        <button type="button" class="btn btn-outline" onclick="closeAdminModal()">გაუქმება</button>
      </div>
    </form>
  `);
};

window.saveNewService = async function() {
  const form = document.getElementById('addServiceForm');
  const formData = new FormData(form);
  
  const data = {
    name: formData.get('name'),
    nameEn: formData.get('nameEn'),
    category: formData.get('category'),
    bpPrice: parseInt(formData.get('bpPrice')) || 10,
    duration: parseInt(formData.get('duration')) || 30,
    imageUrl: formData.get('imageUrl'),
    description: formData.get('description'),
    descriptionEn: formData.get('descriptionEn')
  };
  
  try {
    await adminApiCall('/api/admin/services', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showToast('სერვისი დამატებულია!', 'success');
    closeAdminModal();
    loadAdminServices(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

window.editAdminService = async function(serviceId) {
  try {
    const services = await adminApiCall('/api/admin/services');
    const service = services.find(s => s._id === serviceId);
    
    if (!service) {
      showToast('სერვისი ვერ მოიძებნა', 'error');
      return;
    }
    
    showAdminModal('სერვისის რედაქტირება / Edit Service', `
      <form id="editServiceForm">
        <div class="form-row">
          <div class="form-group">
            <label>სახელი (ქართ.)</label>
            <input type="text" name="name" class="form-input" value="${service.name || ''}" required>
          </div>
          <div class="form-group">
            <label>Name (Eng)</label>
            <input type="text" name="nameEn" class="form-input" value="${service.nameEn || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>კატეგორია / Category</label>
            <select name="category" class="form-input" required>
              <option value="nails" ${service.category === 'nails' ? 'selected' : ''}>💅 ფრჩხილები / Nails</option>
              <option value="hair" ${service.category === 'hair' ? 'selected' : ''}>💇 თმა / Hair</option>
              <option value="face" ${service.category === 'face' ? 'selected' : ''}>🧖 სახე / Face</option>
              <option value="body" ${service.category === 'body' ? 'selected' : ''}>💆 სხეული / Body</option>
              <option value="makeup" ${service.category === 'makeup' ? 'selected' : ''}>💄 მაკიაჟი / Makeup</option>
              <option value="spa" ${service.category === 'spa' ? 'selected' : ''}>🧘 SPA</option>
              <option value="other" ${service.category === 'other' ? 'selected' : ''}>სხვა / Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>ფასი BP / Price BP</label>
            <input type="number" name="bpPrice" class="form-input" value="${service.bpPrice || 10}" min="1" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>ხანგრძლივობა (წთ) / Duration (min)</label>
            <input type="number" name="duration" class="form-input" value="${service.duration || 30}" min="15" step="15">
          </div>
          <div class="form-group">
            <label>სურათის URL / Image URL</label>
            <input type="text" name="imageUrl" class="form-input" value="${service.imageUrl || ''}">
          </div>
        </div>
        <div class="form-group">
          <label>აღწერა (ქართ.) / Description</label>
          <textarea name="description" class="form-input" rows="2">${service.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Description (Eng)</label>
          <textarea name="descriptionEn" class="form-input" rows="2">${service.descriptionEn || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="saveEditedService('${serviceId}')">შენახვა / Save</button>
          <button type="button" class="btn btn-outline" onclick="closeAdminModal()">გაუქმება</button>
        </div>
      </form>
    `);
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

window.saveEditedService = async function(serviceId) {
  const form = document.getElementById('editServiceForm');
  const formData = new FormData(form);
  
  const data = {
    name: formData.get('name'),
    nameEn: formData.get('nameEn'),
    category: formData.get('category'),
    bpPrice: parseInt(formData.get('bpPrice')) || 10,
    duration: parseInt(formData.get('duration')) || 30,
    imageUrl: formData.get('imageUrl'),
    description: formData.get('description'),
    descriptionEn: formData.get('descriptionEn')
  };
  
  try {
    await adminApiCall(`/api/admin/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    showToast('სერვისი განახლდა!', 'success');
    closeAdminModal();
    loadAdminServices(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// ======================================
// ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ САЛОНОВ
// ======================================

window.showAddSalonForm = function() {
  showAdminModal('სალონის დამატება / Add Salon', `
    <form id="addSalonForm">
      <div class="form-row">
        <div class="form-group">
          <label>სახელი / Name</label>
          <input type="text" name="name" class="form-input" placeholder="Beauty Studio" required>
        </div>
        <div class="form-group">
          <label>ტელეფონი / Phone</label>
          <input type="tel" name="phone" class="form-input" placeholder="+995 5XX XXX XXX">
        </div>
      </div>
      <div class="form-group">
        <label>მისამართი / Address</label>
        <input type="text" name="address" class="form-input" placeholder="თბილისი, რუსთაველის 1">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>განედი (Lat) / Latitude</label>
          <input type="number" step="0.000001" name="lat" class="form-input" placeholder="41.7151">
        </div>
        <div class="form-group">
          <label>გრძედი (Lng) / Longitude</label>
          <input type="number" step="0.000001" name="lng" class="form-input" placeholder="44.8271">
        </div>
      </div>
      <div class="form-group">
        <label>აღწერა / Description</label>
        <textarea name="description" class="form-input" rows="2" placeholder="სალონის აღწერა..."></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>სურათის URL / Image URL</label>
          <input type="text" name="imageUrl" class="form-input" placeholder="https://...">
        </div>
        <div class="form-group">
          <label>რეიტინგი / Rating</label>
          <input type="number" step="0.1" name="rating" class="form-input" value="4.5" min="1" max="5">
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-primary" onclick="saveNewSalon()">დამატება / Add</button>
        <button type="button" class="btn btn-outline" onclick="closeAdminModal()">გაუქმება</button>
      </div>
    </form>
  `);
};

window.saveNewSalon = async function() {
  const form = document.getElementById('addSalonForm');
  const formData = new FormData(form);
  
  const data = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    coordinates: {
      lat: parseFloat(formData.get('lat')) || 41.7151,
      lng: parseFloat(formData.get('lng')) || 44.8271
    },
    description: formData.get('description'),
    imageUrl: formData.get('imageUrl'),
    rating: parseFloat(formData.get('rating')) || 4.5
  };
  
  try {
    await adminApiCall('/api/admin/salons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showToast('სალონი დამატებულია!', 'success');
    closeAdminModal();
    loadAdminSalons(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

window.editAdminSalon = async function(salonId) {
  try {
    const salons = await adminApiCall('/api/admin/salons');
    const salon = salons.find(s => s._id === salonId);
    
    if (!salon) {
      showToast('სალონი ვერ მოიძებნა', 'error');
      return;
    }
    
    showAdminModal('სალონის რედაქტირება / Edit Salon', `
      <form id="editSalonForm">
        <div class="form-row">
          <div class="form-group">
            <label>სახელი / Name</label>
            <input type="text" name="name" class="form-input" value="${salon.name || ''}" required>
          </div>
          <div class="form-group">
            <label>ტელეფონი / Phone</label>
            <input type="tel" name="phone" class="form-input" value="${salon.phone || ''}">
          </div>
        </div>
        <div class="form-group">
          <label>მისამართი / Address</label>
          <input type="text" name="address" class="form-input" value="${salon.address || ''}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>განედი (Lat) / Latitude</label>
            <input type="number" step="0.000001" name="lat" class="form-input" value="${salon.coordinates?.lat || 41.7151}">
          </div>
          <div class="form-group">
            <label>გრძედი (Lng) / Longitude</label>
            <input type="number" step="0.000001" name="lng" class="form-input" value="${salon.coordinates?.lng || 44.8271}">
          </div>
        </div>
        <div class="form-group">
          <label>აღწერა / Description</label>
          <textarea name="description" class="form-input" rows="2">${salon.description || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>სურათის URL / Image URL</label>
            <input type="text" name="imageUrl" class="form-input" value="${salon.imageUrl || ''}">
          </div>
          <div class="form-group">
            <label>რეიტინგი / Rating</label>
            <input type="number" step="0.1" name="rating" class="form-input" value="${salon.rating || 4.5}" min="1" max="5">
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="saveEditedSalon('${salonId}')">შენახვა / Save</button>
          <button type="button" class="btn btn-outline" onclick="closeAdminModal()">გაუქმება</button>
        </div>
      </form>
    `);
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

window.saveEditedSalon = async function(salonId) {
  const form = document.getElementById('editSalonForm');
  const formData = new FormData(form);
  
  const data = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    coordinates: {
      lat: parseFloat(formData.get('lat')) || 41.7151,
      lng: parseFloat(formData.get('lng')) || 44.8271
    },
    description: formData.get('description'),
    imageUrl: formData.get('imageUrl'),
    rating: parseFloat(formData.get('rating')) || 4.5
  };
  
  try {
    await adminApiCall(`/api/admin/salons/${salonId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    showToast('სალონი განახლდა!', 'success');
    closeAdminModal();
    loadAdminSalons(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// ======================================
// ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ ПАКЕТОВ
// ======================================

window.showAddPackageForm = function() {
  showAdminModal('პაკეტის დამატება / Add Package', `
    <form id="addPackageForm">
      <div class="form-row">
        <div class="form-group">
          <label>სახელი / Plan Name</label>
          <input type="text" name="plan" class="form-input" placeholder="Premium" required>
        </div>
        <div class="form-group">
          <label>ფასი (₾) / Price</label>
          <input type="number" name="price" class="form-input" value="99" min="1" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>BP (tokens)</label>
          <input type="number" name="tokens" class="form-input" value="100" min="1" required>
        </div>
        <div class="form-group">
          <label>პოპულარული / Popular</label>
          <select name="popular" class="form-input">
            <option value="false">არა / No</option>
            <option value="true">დიახ / Yes</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>აღწერა / Description</label>
        <textarea name="description" class="form-input" rows="2" placeholder="პაკეტის აღწერა..." required></textarea>
      </div>
      <div class="form-group">
        <label>რა შედის (თითო ხაზზე) / Includes (one per line)</label>
        <textarea name="includes" class="form-input" rows="3" placeholder="მანიკური&#10;პედიკური&#10;თმის შეჭრა"></textarea>
      </div>
      <div class="form-group">
        <label>უპირატესობები (თითო ხაზზე) / Perks (one per line)</label>
        <textarea name="perks" class="form-input" rows="2" placeholder="VIP მხარდაჭერა&#10;10% ფასდაკლება"></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-primary" onclick="saveNewPackage()">დამატება / Add</button>
        <button type="button" class="btn btn-outline" onclick="closeAdminModal()">გაუქმება</button>
      </div>
    </form>
  `);
};

window.saveNewPackage = async function() {
  const form = document.getElementById('addPackageForm');
  const formData = new FormData(form);
  
  const includesText = formData.get('includes') || '';
  const perksText = formData.get('perks') || '';
  
  const data = {
    plan: formData.get('plan'),
    price: parseInt(formData.get('price')) || 99,
    tokens: parseInt(formData.get('tokens')) || 100,
    popular: formData.get('popular') === 'true',
    description: formData.get('description'),
    includes: includesText.split('\n').map(s => s.trim()).filter(Boolean),
    perks: perksText.split('\n').map(s => s.trim()).filter(Boolean)
  };
  
  try {
    await adminApiCall('/api/admin/packages', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showToast('პაკეტი დამატებულია!', 'success');
    closeAdminModal();
    loadAdminTariffs(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

window.editAdminPackage = async function(packageId) {
  try {
    const packages = await adminApiCall('/api/admin/packages');
    const pkg = packages.find(p => p._id === packageId);
    
    if (!pkg) {
      showToast('პაკეტი ვერ მოიძებნა', 'error');
      return;
    }
    
    const includesStr = (pkg.includes || []).join('\n');
    const perksStr = (pkg.perks || []).join('\n');
    
    showAdminModal('პაკეტის რედაქტირება / Edit Package', `
      <form id="editPackageForm">
        <div class="form-row">
          <div class="form-group">
            <label>სახელი / Plan Name</label>
            <input type="text" name="plan" class="form-input" value="${pkg.plan || ''}" required>
          </div>
          <div class="form-group">
            <label>ფასი (₾) / Price</label>
            <input type="number" name="price" class="form-input" value="${pkg.price || 99}" min="1" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>BP (tokens)</label>
            <input type="number" name="tokens" class="form-input" value="${pkg.tokens || 100}" min="1" required>
          </div>
          <div class="form-group">
            <label>პოპულარული / Popular</label>
            <select name="popular" class="form-input">
              <option value="false" ${!pkg.popular ? 'selected' : ''}>არა / No</option>
              <option value="true" ${pkg.popular ? 'selected' : ''}>დიახ / Yes</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>აღწერა / Description</label>
          <textarea name="description" class="form-input" rows="2" required>${pkg.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>რა შედის (თითო ხაზზე) / Includes (one per line)</label>
          <textarea name="includes" class="form-input" rows="3">${includesStr}</textarea>
        </div>
        <div class="form-group">
          <label>უპირატესობები (თითო ხაზზე) / Perks (one per line)</label>
          <textarea name="perks" class="form-input" rows="2">${perksStr}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="saveEditedPackage('${packageId}')">შენახვა / Save</button>
          <button type="button" class="btn btn-outline" onclick="closeAdminModal()">გაუქმება</button>
        </div>
      </form>
    `);
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

window.saveEditedPackage = async function(packageId) {
  const form = document.getElementById('editPackageForm');
  const formData = new FormData(form);
  
  const includesText = formData.get('includes') || '';
  const perksText = formData.get('perks') || '';
  
  const data = {
    plan: formData.get('plan'),
    price: parseInt(formData.get('price')) || 99,
    tokens: parseInt(formData.get('tokens')) || 100,
    popular: formData.get('popular') === 'true',
    description: formData.get('description'),
    includes: includesText.split('\n').map(s => s.trim()).filter(Boolean),
    perks: perksText.split('\n').map(s => s.trim()).filter(Boolean)
  };
  
  try {
    await adminApiCall(`/api/admin/packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    showToast('პაკეტი განახლდა!', 'success');
    closeAdminModal();
    loadAdminTariffs(document.getElementById('adminTabContent'));
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// ======================================
// УПРАВЛЕНИЕ КОНТЕНТОМ САЙТА
// ======================================

// Загрузка контента сайта
async function loadAdminContent(container) {
  container.innerHTML = `
    <div class="admin-content-section">
      <h3>📝 კონტენტის მართვა / Content Management</h3>
      
      <div class="content-tabs">
        <button class="content-tab active" onclick="showContentTab('texts')">📄 ტექსტები</button>
        <button class="content-tab" onclick="showContentTab('map')">🗺️ რუკა</button>
        <button class="content-tab" onclick="showContentTab('settings')">⚙️ პარამეტრები</button>
      </div>
      
      <div id="contentTabBody">
        <!-- Default: texts -->
        <div class="content-editor" id="textsEditor">
          <h4>მთავარი გვერდის ტექსტები / Homepage Texts</h4>
          
          <div class="form-group">
            <label>სლოგანი / Slogan</label>
            <input type="text" id="siteSlogan" class="form-input" value="შენი სილამაზე, ჩვენი ზრუნვა">
          </div>
          
          <div class="form-group">
            <label>აღწერა / Description</label>
            <textarea id="siteDescription" class="form-input" rows="3">Beauty Pass - თქვენი სილამაზის პარტნიორი თბილისში. მიიღეთ წვდომა საუკეთესო სალონებზე ერთი გამოწერით.</textarea>
          </div>
          
          <h4>კონტაქტები / Contact Info</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>ელფოსტა / Email</label>
              <input type="email" id="siteEmail" class="form-input" value="info@beautypass.ge">
            </div>
            <div class="form-group">
              <label>ტელეფონი / Phone</label>
              <input type="tel" id="sitePhone" class="form-input" value="+995 XXX XX XX XX">
            </div>
          </div>
          
          <div class="form-group">
            <label>მისამართი / Address</label>
            <input type="text" id="siteAddress" class="form-input" value="თბილისი, საქართველო">
          </div>
          
          <h4>სოციალური ქსელები / Social Media</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label>Facebook URL</label>
              <input type="url" id="socialFacebook" class="form-input" placeholder="https://facebook.com/beautypass">
            </div>
            <div class="form-group">
              <label>Instagram URL</label>
              <input type="url" id="socialInstagram" class="form-input" placeholder="https://instagram.com/beautypass">
            </div>
          </div>
          
          <div class="form-actions">
            <button class="btn btn-primary" onclick="saveSiteContent()">შენახვა / Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Load saved content
  loadSavedContent();
}

window.showContentTab = function(tab) {
  document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  const body = document.getElementById('contentTabBody');
  
  if (tab === 'texts') {
    loadAdminContent(document.getElementById('adminTabContent'));
  } else if (tab === 'map') {
    body.innerHTML = `
      <div class="content-editor" id="mapEditor">
        <h4>🗺️ რუკის პარამეტრები / Map Settings</h4>
        
        <div class="form-row">
          <div class="form-group">
            <label>ცენტრის განედი / Center Lat</label>
            <input type="number" step="0.0001" id="mapCenterLat" class="form-input" value="41.7151">
          </div>
          <div class="form-group">
            <label>ცენტრის გრძედი / Center Lng</label>
            <input type="number" step="0.0001" id="mapCenterLng" class="form-input" value="44.8271">
          </div>
        </div>
        
        <div class="form-group">
          <label>ზუმის დონე / Zoom Level</label>
          <input type="number" id="mapZoom" class="form-input" value="13" min="10" max="18">
        </div>
        
        <h4>📍 რუკაზე სალონები / Salons on Map</h4>
        <p class="text-muted">სალონების კოორდინატები შეგიძლიათ შეცვალოთ "სალონები" ჩანართში</p>
        
        <div id="mapSalonsList"></div>
        
        <div class="form-actions">
          <button class="btn btn-primary" onclick="saveMapSettings()">შენახვა / Save</button>
          <button class="btn btn-outline" onclick="previewMap()">წინასწარი ნახვა / Preview</button>
        </div>
      </div>
    `;
    loadMapSalons();
  } else if (tab === 'settings') {
    body.innerHTML = `
      <div class="content-editor" id="settingsEditor">
        <h4>⚙️ სისტემის პარამეტრები / System Settings</h4>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="maintenanceMode"> ტექნიკური სამუშაოების რეჟიმი / Maintenance Mode
          </label>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="registrationEnabled" checked> რეგისტრაციის ნებართვა / Allow Registration
          </label>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="bookingEnabled" checked> ჯავშნის ნებართვა / Allow Bookings
          </label>
        </div>
        
        <h4>💰 გადახდის პარამეტრები / Payment Settings</h4>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="testPaymentMode" checked> ტესტ რეჟიმი / Test Mode
          </label>
          <small class="text-muted">გამორთეთ რეალური გადახდებისთვის</small>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>მინ. თანხა / Min Amount (₾)</label>
            <input type="number" id="minPayAmount" class="form-input" value="1">
          </div>
          <div class="form-group">
            <label>მაქს. თანხა / Max Amount (₾)</label>
            <input type="number" id="maxPayAmount" class="form-input" value="10000">
          </div>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary" onclick="saveSystemSettings()">შენახვა / Save</button>
        </div>
      </div>
    `;
    loadSystemSettings();
  }
};

async function loadMapSalons() {
  try {
    const salons = await adminApiCall('/api/admin/salons');
    const list = document.getElementById('mapSalonsList');
    
    if (list) {
      list.innerHTML = salons.map(s => `
        <div class="map-salon-item">
          <span class="salon-name">${s.name}</span>
          <span class="salon-coords">${s.coordinates?.lat || '-'}, ${s.coordinates?.lng || '-'}</span>
          <button class="btn btn-sm btn-outline" onclick="editAdminSalon('${s._id}')">✏️</button>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading map salons:', error);
  }
}

function loadSavedContent() {
  // Загружаем настройки с сервера
  fetch('/api/site-settings')
    .then(res => res.json())
    .then(settings => {
      if (settings.phone) {
        const el = document.getElementById('sitePhone');
        if (el) el.value = settings.phone;
      }
      if (settings.email) {
        const el = document.getElementById('siteEmail');
        if (el) el.value = settings.email;
      }
      if (settings.address) {
        const el = document.getElementById('siteAddress');
        if (el) el.value = settings.address;
      }
      if (settings.socialFacebook) {
        const el = document.getElementById('socialFacebook');
        if (el) el.value = settings.socialFacebook;
      }
      if (settings.socialInstagram) {
        const el = document.getElementById('socialInstagram');
        if (el) el.value = settings.socialInstagram;
      }
      if (settings.seoTitle) {
        const el = document.getElementById('siteSlogan');
        if (el) el.value = settings.seoTitle;
      }
      if (settings.seoDescription) {
        const el = document.getElementById('siteDescription');
        if (el) el.value = settings.seoDescription;
      }
    })
    .catch(err => {
      console.error('Error loading site settings:', err);
      // Фолбэк на localStorage
      const content = JSON.parse(localStorage.getItem('siteContent') || '{}');
      if (content.slogan) document.getElementById('siteSlogan').value = content.slogan;
      if (content.description) document.getElementById('siteDescription').value = content.description;
      if (content.email) document.getElementById('siteEmail').value = content.email;
      if (content.phone) document.getElementById('sitePhone').value = content.phone;
      if (content.address) document.getElementById('siteAddress').value = content.address;
      if (content.facebook) document.getElementById('socialFacebook').value = content.facebook;
      if (content.instagram) document.getElementById('socialInstagram').value = content.instagram;
    });
}

window.saveSiteContent = async function() {
  const content = {
    seoTitle: document.getElementById('siteSlogan')?.value,
    seoDescription: document.getElementById('siteDescription')?.value,
    email: document.getElementById('siteEmail')?.value,
    phone: document.getElementById('sitePhone')?.value,
    address: document.getElementById('siteAddress')?.value,
    socialFacebook: document.getElementById('socialFacebook')?.value,
    socialInstagram: document.getElementById('socialInstagram')?.value
  };
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/admin/site-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(content)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showToast('კონტენტი შენახულია სერვერზე! ✅', 'success');
      
      // Также сохраняем локально для быстрого доступа
      localStorage.setItem('siteContent', JSON.stringify(content));
      
      // Apply to page
      applySiteContent(content);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Save content error:', error);
    showToast('შეცდომა: ' + error.message, 'error');
    
    // Сохраняем локально как фолбэк
    localStorage.setItem('siteContent', JSON.stringify(content));
    showToast('შენახულია ლოკალურად', 'success');
  }
};

function applySiteContent(content) {
  // Update footer contact info - using proper DOM traversal instead of :contains
  const footerSections = document.querySelectorAll('.footer-section p');
  let footerEmail = null;
  let footerPhone = null;
  
  footerSections.forEach(p => {
    const text = p.textContent || '';
    if (text.includes('Email') || text.includes('email') || text.includes('@')) {
      footerEmail = p;
    }
    if (text.includes('Phone') || text.includes('phone') || text.includes('ტელ') || text.includes('+995')) {
      footerPhone = p;
    }
  });
  
  // Update values if elements found and content provided
  if (footerEmail && content.contactEmail) {
    footerEmail.innerHTML = `📧 ${content.contactEmail}`;
  }
  if (footerPhone && content.contactPhone) {
    footerPhone.innerHTML = `📞 ${content.contactPhone}`;
  }
}

window.saveMapSettings = function() {
  const settings = {
    centerLat: parseFloat(document.getElementById('mapCenterLat')?.value) || 41.7151,
    centerLng: parseFloat(document.getElementById('mapCenterLng')?.value) || 44.8271,
    zoom: parseInt(document.getElementById('mapZoom')?.value) || 13
  };
  
  localStorage.setItem('mapSettings', JSON.stringify(settings));
  showToast('რუკის პარამეტრები შენახულია!', 'success');
};

window.previewMap = function() {
  const lat = document.getElementById('mapCenterLat')?.value || 41.7151;
  const lng = document.getElementById('mapCenterLng')?.value || 44.8271;
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
};

function loadSystemSettings() {
  const settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
  
  if (document.getElementById('maintenanceMode')) {
    document.getElementById('maintenanceMode').checked = settings.maintenanceMode || false;
  }
  if (document.getElementById('registrationEnabled')) {
    document.getElementById('registrationEnabled').checked = settings.registrationEnabled !== false;
  }
  if (document.getElementById('bookingEnabled')) {
    document.getElementById('bookingEnabled').checked = settings.bookingEnabled !== false;
  }
  if (document.getElementById('testPaymentMode')) {
    document.getElementById('testPaymentMode').checked = settings.testPaymentMode !== false;
  }
  if (document.getElementById('minPayAmount')) {
    document.getElementById('minPayAmount').value = settings.minPayAmount || 1;
  }
  if (document.getElementById('maxPayAmount')) {
    document.getElementById('maxPayAmount').value = settings.maxPayAmount || 10000;
  }
}

window.saveSystemSettings = function() {
  const settings = {
    maintenanceMode: document.getElementById('maintenanceMode')?.checked,
    registrationEnabled: document.getElementById('registrationEnabled')?.checked,
    bookingEnabled: document.getElementById('bookingEnabled')?.checked,
    testPaymentMode: document.getElementById('testPaymentMode')?.checked,
    minPayAmount: parseInt(document.getElementById('minPayAmount')?.value) || 1,
    maxPayAmount: parseInt(document.getElementById('maxPayAmount')?.value) || 10000
  };
  
  localStorage.setItem('systemSettings', JSON.stringify(settings));
  showToast('პარამეტრები შენახულია!', 'success');
};

// Добавляем таб контента в switchAdminTab
const originalSwitchAdminTab = window.switchAdminTab;
window.switchAdminTab = async function(tab) {
  if (tab === 'content') {
    adminCurrentTab = tab;
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.admin-tab[onclick*="${tab}"]`)?.classList.add('active');
    
    const content = document.getElementById('adminTabContent');
    if (content) {
      await loadAdminContent(content);
    }
    return;
  }
  
  // Call original function for other tabs
  if (typeof originalSwitchAdminTab === 'function') {
    return originalSwitchAdminTab.call(this, tab);
  }
};

// Проверка авторизации админа при загрузке
(function checkAdminAuth() {
  const adminUser = localStorage.getItem('adminUser');
  if (adminUser) {
    try {
      const user = JSON.parse(adminUser);
      if (user.isAdmin) {
        // При загрузке админ-панели покажем dashboard если сохранен
        setTimeout(() => {
          if (document.getElementById('adminLoginCard') && document.getElementById('adminDashboard')) {
            showAdminDashboard(user);
          }
        }, 500);
      }
    } catch (e) {
      localStorage.removeItem('adminUser');
    }
  }
})();

// ======================================
// PROMO CAROUSEL
// ======================================

let promoCurrentSlide = 0;
let promoAutoPlayInterval = null;

function initPromoCarousel() {
  const carousel = document.getElementById('promoCarousel');
  const dotsContainer = document.getElementById('promoDots');
  
  if (!carousel || !dotsContainer) return;
  
  const slides = carousel.querySelectorAll('.promo-slide');
  
  // Create dots
  dotsContainer.innerHTML = '';
  slides.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = 'promo-dot' + (index === 0 ? ' active' : '');
    dot.onclick = () => goToPromoSlide(index);
    dotsContainer.appendChild(dot);
  });
  
  // Start autoplay
  startPromoAutoplay();
  
  // Pause on hover
  carousel.addEventListener('mouseenter', stopPromoAutoplay);
  carousel.addEventListener('mouseleave', startPromoAutoplay);
}

function goToPromoSlide(index) {
  const carousel = document.getElementById('promoCarousel');
  if (!carousel) return;
  
  const slides = carousel.querySelectorAll('.promo-slide');
  const dots = document.querySelectorAll('.promo-dot');
  
  if (index >= slides.length) index = 0;
  if (index < 0) index = slides.length - 1;
  
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
  
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
  
  promoCurrentSlide = index;
}

window.movePromoSlide = function(direction) {
  goToPromoSlide(promoCurrentSlide + direction);
};

function startPromoAutoplay() {
  if (promoAutoPlayInterval) return;
  promoAutoPlayInterval = setInterval(() => {
    goToPromoSlide(promoCurrentSlide + 1);
  }, 4000); // Change slide every 4 seconds
}

function stopPromoAutoplay() {
  if (promoAutoPlayInterval) {
    clearInterval(promoAutoPlayInterval);
    promoAutoPlayInterval = null;
  }
}

console.log("app.js loaded successfully!");