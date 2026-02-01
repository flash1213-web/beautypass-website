// ===== Beauty Pass - AI Chatbot Assistant =====
'use strict';

const BeautyBot = {
  isOpen: false,
  conversationHistory: [],
  isTyping: false,
  
  // Bot personality and knowledge base
  personality: {
    name: 'Bella',
    emoji: '💅',
    greeting: {
      ka: 'გამარჯობა! მე ვარ Bella, თქვენი Beauty Pass ასისტენტი. როგორ შემიძლია დაგეხმაროთ?',
      en: 'Hello! I\'m Bella, your Beauty Pass assistant. How can I help you today?'
    }
  },
  
  // Knowledge base with common questions and answers
  knowledgeBase: {
    // Plans & Pricing
    plans: {
      keywords: ['plan', 'tariff', 'price', 'cost', 'ტარიფ', 'ფას', 'გეგმ', 'ღირ'],
      response: {
        ka: `ჩვენ გვაქვს 3 ტარიფი:\n\n🥉 **BP Basic** - 35₾/თვე (100 BP)\n• ფრჩხილები, წარბები\n\n🥈 **BP Plus** - 60₾/თვე (200 BP)\n• + თმა, 5% cashback\n\n🥇 **BP Pro** - 100₾/თვე (400 BP)\n• ყველა სერვისი, 10% cashback, VIP მხარდაჭერა\n\nგსურთ კონკრეტული ტარიფის შესახებ მეტი ინფორმაცია?`,
        en: `We have 3 plans:\n\n🥉 **BP Basic** - 35₾/month (100 BP)\n• Nails, Brows\n\n🥈 **BP Plus** - 60₾/month (200 BP)\n• + Hair, 5% cashback\n\n🥇 **BP Pro** - 100₾/month (400 BP)\n• All services, 10% cashback, VIP support\n\nWould you like more info about a specific plan?`
      }
    },
    
    // Booking
    booking: {
      keywords: ['book', 'appointment', 'schedule', 'reserve', 'ჯავშან', 'დაჯავშნ', 'რეზერვ'],
      response: {
        ka: `ჯავშნისთვის:\n\n1️⃣ აირჩიეთ სალონი მთავარ გვერდზე ან რუკაზე\n2️⃣ აირჩიეთ სერვისი და სპეციალისტი\n3️⃣ აირჩიეთ თარიღი და დრო\n4️⃣ დაადასტურეთ ჯავშანი\n\n💡 დადასტურება მოვა თქვენს ელფოსტაზე!\n\nგსურთ რომელიმე სალონის ნახვა?`,
        en: `To book:\n\n1️⃣ Choose a salon from homepage or map\n2️⃣ Select service and specialist\n3️⃣ Pick date and time\n4️⃣ Confirm booking\n\n💡 Confirmation will be sent to your email!\n\nWould you like to see any salon?`
      }
    },
    
    // Cancellation
    cancellation: {
      keywords: ['cancel', 'refund', 'გაუქმ', 'დაბრუნ', 'უკან'],
      response: {
        ka: `გაუქმების პოლიტიკა:\n\n✅ **3+ დღით ადრე** - სრული თანხის დაბრუნება\n⚠️ **2-3 დღით ადრე** - შეგიძლიათ შეცვალოთ დრო (არა გაუქმება)\n❌ **24 საათამდე** - თანხა არ ბრუნდება\n\nეს პოლიტიკა იცავს როგორც კლიენტებს, ასევე სალონებს.`,
        en: `Cancellation policy:\n\n✅ **3+ days before** - Full refund\n⚠️ **2-3 days before** - Can reschedule (no cancel)\n❌ **Under 24 hours** - No refund\n\nThis policy protects both clients and salons.`
      }
    },
    
    // Beauty Points
    points: {
      keywords: ['point', 'bp', 'beauty point', 'ქულ', 'პოინტ'],
      response: {
        ka: `Beauty Points (BP) - ეს არის ჩვენი შიდა ვალუტა:\n\n💎 1 BP ≈ 1₾ ღირებულების სერვისი\n📦 BP-ს იღებთ ტარიფის შეძენისას\n💰 BP-თი იხდით სერვისებს სალონებში\n\nმაგალითი:\n• მანიკური = 45 BP\n• თმის შეჭრა = 70 BP\n• მასაჟი 60წთ = 110 BP`,
        en: `Beauty Points (BP) - our internal currency:\n\n💎 1 BP ≈ 1₾ service value\n📦 You get BP when buying a plan\n💰 Use BP to pay for services\n\nExamples:\n• Manicure = 45 BP\n• Haircut = 70 BP\n• Massage 60min = 110 BP`
      }
    },
    
    // Salons
    salons: {
      keywords: ['salon', 'partner', 'where', 'location', 'სალონ', 'პარტნიორ', 'სად', 'მისამარ'],
      response: {
        ka: `ჩვენ გვყავს 9+ პარტნიორი სალონი თბილისში:\n\n📍 ვაკე - Berberis Beauty Salon\n📍 საბურთალო - Daphne, Pivot Beauty\n📍 მარჯანიშვილი - Nailomania\n📍 ავლაბარი - Beauty Room\n\n🗺️ გამოიყენეთ ინტერაქტიული რუკა მთავარ გვერდზე ყველა სალონის სანახავად!\n\nრომელ უბანში ეძებთ?`,
        en: `We have 9+ partner salons in Tbilisi:\n\n📍 Vake - Berberis Beauty Salon\n📍 Saburtalo - Daphne, Pivot Beauty\n📍 Marjanishvili - Nailomania\n📍 Avlabari - Beauty Room\n\n🗺️ Use the interactive map on homepage to see all!\n\nWhich area are you looking for?`
      }
    },
    
    // Payment
    payment: {
      keywords: ['pay', 'payment', 'card', 'bank', 'tbc', 'bog', 'გადახდ', 'ბარათ', 'ბანკ'],
      response: {
        ka: `გადახდის მეთოდები:\n\n🏦 **საქართველოს ბანკი** (BOG)\n🏦 **TBC ბანკი**\n\n💳 ბალანსის შევსება:\n1. შედით პროფილში\n2. დააჭირეთ "ბალანსის შევსება"\n3. აირჩიეთ ბანკი და თანხა\n4. დაადასტურეთ გადახდა\n\n✉️ დადასტურება მოვა ელფოსტაზე!`,
        en: `Payment methods:\n\n🏦 **Bank of Georgia** (BOG)\n🏦 **TBC Bank**\n\n💳 Top up balance:\n1. Go to profile\n2. Click "Top Up Balance"\n3. Choose bank and amount\n4. Confirm payment\n\n✉️ Confirmation sent to email!`
      }
    },
    
    // Balance
    balance: {
      keywords: ['balance', 'topup', 'top up', 'money', 'ბალანს', 'შევსება', 'თანხა', 'ფული'],
      response: {
        ka: `ბალანსის შევსება:\n\n💳 **როგორ შევავსო?**\n1. პროფილში დააჭირეთ "შევსება" ღილაკს\n2. აირჩიეთ თანხა (20₾, 50₾, 100₾, 200₾)\n3. აირჩიეთ ბანკი\n4. გადახდის შემდეგ ბალანსი ავტომატურად განახლდება\n\n💡 რჩევა: 100₾ ყველაზე პოპულარულია!\n\nგსურთ ახლავე ბალანსის შევსება?`,
        en: `Top up balance:\n\n💳 **How to top up?**\n1. Click "Top Up" button in profile\n2. Select amount (20₾, 50₾, 100₾, 200₾)\n3. Choose bank\n4. Balance updates automatically after payment\n\n💡 Tip: 100₾ is most popular!\n\nWould you like to top up now?`
      },
      action: 'topup'
    },

    // Referral
    referral: {
      keywords: ['refer', 'friend', 'bonus', 'invite', 'მოიწვ', 'მეგობ', 'ბონუს', 'რეფერ'],
      response: {
        ka: `რეფერალ პროგრამა:\n\n🎁 მოიწვიეთ მეგობარი და მიიღეთ:\n• **თქვენ** - 20 BP ბონუსი\n• **მეგობარი** - 10 BP საჩუქარი\n\n📤 თქვენი რეფერალ კოდი პროფილშია.\n\nარ არის ლიმიტი - რაც მეტ მეგობარს მოიწვევთ, მით მეტ BP-ს მიიღებთ!`,
        en: `Referral program:\n\n🎁 Invite a friend and get:\n• **You** - 20 BP bonus\n• **Friend** - 10 BP gift\n\n📤 Your referral code is in your profile.\n\nNo limit - invite more friends, earn more BP!`
      }
    },
    
    // About/Philosophy
    about: {
      keywords: ['about', 'who', 'company', 'philosophy', 'ვინ', 'შესახებ', 'ფილოსოფ', 'კომპან'],
      response: {
        ka: `Beauty Pass - სილამაზე ხელმისაწვდომია ყველასთვის! 💅\n\nჩვენი ფილოსოფია:\n• 🌟 საკუთარ თავზე ზრუნვა არ არის ფუფუნება\n• 💎 ეს არის ცხოვრების წესი\n• ✨ ყველა იმსახურებს საუკეთესოს\n\nჩვენ ვაკავშირებთ თქვენ საქართველოს საუკეთესო სალონებთან ერთი ელეგანტური პლატფორმით.`,
        en: `Beauty Pass - making beauty accessible to everyone! 💅\n\nOur philosophy:\n• 🌟 Self-care is not a luxury\n• 💎 It's a lifestyle\n• ✨ Everyone deserves the best\n\nWe connect you with Georgia's best salons through one elegant platform.`
      }
    },
    
    // Help
    help: {
      keywords: ['help', 'support', 'contact', 'დახმარ', 'კონტაქტ', 'მხარდაჭ'],
      response: {
        ka: `დახმარება:\n\n📧 Email: info@beautypass.ge\n📞 ტელეფონი: +995 XXX XX XX XX\n💬 ეს ჩატი - 24/7\n\nხშირი შეკითხვები:\n• "ტარიფები" - გეგმების ნახვა\n• "ჯავშანი" - როგორ დავჯავშნო\n• "გაუქმება" - დაბრუნების პოლიტიკა\n• "სალონები" - პარტნიორები\n\nრით შემიძლია დაგეხმაროთ?`,
        en: `Help:\n\n📧 Email: info@beautypass.ge\n📞 Phone: +995 XXX XX XX XX\n💬 This chat - 24/7\n\nCommon questions:\n• "plans" - view tariffs\n• "booking" - how to book\n• "cancel" - refund policy\n• "salons" - partners\n\nHow can I help you?`
      }
    }
  },
  
  // Initialize chatbot
  init: function() {
    this.createChatWidget();
    this.loadConversationHistory();
    this.bindEvents();
    console.log('✅ BeautyBot initialized');
  },
  
  // Create chat widget HTML
  createChatWidget: function() {
    const widget = document.createElement('div');
    widget.id = 'beautyBotWidget';
    widget.innerHTML = `
      <div class="bot-button" onclick="BeautyBot.toggle()">
        <span class="bot-icon">🤖</span>
        <span class="bot-label">Bella AI</span>
        <span class="bot-badge" id="botBadge" style="display: none;">1</span>
      </div>
      
      <div class="bot-window" id="botWindow">
        <div class="bot-header">
          <div class="bot-avatar">💅</div>
          <div class="bot-info">
            <div class="bot-name">Bella</div>
            <div class="bot-status">
              <span class="status-dot"></span>
              <span id="botStatusText">Online</span>
            </div>
          </div>
          <button class="bot-close" onclick="BeautyBot.toggle()">✕</button>
        </div>
        
        <div class="bot-messages" id="botMessages">
          <!-- Messages will be rendered here -->
        </div>
        
        <div class="bot-suggestions" id="botSuggestions">
          <button class="suggestion-btn" onclick="BeautyBot.sendSuggestion('plans')" data-ka="💎 ტარიფები" data-en="💎 Plans">💎 ტარიფები</button>
          <button class="suggestion-btn" onclick="BeautyBot.sendSuggestion('booking')" data-ka="📅 ჯავშანი" data-en="📅 Booking">📅 ჯავშანი</button>
          <button class="suggestion-btn" onclick="BeautyBot.sendSuggestion('salons')" data-ka="📍 სალონები" data-en="📍 Salons">📍 სალონები</button>
          <button class="suggestion-btn" onclick="BeautyBot.sendSuggestion('balance')" data-ka="💳 ბალანსი" data-en="💳 Balance">💳 ბალანსი</button>
          <button class="suggestion-btn" onclick="BeautyBot.sendSuggestion('help')" data-ka="❓ დახმარება" data-en="❓ Help">❓ დახმარება</button>
        </div>
        
        <div class="bot-input-area">
          <input type="text" id="botInput" class="bot-input" 
                 placeholder="დაწერეთ შეკითხვა..." 
                 onkeypress="if(event.key==='Enter') BeautyBot.sendMessage()">
          <button class="bot-send" onclick="BeautyBot.sendMessage()">
            <span>➤</span>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
  },
  
  // Bind events
  bindEvents: function() {
    // Close on outside click
    document.addEventListener('click', (e) => {
      const widget = document.getElementById('beautyBotWidget');
      if (this.isOpen && !widget.contains(e.target)) {
        // Don't close, user might be typing
      }
    });
  },
  
  // Toggle chat window
  toggle: function() {
    this.isOpen = !this.isOpen;
    const window = document.getElementById('botWindow');
    const badge = document.getElementById('botBadge');
    
    if (this.isOpen) {
      window.classList.add('active');
      badge.style.display = 'none';
      
      // Show greeting if first time
      if (this.conversationHistory.length === 0) {
        this.showGreeting();
      }
      
      // Focus input
      setTimeout(() => {
        document.getElementById('botInput').focus();
      }, 300);
    } else {
      window.classList.remove('active');
    }
  },
  
  // Show greeting message
  showGreeting: function() {
    const lang = typeof currentLanguage !== 'undefined' ? currentLanguage : (typeof currentLang !== 'undefined' ? currentLang : 'ka');
    const greeting = this.personality.greeting[lang] || this.personality.greeting['ka'];
    
    this.addMessage(greeting, 'bot');
    
    // Update suggestions based on language
    this.updateSuggestionsLanguage(lang);
  },
  
  // Update suggestion buttons language
  updateSuggestionsLanguage: function(lang) {
    const suggestions = document.querySelectorAll('.suggestion-btn');
    suggestions.forEach(btn => {
      const kaText = btn.getAttribute('data-ka');
      const enText = btn.getAttribute('data-en');
      if (lang === 'en' && enText) {
        btn.textContent = enText;
      } else if (kaText) {
        btn.textContent = kaText;
      }
    });
    
    // Update input placeholder
    const input = document.getElementById('botInput');
    if (input) {
      input.placeholder = lang === 'en' ? 'Type your question...' : 'დაწერეთ შეკითხვა...';
    }
    
    // Add personalized message if user is logged in
    if (typeof state !== 'undefined' && state.user && state.user.name) {
      setTimeout(() => {
        const personalMsg = lang === 'en' 
          ? `${state.user.name}, your balance: ${state.user.balanceBP || 0} BP 💎`
          : `${state.user.name}, თქვენი ბალანსი: ${state.user.balanceBP || 0} BP 💎`;
        this.addMessage(personalMsg, 'bot');
      }, 1000);
    }
  },
  
  // Send message
  sendMessage: async function() {
    const input = document.getElementById('botInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    // Add user message
    this.addMessage(text, 'user');
    input.value = '';
    
    // Show typing indicator
    this.showTyping();
    
    // Process and respond (async for AI)
    try {
      const response = await this.processMessage(text);
      this.hideTyping();
      this.addMessage(response, 'bot');
    } catch (error) {
      this.hideTyping();
      this.addMessage('უკაცრავად, დაფიქსირდა შეცდომა. სცადეთ თავიდან! 🙏', 'bot');
    }
  },
  
  // Send suggestion
  sendSuggestion: function(topic) {
    const lang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'ka';
    const suggestions = {
      plans: { ka: 'რა ტარიფები გაქვთ?', en: 'What plans do you have?' },
      booking: { ka: 'როგორ დავჯავშნო?', en: 'How do I book?' },
      salons: { ka: 'სად არის თქვენი სალონები?', en: 'Where are your salons?' },
      balance: { ka: 'როგორ შევავსო ბალანსი?', en: 'How do I top up balance?' },
      help: { ka: 'მჭირდება დახმარება', en: 'I need help' }
    };
    
    const msg = suggestions[topic]?.[lang] || suggestions[topic]?.ka;
    if (msg) {
      document.getElementById('botInput').value = msg;
      this.sendMessage();
    }
  },
  
  // Process user message - теперь с ChatGPT
  processMessage: async function(text) {
    const lang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'ka';
    const lowerText = text.toLowerCase();
    
    // Сначала проверяем локальную базу знаний для быстрых ответов
    for (const [key, data] of Object.entries(this.knowledgeBase)) {
      for (const keyword of data.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          if (data.action) {
            this.executeAction(data.action);
          }
          return data.response[lang] || data.response['ka'];
        }
      }
    }
    
    // Проверяем приветствия
    const greetings = ['hello', 'hi', 'hey', 'გამარჯობა', 'გაუმარჯოს', 'გაგიმარჯოს', 'სალამი', 'привет', 'здравствуй'];
    if (greetings.some(g => lowerText.includes(g))) {
      return lang === 'en'
        ? `Hello! 👋 I'm Bella, your AI beauty assistant. Ask me anything about beauty, our services, or just chat!`
        : `გამარჯობა! 👋 მე ვარ Bella, თქვენი AI სილამაზის ასისტენტი. მკითხეთ ნებისმიერი რამ სილამაზის, ჩვენი სერვისების ან უბრალოდ დამელაპარაკეთ!`;
    }
    
    // Для сложных вопросов используем ChatGPT API
    try {
      const response = await this.askAI(text, lang);
      if (response) {
        return response;
      }
    } catch (error) {
      console.log('AI fallback to local response');
    }
    
    // Fallback ответ
    return lang === 'en'
      ? `I'm here to help! 💅 Try asking about:\n\n• **Plans & pricing**\n• **How to book**\n• **Our salons**\n• **Beauty tips**\n\nOr just chat with me about anything beauty-related!`
      : `მზად ვარ დასახმარებლად! 💅 შეგიძლიათ მკითხოთ:\n\n• **ტარიფები და ფასები**\n• **როგორ დავჯავშნო**\n• **ჩვენი სალონები**\n• **სილამაზის რჩევები**\n\nან უბრალოდ დამელაპარაკეთ სილამაზეზე!`;
  },
  
  // Запрос к AI API
  askAI: async function(message, lang) {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          conversationHistory: this.conversationHistory.slice(-10),
          language: lang
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
      return null;
    } catch (error) {
      console.error('AI API error:', error);
      return null;
    }
  },
  
  // Execute action based on response
  executeAction: function(action) {
    setTimeout(() => {
      switch(action) {
        case 'topup':
          // Открыть модальное окно пополнения баланса
          if (typeof PaymentSystem !== 'undefined' && PaymentSystem.showTopUpModal) {
            this.toggle(); // Закрываем бота
            PaymentSystem.showTopUpModal();
          }
          break;
        case 'booking':
          // Перейти к салонам
          if (typeof navigate === 'function') {
            this.toggle();
            navigate('salons');
          }
          break;
        case 'profile':
          // Перейти в профиль
          if (typeof navigate === 'function') {
            this.toggle();
            navigate('client');
          }
          break;
        case 'community':
          // Открыть Community
          if (typeof CommunityApp !== 'undefined') {
            this.toggle();
            CommunityApp.showCommunity();
          }
          break;
      }
    }, 2000);
  },
  
  // Add message to chat
  addMessage: function(text, sender) {
    const container = document.getElementById('botMessages');
    const message = document.createElement('div');
    message.className = `bot-message ${sender}-message`;
    
    // Parse markdown-style formatting
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    
    message.innerHTML = `
      <div class="message-content">${formattedText}</div>
      <div class="message-time">${new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
    
    // Save to history
    this.conversationHistory.push({ text, sender, time: Date.now() });
    this.saveConversationHistory();
  },
  
  // Show typing indicator
  showTyping: function() {
    this.isTyping = true;
    const container = document.getElementById('botMessages');
    const typing = document.createElement('div');
    typing.className = 'bot-message bot-message typing-indicator';
    typing.id = 'typingIndicator';
    typing.innerHTML = `
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
  },
  
  // Hide typing indicator
  hideTyping: function() {
    this.isTyping = false;
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
  },
  
  // Save conversation to localStorage
  saveConversationHistory: function() {
    try {
      localStorage.setItem('beautybot_history', JSON.stringify(this.conversationHistory.slice(-50)));
    } catch (e) {
      console.warn('Could not save bot history');
    }
  },
  
  // Load conversation from localStorage
  loadConversationHistory: function() {
    try {
      const saved = localStorage.getItem('beautybot_history');
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
        // Render recent messages (last 10)
        const recent = this.conversationHistory.slice(-10);
        recent.forEach(msg => {
          const container = document.getElementById('botMessages');
          const message = document.createElement('div');
          message.className = `bot-message ${msg.sender}-message`;
          message.innerHTML = `
            <div class="message-content">${msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>
            <div class="message-time">${new Date(msg.time).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</div>
          `;
          container.appendChild(message);
        });
      }
    } catch (e) {
      console.warn('Could not load bot history');
    }
  },
  
  // Clear conversation
  clearHistory: function() {
    this.conversationHistory = [];
    localStorage.removeItem('beautybot_history');
    document.getElementById('botMessages').innerHTML = '';
    this.showGreeting();
  }
};

