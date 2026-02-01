// ===== SALON FUNCTIONS =====

let salonData = {
  isLoggedIn: false,
  salonName: null,
  salonEmail: null,
  slots: [],
  bookings: []
};

// Populate salon dropdown - DEPRECATED (now using email/password login)
function populateSalonDropdown() {
  // No longer needed - salons login with email/password
}

// Login Salon (NEW: with server auth + 2FA)
async function loginSalon() {
  const email = document.getElementById('salonEmail')?.value?.trim();
  const password = document.getElementById('salonPassword')?.value;

  if (!email || !password) {
    showToast('შეავსეთ ელ-ფოსტა და პაროლი', 'error');
    return;
  }

  try {
    // Используем существующую функцию login из api-client.js или app.js
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Показываем форму 2FA
      const twoFACard = document.getElementById("salon2FACard");
      if (twoFACard) {
        twoFACard.style.display = "block";
      }
      showToast('2FA კოდი გაგზავნილია ელ-ფოსტაზე', 'success');
    } else {
      throw new Error(result.message || 'შეცდომა');
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
}

// Verify Salon 2FA
async function verifySalon2FA() {
  const email = document.getElementById('salonEmail')?.value?.trim();
  const code = document.getElementById('salon2FACode')?.value?.trim();
  
  if (!email || !code) {
    showToast('შეიყვანეთ კოდი', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/confirm-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    
    const result = await response.json();
    
    if (response.ok && result.token && result.user) {
      // Проверяем что это салон
      if (result.user.userType !== 'salon') {
        showToast('ეს ანგარიში არ არის სალონის ანგარიში', 'error');
        return;
      }
      
      // Сохраняем токен и данные пользователя
      localStorage.setItem('token', result.token);
      localStorage.setItem('salonToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      salonData.isLoggedIn = true;
      salonData.salonName = result.user.salonName || result.user.firstName;
      salonData.salonEmail = result.user.email;
      
      // Показываем дашборд
      showSalonDashboard();
      showToast('წარმატებით შეხვედით!', 'success');
    } else {
      throw new Error(result.message || 'არასწორი კოდი');
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
}

// Show Salon Dashboard
function showSalonDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  document.getElementById('salonLoginCard')?.style.setProperty('display', 'none');
  document.getElementById('salon2FACard')?.style.setProperty('display', 'none');
  document.getElementById('salonDashboard')?.style.setProperty('display', 'block');
  
  const nameEl = document.getElementById('dashboardSalonName');
  const emailEl = document.getElementById('dashboardSalonEmail');
  
  if (nameEl) nameEl.textContent = '🏢 ' + (user.salonName || user.firstName || 'სალონი');
  if (emailEl) emailEl.textContent = user.email || '';
  
  // Инициализируем первый таб
  const content = document.getElementById('salonTabContent');
  if (content) {
    renderSalonSlotsTabNew(content);
  }
  
  // Update header
  if (typeof updateAuthUI === 'function') updateAuthUI();
}

// კოდის შეყვანის მოდალი (სალონისთვის)
window.showConfirmCodeModal = function() {
  const existingModal = document.getElementById('confirmCodeModal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'confirmCodeModal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000;';
  modal.innerHTML = `
    <div class="modal-content" style="background: white; border-radius: 20px; padding: 32px; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
      <h3 style="margin: 0 0 24px 0; color: #1e293b; font-size: 22px; text-align: center;">
        🔢 ჯავშნის კოდის შეყვანა
      </h3>
      
      <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.5;">
          კლიენტმა უნდა გაჩვენოთ კოდი ან QR. კოდის გააქტიურება შესაძლებელია მხოლოდ დანიშნულ დროს (±30 წუთი).
        </p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <label style="display: block; margin-bottom: 8px; color: #475569; font-weight: 500;">ჯავშნის კოდი:</label>
        <input type="text" id="confirmBookingCode" 
          placeholder="მაგ: BP-XXXXX-XXX" 
          style="width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 18px; font-family: monospace; text-align: center; text-transform: uppercase;"
          oninput="this.value = this.value.toUpperCase()">
      </div>
      
      <div style="display: flex; gap: 12px;">
        <button onclick="document.getElementById('confirmCodeModal').remove()" 
          style="flex: 1; padding: 14px; border: 2px solid #e2e8f0; background: white; border-radius: 12px; font-size: 16px; cursor: pointer;">
          გაუქმება
        </button>
        <button onclick="confirmBookingByCode()" 
          style="flex: 1; padding: 14px; border: none; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border-radius: 12px; font-size: 16px; cursor: pointer; font-weight: 600;">
          ✅ გააქტიურება
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.getElementById('confirmBookingCode').focus();
  
  // დახურვა overlay-ზე დაკლიკებისას
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
};

// კოდით ჯავშნის დადასტურება
window.confirmBookingByCode = async function() {
  const codeInput = document.getElementById('confirmBookingCode');
  const code = codeInput?.value?.trim().toUpperCase();
  
  if (!code) {
    showToast('შეიყვანეთ კოდი', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('salonToken') || localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/confirm-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookingCode: code })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      document.getElementById('confirmCodeModal')?.remove();
      showToast(`✅ ${result.message}`, 'success');
      
      // განახლება
      if (typeof loadSalonBookings === 'function') {
        await loadSalonBookings();
      }
    } else {
      showToast(result.message || 'შეცდომა', 'error');
    }
  } catch (error) {
    console.error('Confirm booking error:', error);
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Logout Salon
function logoutSalon() {
  salonData.isLoggedIn = false;
  salonData.salonName = null;
  salonData.salonEmail = null;
  
  localStorage.removeItem('token');
  localStorage.removeItem('salonToken');
  localStorage.removeItem('user');
  localStorage.removeItem('salon_auth');
  
  document.getElementById('salonLoginCard').style.display = 'block';
  document.getElementById('salonDashboard').style.display = 'none';
  document.getElementById('salon2FACard').style.display = 'none';
  
  // Очищаем поля
  const emailInput = document.getElementById('salonEmail');
  const passInput = document.getElementById('salonPassword');
  const codeInput = document.getElementById('salon2FACode');
  if (emailInput) emailInput.value = '';
  if (passInput) passInput.value = '';
  if (codeInput) codeInput.value = '';
  
  // Update header
  if (typeof updateAuthUI === 'function') updateAuthUI();
  
  showToast('გამოსვლა წარმატებით!', 'success');
}

// Load Salon Data
function loadSalonData() {
  const salonName = salonData.salonName;
  
  // Load slots from localStorage AND from SALONS array
  const allSlots = JSON.parse(localStorage.getItem('salon_slots') || '[]');
  const salonFromArray = SALONS.find(s => s.name === salonName);
  
  // Combine slots from both sources
  const localSlots = allSlots.filter(slot => slot.salonName === salonName);
  const arraySlots = salonFromArray?.slots || [];
  
  // Merge without duplicates by id
  const slotMap = new Map();
  localSlots.forEach(s => slotMap.set(s.id, s));
  arraySlots.forEach(s => slotMap.set(s.id, s));
  
  salonData.slots = Array.from(slotMap.values());
  
  // Load bookings for this salon
  const allBookings = JSON.parse(localStorage.getItem('bp_bookings') || '[]');
  salonData.bookings = allBookings.filter(b => b.salonName === salonName);
}

// Switch Salon Tab
function switchSalonTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event?.target?.classList.add('active');

  const content = document.getElementById('salonTabContent');
  
  switch(tabName) {
    case 'slots':
      renderSalonSlotsTabNew(content);
      break;
    case 'specialists':
      renderSalonSpecialistsTab(content);
      break;
    case 'gallery':
      renderSalonGalleryTab(content);
      break;
    case 'services':
      renderSalonServicesTab(content);
      break;
    case 'bookings':
      renderSalonBookingsTabNew(content);
      break;
    case 'analytics':
      renderSalonAnalyticsTab(content);
      break;
    case 'settings':
      renderSalonSettingsTab(content);
      break;
  }
}

// ===============================
// NEW SPECIALISTS SECTION - FROM SCRATCH
// ===============================

async function renderSalonSpecialistsTab(container) {
  container.innerHTML = `
    <div class="admin-section active">
      <div class="specialists-header">
        <div>
          <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 32px;">👥</span>
            სპეციალისტები
          </h3>
          <p style="color: #666; margin: 8px 0 0 0; font-size: 14px;">
            დაამატეთ თქვენი გუნდის წევრები და მათი სერვისები
          </p>
        </div>
        <button class="btn btn-primary" onclick="showAddSpecialistModal()" style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">➕</span>
          ახალი სპეციალისტი
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="specialists-stats" id="specialistsStats">
        <div class="stat-box">
          <span class="stat-number" id="totalSpecialists">0</span>
          <span class="stat-label">სპეციალისტი</span>
        </div>
        <div class="stat-box">
          <span class="stat-number" id="totalSpecServices">0</span>
          <span class="stat-label">სერვისი</span>
        </div>
      </div>

      <!-- Specialists Grid -->
      <div id="salonSpecialistsGrid" class="specialists-grid">
        <div class="loading-spinner">იტვირთება...</div>
      </div>
    </div>

    <style>
      .specialists-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }
      
      .specialists-stats {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .stat-box {
        background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        text-align: center;
        min-width: 120px;
      }
      
      .stat-number {
        font-size: 28px;
        font-weight: 700;
        display: block;
      }
      
      .stat-label {
        font-size: 13px;
        opacity: 0.9;
      }
      
      .specialists-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 20px;
      }
      
      .specialist-card {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        transition: all 0.3s ease;
        border: 1px solid #f0f0f0;
      }
      
      .specialist-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(124, 58, 237, 0.15);
      }
      
      .specialist-photo-section {
        position: relative;
        height: 200px;
        background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      
      .specialist-photo-section img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .specialist-photo-placeholder {
        font-size: 80px;
        opacity: 0.5;
      }
      
      .photo-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.7));
        color: white;
        padding: 20px 16px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .specialist-photo-section:hover .photo-overlay {
        opacity: 1;
      }
      
      .specialist-info {
        padding: 20px;
      }
      
      .specialist-name {
        font-size: 20px;
        font-weight: 700;
        color: #1a1a2e;
        margin: 0 0 4px 0;
      }
      
      .specialist-position {
        color: #7c3aed;
        font-weight: 500;
        font-size: 14px;
        margin: 0 0 8px 0;
      }
      
      .specialist-description {
        color: #666;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
      }
      
      .specialist-services-section {
        padding: 0 20px 20px;
      }
      
      .services-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }
      
      .services-header h5 {
        margin: 0;
        font-size: 14px;
        color: #666;
      }
      
      .service-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .service-chip {
        background: #f8f4ff;
        border: 1px solid #e9d5ff;
        padding: 8px 14px;
        border-radius: 20px;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      }
      
      .service-chip:hover {
        background: #e9d5ff;
      }
      
      .service-chip-price {
        font-weight: 600;
        color: #7c3aed;
      }
      
      .service-chip-delete {
        cursor: pointer;
        opacity: 0.5;
        margin-left: 4px;
      }
      
      .service-chip-delete:hover {
        opacity: 1;
        color: #dc2626;
      }
      
      .no-services {
        color: #999;
        font-size: 13px;
        font-style: italic;
      }
      
      .specialist-actions {
        display: flex;
        gap: 8px;
        padding: 16px 20px;
        background: #fafafa;
        border-top: 1px solid #f0f0f0;
      }
      
      .specialist-actions button {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }
      
      .btn-edit-spec {
        background: #f0f0f0;
        color: #333;
      }
      
      .btn-edit-spec:hover {
        background: #e0e0e0;
      }
      
      .btn-delete-spec {
        background: #fee2e2;
        color: #dc2626;
      }
      
      .btn-delete-spec:hover {
        background: #fecaca;
      }
      
      .empty-specialists {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        background: #fafafa;
        border-radius: 16px;
        border: 2px dashed #e0e0e0;
      }
      
      .empty-specialists-icon {
        font-size: 60px;
        margin-bottom: 16px;
      }
      
      .empty-specialists h4 {
        margin: 0 0 8px 0;
        color: #333;
      }
      
      .empty-specialists p {
        margin: 0;
        color: #666;
      }
      
      /* Modal styles for specialists */
      .specialist-modal-form {
        max-width: 500px;
      }
      
      .specialist-modal-form .form-group {
        margin-bottom: 20px;
      }
      
      .specialist-modal-form label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }
      
      .specialist-modal-form input,
      .specialist-modal-form textarea,
      .specialist-modal-form select {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        font-size: 15px;
        transition: border-color 0.2s;
      }
      
      .specialist-modal-form input:focus,
      .specialist-modal-form textarea:focus,
      .specialist-modal-form select:focus {
        outline: none;
        border-color: #7c3aed;
      }
      
      .specialist-modal-form textarea {
        resize: vertical;
        min-height: 80px;
      }
      
      .category-select-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 8px;
      }
      
      .category-option {
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 13px;
      }
      
      .category-option:hover {
        border-color: #7c3aed;
      }
      
      .category-option.selected {
        border-color: #7c3aed;
        background: #f8f4ff;
      }
      
      .category-option span {
        display: block;
        font-size: 24px;
        margin-bottom: 4px;
      }
    </style>
  `;
  
  await loadSpecialistsNew();
}

// NEW: Load Specialists - Complete rewrite
async function loadSpecialistsNew() {
  const container = document.getElementById('salonSpecialistsGrid');
  if (!container) return;
  
  try {
    const token = localStorage.getItem('salonToken') || localStorage.getItem('token');
    
    if (!token) {
      container.innerHTML = `
        <div class="empty-specialists">
          <div class="empty-specialists-icon">🔒</div>
          <h4>ავტორიზაცია საჭიროა</h4>
          <p>გთხოვთ გაიაროთ ავტორიზაცია</p>
        </div>
      `;
      return;
    }
    
    const response = await fetch('/api/salon-owner/specialists', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to load');
    }
    
    const specialists = await response.json();
    
    // Update stats
    document.getElementById('totalSpecialists').textContent = specialists.length;
    const totalServices = specialists.reduce((sum, s) => sum + (s.services?.length || 0), 0);
    document.getElementById('totalSpecServices').textContent = totalServices;
    
    if (!Array.isArray(specialists) || specialists.length === 0) {
      container.innerHTML = `
        <div class="empty-specialists">
          <div class="empty-specialists-icon">👤</div>
          <h4>სპეციალისტები არ არის</h4>
          <p>დაამატეთ თქვენი პირველი სპეციალისტი</p>
          <button class="btn btn-primary" onclick="showAddSpecialistModal()" style="margin-top: 16px;">
            ➕ დამატება
          </button>
        </div>
      `;
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
      <div class="specialist-card" data-id="${spec._id}">
        <!-- Photo Section -->
        <div class="specialist-photo-section" onclick="triggerSpecialistPhotoUpload('${spec._id}')">
          ${spec.photoUrl ? 
            `<img src="${spec.photoUrl}" alt="${spec.name}">` :
            `<div class="specialist-photo-placeholder">👤</div>`
          }
          <div class="photo-overlay">
            <span>📷</span> ფოტოს შეცვლა
          </div>
          <input type="file" id="specPhoto_${spec._id}" accept="image/*" style="display: none;" 
                 onchange="uploadSpecialistPhotoNew('${spec._id}', this)">
        </div>
        
        <!-- Info Section -->
        <div class="specialist-info">
          <h4 class="specialist-name">${spec.name}</h4>
          ${spec.position ? `<p class="specialist-position">${spec.position}</p>` : ''}
          ${spec.description ? `<p class="specialist-description">${spec.description}</p>` : ''}
        </div>
        
        <!-- Services Section -->
        <div class="specialist-services-section">
          <div class="services-header">
            <h5>სერვისები (${spec.services?.length || 0})</h5>
            <button class="btn btn-sm btn-outline" onclick="showAddServiceModal('${spec._id}', '${spec.name}')">
              + დამატება
            </button>
          </div>
          <div class="service-chips">
            ${spec.services && spec.services.length > 0 ? 
              spec.services.map(s => `
                <div class="service-chip">
                  <span>${categoryIcons[s.category] || '🎨'}</span>
                  ${s.name}
                  <span class="service-chip-price">${s.bpPrice} BP</span>
                  <span class="service-chip-delete" onclick="deleteServiceFromSpecialist('${spec._id}', '${s._id || s.name}')" title="წაშლა">✕</span>
                </div>
              `).join('') :
              '<span class="no-services">სერვისები არ არის დამატებული</span>'
            }
          </div>
        </div>
        
        <!-- Actions -->
        <div class="specialist-actions">
          <button class="btn-edit-spec" onclick="showEditSpecialistModal('${spec._id}')">
            ✏️ რედაქტირება
          </button>
          <button class="btn-delete-spec" onclick="deleteSpecialistNew('${spec._id}', '${spec.name}')">
            🗑️ წაშლა
          </button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Load specialists error:', error);
    container.innerHTML = `
      <div class="empty-specialists">
        <div class="empty-specialists-icon">⚠️</div>
        <h4>შეცდომა</h4>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="loadSpecialistsNew()" style="margin-top: 16px;">
          🔄 ხელახლა ცდა
        </button>
      </div>
    `;
  }
}

// Ensure admin modal exists
function ensureAdminModal() {
  let modal = document.getElementById('adminEditModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminEditModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3 id="adminModalTitle">Edit</h3>
          <button class="modal-close" onclick="closeAdminModal()">✕</button>
        </div>
        <div class="modal-body" id="adminModalBody" style="padding: 24px;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  return modal;
}

// Close admin modal
window.closeAdminModal = function() {
  const modal = document.getElementById('adminEditModal');
  if (modal) modal.style.display = 'none';
};

// Show Add Specialist Modal
window.showAddSpecialistModal = function() {
  const modal = ensureAdminModal();
  const modalTitle = document.getElementById('adminModalTitle');
  const modalBody = document.getElementById('adminModalBody');
  
  modalTitle.textContent = '➕ ახალი სპეციალისტი';
  modalBody.innerHTML = `
    <div class="specialist-modal-form">
      <div class="form-group">
        <label>სახელი და გვარი *</label>
        <input type="text" id="newSpecName" placeholder="მაგ: ნინო გელაშვილი">
      </div>
      <div class="form-group">
        <label>პოზიცია / სპეციალიზაცია</label>
        <input type="text" id="newSpecPosition" placeholder="მაგ: მანიკურისტი, სტილისტი">
      </div>
      <div class="form-group">
        <label>აღწერა (არასავალდებულო)</label>
        <textarea id="newSpecDescription" placeholder="მოკლე ინფორმაცია სპეციალისტის შესახებ..."></textarea>
      </div>
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="btn btn-primary" onclick="createSpecialist()" style="flex: 1;">
          შექმნა
        </button>
        <button class="btn btn-outline" onclick="closeAdminModal()" style="flex: 1;">
          გაუქმება
        </button>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  document.getElementById('newSpecName')?.focus();
};

