// ===== Beauty Pass - Payment Integration (BOG & TBC) =====
'use strict';

// ======================================
// PAYMENT CONFIG - настройки для банков
// ======================================
const PAYMENT_CONFIG = {
  // Использовать ли реальный бэкенд
  USE_BACKEND: true,
  
  // Bank of Georgia iPay Integration
  BOG: {
    enabled: true,
    testMode: true, // true = тестовый режим, false = продакшн
    // Для реальной интеграции нужно получить от BOG:
    merchantId: 'YOUR_BOG_MERCHANT_ID',
    secretKey: 'YOUR_BOG_SECRET_KEY',
    // URL для тестового режима
    testUrl: 'https://ipay.ge/opay/test',
    // URL для продакшна
    prodUrl: 'https://ipay.ge/opay/pay',
    // Callback URL после оплаты
    callbackUrl: window.location.origin + '/api/payment/bog/callback',
    // URL для редиректа
    returnUrl: window.location.origin + '/#client'
  },
  
  // TBC Pay Integration
  TBC: {
    enabled: true,
    testMode: true,
    // Для реальной интеграции нужно получить от TBC:
    merchantId: 'YOUR_TBC_MERCHANT_ID', 
    secretKey: 'YOUR_TBC_SECRET_KEY',
    // URL для тестового режима
    testUrl: 'https://ecommerce.ufc.ge/ecomm2/MerchantHandler',
    // URL для продакшна
    prodUrl: 'https://securepay.ufc.ge/ecomm2/MerchantHandler',
    // Callback URL
    callbackUrl: window.location.origin + '/api/payment/tbc/callback',
    returnUrl: window.location.origin + '/#client'
  },

  // Минимальная/максимальная сумма
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 10000,
  
  // Комиссия (0 = без комиссии)
  FEE_PERCENT: 0
};