// CSS for chatbot (inject into page)
const botStyles = document.createElement('style');
botStyles.textContent = `
  /* Bot Widget Container */
  #beautyBotWidget {
    position: fixed;
    bottom: 24px;
    left: 24px;
    z-index: 9999;
    font-family: 'Inter', sans-serif;
  }
  
  @media (max-width: 768px) {
    #beautyBotWidget {
      bottom: 16px;
      left: 16px;
    }
  }
  
  /* Bot Button */
  .bot-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(108, 92, 231, 0.4);
    transition: all 0.3s ease;
    animation: botPulse 2s infinite;
  }
  
  .bot-button:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 30px rgba(108, 92, 231, 0.5);
  }
  
  .bot-icon {
    font-size: 1.4rem;
  }
  
  .bot-label {
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .bot-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 20px;
    height: 20px;
    background: #e84393;
    color: white;
    border-radius: 50%;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
  
  @keyframes botPulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(108, 92, 231, 0.4); }
    50% { box-shadow: 0 4px 30px rgba(108, 92, 231, 0.6); }
  }
  
  /* Bot Window */
  .bot-window {
    position: absolute;
    bottom: 70px;
    left: 0;
    width: 380px;
    max-width: calc(100vw - 32px);
    height: 500px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 50px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px) scale(0.95);
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .bot-window.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  }
  
  @media (max-width: 480px) {
    .bot-window {
      width: calc(100vw - 32px);
      height: 70vh;
      max-height: 500px;
    }
  }
  
  /* Bot Header */
  .bot-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
  }
  
  .bot-avatar {
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }
  
  .bot-info {
    flex: 1;
  }
  
  .bot-name {
    font-weight: 700;
    font-size: 1.1rem;
  }
  
  .bot-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    opacity: 0.9;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    background: #00b894;
    border-radius: 50%;
    animation: statusPulse 1.5s infinite;
  }
  
  @keyframes statusPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .bot-close {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .bot-close:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  /* Bot Messages */
  .bot-messages {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #f8f9fa;
  }
  
  .bot-message {
    max-width: 85%;
    animation: messageSlide 0.3s ease-out;
  }
  
  @keyframes messageSlide {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .bot-message.bot-message {
    align-self: flex-start;
  }
  
  .bot-message.user-message {
    align-self: flex-end;
  }
  
  .message-content {
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  
  .bot-message .message-content {
    background: white;
    color: var(--text);
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  .user-message .message-content {
    background: linear-gradient(135deg, #e84393, #fd79a8);
    color: white;
    border-bottom-right-radius: 4px;
  }
  
  .message-time {
    font-size: 0.7rem;
    color: var(--text-muted);
    margin-top: 4px;
    padding: 0 4px;
  }
  
  .user-message .message-time {
    text-align: right;
  }
  
  /* Typing Indicator */
  .typing-indicator .message-content {
    padding: 16px 20px;
  }
  
  .typing-dots {
    display: flex;
    gap: 4px;
  }
  
  .typing-dots span {
    width: 8px;
    height: 8px;
    background: var(--primary);
    border-radius: 50%;
    animation: typingBounce 1.4s infinite ease-in-out;
  }
  
  .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
  .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes typingBounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }
  
  /* Suggestions */
  .bot-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px;
    background: white;
    border-top: 1px solid var(--border-light);
  }
  
  .suggestion-btn {
    padding: 8px 14px;
    background: var(--primary-pale);
    color: var(--primary);
    border: none;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .suggestion-btn:hover {
    background: var(--primary);
    color: white;
    transform: scale(1.05);
  }
  
  /* Input Area */
  .bot-input-area {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    background: white;
    border-top: 1px solid var(--border-light);
  }
  
  .bot-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid var(--border-color);
    border-radius: 24px;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }
  
  .bot-input:focus {
    border-color: var(--primary);
  }
  
  .bot-send {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #e84393, #fd79a8);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 1.1rem;
    cursor: pointer;
    transition: transform 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .bot-send:hover {
    transform: scale(1.1);
  }
`;
document.head.appendChild(botStyles);

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BeautyBot.init());
} else {
  BeautyBot.init();
}

// Export for global access
window.BeautyBot = BeautyBot;
