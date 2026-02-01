// backend-integration.js

// Функции для управления состоянием пользователя в localStorage

function getAuthToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function isLoggedIn() {
  return !!getAuthToken();
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // После выхода перезагружаем страницу, чтобы сбросить состояние
  window.location.reload(); 
}

// Эта функция вызывается при загрузке страницы
function initializeApp() {
  if (isLoggedIn()) {
    const user = getUser();
    console.log('Пользователь уже вошел в систему:', user);
    // Если пользователь вошел, показываем соответствующую секцию
    if (user.userType === 'client') {
      showClientProfile();
    } else if (user.userType === 'salon') {
      showSalonDashboard();
    }
    // Обновляем кнопки в шапке
    updateAuthUI(user);
  } else {
    console.log('Пользователь не авторизован');
    // Показываем экран входа/регистрации
    updateAuthUI(null);
  }
}