const PaymentSystem = {
  // Supported payment methods
  methods: {
    BOG: {
      name: 'Bank of Georgia',
      nameKa: 'საქართველოს ბანკი',
      icon: '🏦',
      color: '#FF6B00',
      logo: 'bog-logo.png',
      enabled: PAYMENT_CONFIG.BOG.enabled
    },
    TBC: {
      name: 'TBC Bank',
      nameKa: 'თიბისი ბანკი',
      icon: '🏦',
      color: '#00A0E3',
      logo: 'tbc-logo.png',
      enabled: PAYMENT_CONFIG.TBC.enabled
    }
  },
  
  // Current transaction
  currentTransaction: null,
  
  // Initialize payment system
  init: function() {
    console.log('✅ PaymentSystem initialized');
    console.log('🏦 BOG:', PAYMENT_CONFIG.BOG.testMode ? 'Test Mode' : 'Production');
    console.log('🏦 TBC:', PAYMENT_CONFIG.TBC.testMode ? 'Test Mode' : 'Production');
  },
  
  // Close modal helper
  closePaymentModal: function() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  },
  
  // Open modal helper
  openPaymentModal: function() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  },
  
  // Show top-up modal
  showTopUpModal: function() {
    const modal = document.getElementById('bookingModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalTitle || !modalBody) {
      console.error('Modal elements not found');
      showToast('შეცდომა: მოდალური ფანჯარა ვერ მოიძებნა', 'error');
      return;
    }
    
    modalTitle.innerHTML = '<span data-ka="ბალანსის შევსება" data-en="Top Up Balance">ბალანსის შევსება / Top Up Balance</span>';
    
    modalBody.innerHTML = `
      <div class="payment-modal">
        <div class="payment-amounts">
          <h4>აირჩიეთ თანხა / Select Amount</h4>
          <div class="amount-grid">
            <button class="amount-btn" onclick="PaymentSystem.selectAmount(20, this)">20₾</button>
            <button class="amount-btn" onclick="PaymentSystem.selectAmount(50, this)">50₾</button>
            <button class="amount-btn popular" onclick="PaymentSystem.selectAmount(100, this)">
              100₾
              <span class="popular-tag">პოპულარული</span>
            </button>
            <button class="amount-btn" onclick="PaymentSystem.selectAmount(200, this)">200₾</button>
          </div>
          <div class="custom-amount">
            <label>ან შეიყვანეთ თანხა / Or enter amount:</label>
            <div class="input-with-suffix">
              <input type="number" id="customAmount" min="${PAYMENT_CONFIG.MIN_AMOUNT}" max="${PAYMENT_CONFIG.MAX_AMOUNT}" placeholder="50" oninput="PaymentSystem.handleCustomAmount()">
              <span class="suffix">₾</span>
            </div>
          </div>
        </div>
        
        <div class="payment-methods">
          <h4>გადახდის მეთოდი / Payment Method</h4>
          <div class="method-options">
            ${PAYMENT_CONFIG.BOG.enabled ? `
            <button class="method-btn" onclick="PaymentSystem.selectMethod('BOG', this)" id="methodBOG">
              <span class="method-icon" style="color: #FF6B00;">🏦</span>
              <span class="method-name">
                <strong>Bank of Georgia</strong>
                <small>საქართველოს ბანკი</small>
              </span>
              ${PAYMENT_CONFIG.BOG.testMode ? '<span class="test-badge">TEST</span>' : ''}
            </button>
            ` : ''}
            ${PAYMENT_CONFIG.TBC.enabled ? `
            <button class="method-btn" onclick="PaymentSystem.selectMethod('TBC', this)" id="methodTBC">
              <span class="method-icon" style="color: #00A0E3;">🏦</span>
              <span class="method-name">
                <strong>TBC Bank</strong>
                <small>თიბისი ბანკი</small>
              </span>
              ${PAYMENT_CONFIG.TBC.testMode ? '<span class="test-badge">TEST</span>' : ''}
            </button>
            ` : ''}
          </div>
        </div>
        
        <div class="payment-summary" id="paymentSummary" style="display: none;">
          <div class="summary-row">
            <span>თანხა / Amount:</span>
            <span id="summaryAmount">0₾</span>
          </div>
          <div class="summary-row">
            <span>საკომისიო / Fee:</span>
            <span id="summaryFee">0₾</span>
          </div>
          <div class="summary-row total">
            <span>სულ / Total:</span>
            <span id="summaryTotal">0₾</span>
          </div>
        </div>
        
        <div class="payment-actions">
          <button class="btn btn-primary btn-block btn-large" id="payBtn" disabled onclick="PaymentSystem.processPayment()">
            გადახდა / Pay
          </button>
          <p class="payment-note">
            <span class="lock-icon">🔒</span>
            უსაფრთხო გადახდა SSL • დადასტურება მოვა ელფოსტაზე
          </p>
        </div>
      </div>
    `;
    
    // Reset state with auto-selected method
    this.currentTransaction = {
      amount: 0,
      method: PAYMENT_CONFIG.BOG.enabled ? 'BOG' : (PAYMENT_CONFIG.TBC.enabled ? 'TBC' : null)
    };
    
    // Open modal
    this.openPaymentModal();
    
    // Auto-select first payment method
    setTimeout(() => {
      const firstMethod = document.getElementById('methodBOG') || document.getElementById('methodTBC');
      if (firstMethod) {
        firstMethod.classList.add('selected');
      }
    }, 100);
  },
  
  // Select amount
  selectAmount: function(amount, btn) {
    this.currentTransaction.amount = amount;
    
    // Update UI
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');
    
    // Clear custom amount
    const customInput = document.getElementById('customAmount');
    if (customInput) customInput.value = '';
    
    this.updateSummary();
  },
  
  // Handle custom amount input
  handleCustomAmount: function() {
    const input = document.getElementById('customAmount');
    if (!input) return;
    
    const amount = parseInt(input.value) || 0;
    
    if (amount >= PAYMENT_CONFIG.MIN_AMOUNT && amount <= PAYMENT_CONFIG.MAX_AMOUNT) {
      this.currentTransaction.amount = amount;
      document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
      this.updateSummary();
    } else if (amount > PAYMENT_CONFIG.MAX_AMOUNT) {
      input.value = PAYMENT_CONFIG.MAX_AMOUNT;
      this.currentTransaction.amount = PAYMENT_CONFIG.MAX_AMOUNT;
      this.updateSummary();
    }
  },
  
  // Select payment method
  selectMethod: function(method, btn) {
    this.currentTransaction.method = method;
    
    // Update UI
    document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');
    
    this.updateSummary();
  },
  
  // Update payment summary
  updateSummary: function() {
    const summary = document.getElementById('paymentSummary');
    const payBtn = document.getElementById('payBtn');
    
    if (!summary || !payBtn) return;
    
    const amount = this.currentTransaction?.amount || 0;
    const method = this.currentTransaction?.method;
    
    // Активируем кнопку если выбрана сумма (метод выбран автоматически)
    if (amount > 0) {
      const fee = Math.round(amount * PAYMENT_CONFIG.FEE_PERCENT / 100);
      const total = amount + fee;
      
      const summaryAmount = document.getElementById('summaryAmount');
      const summaryFee = document.getElementById('summaryFee');
      const summaryTotal = document.getElementById('summaryTotal');
      
      if (summaryAmount) summaryAmount.textContent = `${amount}₾`;
      if (summaryFee) summaryFee.textContent = fee > 0 ? `${fee}₾` : 'უფასო / Free';
      if (summaryTotal) summaryTotal.textContent = `${total}₾`;
      
      summary.style.display = 'block';
      payBtn.disabled = false;
      payBtn.textContent = `გადახდა ${total}₾ / Pay ${total}₾`;
      payBtn.style.opacity = '1';
      payBtn.style.cursor = 'pointer';
    } else {
      summary.style.display = 'none';
      payBtn.disabled = true;
      payBtn.textContent = 'გადახდა / Pay';
    }
  },
  
  // Process payment
  processPayment: async function() {
    const { amount, method } = this.currentTransaction || {};
    
    if (!amount || !method) {
      showToast('აირჩიეთ თანხა და მეთოდი', 'error');
      return;
    }
    
    // Check if user is logged in
    const user = (typeof currentUser !== 'undefined' && currentUser) || (typeof state !== 'undefined' && state.user);
    const token = localStorage.getItem('token');
    
    if (!user?.email || !token) {
      showToast('გთხოვთ შეხვიდეთ სისტემაში', 'error');
      this.closePaymentModal();
      if (typeof showLoginForm === 'function') {
        showLoginForm();
      } else if (typeof navigate === 'function') {
        navigate('client');
      }
      return;
    }
    
    // Show loading state
    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.innerHTML = '<span class="spinner"></span> დამუშავება...';
    }
    
    try {
      // Check if we should use real bank integration
      const bankConfig = PAYMENT_CONFIG[method];
      
      if (bankConfig && !bankConfig.testMode) {
        // Real bank integration
        await this.initiateBankPayment(method, amount, user);
      } else {
        // Demo/test mode - simulate payment
        await this.simulateBankRedirect(method, amount);
        
        // On success, update balance via API
        if (PAYMENT_CONFIG.USE_BACKEND && token) {
          try {
            const response = await fetch('/api/balance/add', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ amount })
            });
            
            if (response.ok) {
              const result = await response.json();
              // Update local user data
              if (typeof currentUser !== 'undefined' && currentUser) {
                currentUser.balance = result.user?.balance || (currentUser.balance || 0) + amount;
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                // Мгновенно обновляем UI (Seamless Experience)
                if (typeof updateUserUIElements === 'function') {
                  updateUserUIElements(currentUser);
                }
              }
              if (typeof state !== 'undefined' && state.user) {
                state.user.balance = result.user?.balance || (state.user.balance || 0) + amount;
              }
            }
          } catch (apiError) {
            console.error('API Error:', apiError);
          }
        }
        
        // Close modal and show success
        this.closePaymentModal();
        showToast(`ბალანსი შეივსო: +${amount}₾`, 'success');
        
        // Мгновенно обновляем баланс в UI
        const balanceEl = document.getElementById("userBalance");
        if (balanceEl && typeof currentUser !== 'undefined' && currentUser) {
          balanceEl.textContent = (currentUser.balance || 0) + "₾";
          balanceEl.classList.add('value-updated');
          setTimeout(() => balanceEl.classList.remove('value-updated'), 1000);
        }
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      showToast('გადახდა ვერ განხორციელდა: ' + error.message, 'error');
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.textContent = 'გადახდა / Pay';
      }
    }
  },
  
  // Initiate real bank payment
  initiateBankPayment: async function(method, amount, user) {
    const bankConfig = PAYMENT_CONFIG[method];
    const orderId = 'BP' + Date.now() + Math.random().toString(36).substr(2, 9);
    
    try {
      // Call our backend to create payment session
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bank: method,
          amount: amount,
          orderId: orderId,
          description: `Beauty Pass Balance Top-up: ${amount} GEL`,
          userEmail: user.email
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }
      
      const paymentData = await response.json();
      
      // Redirect to bank's payment page
      if (paymentData.redirectUrl) {
        window.location.href = paymentData.redirectUrl;
      } else {
        throw new Error('No redirect URL received');
      }
      
    } catch (error) {
      throw error;
    }
  },
  
  // Simulate bank redirect (for demo/test mode)
  simulateBankRedirect: function(method, amount) {
    return new Promise((resolve, reject) => {
      const bankInfo = this.methods[method];
      
      // Show bank simulation modal
      const modalBody = document.getElementById('modalBody');
      if (!modalBody) {
        reject(new Error('Modal body not found'));
        return;
      }
      
      modalBody.innerHTML = `
        <div class="bank-redirect-simulation">
          <div class="bank-header" style="background: ${bankInfo.color};">
            <span class="bank-icon">🏦</span>
            <h3>${bankInfo.name}</h3>
          </div>
          <div class="bank-body">
            <p class="redirect-message">გადამისამართება ${bankInfo.nameKa}-ზე...</p>
            <div class="bank-amount">${amount}₾</div>
            <div class="bank-progress">
              <div class="progress-bar-animated"></div>
            </div>
            <p class="bank-note">
              ${PAYMENT_CONFIG[method].testMode ? '⚠️ ტესტ რეჟიმი - რეალური გადახდა არ ხდება' : '🔒 უსაფრთხო კავშირი'}
            </p>
          </div>
        </div>
      `;
      
      // Simulate delay
      setTimeout(() => {
        resolve({ success: true, transactionId: 'TX' + Date.now() });
      }, 2500);
    });
  },
  
  // Show purchase tariff modal
  showPurchaseTariffModal: function(tariff) {
    const modal = document.getElementById('bookingModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalTitle || !modalBody) {
      showToast('შეცდომა', 'error');
      return;
    }
    
    const user = (typeof currentUser !== 'undefined' && currentUser) || (typeof state !== 'undefined' && state.user);
    const balance = user?.balance || 0;
    const canAfford = balance >= tariff.priceGEL;
    
    modalTitle.innerHTML = `<span>ტარიფის შეძენა / Purchase Plan</span>`;
    
    modalBody.innerHTML = `
      <div class="purchase-modal">
        <div class="tariff-preview">
          <div class="tariff-icon">💎</div>
          <h3>${tariff.plan}</h3>
          <div class="tariff-price">${tariff.priceGEL}₾<small>/თვე</small></div>
          <div class="tariff-bp">+${tariff.bpAmount} BP</div>
        </div>
        
        <div class="tariff-features">
          <h4>მოიცავს / Includes:</h4>
          <ul>
            ${(tariff.includes || []).map(i => `<li>✅ ${i}</li>`).join('')}
          </ul>
          <h4>უპირატესობები / Perks:</h4>
          <ul>
            ${(tariff.perks || []).map(p => `<li>⭐ ${p}</li>`).join('')}
          </ul>
        </div>
        
        <div class="balance-check ${canAfford ? 'sufficient' : 'insufficient'}">
          <span>თქვენი ბალანსი / Your balance:</span>
          <span class="balance-amount">${balance}₾</span>
        </div>
        
        ${!canAfford ? `
          <div class="insufficient-notice">
            <p>⚠️ არასაკმარისი ბალანსი. გჭირდებათ კიდევ ${tariff.priceGEL - balance}₾</p>
            <button class="btn btn-outline" onclick="PaymentSystem.closePaymentModal(); setTimeout(() => PaymentSystem.showTopUpModal(), 300);">
              ბალანსის შევსება
            </button>
          </div>
        ` : ''}
        
        <div class="purchase-actions">
          <button class="btn btn-primary btn-block btn-large" 
                  ${!canAfford ? 'disabled' : ''}
                  onclick="PaymentSystem.purchaseTariff('${tariff.plan}', ${tariff.priceGEL}, ${tariff.bpAmount})">
            ${canAfford ? `შეძენა ${tariff.priceGEL}₾ / Purchase` : 'არასაკმარისი ბალანსი'}
          </button>
        </div>
      </div>
    `;
    
    this.openPaymentModal();
  },
  
  // Purchase tariff
  purchaseTariff: async function(plan, price, bpAmount) {
    const payBtn = event?.target;
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.innerHTML = '<span class="spinner"></span> მუშავდება...';
    }
    
    const token = localStorage.getItem('token');
    
    try {
      if (PAYMENT_CONFIG.USE_BACKEND && token) {
        const response = await fetch('/api/packages/buy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plan, price })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Purchase failed');
        }
        
        const result = await response.json();
        
        // Update local user with new balance, BP and activePlan
        if (typeof currentUser !== 'undefined' && currentUser) {
          currentUser.balance = result.user?.balance ?? currentUser.balance;
          currentUser.beautyPoints = result.user?.beautyPoints ?? currentUser.beautyPoints;
          currentUser.activePlan = result.user?.activePlan ?? currentUser.activePlan;
          currentUser.purchases = result.user?.purchases ?? currentUser.purchases;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
        if (typeof state !== 'undefined' && state.user) {
          state.user.balance = result.user?.balance ?? state.user.balance;
          state.user.beautyPoints = result.user?.beautyPoints ?? state.user.beautyPoints;
          state.user.activePlan = result.user?.activePlan ?? state.user.activePlan;
        }
      }
      
      this.closePaymentModal();
      showToast(`${plan} შეძენილია! +${bpAmount} BP დამატებულია`, 'success');
      
      // Refresh profile to show updated BP and plan
      if (typeof showClientProfile === 'function') {
        setTimeout(() => showClientProfile(), 500);
      }
      
    } catch (error) {
      console.error('Purchase error:', error);
      showToast('შეძენა ვერ განხორციელდა: ' + error.message, 'error');
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.textContent = `შეძენა ${price}₾ / Purchase`;
      }
    }
  }
};

