// ======================================
// MESSENGER - ჩატი კლიენტებსა და სალონებს შორის
// ======================================

// მესენჯერის სთეითი
let messengerState = {
  isOpen: false,
  currentChatPartnerId: null,
  currentChatPartnerName: null,
  currentChatPartnerPhone: null,
  chats: [],
  messages: []
};

// მესენჯერის გახსნა/დახურვა
window.toggleMessenger = function() {
  const panel = document.getElementById('messengerPanel');
  if (!panel) {
    createMessengerPanel();
  }
  
  const messengerPanel = document.getElementById('messengerPanel');
  messengerState.isOpen = !messengerState.isOpen;
  
  if (messengerState.isOpen) {
    messengerPanel.classList.add('open');
    loadChats();
  } else {
    messengerPanel.classList.remove('open');
  }
};

// მესენჯერის პანელის შექმნა
function createMessengerPanel() {
  const panel = document.createElement('div');
  panel.id = 'messengerPanel';
  panel.className = 'messenger-panel';
  panel.innerHTML = `
    <div class="messenger-header">
      <div class="messenger-title">
        <span>💬</span>
        <span>შეტყობინებები</span>
        <span class="unread-badge" id="messengerUnreadBadge" style="display: none;">0</span>
      </div>
      <button class="messenger-close" onclick="toggleMessenger()">✕</button>
    </div>
    <div class="messenger-content">
      <div id="chatsList" class="chats-list">
        <div class="loading">იტვირთება...</div>
      </div>
      <div id="chatWindow" class="chat-window" style="display: none;">
        <div class="chat-header">
          <button class="back-btn" onclick="showChatsList()">←</button>
          <div class="chat-partner-info">
            <span class="partner-name" id="chatPartnerName"></span>
            <a href="#" class="call-btn" id="callButton" onclick="callPartner()">📞 დარეკვა</a>
          </div>
        </div>
        <div class="messages-container" id="messagesContainer"></div>
        <div class="message-input-container">
          <input type="text" id="messageInput" placeholder="შეტყობინება..." maxlength="1000" onkeypress="if(event.key==='Enter')sendMessage()">
          <button class="send-btn" onclick="sendMessage()">➤</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  
  // სტილების დამატება
  addMessengerStyles();
}

// სტილები
function addMessengerStyles() {
  if (document.getElementById('messengerStyles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'messengerStyles';
  styles.textContent = `
    .messenger-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    .messenger-btn:hover {
      transform: scale(1.1);
    }
    .messenger-btn .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .messenger-panel {
      position: fixed;
      bottom: 94px;
      right: 24px;
      width: 360px;
      max-width: calc(100vw - 40px);
      height: 500px;
      max-height: calc(100vh - 120px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: translateY(20px);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    .messenger-panel.open {
      transform: translateY(0);
      opacity: 1;
      visibility: visible;
    }
    
    .messenger-header {
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .messenger-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 16px;
    }
    .messenger-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
    }
    
    .messenger-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .chats-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .chat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 12px;
      transition: background 0.2s;
      position: relative;
    }
    .chat-item:hover {
      background: #f5f3ff;
    }
    .chat-item-main {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      cursor: pointer;
    }
    .chat-delete-btn {
      background: none;
      border: none;
      font-size: 14px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
      padding: 4px 8px;
    }
    .chat-item:hover .chat-delete-btn {
      opacity: 0.5;
    }
    .chat-delete-btn:hover {
      opacity: 1 !important;
    }
    .chat-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e9d5ff, #c4b5fd);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .chat-info {
      flex: 1;
      min-width: 0;
    }
    .chat-name {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .chat-preview {
      font-size: 13px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chat-meta {
      text-align: right;
    }
    .chat-time {
      font-size: 11px;
      color: #94a3b8;
    }
    .chat-unread {
      background: #7c3aed;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 4px;
      margin-left: auto;
    }
    
    .chat-window {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .chat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .back-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      color: #7c3aed;
    }
    .chat-partner-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .partner-name {
      font-weight: 600;
      color: #1e293b;
    }
    .call-btn {
      color: #22c55e;
      text-decoration: none;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .message {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.4;
    }
    .message.own {
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .message.other {
      background: #f1f5f9;
      color: #1e293b;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .message-time {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 4px;
    }
    
    .message-input-container {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #e2e8f0;
    }
    .message-input-container input {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 14px;
      outline: none;
    }
    .message-input-container input:focus {
      border-color: #7c3aed;
    }
    .send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
    }
    
    .empty-chats {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
    }
    .empty-chats-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .unread-badge {
      background: #ef4444;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 11px;
    }
    
    @media (max-width: 480px) {
      .messenger-panel {
        width: 100%;
        height: 100%;
        max-height: 100vh;
        bottom: 0;
        right: 0;
        border-radius: 0;
      }
      .messenger-btn {
        bottom: 80px;
      }
    }
  `;
  document.head.appendChild(styles);
}

// ჩატების ჩატვირთვა
async function loadChats() {
  const container = document.getElementById('chatsList');
  if (!container) return;
  
  const token = localStorage.getItem('token') || localStorage.getItem('salonToken');
  if (!token) {
    container.innerHTML = `
      <div class="empty-chats">
        <div class="empty-chats-icon">🔒</div>
        <p>გთხოვთ შეხვიდეთ სისტემაში</p>
      </div>
    `;
    return;
  }
  
  try {
    const response = await fetch('/api/messages/chats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load chats');
    
    const chats = await response.json();
    messengerState.chats = chats;
    
    if (chats.length === 0) {
      container.innerHTML = `
        <div class="empty-chats">
          <div class="empty-chats-icon">💬</div>
          <p>ჩატები არ არის</p>
          <p style="font-size: 13px; margin-top: 8px;">დაიწყეთ საუბარი სალონთან დაჯავშნის გვერდიდან</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = chats.map(chat => `
      <div class="chat-item" data-partner-id="${chat.partnerId}">
        <div class="chat-item-main" onclick="openChat('${chat.partnerId}', '${chat.partnerName.replace(/'/g, '')}', '${chat.partnerPhone || ''}')">
          <div class="chat-avatar">${chat.partnerType === 'salon' ? '🏢' : '👤'}</div>
          <div class="chat-info">
            <div class="chat-name">${chat.partnerName}</div>
            <div class="chat-preview">${chat.lastMessage}</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">${formatChatTime(chat.lastMessageTime)}</div>
            ${chat.unreadCount > 0 ? `<div class="chat-unread">${chat.unreadCount}</div>` : ''}
          </div>
        </div>
        <button class="chat-delete-btn" onclick="event.stopPropagation(); deleteChat('${chat.partnerId}')" title="წაშლა">🗑️</button>
      </div>
    `).join('');
    
    // განაახლეთ unread badge
    const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);
    updateUnreadBadge(totalUnread);
    
  } catch (error) {
    console.error('Load chats error:', error);
    container.innerHTML = `
      <div class="empty-chats">
        <div class="empty-chats-icon">❌</div>
        <p>შეცდომა ჩატების ჩატვირთვისას</p>
      </div>
    `;
  }
}