// Create Specialist
window.createSpecialist = async function() {
  const name = document.getElementById('newSpecName')?.value?.trim();
  const position = document.getElementById('newSpecPosition')?.value?.trim();
  const description = document.getElementById('newSpecDescription')?.value?.trim();
  
  if (!name) {
    showToast('შეიყვანეთ სპეციალისტის სახელი', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('salonToken') || localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/specialists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, position, description })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showToast('✅ სპეციალისტი დამატებულია!', 'success');
      closeAdminModal();
      await loadSpecialistsNew();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Show Edit Specialist Modal
window.showEditSpecialistModal = async function(specId) {
  const modal = ensureAdminModal();
  const modalTitle = document.getElementById('adminModalTitle');
  const modalBody = document.getElementById('adminModalBody');
  
  if (!modal || !modalBody) return;
  
  try {
    const token = localStorage.getItem('salonToken') || localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/specialists', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const specialists = await response.json();
    const spec = specialists.find(s => s._id === specId);
    
    if (!spec) {
      showToast('სპეციალისტი ვერ მოიძებნა', 'error');
      return;
    }
    
    modalTitle.textContent = '✏️ რედაქტირება: ' + spec.name;
    modalBody.innerHTML = `
      <div class="specialist-modal-form">
        <div class="form-group">
          <label>სახელი და გვარი *</label>
          <input type="text" id="editSpecName" value="${spec.name}">
        </div>
        <div class="form-group">
          <label>პოზიცია / სპეციალიზაცია</label>
          <input type="text" id="editSpecPosition" value="${spec.position || ''}">
        </div>
        <div class="form-group">
          <label>აღწერა</label>
          <textarea id="editSpecDescription">${spec.description || ''}</textarea>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button class="btn btn-primary" onclick="updateSpecialist('${specId}')" style="flex: 1;">
            შენახვა
          </button>
          <button class="btn btn-outline" onclick="closeAdminModal()" style="flex: 1;">
            გაუქმება
          </button>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Update Specialist
window.updateSpecialist = async function(specId) {
  const name = document.getElementById('editSpecName')?.value?.trim();
  const position = document.getElementById('editSpecPosition')?.value?.trim();
  const description = document.getElementById('editSpecDescription')?.value?.trim();
  
  if (!name) {
    showToast('შეიყვანეთ სახელი', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('salonToken') || localStorage.getItem('token');
    const response = await fetch(`/api/salon-owner/specialists/${specId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, position, description })
    });
    
    if (response.ok) {
      showToast('✅ განახლებულია!', 'success');
      closeAdminModal();
      await loadSpecialistsNew();
    } else {
      const result = await response.json();
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Delete Specialist
window.deleteSpecialistNew = async function(specId, specName) {
  if (!confirm(`ნამდვილად წაშალოთ "${specName}"?`)) return;
  
  try {
    const token = localStorage.getItem('salonToken') || localStorage.getItem('token');
    const response = await fetch(`/api/salon-owner/specialists/${specId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      showToast('✅ სპეციალისტი წაშლილია', 'success');
      await loadSpecialistsNew();
    } else {
      const result = await response.json();
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Trigger photo upload
window.triggerSpecialistPhotoUpload = function(specId) {
  document.getElementById(`specPhoto_${specId}`)?.click();
};

// Upload specialist photo
window.uploadSpecialistPhotoNew = async function(specId, input) {
  if (!input.files || !input.files[0]) return;
  
  const file = input.files[0];
  if (file.size > 15 * 1024 * 1024) {
    showToast('ფოტო ძალიან დიდია (მაქს. 15MB)', 'error');
    return;
  }
  
  const formData = new FormData();
  formData.append('photo', file);
  
  try {
    showToast('⏳ იტვირთება...', 'info');
    
    const token = localStorage.getItem('salonToken') || localStorage.getItem('token');
    const response = await fetch(`/api/salon-owner/specialists/${specId}/photo`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showToast('✅ ფოტო ატვირთულია!', 'success');
      await loadSpecialistsNew();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Show Add Service Modal
window.showAddServiceModal = function(specId, specName) {
  const modal = ensureAdminModal();
  const modalTitle = document.getElementById('adminModalTitle');
  const modalBody = document.getElementById('adminModalBody');
  
  modalTitle.textContent = `➕ სერვისის დამატება - ${specName}`;
  modalBody.innerHTML = `
    <div class="specialist-modal-form">
      <div class="form-group">
        <label>სერვისის სახელი *</label>
        <input type="text" id="serviceNameInput" placeholder="მაგ: კლასიკური მანიკური">
      </div>
      
      <div class="form-group">
        <label>კატეგორია *</label>
        <div class="category-select-grid" id="categorySelect">
          <div class="category-option" data-cat="nails" onclick="selectCategory('nails')">
            <span>💅</span>ფრჩხილები
          </div>
          <div class="category-option" data-cat="hair" onclick="selectCategory('hair')">
            <span>💇</span>თმა
          </div>
          <div class="category-option" data-cat="face" onclick="selectCategory('face')">
            <span>✨</span>სახე
          </div>
          <div class="category-option" data-cat="body" onclick="selectCategory('body')">
            <span>💆</span>სხეული
          </div>
          <div class="category-option" data-cat="makeup" onclick="selectCategory('makeup')">
            <span>💄</span>მაკიაჟი
          </div>
          <div class="category-option" data-cat="other" onclick="selectCategory('other')">
            <span>🎨</span>სხვა
          </div>
        </div>
        <input type="hidden" id="selectedCategory" value="">
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="form-group">
          <label>ხანგრძლივობა (წთ)</label>
          <input type="number" id="serviceDuration" value="30" min="10" step="5">
        </div>
        <div class="form-group">
          <label>ფასი (BP)</label>
          <input type="number" id="servicePrice" value="10" min="1">
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="btn btn-primary" onclick="addServiceToSpec('${specId}')" style="flex: 1;">
          დამატება
        </button>
        <button class="btn btn-outline" onclick="closeAdminModal()" style="flex: 1;">
          გაუქმება
        </button>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  document.getElementById('serviceNameInput')?.focus();
};

// Select category
window.selectCategory = function(cat) {
  document.querySelectorAll('.category-option').forEach(el => el.classList.remove('selected'));
  document.querySelector(`.category-option[data-cat="${cat}"]`)?.classList.add('selected');
  document.getElementById('selectedCategory').value = cat;
};

// Add service to specialist
window.addServiceToSpec = async function(specId) {
  const name = document.getElementById('serviceNameInput')?.value?.trim();
  const category = document.getElementById('selectedCategory')?.value;
  const duration = parseInt(document.getElementById('serviceDuration')?.value) || 30;
  const bpPrice = parseInt(document.getElementById('servicePrice')?.value) || 10;
  
  if (!name) {
    showToast('შეიყვანეთ სერვისის სახელი', 'error');
    return;
  }
  
  if (!category) {
    showToast('აირჩიეთ კატეგორია', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('salonToken') || localStorage.getItem('token');
    const response = await fetch(`/api/salon-owner/specialists/${specId}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, category, duration, bpPrice })
    });
    
    if (response.ok) {
      showToast('✅ სერვისი დამატებულია!', 'success');
      closeAdminModal();
      await loadSpecialistsNew();
    } else {
      const result = await response.json();
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Delete service from specialist
window.deleteServiceFromSpecialist = async function(specId, serviceIdOrName) {
  if (!confirm('წაშალოთ ეს სერვისი?')) return;
  
  try {
    const token = localStorage.getItem('salonToken') || localStorage.getItem('token');
    const response = await fetch(`/api/salon-owner/specialists/${specId}/services/${encodeURIComponent(serviceIdOrName)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      showToast('✅ სერვისი წაშლილია', 'success');
      await loadSpecialistsNew();
    } else {
      const result = await response.json();
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// NEW: Render Services Tab
async function renderSalonServicesTab(container) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  container.innerHTML = `
    <div class="admin-section active">
      <div class="admin-toolbar">
        <h3>💅 ჩემი სერვისები</h3>
      </div>

      <!-- Форма добавления услуги -->
      <div class="card" style="margin-bottom: 24px; padding: 24px;">
        <h4 style="margin-bottom: 16px;">➕ ახალი სერვისის დამატება</h4>
        <div class="form-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label>სერვისის სახელი *</label>
            <input type="text" id="newServiceName" class="form-input" placeholder="მაგ: მანიკური">
          </div>
          <div class="form-group">
            <label>კატეგორია *</label>
            <select id="newServiceCategory" class="form-input">
              <option value="">აირჩიეთ...</option>
              <option value="nails">💅 ფრჩხილები</option>
              <option value="hair">💇 თმა</option>
              <option value="face">✨ სახე</option>
              <option value="body">💆 სხეული</option>
              <option value="makeup">💄 მაკიაჟი</option>
              <option value="other">🎨 სხვა</option>
            </select>
          </div>
          <div class="form-group">
            <label>ფასი (BP) *</label>
            <input type="number" id="newServicePrice" class="form-input" value="10" min="1">
          </div>
          <div class="form-group">
            <label>ხანგრძლივობა (წუთი)</label>
            <input type="number" id="newServiceDuration" class="form-input" value="30" min="10">
          </div>
        </div>
        <div class="form-group" style="margin-top: 12px;">
          <label>აღწერა</label>
          <textarea id="newServiceDescription" class="form-input" rows="2" placeholder="სერვისის აღწერა..."></textarea>
        </div>
        <button class="btn btn-primary" onclick="addSalonService()" style="margin-top: 12px;">დამატება</button>
      </div>

      <!-- Список услуг -->
      <div class="admin-table">
        <table id="salonServicesTable">
          <thead>
            <tr>
              <th>სერვისი</th>
              <th>კატეგორია</th>
              <th>ფასი</th>
              <th>ხანგრძლივობა</th>
              <th>მოქმედებები</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="5" class="loading">იტვირთება...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  // Загружаем услуги
  await loadSalonServices();
}

// Загрузка услуг салона
async function loadSalonServices() {
  const tbody = document.querySelector("#salonServicesTable tbody");
  if (!tbody) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/services', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const services = await response.json();
    
    if (!services || services.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">სერვისები არ არის</td></tr>';
      return;
    }
    
    const categoryNames = {
      nails: '💅 ფრჩხილები',
      hair: '💇 თმა',
      face: '✨ სახე',
      body: '💆 სხეული',
      makeup: '💄 მაკიაჟი',
      other: '🎨 სხვა'
    };
    
    tbody.innerHTML = services.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>${categoryNames[s.category] || s.category}</td>
        <td>${s.bpPrice} BP</td>
        <td>${s.duration || 30} წუთი</td>
        <td>
          <button class="btn-icon btn-danger" onclick="deleteSalonService('${s._id}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Load services error:', error);
    tbody.innerHTML = '<tr><td colspan="5">შეცდომა</td></tr>';
  }
}

// Добавить услугу
window.addSalonService = async function() {
  const name = document.getElementById('newServiceName')?.value?.trim();
  const category = document.getElementById('newServiceCategory')?.value;
  const bpPrice = parseInt(document.getElementById('newServicePrice')?.value) || 10;
  const duration = parseInt(document.getElementById('newServiceDuration')?.value) || 30;
  const description = document.getElementById('newServiceDescription')?.value?.trim();
  
  if (!name || !category) {
    showToast('შეავსეთ სახელი და კატეგორია', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, category, bpPrice, duration, description })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showToast('სერვისი დამატებულია!', 'success');
      document.getElementById('newServiceName').value = '';
      document.getElementById('newServiceCategory').value = '';
      document.getElementById('newServicePrice').value = '10';
      document.getElementById('newServiceDuration').value = '30';
      document.getElementById('newServiceDescription').value = '';
      await loadSalonServices();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Удалить услугу
window.deleteSalonService = async function(id) {
  if (!confirm('ნამდვილად წაშლა?')) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/salon-owner/services/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      showToast('სერვისი წაშლილია', 'success');
      await loadSalonServices();
    } else {
      const result = await response.json();
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// ===============================
// NEW: SALON GALLERY MANAGEMENT
// ===============================

async function renderSalonGalleryTab(container) {
  container.innerHTML = `
    <div class="admin-section active">
      <div class="gallery-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 32px;">📸</span>
            გალერეა
          </h3>
          <p style="color: #666; margin: 8px 0 0 0; font-size: 14px;">
            დაამატეთ ფოტოები და ვიდეოები თქვენი სალონისთვის. კლიენტები დაინახავენ მათ მთავარ გვერდზე.
          </p>
        </div>
        <button class="btn btn-primary" onclick="showAddGalleryMediaModal()" style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">➕</span>
          დამატება
        </button>
      </div>

      <!-- Stats -->
      <div class="gallery-stats" style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div class="stat-box" style="background: #f8f4ff; padding: 16px 24px; border-radius: 12px; text-align: center;">
          <span class="stat-number" id="galleryPhotosCount" style="font-size: 24px; font-weight: bold; color: #7c3aed;">0</span>
          <span class="stat-label" style="display: block; color: #666; font-size: 12px;">ფოტო</span>
        </div>
        <div class="stat-box" style="background: #f0fdf4; padding: 16px 24px; border-radius: 12px; text-align: center;">
          <span class="stat-number" id="galleryVideosCount" style="font-size: 24px; font-weight: bold; color: #10b981;">0</span>
          <span class="stat-label" style="display: block; color: #666; font-size: 12px;">ვიდეო</span>
        </div>
      </div>

      <!-- Gallery Grid -->
      <div id="salonGalleryGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
        <div class="loading-spinner" style="grid-column: 1/-1; text-align: center; padding: 40px;">
          <span style="font-size: 32px;">⏳</span>
          <p>იტვირთება...</p>
        </div>
      </div>
    </div>
  `;

  // Load gallery
  await loadSalonGallery();
}

async function loadSalonGallery() {
  const token = localStorage.getItem('token');
  const grid = document.getElementById('salonGalleryGrid');
  
  try {
    const response = await fetch('/api/salon-owner/gallery', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load gallery');
    
    const data = await response.json();
    const gallery = data.gallery || [];
    
    console.log('Gallery loaded:', gallery.length, 'items');
    
    // Update counts
    const photos = gallery.filter(item => item.type === 'photo');
    const videos = gallery.filter(item => item.type === 'video');
    
    const photosCount = document.getElementById('galleryPhotosCount');
    const videosCount = document.getElementById('galleryVideosCount');
    if (photosCount) photosCount.textContent = photos.length;
    if (videosCount) videosCount.textContent = videos.length;
    
    if (!gallery || gallery.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #f8f4ff; border-radius: 16px; border: 2px dashed #e9d5ff;">
          <span style="font-size: 64px; display: block; margin-bottom: 16px;">📷</span>
          <h3 style="margin: 0 0 8px 0; color: #7c3aed;">გალერეა ცარიელია</h3>
          <p style="margin: 0; color: #666;">დაამატეთ ფოტოები და ვიდეოები თქვენი სალონის საპრეზენტაციოდ</p>
          <button class="btn btn-primary" onclick="showAddGalleryMediaModal()" style="margin-top: 20px;">
            ➕ პირველი მედია დამატება
          </button>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = gallery.map((item, index) => `
      <div class="gallery-item" style="position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); aspect-ratio: 1;">
        ${item.type === 'video' ? `
          <video src="${item.url}" style="width: 100%; height: 100%; object-fit: cover;" onclick="previewGalleryMedia('${item.url}', 'video')"></video>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;">
            <span style="font-size: 48px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">▶️</span>
          </div>
        ` : `
          <img src="${item.url}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="previewGalleryMedia('${item.url}', 'photo')">
        `}
        ${item.caption ? `
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 20px 12px 12px; color: white; font-size: 13px;">
            ${item.caption}
          </div>
        ` : ''}
        <button onclick="deleteGalleryItem(${index})" style="position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(239,68,68,0.9); border: none; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">
          🗑️
        </button>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Load gallery error:', error);
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
        <span style="font-size: 32px;">❌</span>
        <p>შეცდომა გალერეის ჩატვირთვისას</p>
      </div>
    `;
  }
}

window.showAddGalleryMediaModal = function() {
  let modal = document.getElementById('addGalleryMediaModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'addGalleryMediaModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3>📸 მედიის დამატება</h3>
        <button class="modal-close" onclick="closeAddGalleryMediaModal()">✕</button>
      </div>
      <div class="modal-body" style="padding: 24px;">
        <div class="upload-zone" id="galleryUploadZone" style="border: 2px dashed #d1d5db; border-radius: 16px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s;" 
             onclick="document.getElementById('galleryFileInput').click()"
             ondragover="event.preventDefault(); this.style.borderColor='#7c3aed'; this.style.background='#f8f4ff';"
             ondragleave="this.style.borderColor='#d1d5db'; this.style.background='transparent';"
             ondrop="handleGalleryFileDrop(event)">
          <span style="font-size: 48px; display: block; margin-bottom: 16px;">📤</span>
          <p style="margin: 0 0 8px 0; font-weight: 600;">აირჩიეთ ფაილები ან ჩააგდეთ აქ</p>
          <p style="margin: 0; color: #666; font-size: 14px;">ფოტოები (JPG, PNG) ან ვიდეოები (MP4, MOV)</p>
          <input type="file" id="galleryFileInput" accept="image/*,video/*" multiple style="display: none;" onchange="handleGalleryFileSelect(event)">
        </div>
        
        <div id="galleryPreviewArea" style="margin-top: 20px; display: none;">
          <h4 style="margin: 0 0 12px 0;">არჩეული ფაილები:</h4>
          <div id="galleryFilePreviews" style="display: flex; flex-wrap: wrap; gap: 12px;"></div>
        </div>
        
        <div class="form-group" style="margin-top: 20px;">
          <label>აღწერა (არასავალდებულო)</label>
          <input type="text" id="galleryCaption" class="form-input" placeholder="მედიის აღწერა...">
        </div>
        
        <button id="uploadGalleryBtn" class="btn btn-primary btn-block" onclick="uploadGalleryMedia()" style="margin-top: 20px;" disabled>
          📤 ატვირთვა
        </button>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
};

window.closeAddGalleryMediaModal = function() {
  const modal = document.getElementById('addGalleryMediaModal');
  if (modal) modal.style.display = 'none';
  window.selectedGalleryFiles = [];
};

window.selectedGalleryFiles = [];

window.handleGalleryFileSelect = function(event) {
  const files = Array.from(event.target.files);
  processGalleryFiles(files);
};

window.handleGalleryFileDrop = function(event) {
  event.preventDefault();
  event.target.style.borderColor = '#d1d5db';
  event.target.style.background = 'transparent';
  
  const files = Array.from(event.dataTransfer.files);
  processGalleryFiles(files);
};

function processGalleryFiles(files) {
  const validFiles = files.filter(f => 
    f.type.startsWith('image/') || f.type.startsWith('video/')
  );
  
  if (validFiles.length === 0) {
    showToast('აირჩიეთ ფოტო ან ვიდეო ფაილები', 'error');
    return;
  }
  
  window.selectedGalleryFiles = validFiles;
  
  const previewArea = document.getElementById('galleryPreviewArea');
  const previews = document.getElementById('galleryFilePreviews');
  const uploadBtn = document.getElementById('uploadGalleryBtn');
  
  previewArea.style.display = 'block';
  uploadBtn.disabled = false;
  
  previews.innerHTML = validFiles.map((file, i) => {
    const isVideo = file.type.startsWith('video/');
    return `
      <div style="position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; background: #f3f4f6;">
        ${isVideo ? `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #1f2937;">
            <span style="font-size: 24px;">🎬</span>
          </div>
        ` : `
          <img src="${URL.createObjectURL(file)}" style="width: 100%; height: 100%; object-fit: cover;">
        `}
        <button onclick="removeGalleryFile(${i})" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; background: rgba(239,68,68,0.9); border: none; color: white; cursor: pointer; font-size: 10px;">✕</button>
      </div>
    `;
  }).join('');
}

window.removeGalleryFile = function(index) {
  window.selectedGalleryFiles.splice(index, 1);
  processGalleryFiles(window.selectedGalleryFiles);
  
  if (window.selectedGalleryFiles.length === 0) {
    document.getElementById('galleryPreviewArea').style.display = 'none';
    document.getElementById('uploadGalleryBtn').disabled = true;
  }
};

window.uploadGalleryMedia = async function() {
  const files = window.selectedGalleryFiles;
  if (!files || files.length === 0) {
    showToast('აირჩიეთ ფაილები', 'error');
    return;
  }
  
  const token = localStorage.getItem('token');
  const caption = document.getElementById('galleryCaption').value;
  const btn = document.getElementById('uploadGalleryBtn');
  
  btn.disabled = true;
  btn.innerHTML = '⏳ იტვირთება...';
  
  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('caption', caption);
      formData.append('type', file.type.startsWith('video/') ? 'video' : 'photo');
      
      const response = await fetch('/api/salon-owner/gallery', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
    }
    
    showToast(`${files.length} მედია წარმატებით აიტვირთა`, 'success');
    closeAddGalleryMediaModal();
    await loadSalonGallery();
    
  } catch (error) {
    console.error('Upload error:', error);
    showToast('შეცდომა: ' + error.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '📤 ატვირთვა';
  }
};

window.deleteGalleryItem = async function(index) {
  if (!confirm('წავშალოთ ეს მედია?')) return;
  
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/salon-owner/gallery/${index}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Delete failed');
    
    showToast('მედია წაშლილია', 'success');
    await loadSalonGallery();
    
  } catch (error) {
    console.error('Delete error:', error);
    showToast('შეცდომა წაშლისას', 'error');
  }
};

window.previewGalleryMedia = function(url, type) {
  let modal = document.getElementById('galleryPreviewModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'galleryPreviewModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 90vw; max-height: 90vh; background: transparent; box-shadow: none;">
      <button onclick="document.getElementById('galleryPreviewModal').style.display='none'" style="position: absolute; top: -40px; right: 0; background: white; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 18px;">✕</button>
      ${type === 'video' ? `
        <video src="${url}" controls autoplay style="max-width: 100%; max-height: 80vh; border-radius: 12px;"></video>
      ` : `
        <img src="${url}" style="max-width: 100%; max-height: 80vh; border-radius: 12px;">
      `}
    </div>
  `;
  
  modal.style.display = 'flex';
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
};

// NEW: Render Settings Tab (Profile + Change Password)
async function renderSalonSettingsTab(container) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  container.innerHTML = `
    <div class="admin-section active">
      <div class="settings-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
        
        <!-- Профиль салона -->
        <div class="card" style="padding: 24px;">
          <h3 style="margin-bottom: 20px;">🏢 სალონის პროფილი</h3>
          
          <div class="form-group">
            <label>სალონის სახელი</label>
            <input type="text" id="settingSalonName" class="form-input" value="${user.salonName || ''}" placeholder="სალონის სახელი">
          </div>
          
          <div class="form-group">
            <label>მისამართი</label>
            <input type="text" id="settingSalonAddress" class="form-input" value="${user.address || ''}" placeholder="თბილისი, ...">
          </div>
          
          <div class="form-group">
            <label>ტელეფონი</label>
            <input type="tel" id="settingSalonPhone" class="form-input" value="${user.phone || ''}" placeholder="+995 5XX XXX XXX">
          </div>
          
          <div class="form-group">
            <label>აღწერა</label>
            <textarea id="settingSalonDescription" class="form-input" rows="3" placeholder="სალონის აღწერა...">${user.salonDescription || ''}</textarea>
          </div>
          
          <button class="btn btn-primary" onclick="saveSalonProfile()">შენახვა</button>
        </div>
        
        <!-- Смена пароля -->
        <div class="card" style="padding: 24px;">
          <h3 style="margin-bottom: 20px;">🔐 პაროლის შეცვლა</h3>
          
          <div class="form-group">
            <label>მიმდინარე პაროლი</label>
            <input type="password" id="currentPassword" class="form-input" placeholder="••••••••">
          </div>
          
          <div class="form-group">
            <label>ახალი პაროლი</label>
            <input type="password" id="newPassword" class="form-input" placeholder="მინ. 8 სიმბოლო">
          </div>
          
          <div class="form-group">
            <label>გაიმეორეთ ახალი პაროლი</label>
            <input type="password" id="confirmPassword" class="form-input" placeholder="••••••••">
          </div>
          
          <button class="btn btn-primary" onclick="changeSalonPassword()">პაროლის შეცვლა</button>
        </div>
        
        <!-- Информация об аккаунте -->
        <div class="card" style="padding: 24px;">
          <h3 style="margin-bottom: 20px;">📋 ანგარიშის ინფორმაცია</h3>
          
          <div class="info-row" style="padding: 10px 0; border-bottom: 1px solid #eee;">
            <span style="color: #666;">ელ-ფოსტა:</span>
            <strong>${user.email || '-'}</strong>
          </div>
          
          <div class="info-row" style="padding: 10px 0; border-bottom: 1px solid #eee;">
            <span style="color: #666;">ანგარიშის ტიპი:</span>
            <strong>🏢 სალონი</strong>
          </div>
          
          <div class="info-row" style="padding: 10px 0; border-bottom: 1px solid #eee;">
            <span style="color: #666;">რეგისტრაციის თარიღი:</span>
            <strong>${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ka-GE') : '-'}</strong>
          </div>
          
          <div class="info-row" style="padding: 10px 0;">
            <span style="color: #666;">სტატუსი:</span>
            <span class="status-badge status-available">აქტიური</span>
          </div>
        </div>
        
      </div>
    </div>
  `;
}

// Сохранить профиль салона
window.saveSalonProfile = async function() {
  const salonName = document.getElementById('settingSalonName')?.value?.trim();
  const address = document.getElementById('settingSalonAddress')?.value?.trim();
  const phone = document.getElementById('settingSalonPhone')?.value?.trim();
  const salonDescription = document.getElementById('settingSalonDescription')?.value?.trim();
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ salonName, address, phone, salonDescription })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Обновляем локальные данные
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.salonName = salonName;
      user.address = address;
      user.phone = phone;
      user.salonDescription = salonDescription;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Обновляем заголовок
      document.getElementById('dashboardSalonName').textContent = '🏢 ' + (salonName || 'სალონი');
      
      showToast('პროფილი შენახულია!', 'success');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// Сменить пароль салона
window.changeSalonPassword = async function() {
  const currentPassword = document.getElementById('currentPassword')?.value;
  const newPassword = document.getElementById('newPassword')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('შეავსეთ ყველა ველი', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('პაროლები არ ემთხვევა', 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showToast('პაროლი უნდა იყოს მინ. 8 სიმბოლო', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showToast('პაროლი შეცვლილია!', 'success');
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('შეცდომა: ' + error.message, 'error');
  }
};

// NEW: Render Slots Tab with Server Data
async function renderSalonSlotsTabNew(container) {
  // Загружаем специалистов для dropdown
  let specialists = [];
  try {
    const token = localStorage.getItem('token');
    const resp = await fetch('/api/salon-owner/specialists', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (resp.ok) specialists = await resp.json();
  } catch (e) {
    console.log('Could not load specialists');
  }
  
  // Минимальная дата - сегодня
  const today = new Date().toISOString().split('T')[0];
  
  const specialistOptions = specialists.length > 0 
    ? specialists.map(s => `<option value="${s._id}" data-name="${s.name}">${s.name} - ${s.position || 'სპეციალისტი'}</option>`).join('')
    : '<option value="">ჯერ არ არის სპეციალისტი</option>';
  
  container.innerHTML = `
    <div class="admin-section active">
      <div class="admin-toolbar">
        <h3>📅 სლოტების მართვა</h3>
        <button class="btn btn-outline btn-sm" onclick="switchSalonTab('specialists')">👤 სპეციალისტები</button>
      </div>

      <!-- Форма добавления слотов -->
      <div class="card" style="margin-bottom: 24px; padding: 24px;">
        <h4 style="margin-bottom: 16px;">➕ ახალი სლოტების დამატება</h4>
        <div class="form-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label>სპეციალისტი</label>
            <select id="slotSpecialist" class="form-input">
              <option value="">აირჩიეთ სპეციალისტი...</option>
              ${specialistOptions}
            </select>
          </div>
          <div class="form-group">
            <label>პროცედურა *</label>
            <input type="text" id="slotServiceName" class="form-input" placeholder="მაგ: მანიკური">
          </div>
          <div class="form-group">
            <label>კატეგორია *</label>
            <select id="slotCategory" class="form-input" required>
              <option value="">აირჩიეთ კატეგორია *</option>
              <option value="nails">💅 ფრჩხილები</option>
              <option value="hair">💇 თმა</option>
              <option value="face">✨ სახე</option>
              <option value="body">💆 სხეული</option>
              <option value="makeup">💄 მაკიაჟი</option>
              <option value="other">🎨 სხვა</option>
            </select>
          </div>
          <div class="form-group">
            <label>თარიღი *</label>
            <input type="date" id="slotDate" class="form-input" min="${today}">
          </div>
          <div class="form-group">
            <label>დროები * (მძიმით)</label>
            <input type="text" id="slotTimes" class="form-input" placeholder="10:00, 11:00, 12:00">
          </div>
          <div class="form-group">
            <label>ფასი (BP)</label>
            <input type="number" id="slotBpPrice" class="form-input" value="10" min="1">
          </div>
        </div>
        <button class="btn btn-primary" onclick="addSlots()" style="margin-top: 12px;">დამატება</button>
      </div>

      <!-- Таблица слотов -->
      <div class="admin-table">
        <table id="salonSlotsTable">
          <thead>
            <tr>
              <th>პროცედურა</th>
              <th>თარიღი</th>
              <th>დრო</th>
              <th>ფასი</th>
              <th>სტატუსი</th>
              <th>მოქმედებები</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="6" class="loading">იტვირთება...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  // Загружаем слоты с сервера
  if (typeof loadSalonSlots === 'function') {
    await loadSalonSlots();
  }
}

// NEW: Render Bookings Tab with Server Data
async function renderSalonBookingsTabNew(container) {
  container.innerHTML = `
    <div class="admin-section active">
      <div class="admin-toolbar">
        <h3>📋 ჯავშნები</h3>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-outline" onclick="showConfirmCodeModal()">🔢 კოდის შეყვანა</button>
          <button class="btn btn-primary" onclick="openQRScanner()">📷 QR სკანერი</button>
        </div>
      </div>
      
      <div class="info-box" style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <p style="color: #92400e; margin: 0;">
          <strong>ℹ️</strong> კლიენტი გაჩვენებთ კოდს ვიზიტის დროს. გააქტიურება შესაძლებელია მხოლოდ დანიშნულ დროს (±30 წუთი).
        </p>
      </div>

      <div class="admin-table">
        <table id="salonBookingsTable">
          <thead>
            <tr>
              <th>თარიღი</th>
              <th>დრო</th>
              <th>პროცედურა</th>
              <th>კლიენტი</th>
              <th>ტელეფონი</th>
              <th>სტატუსი</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="6" class="loading">იტვირთება...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  // Загружаем бронирования с сервера
  if (typeof loadSalonBookings === 'function') {
    await loadSalonBookings();
  }
}

// Render Slots Tab
function renderSalonSlotsTab(container) {
  container.innerHTML = `
    <div class="admin-section active">
      <div class="admin-toolbar">
        <h3>📅 Manage Time Slots</h3>
        <button class="btn btn-primary" onclick="showAddSlotModal()">+ Add Slots</button>
      </div>

      <div class="admin-stats">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-value">${salonData.slots.length}</div>
          <div class="stat-label">Total Slots</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${salonData.slots.filter(s => s.status === 'available').length}</div>
          <div class="stat-label">Available</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-value">${salonData.slots.filter(s => s.status === 'booked').length}</div>
          <div class="stat-label">Booked</div>
        </div>
      </div>

      <div class="admin-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Service</th>
              <th>Status</th>
              <th>Client</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${salonData.slots.map(slot => `
              <tr>
                <td>${slot.date}</td>
                <td>${slot.time}</td>
                <td>${slot.category}</td>
                <td><span class="badge badge-${slot.status}">${slot.status}</span></td>
                <td>${slot.clientEmail || '-'}</td>
                <td>
                  <div class="admin-actions">
                    ${slot.status === 'available' ? 
                      `<button class="admin-btn admin-btn-delete" onclick="deleteSalonSlot('${slot.id}')">🗑️ Delete</button>` :
                      `<button class="admin-btn admin-btn-view" onclick="viewSlotBooking('${slot.id}')">👁️ View</button>`
                    }
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Render Bookings Tab
function renderSalonBookingsTab(container) {
  container.innerHTML = `
    <div class="admin-section active">
      <div class="admin-toolbar">
        <h3>📋 Client Bookings</h3>
      </div>

      <div class="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Service</th>
              <th>Client</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${salonData.bookings.map(booking => `
              <tr>
                <td>#${booking.id}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.serviceName}</td>
                <td>${booking.clientName}</td>
                <td>${booking.clientPhone || '-'}</td>
                <td><span class="badge badge-${booking.status}">${booking.status}</span></td>
                <td>
                  <div class="admin-actions">
                    <button class="admin-btn admin-btn-view" onclick="viewBookingDetails(${booking.id})">👁️ View</button>
                    <button class="admin-btn admin-btn-edit" onclick="chatWithClient('${booking.clientEmail}')">💬 Chat</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Render Analytics Tab
async function renderSalonAnalyticsTab(container) {
  container.innerHTML = `<div class="admin-section active"><h3>⏳ იტვირთება...</h3></div>`;
  
  try {
    const token = localStorage.getItem('salonToken') || localStorage.getItem('token');
    console.log('Analytics: Token exists?', !!token);
    
    if (!token) {
      container.innerHTML = `
        <div class="admin-section active">
          <div style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
            <h3 style="color: #dc2626;">გთხოვთ გაიაროთ ავტორიზაცია</h3>
            <p style="color: #666;">გამოდით და თავიდან შედით სისტემაში</p>
          </div>
        </div>
      `;
      return;
    }
    
    const response = await fetch('/api/salon-owner/finance', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Analytics: Response status', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Analytics error:', errorData);
      throw new Error(errorData.message || 'Failed to load finance data');
    }
    
    const data = await response.json();
    const { finance, stats, paymentBreakdown, recentBookings } = data;
    
    container.innerHTML = `
      <div class="admin-section active">
        <h3 style="color: #1e293b; font-size: 24px; margin-bottom: 24px;">💰 ფინანსები და ანალიტიკა</h3>
        
        <!-- ფინანსური სტატისტიკა -->
        <div class="admin-stats" style="margin-bottom: 30px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div class="stat-card" style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; padding: 20px; color: white; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3); min-height: 140px;">
            <div class="stat-icon" style="font-size: 32px; margin-bottom: 6px;">💵</div>
            <div class="stat-value" style="font-size: 26px; font-weight: 800; color: white;">${finance.totalRevenue} BP</div>
            <div class="stat-label" style="font-size: 12px; opacity: 0.95; font-weight: 500; color: white;">მთლიანი შემოსავალი</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 16px; padding: 20px; color: white; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3); min-height: 140px;">
            <div class="stat-icon" style="font-size: 32px; margin-bottom: 6px;">⏳</div>
            <div class="stat-value" style="font-size: 26px; font-weight: 800; color: white;">${finance.pendingRevenue} BP</div>
            <div class="stat-label" style="font-size: 12px; opacity: 0.95; font-weight: 500; color: white;">Escrow</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 16px; padding: 20px; color: white; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3); min-height: 140px;">
            <div class="stat-icon" style="font-size: 32px; margin-bottom: 6px;">✅</div>
            <div class="stat-value" style="font-size: 26px; font-weight: 800; color: white;">${finance.availableForWithdrawal} BP</div>
            <div class="stat-label" style="font-size: 12px; opacity: 0.95; font-weight: 500; color: white;">ხელმისაწვდომი</div>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 16px; padding: 20px; color: white; box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3); min-height: 140px;">
            <div class="stat-icon" style="font-size: 32px; margin-bottom: 6px;">📤</div>
            <div class="stat-value" style="font-size: 26px; font-weight: 800; color: white;">${finance.withdrawnRevenue} BP</div>
            <div class="stat-label" style="font-size: 12px; opacity: 0.95; font-weight: 500; color: white;">გამოტანილი</div>
          </div>
        </div>
        
        <!-- როგორ მუშაობს -->
        <div class="admin-form-section" style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #22c55e; margin-bottom: 20px; border-radius: 16px; padding: 20px;">
          <h4 style="color: #15803d; font-size: 18px; margin-bottom: 12px;">ℹ️ როგორ მუშაობს გადახდა?</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #166534; font-size: 15px; line-height: 1.8;">
            <li>კლიენტის ჯავშნის დროს BP იბლოკება (Escrow)</li>
            <li>QR კოდის/პინის დადასტურებისას BP გადმოდის თქვენს ანგარიშზე</li>
            <li>ვიზიტამდე 3+ დღით ადრე გაუქმება = BP ბრუნდება კლიენტს</li>
            <li>ვიზიტამდე 3 დღეზე ნაკლებით გაუქმება = BP რჩება თქვენ</li>
          </ul>
        </div>
        
        <!-- ჯავშნების სტატისტიკა -->
        <div class="admin-form-section" style="background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
          <h4 style="color: #1e293b; font-size: 18px; margin-bottom: 16px;">📊 ჯავშნები</h4>
          <div class="admin-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div class="stat-card" style="background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 24px; margin-bottom: 4px;">📋</div>
              <div style="font-size: 24px; font-weight: 800; color: #1e293b;">${stats.totalBookings}</div>
              <div style="font-size: 11px; color: #64748b;">სულ</div>
            </div>
            <div class="stat-card" style="background: #dcfce7; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #86efac;">
              <div style="font-size: 24px; margin-bottom: 4px;">✅</div>
              <div style="font-size: 24px; font-weight: 800; color: #166534;">${stats.completedBookings}</div>
              <div style="font-size: 11px; color: #166534;">დადასტურ.</div>
            </div>
            <div class="stat-card" style="background: #fee2e2; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #fca5a5;">
              <div style="font-size: 24px; margin-bottom: 4px;">❌</div>
              <div style="font-size: 24px; font-weight: 800; color: #dc2626;">${stats.cancelledBookings}</div>
              <div style="font-size: 11px; color: #dc2626;">გაუქმებული</div>
            </div>
            <div class="stat-card" style="background: #dbeafe; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #93c5fd;">
              <div style="font-size: 24px; margin-bottom: 4px;">📈</div>
              <div style="font-size: 24px; font-weight: 800; color: #1e40af;">${stats.conversionRate}%</div>
              <div style="font-size: 11px; color: #1e40af;">კონვერსია</div>
            </div>
          </div>
        </div>
        
        <!-- უახლესი ტრანზაქციები -->
        <div class="admin-form-section" style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <h4 style="color: #1e293b; font-size: 18px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">📜</span> ბოლო ტრანზაქციები
          </h4>
          <div style="max-height: 400px; overflow-y: auto; border-radius: 12px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); text-align: left;">
                  <th style="padding: 14px 12px; font-weight: 600; color: #475569; font-size: 13px;">სერვისი</th>
                  <th style="padding: 14px 12px; font-weight: 600; color: #475569; font-size: 13px;">BP</th>
                  <th style="padding: 14px 12px; font-weight: 600; color: #475569; font-size: 13px;">სტატუსი</th>
                  <th style="padding: 14px 12px; font-weight: 600; color: #475569; font-size: 13px;">თარიღი</th>
                </tr>
              </thead>
              <tbody>
                ${recentBookings.length > 0 ? recentBookings.map((b, index) => `
                  <tr style="border-bottom: 1px solid #f1f5f9; background: ${index % 2 === 0 ? '#ffffff' : '#fafbfc'}; transition: background 0.2s;" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='${index % 2 === 0 ? '#ffffff' : '#fafbfc'}'">
                    <td style="padding: 14px 12px; color: #334155; font-weight: 500;">${b.serviceName}</td>
                    <td style="padding: 14px 12px; font-weight: 700; color: #059669;">${b.bpPrice} BP</td>
                    <td style="padding: 14px 12px;">
                      ${getPaymentStatusBadge(b.paymentStatus, b.status)}
                    </td>
                    <td style="padding: 14px 12px; color: #64748b; font-size: 13px;">${new Date(b.createdAt).toLocaleDateString('ka-GE')}</td>
                  </tr>
                `).join('') : '<tr><td colspan="4" style="padding: 40px; text-align: center; color: #94a3b8; font-size: 14px;">📭 ტრანზაქციები არ არის</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading finance:', error);
    container.innerHTML = `
      <div class="admin-section active">
        <h3>❌ შეცდომა</h3>
        <p>ფინანსური მონაცემების ჩატვირთვა ვერ მოხერხდა</p>
        <button class="btn btn-primary" onclick="renderSalonAnalyticsTab(this.parentElement.parentElement)">🔄 სცადეთ თავიდან</button>
      </div>
    `;
  }
}

// Helper for payment status badge
function getPaymentStatusBadge(paymentStatus, bookingStatus) {
  if (bookingStatus === 'cancelled') {
    if (paymentStatus === 'refunded') {
      return '<span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px;">↩️ დაბრუნდა კლიენტს</span>';
    } else if (paymentStatus === 'released') {
      return '<span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 4px; font-size: 12px;">💵 გაუქმების საკომისიო</span>';
    }
  }
  
  switch (paymentStatus) {
    case 'escrow':
      return '<span style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-size: 12px;">⏳ მომლოდინე</span>';
    case 'released':
      return '<span style="background: #dcfce7; color: #16a34a; padding: 4px 8px; border-radius: 4px; font-size: 12px;">✅ ჩარიცხული</span>';
    case 'refunded':
      return '<span style="background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px;">↩️ დაბრუნებული</span>';
    default:
      return '<span style="background: #f3f4f6; color: #6b7280; padding: 4px 8px; border-radius: 4px; font-size: 12px;">—</span>';
  }
}

// Render Profile Tab
function renderSalonProfileTab(container) {
  const salon = SALONS.find(s => s.name === salonData.salonName);
  if (!salon) return;

  container.innerHTML = `
    <div class="admin-section active">
      <h3>⚙️ Salon Profile Settings</h3>
      
      <div class="admin-form-section">
        <h4>Salon Information</h4>
        <div class="admin-form-grid">
          <div class="form-group">
            <label>Salon Name</label>
            <input type="text" class="form-input" value="${salon.name}" id="profileSalonName">
          </div>
          <div class="form-group">
            <label>Location</label>
            <input type="text" class="form-input" value="${salon.location}" id="profileSalonLocation">
          </div>
          <div class="form-group">
            <label>Address</label>
            <input type="text" class="form-input" value="${salon.address}" id="profileSalonAddress">
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" class="form-input" value="${salon.phone}" id="profileSalonPhone">
          </div>
        </div>
        <div class="admin-modal-actions">
          <button class="btn btn-primary" onclick="saveSalonProfile()">💾 Save Changes</button>
        </div>
      </div>
    </div>
  `;
}

// Add Slot Modal
function showAddSlotModal() {
  const content = `
    <form class="admin-modal-form" onsubmit="addSalonSlots(); return false;">
      <div class="form-group">
        <label>Service Category</label>
        <select class="form-input" id="newSlotCategory" required>
          <option value="">Select category</option>
          <option value="Nails">Nails</option>
          <option value="Hair">Hair</option>
          <option value="Makeup">Makeup</option>
          <option value="Spa">Spa</option>
          <option value="Massage">Massage</option>
          <option value="Pedicure">Pedicure</option>
        </select>
      </div>
      <div class="form-group">
        <label>Date</label>
        <input type="date" class="form-input" id="newSlotDate" required>
      </div>
      <div class="form-group">
        <label>Times (comma-separated, e.g: 10:00, 12:30, 15:00)</label>
        <input type="text" class="form-input" id="newSlotTimes" placeholder="10:00, 12:30, 15:00" required>
      </div>
      <div class="admin-modal-actions">
        <button type="button" class="btn btn-outline" onclick="closeAdminModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Slots</button>
      </div>
    </form>
  `;
  
  showAdminModal('Add Time Slots', content);
}

// Add Salon Slots
function addSalonSlots() {
  const category = document.getElementById('newSlotCategory').value;
  const date = document.getElementById('newSlotDate').value;
  const timesStr = document.getElementById('newSlotTimes').value;
  
  const times = timesStr.split(',').map(t => t.trim()).filter(t => t);
  
  const allSlots = JSON.parse(localStorage.getItem('salon_slots') || '[]');
  
  times.forEach(time => {
    const slot = {
      id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      salonName: salonData.salonName,
      category,
      date,
      time,
      status: 'available',
      clientEmail: null,
      createdAt: new Date().toISOString()
    };
    
    allSlots.push(slot);
    salonData.slots.push(slot);
  });
  
  localStorage.setItem('salon_slots', JSON.stringify(allSlots));
  
  // Update SALONS array with new slots
  const salonIndex = SALONS.findIndex(s => s.name === salonData.salonName);
  if (salonIndex !== -1) {
    if (!SALONS[salonIndex].slots) SALONS[salonIndex].slots = [];
    times.forEach(time => {
      SALONS[salonIndex].slots.push({
        id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        category,
        date,
        time,
        status: 'available'
      });
    });
    saveAdminDataToStorage();
    
    // Trigger global refresh
    window.dispatchEvent(new Event('admin-data-changed'));
  }
  
  closeAdminModal();
  switchSalonTab('slots');
  showToast(`✅ Added ${times.length} time slots!`, 'success');
}

// Delete Salon Slot
function deleteSalonSlot(slotId) {
  if (!confirm('Delete this slot?')) return;
  
  const allSlots = JSON.parse(localStorage.getItem('salon_slots') || '[]');
  const filtered = allSlots.filter(s => s.id !== slotId);
  localStorage.setItem('salon_slots', JSON.stringify(filtered));
  
  salonData.slots = salonData.slots.filter(s => s.id !== slotId);
  
  // Update SALONS array
  const salonIndex = SALONS.findIndex(s => s.name === salonData.salonName);
  if (salonIndex !== -1 && SALONS[salonIndex].slots) {
    SALONS[salonIndex].slots = SALONS[salonIndex].slots.filter(s => s.id !== slotId);
    saveAdminDataToStorage();
    
    // Trigger global refresh
    window.dispatchEvent(new Event('admin-data-changed'));
  }
  
  switchSalonTab('slots');
  showToast('Slot deleted', 'success');
}

// Save Salon Profile
function saveSalonProfile() {
  const name = document.getElementById('profileSalonName').value;
  const location = document.getElementById('profileSalonLocation').value;
  const address = document.getElementById('profileSalonAddress').value;
  const phone = document.getElementById('profileSalonPhone').value;
  
  const salonIndex = SALONS.findIndex(s => s.name === salonData.salonName);
  if (salonIndex !== -1) {
    SALONS[salonIndex].location = location;
    SALONS[salonIndex].address = address;
    SALONS[salonIndex].phone = phone;
    
    saveAdminDataToStorage();
    
    // Trigger refresh for all users
    if (window.location.hash === '#salons') {
      renderSalonsGrid();
    }
    
    showToast('✅ Profile updated!', 'success');
  }
}

// Open Salon Chat
function openSalonChat() {
  openGlobalChat();
}

// Chat with client
function chatWithClient(clientEmail) {
  openGlobalChat();
  selectChatConversation(clientEmail);
}

// ===== GLOBAL CHAT SYSTEM =====

let chatData = {
  conversations: [],
  messages: [],
  activeConversation: null
};

// Initialize Chat
async function initChat() {
  // Try to load from API, fallback to localStorage
  const currentUserEmail = state.user?.email || salonData.salonEmail || adminData.email;
  const useBackend = typeof CONFIG !== 'undefined' && CONFIG.USE_BACKEND;
  if (currentUserEmail && useBackend) {
    try {
      const response = await fetch(`https://beauty-pass-api.onrender.com/api/chat/conversations/${currentUserEmail}`);
      if (response.ok) {
        chatData.conversations = await response.json();
      }
    } catch (error) {
      console.warn('Failed to load conversations from API:', error);
      chatData.conversations = JSON.parse(localStorage.getItem('chat_conversations') || '[]');
    }
  } else {
    chatData.conversations = JSON.parse(localStorage.getItem('chat_conversations') || '[]');
  }
  chatData.messages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
  updateChatBadge();
}

// Open Global Chat
function openGlobalChat() {
  initChat();
  
  const modal = document.getElementById('chatModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  renderChatConversations();
}

// Close Chat Modal
function closeChatModal() {
  const modal = document.getElementById('chatModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Render Chat Conversations
function renderChatConversations() {
  const container = document.getElementById('chatConversations');
  const currentUserEmail = state.user?.email || salonData.salonEmail || adminData.email;
  
  // Get unique conversations
  const convos = new Set();
  chatData.messages.forEach(msg => {
    if (msg.from === currentUserEmail) convos.add(msg.to);
    if (msg.to === currentUserEmail) convos.add(msg.from);
  });
  
  const conversationsList = Array.from(convos).map(email => {
    const msgs = chatData.messages.filter(m => 
      (m.from === currentUserEmail && m.to === email) || 
      (m.from === email && m.to === currentUserEmail)
    );
    const lastMsg = msgs[msgs.length - 1];
    const unread = msgs.filter(m => m.to === currentUserEmail && !m.read).length;
    
    return {
      email,
      lastMessage: lastMsg?.text || '',
      lastTime: lastMsg?.timestamp || 0,
      unread
    };
  }).sort((a, b) => b.lastTime - a.lastTime);
  
  container.innerHTML = conversationsList.map(conv => `
    <div class="chat-conversation-item ${chatData.activeConversation === conv.email ? 'active' : ''}" 
         onclick="selectChatConversation('${conv.email}')">
      <div class="chat-conversation-avatar">${conv.email[0].toUpperCase()}</div>
      <div class="chat-conversation-info">
        <div class="chat-conversation-name">${conv.email}</div>
        <div class="chat-conversation-preview">${conv.lastMessage.substring(0, 30)}...</div>
        ${conv.unread > 0 ? `<span class="chat-conversation-unread">${conv.unread}</span>` : ''}
      </div>
      <div class="chat-conversation-time">${formatChatTime(conv.lastTime)}</div>
    </div>
  `).join('');
  
  // Show empty state if no conversations
  if (conversationsList.length === 0) {
    container.innerHTML = '<div class="chat-empty-state"><p>No conversations yet</p></div>';
  }
}

// Select Chat Conversation
async function selectChatConversation(email) {
  chatData.activeConversation = email;
  const currentUserEmail = state.user?.email || salonData.salonEmail || adminData.email;
  
  document.getElementById('chatUserName').textContent = email;
  
  // Load messages from API
  try {
    const response = await fetch(`https://beauty-pass-api.onrender.com/api/chat/messages?user1=${currentUserEmail}&user2=${email}`);
    if (response.ok) {
      const apiMessages = await response.json();
      
      // Convert to local format
      chatData.messages = apiMessages.map(msg => ({
        id: msg.id,
        from: msg.from_email,
        to: msg.to_email,
        text: msg.message_text,
        timestamp: new Date(msg.created_at).getTime(),
        read: msg.is_read
      }));
      
      saveChatMessages(); // Backup to localStorage
    }
  } catch (error) {
    console.warn('Failed to load messages from API:', error);
  }
  
  renderChatMessages();
  renderChatConversations(); // Refresh to show active state
  
  // Mark messages as read in API
  try {
    await fetch('https://beauty-pass-api.onrender.com/api/chat/mark-read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_email: email, to_email: currentUserEmail })
    });
  } catch (error) {
    console.warn('Failed to mark messages as read:', error);
  }
  
  // Mark locally
  chatData.messages.forEach(msg => {
    if (msg.from === email && msg.to === currentUserEmail) {
      msg.read = true;
    }
  });
  saveChatMessages();
  updateChatBadge();
}

// Render Chat Messages
function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  const currentUserEmail = state.user?.email || salonData.salonEmail || adminData.email;
  
  if (!chatData.activeConversation) {
    container.innerHTML = '<div class="chat-empty-state"><p>Select a conversation to start messaging</p></div>';
    return;
  }
  
  const messages = chatData.messages.filter(m => 
    (m.from === currentUserEmail && m.to === chatData.activeConversation) ||
    (m.from === chatData.activeConversation && m.to === currentUserEmail)
  );
  
  container.innerHTML = messages.map(msg => {
    const isSent = msg.from === currentUserEmail;
    return `
      <div class="chat-message ${isSent ? 'sent' : ''}">
        <div class="chat-message-avatar">${msg.from[0].toUpperCase()}</div>
        <div class="chat-message-content">
          <div class="chat-message-bubble">
            <div class="chat-message-text">${msg.text}</div>
          </div>
          <div class="chat-message-time">${formatChatTime(msg.timestamp)}</div>
        </div>
      </div>
    `;
  }).join('');
  
  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// Send Chat Message
async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  
  if (!text || !chatData.activeConversation) return;
  
  const currentUserEmail = state.user?.email || salonData.salonEmail || adminData.email;
  
  const messageData = {
    from_email: currentUserEmail,
    to_email: chatData.activeConversation,
    message_text: text
  };
  
  try {
    // Send to API
    const response = await fetch('https://beauty-pass-api.onrender.com/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    
    if (response.ok) {
      const savedMessage = await response.json();
      
      // Add to local cache
      const message = {
        id: savedMessage.id,
        from: savedMessage.from_email,
        to: savedMessage.to_email,
        text: savedMessage.message_text,
        timestamp: new Date(savedMessage.created_at).getTime(),
        read: savedMessage.is_read
      };
      
      chatData.messages.push(message);
      saveChatMessages(); // Save to localStorage as backup
      
      input.value = '';
      renderChatMessages();
      renderChatConversations();
      updateChatBadge();
    } else {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    console.error('Send message error:', error);
    showToast('შეტყობინება ვერ გაიგზავნა', 'error');
  }
}

// Filter Chat Conversations
function filterChatConversations(search) {
  const items = document.querySelectorAll('.chat-conversation-item');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(search.toLowerCase()) ? '' : 'none';
  });
}

// Save Chat Messages
function saveChatMessages() {
  localStorage.setItem('chat_messages', JSON.stringify(chatData.messages));
}

// Update Chat Badge
function updateChatBadge() {
  const currentUserEmail = state.user?.email || salonData.salonEmail || adminData.email;
  const unread = chatData.messages.filter(m => m.to === currentUserEmail && !m.read).length;
  
  const badge = document.getElementById('chatBadge');
  if (!badge) return; // Badge element not found, skip
  
  if (unread > 0) {
    badge.textContent = unread;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// Format Chat Time
function formatChatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
  return date.toLocaleDateString();
}

// ======================================
// SLOTS MANAGEMENT - NEW
// ======================================

// Load salon slots from server
async function loadSalonSlots() {
  const tbody = document.querySelector('#salonSlotsTable tbody');
  if (!tbody) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/salon/slots', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load slots');
    
    const slots = await response.json();
    
    if (slots.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #999;">სლოტები არ არის. დაამატეთ ახალი სლოტები!</td></tr>';
      return;
    }
    
    tbody.innerHTML = slots.map(slot => `
      <tr data-slot-id="${slot._id}">
        <td>
          <strong>${slot.serviceName}</strong>
          ${slot.specialistName ? `<br><small style="color:#888;">👤 ${slot.specialistName}</small>` : ''}
        </td>
        <td>${slot.date}</td>
        <td>${slot.time}</td>
        <td>${slot.bpPrice} BP</td>
        <td>
          <span class="status-badge ${slot.isBooked ? 'status-booked' : 'status-available'}">
            ${slot.isBooked ? '🔴 დაკავებული' : '🟢 თავისუფალი'}
          </span>
        </td>
        <td style="display: flex; gap: 8px;">
          ${!slot.isBooked ? `
            <button class="btn btn-sm btn-outline" onclick="editSlot('${slot._id}')" title="რედაქტირება">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSlot('${slot._id}')" title="წაშლა">❌</button>
          ` : '-'}
        </td>
      </tr>
    `).join('');
    
  } catch (error) {
    console.error('Load slots error:', error);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">შეცდომა სლოტების ჩატვირთვისას</td></tr>';
  }
}

// Add slots wrapper - gets values from form
window.addSlots = async function() {
  const specialistEl = document.getElementById('slotSpecialist');
  const specialistId = specialistEl?.value;
  const specialistName = specialistEl?.options[specialistEl.selectedIndex]?.dataset.name || '';
  
  const serviceName = document.getElementById('slotServiceName')?.value?.trim();
  const category = document.getElementById('slotCategory')?.value;
  const date = document.getElementById('slotDate')?.value;
  const timesStr = document.getElementById('slotTimes')?.value?.trim();
  const bpPrice = parseInt(document.getElementById('slotBpPrice')?.value) || 10;
  
  if (!specialistId) {
    showToast('აირჩიეთ სპეციალისტი!', 'error');
    return;
  }
  
  if (!serviceName) {
    showToast('შეიყვანეთ პროცედურის სახელი!', 'error');
    return;
  }
  
  if (!category) {
    showToast('აირჩიეთ კატეგორია!', 'error');
    return;
  }
  
  if (!date) {
    showToast('აირჩიეთ თარიღი!', 'error');
    return;
  }
  
  if (!timesStr) {
    showToast('შეიყვანეთ დროები!', 'error');
    return;
  }
  
  // Parse times
  const times = timesStr.split(',').map(t => t.trim()).filter(t => /^\d{1,2}:\d{2}$/.test(t));
  
  if (times.length === 0) {
    showToast('არასწორი დროის ფორმატი! გამოიყენეთ: 10:00, 11:00', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/salon/specialists/${specialistId}/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        date,
        times,
        serviceName,
        serviceCategory: category,
        bpPrice
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showToast(result.message, 'success');
      // Clear form
      document.getElementById('slotServiceName').value = '';
      document.getElementById('slotTimes').value = '';
      // Reload slots
      await loadSalonSlots();
    } else {
      showToast(result.message || 'შეცდომა', 'error');
    }
    
  } catch (error) {
    console.error('Add slots error:', error);
    showToast('სერვერის შეცდომა', 'error');
  }
};

// Edit slot - show modal
window.editSlot = async function(slotId) {
  // Load slot data
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/salon-owner/my-slots', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load slots');
    
    const slots = await response.json();
    const slot = slots.find(s => s._id === slotId);
    
    if (!slot) {
      showToast('სლოტი ვერ მოიძებნა', 'error');
      return;
    }
    
    // Load specialists for dropdown
    let specialists = [];
    try {
      const specResp = await fetch('/api/salon-owner/specialists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (specResp.ok) specialists = await specResp.json();
    } catch (e) {}
    
    const today = new Date().toISOString().split('T')[0];
    
    const specialistOptions = specialists.map(s => 
      `<option value="${s._id}" data-name="${s.name}" ${slot.specialistId === s._id ? 'selected' : ''}>${s.name}</option>`
    ).join('');
    
    let modal = document.getElementById('editSlotModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'editSlotModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>✏️ სლოტის რედაქტირება</h3>
          <button class="modal-close" onclick="closeEditSlotModal()">✕</button>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <input type="hidden" id="editSlotId" value="${slotId}">
          
          <div class="form-group">
            <label>სპეციალისტი</label>
            <select id="editSlotSpecialist" class="form-input">
              ${specialistOptions}
            </select>
          </div>
          
          <div class="form-group">
            <label>პროცედურა</label>
            <input type="text" id="editSlotServiceName" class="form-input" value="${slot.serviceName || ''}">
          </div>
          
          <div class="form-group">
            <label>კატეგორია</label>
            <select id="editSlotCategory" class="form-input">
              <option value="nails" ${slot.serviceCategory === 'nails' ? 'selected' : ''}>💅 ფრჩხილები</option>
              <option value="hair" ${slot.serviceCategory === 'hair' ? 'selected' : ''}>💇 თმა</option>
              <option value="face" ${slot.serviceCategory === 'face' ? 'selected' : ''}>✨ სახე</option>
              <option value="body" ${slot.serviceCategory === 'body' ? 'selected' : ''}>💆 სხეული</option>
              <option value="makeup" ${slot.serviceCategory === 'makeup' ? 'selected' : ''}>💄 მაკიაჟი</option>
              <option value="other" ${slot.serviceCategory === 'other' ? 'selected' : ''}>🎨 სხვა</option>
            </select>
          </div>
          
          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label>თარიღი</label>
              <input type="date" id="editSlotDate" class="form-input" value="${slot.date}" min="${today}">
            </div>
            <div class="form-group">
              <label>დრო</label>
              <input type="time" id="editSlotTime" class="form-input" value="${slot.time}">
            </div>
          </div>
          
          <div class="form-group">
            <label>ფასი (BP)</label>
            <input type="number" id="editSlotBpPrice" class="form-input" value="${slot.bpPrice || 10}" min="1">
          </div>
          
          <button class="btn btn-primary btn-block" onclick="saveSlotEdit()">💾 შენახვა</button>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
    
  } catch (error) {
    console.error('Edit slot error:', error);
    showToast('შეცდომა სლოტის ჩატვირთვისას', 'error');
  }
};

window.closeEditSlotModal = function() {
  const modal = document.getElementById('editSlotModal');
  if (modal) modal.style.display = 'none';
};

window.saveSlotEdit = async function() {
  const slotId = document.getElementById('editSlotId').value;
  const specialistEl = document.getElementById('editSlotSpecialist');
  const specialistId = specialistEl?.value;
  const specialistName = specialistEl?.options[specialistEl.selectedIndex]?.dataset.name || '';
  
  const serviceName = document.getElementById('editSlotServiceName').value.trim();
  const serviceCategory = document.getElementById('editSlotCategory').value;
  const date = document.getElementById('editSlotDate').value;
  const time = document.getElementById('editSlotTime').value;
  const bpPrice = parseInt(document.getElementById('editSlotBpPrice').value) || 10;
  
  if (!serviceName || !date || !time) {
    showToast('შეავსეთ ყველა ველი', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/salon/slots/${slotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        serviceName,
        serviceCategory,
        date,
        time,
        bpPrice,
        specialistId,
        specialistName
      })
    });
    
    if (response.ok) {
      showToast('სლოტი განახლებულია', 'success');
      closeEditSlotModal();
      await loadSalonSlots();
    } else {
      const result = await response.json();
      showToast(result.message || 'შეცდომა', 'error');
    }
  } catch (error) {
    console.error('Save slot error:', error);
    showToast('სერვერის შეცდომა', 'error');
  }
};

// Delete slot
window.deleteSlot = async function(slotId) {
  if (!confirm('ნამდვილად გსურთ სლოტის წაშლა?')) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/salon/slots/${slotId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      showToast('სლოტი წაშლილია', 'success');
      await loadSalonSlots();
    } else {
      const result = await response.json();
      showToast(result.message || 'შეცდომა', 'error');
    }
  } catch (error) {
    console.error('Delete slot error:', error);
    showToast('სერვერის შეცდომა', 'error');
  }
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  populateSalonDropdown();
  initChat();
  
  // Check salon auth
  const salonAuth = JSON.parse(localStorage.getItem('salon_auth') || 'null');
  if (salonAuth && (Date.now() - salonAuth.timestamp < 24 * 60 * 60 * 1000)) {
    salonData.isLoggedIn = true;
    salonData.salonName = salonAuth.salonName;
    salonData.salonEmail = salonAuth.email;
    
    // Update profile circle for salon
    setTimeout(() => {
      if (typeof updateProfileCircle === 'function') updateProfileCircle();
      if (typeof updateAuthUI === 'function') updateAuthUI();
    }, 100);
    
    if (window.location.hash === '#salon' || window.location.hash === '#salonProfile') {
      document.getElementById('salonLoginCard').style.display = 'none';
      document.getElementById('salonDashboard').style.display = 'block';
      document.getElementById('dashboardSalonName').textContent = '🏢 ' + salonAuth.salonName;
      document.getElementById('dashboardSalonEmail').textContent = salonAuth.email;
      
      loadSalonData();
      switchSalonTab('slots');
    }
  }
});