// CSS for payment system
const paymentStyles = document.createElement('style');
paymentStyles.textContent = `
  /* Payment Modal */
  .payment-modal { padding: 0; }
  .payment-amounts, .payment-methods, .payment-summary, .payment-actions {
    padding: 20px;
    border-bottom: 1px solid var(--border-light, #eee);
  }
  .payment-amounts h4, .payment-methods h4 { margin-bottom: 16px; font-size: 1rem; }
  .amount-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  @media (max-width: 480px) { .amount-grid { grid-template-columns: repeat(2, 1fr); } }
  .amount-btn {
    position: relative; padding: 16px; border: 2px solid var(--border-color, #ddd);
    border-radius: 12px; background: white; font-size: 1.2rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s ease;
  }
  .amount-btn:hover { border-color: var(--primary, #6c5ce7); background: var(--primary-pale, #f0efff); }
  .amount-btn.selected { border-color: var(--primary, #6c5ce7); background: var(--primary, #6c5ce7); color: white; }
  .amount-btn.popular { border-color: var(--primary, #6c5ce7); }
  .popular-tag {
    position: absolute; top: -8px; right: -8px; background: var(--primary, #6c5ce7);
    color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.65rem; font-weight: 600;
  }
  .test-badge {
    position: absolute; top: 4px; right: 4px; background: #ffc107; color: #000;
    padding: 2px 6px; border-radius: 4px; font-size: 0.6rem; font-weight: 700;
  }
  .custom-amount { margin-top: 16px; }
  .custom-amount label { display: block; margin-bottom: 8px; font-size: 0.9rem; color: var(--text-muted, #666); }
  .input-with-suffix { position: relative; display: flex; align-items: center; }
  .input-with-suffix input {
    width: 100%; padding: 12px 40px 12px 16px; border: 2px solid var(--border-color, #ddd);
    border-radius: 12px; font-size: 1.1rem; font-weight: 500;
  }
  .input-with-suffix input:focus { outline: none; border-color: var(--primary, #6c5ce7); }
  .input-with-suffix .suffix { position: absolute; right: 16px; font-size: 1.1rem; font-weight: 600; color: var(--text-muted, #666); }
  .method-options { display: flex; gap: 12px; }
  @media (max-width: 480px) { .method-options { flex-direction: column; } }
  .method-btn {
    position: relative; flex: 1; display: flex; align-items: center; gap: 12px;
    padding: 16px; border: 2px solid var(--border-color, #ddd); border-radius: 12px;
    background: white; cursor: pointer; transition: all 0.2s ease; text-align: left;
  }
  .method-btn:hover { border-color: var(--primary, #6c5ce7); background: var(--primary-pale, #f0efff); }
  .method-btn.selected { border-color: var(--primary, #6c5ce7); background: var(--primary-pale, #f0efff); }
  .method-icon { font-size: 2rem; }
  .method-name { display: flex; flex-direction: column; }
  .method-name strong { font-size: 1rem; }
  .method-name small { font-size: 0.8rem; color: var(--text-muted, #666); }
  .payment-summary { background: #f8f9fa; }
  .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 0.95rem; }
  .summary-row.total { border-top: 2px solid var(--border-color, #ddd); margin-top: 8px; padding-top: 12px; font-weight: 700; font-size: 1.1rem; }
  .payment-actions { border-bottom: none; }
  .payment-note { text-align: center; font-size: 0.85rem; color: var(--text-muted, #666); margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .lock-icon { color: #00b894; }
  .bank-redirect-simulation { text-align: center; }
  .bank-header { padding: 30px; color: white; border-radius: 16px 16px 0 0; }
  .bank-header .bank-icon { font-size: 3rem; display: block; margin-bottom: 8px; }
  .bank-header h3 { margin: 0; }
  .bank-body { padding: 30px; }
  .redirect-message { font-size: 1.1rem; margin-bottom: 20px; }
  .bank-amount { font-size: 2.5rem; font-weight: 700; color: var(--primary, #6c5ce7); margin-bottom: 20px; }
  .bank-progress { height: 4px; background: var(--border-light, #eee); border-radius: 2px; overflow: hidden; margin-bottom: 16px; }
  .progress-bar-animated { height: 100%; background: var(--primary, #6c5ce7); animation: progressAnimation 2.5s ease-in-out; }
  @keyframes progressAnimation { 0% { width: 0%; } 100% { width: 100%; } }
  .bank-note { font-size: 0.85rem; color: var(--text-muted, #666); font-style: italic; }
  .purchase-modal { padding: 0; }
  .tariff-preview { text-align: center; padding: 30px; background: linear-gradient(135deg, var(--primary-pale, #f0efff), white); }
  .tariff-icon { font-size: 3rem; margin-bottom: 8px; }
  .tariff-preview h3 { margin: 0 0 8px; font-size: 1.5rem; }
  .tariff-price { font-size: 2rem; font-weight: 700; color: var(--primary, #6c5ce7); }
  .tariff-price small { font-size: 1rem; font-weight: 400; color: var(--text-muted, #666); }
  .tariff-bp { font-size: 1.2rem; font-weight: 600; color: #6c5ce7; margin-top: 8px; }
  .tariff-features { padding: 20px; }
  .tariff-features h4 { font-size: 0.9rem; color: var(--text-muted, #666); margin-bottom: 8px; }
  .tariff-features ul { list-style: none; padding: 0; margin-bottom: 16px; }
  .tariff-features li { padding: 6px 0; font-size: 0.95rem; }
  .balance-check { display: flex; justify-content: space-between; padding: 16px 20px; background: #f8f9fa; border-radius: 12px; margin: 0 20px; }
  .balance-check.sufficient { background: #d4edda; color: #155724; }
  .balance-check.insufficient { background: #f8d7da; color: #721c24; }
  .balance-amount { font-weight: 700; }
  .insufficient-notice { padding: 16px 20px; text-align: center; }
  .insufficient-notice p { margin-bottom: 12px; color: #e74c3c; }
  .purchase-actions { padding: 20px; }
  .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 8px; vertical-align: middle; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(paymentStyles);

// Initialize
PaymentSystem.init();

// Export for global access
window.PaymentSystem = PaymentSystem;