// დროის ფორმატირება
function formatChatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'ახლა';
  if (diff < 3600000) return `${Math.floor(diff/60000)} წთ`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)} სთ`;
  
  return date.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' });
}

// ჩატის გახსნა
window.openChat = async function(partnerId, partnerName, partnerPhone) {
  messengerState.currentChatPartnerId = partnerId;
  messengerState.currentChatPartnerName = partnerName;
  messengerState.currentChatPartnerPhone = partnerPhone;
  
  document.getElementById('chatsList').style.display = 'none';
  document.getElementById('chatWindow').style.display = 'flex';
  document.getElementById('chatPartnerName').textContent = partnerName;
  
  // დარეკვის ღილაკის კონფიგურაცია
  const callBtn = document.getElementById('callButton');
  if (partnerPhone) {
    callBtn.href = `tel:${partnerPhone}`;
    callBtn.style.display = 'flex';
  } else {
    callBtn.style.display = 'none';
  }
  
  await loadMessages(partnerId);
};

// შეტყობინებების ჩატვირთვა
async function loadMessages(partnerId) {
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '<div class="loading" style="text-align: center; padding: 20px;">იტვირთება...</div>';
  
  const token = localStorage.getItem('token') || localStorage.getItem('salonToken');
  
  try {
    const response = await fetch(`/api/messages/${partnerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load messages');
    
    const data = await response.json();
    messengerState.messages = data.messages;
    
    if (data.messages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #94a3b8;">
          <p>დაიწყეთ საუბარი</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = data.messages.map(msg => `
      <div class="message ${msg.isOwn ? 'own' : 'other'}">
        ${msg.message}
        <div class="message-time">${new Date(msg.createdAt).toLocaleTimeString('ka-GE', {hour: '2-digit', minute: '2-digit'})}</div>
      </div>
    `).join('');
    
    // გადასქროლვა ბოლოში
    container.scrollTop = container.scrollHeight;
    
  } catch (error) {
    console.error('Load messages error:', error);
    container.innerHTML = '<div style="text-align: center; color: #ef4444;">შეცდომა</div>';
  }
}

// შეტყობინების გაგზავნა
window.sendMessage = async function() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  
  if (!message || !messengerState.currentChatPartnerId) return;
  
  const token = localStorage.getItem('token') || localStorage.getItem('salonToken');
  
  try {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverId: messengerState.currentChatPartnerId,
        message
      })
    });
    
    if (!response.ok) throw new Error('Failed to send');
    
    const result = await response.json();
    
    // დამატება UI-ში
    const container = document.getElementById('messagesContainer');
    container.innerHTML += `
      <div class="message own">
        ${result.message.message}
        <div class="message-time">${new Date().toLocaleTimeString('ka-GE', {hour: '2-digit', minute: '2-digit'})}</div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
    
    input.value = '';
    
  } catch (error) {
    console.error('Send message error:', error);
    showToast('შეცდომა შეტყობინების გაგზავნისას', 'error');
  }
};

// ჩატების სიაზე დაბრუნება
window.showChatsList = function() {
  document.getElementById('chatWindow').style.display = 'none';
  document.getElementById('chatsList').style.display = 'block';
  messengerState.currentChatPartnerId = null;
  loadChats();
};

// ჩატის წაშლა
window.deleteChat = async function(partnerId) {
  if (!confirm('ნამდვილად წაშალოთ ეს ჩატი? ყველა შეტყობინება წაიშლება.')) return;
  
  const token = localStorage.getItem('token') || localStorage.getItem('salonToken');
  
  try {
    const response = await fetch(`/api/messages/chat/${partnerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to delete chat');
    
    showToast('ჩატი წაშლილია', 'success');
    await loadChats();
    
  } catch (error) {
    console.error('Delete chat error:', error);
    showToast('შეცდომა ჩატის წაშლისას', 'error');
  }
};

// პარტნიორზე დარეკვა
window.callPartner = function() {
  const phone = messengerState.currentChatPartnerPhone;
  if (phone) {
    window.location.href = `tel:${phone}`;
  } else {
    showToast('ტელეფონის ნომერი მითითებული არ არის', 'error');
  }
};

// Unread badge განახლება
function updateUnreadBadge(count) {
  const badge = document.getElementById('messengerBtnBadge');
  const headerBadge = document.getElementById('messengerUnreadBadge');
  
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
  
  if (headerBadge) {
    if (count > 0) {
      headerBadge.textContent = count;
      headerBadge.style.display = 'inline';
    } else {
      headerBadge.style.display = 'none';
    }
  }
}

// მესენჯერის ღილაკის შექმნა
function createMessengerButton() {
  // Сначала добавляем стили
  addMessengerStyles();
  
  if (document.getElementById('messengerBtn')) return;
  
  const btn = document.createElement('button');
  btn.id = 'messengerBtn';
  btn.className = 'messenger-btn';
  btn.onclick = toggleMessenger;
  btn.innerHTML = `
    💬
    <span class="badge" id="messengerBtnBadge" style="display: none;">0</span>
  `;
  document.body.appendChild(btn);
  
  console.log('✅ Messenger button created');
  
  // ჩექ unread messages
  checkUnreadMessages();
}

// Unread შეტყობინებების შემოწმება
async function checkUnreadMessages() {
  const token = localStorage.getItem('token') || localStorage.getItem('salonToken');
  if (!token) return;
  
  try {
    const response = await fetch('/api/messages/unread/count', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateUnreadBadge(data.unreadCount);
    }
  } catch (error) {
    console.error('Check unread error:', error);
  }
}

// ჩატის დაწყება სალონთან (კლიენტისთვის)
window.startChatWithSalon = async function(salonId, salonName) {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('გთხოვთ შეხვიდეთ სისტემაში', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/messages/start-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ salonId })
    });
    
    if (!response.ok) throw new Error('Failed to start chat');
    
    const result = await response.json();
    
    // გახსენი მესენჯერი და გახსენი ჩატი
    if (!messengerState.isOpen) {
      toggleMessenger();
    }
    
    setTimeout(() => {
      openChat(result.chatPartnerId, result.partnerName, result.partnerPhone);
    }, 300);
    
  } catch (error) {
    console.error('Start chat error:', error);
    showToast('შეცდომა ჩატის დაწყებისას', 'error');
  }
};

// ინიციალიზაცია
document.addEventListener('DOMContentLoaded', () => {
  // Создаём кнопку мессенджера сразу
  createMessengerButton();
  
  // პერიოდულად ჩექავს unread-ს
  setInterval(checkUnreadMessages, 30000);
});

// Также инициализируем если DOM уже загружен
if (document.readyState !== 'loading') {
  createMessengerButton();
}
