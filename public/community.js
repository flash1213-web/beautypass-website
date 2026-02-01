// ======================================
// BEAUTY PASS COMMUNITY - ქომიუნითი
// ======================================

// API URL definition
const API_URL = window.API_URL || window.location.origin;

const CommunityModule = {
  currentTab: 'feed',
  posts: [],
  groups: [],
  conversations: [],
  currentConversation: null,
  currentGroup: null,
  isLoaded: false,

  // ინიციალიზაცია
  init: function() {
    if (this.isLoaded) return;
    this.isLoaded = true;
    console.log('✅ Community module initialized');
  },

  // საზოგადოების სექციის რენდერი
  render: function(container) {
    if (!container) {
      container = document.getElementById('communityContent');
    }
    if (!container) return;

    container.innerHTML = `
      <div id="communityContainer" class="community-container">
        <!-- Header -->
        <div class="community-header">
          <h2>🌸 Beauty ქომიუნითი</h2>
          <p>დაუკავშირდი სილამაზის მოყვარულებს</p>
        </div>

        <!-- Tabs -->
        <div class="community-tabs">
          <button class="community-tab active" data-tab="feed" onclick="CommunityModule.switchTab('feed')">
            📰 ფიდი
          </button>
          <button class="community-tab" data-tab="groups" onclick="CommunityModule.switchTab('groups')">
            👥 ჯგუფები
          </button>
          <button class="community-tab" data-tab="messages" onclick="CommunityModule.switchTab('messages')">
            💬 შეტყობინებები
            <span class="tab-badge" id="msgBadge" style="display: none;">0</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="community-content" id="communityTabContent">
          <!-- Content loaded dynamically -->
        </div>
      </div>
    `;

    this.addStyles();
    this.switchTab('feed');
  },

  // ტაბის გადართვა
  switchTab: function(tab) {
    this.currentTab = tab;
    
    // ტაბების განახლება
    document.querySelectorAll('.community-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    const content = document.getElementById('communityTabContent');
    if (!content) return;

    switch(tab) {
      case 'feed':
        this.renderFeed(content);
        break;
      case 'groups':
        this.renderGroups(content);
        break;
      case 'messages':
        this.renderMessages(content);
        break;
    }
  },

  // ფიდის რენდერი
  renderFeed: async function(container) {
    container.innerHTML = `
      <div class="feed-container">
        <!-- New Post Form -->
        <div class="new-post-card">
          <div class="post-input-area">
            <div class="user-avatar">👤</div>
            <textarea id="newPostText" placeholder="გაუზიარე რაიმე საინტერესო..." maxlength="1000"></textarea>
          </div>
          <div class="post-actions">
            <div class="post-media-btns">
              <button class="media-btn" onclick="CommunityModule.addPhoto()">📷 ფოტო</button>
              <button class="media-btn" onclick="CommunityModule.addPoll()">📊 გამოკითხვა</button>
            </div>
            <button class="post-submit-btn" onclick="CommunityModule.createPost()">გამოქვეყნება</button>
          </div>
        </div>

        <!-- Posts -->
        <div class="posts-list" id="postsList">
          <div class="loading-posts">იტვირთება...</div>
        </div>
      </div>
    `;

    await this.loadPosts();
  },

  // პოსტების ჩატვირთვა
  loadPosts: async function() {
    const container = document.getElementById('postsList');
    if (!container) return;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      // Posts are public, no auth required
      const response = await fetch(`${API_URL}/api/community/posts`);

      if (!response.ok) throw new Error('Failed to load posts');
      
      const data = await response.json();
      this.posts = data.posts || [];

      if (this.posts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">📝</span>
            <p>ჯერ არ არის პოსტები</p>
            <p class="sub-text">იყავი პირველი!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = this.posts.map(post => this.renderPost(post)).join('');

    } catch (error) {
      console.error('Load posts error:', error);
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⚠️</span>
          <p>შეცდომა პოსტების ჩატვირთვისას</p>
          <p class="sub-text">${error.message}</p>
          <button class="btn btn-primary" onclick="CommunityModule.loadPosts()" style="margin-top: 12px;">🔄 თავიდან</button>
        </div>
      `;
    }
  },

  // ერთი პოსტის რენდერი
  renderPost: function(post) {
    const author = post.author || {};
    const authorName = `${author.firstName || 'მომხმარებელი'} ${author.lastName || ''}`;
    const timeAgo = this.timeAgo(post.createdAt);
    const isLiked = post.isLiked || false;

    // Render images
    let imagesHtml = '';
    if (post.images && post.images.length > 0) {
      const imageCount = post.images.length;
      if (imageCount === 1) {
        imagesHtml = `<img src="${post.images[0]}" class="post-image" alt="post" style="width: 100%; border-radius: 12px; margin-top: 12px; cursor: pointer;" onclick="CommunityModule.viewImage('${post.images[0]}')">`;
      } else {
        imagesHtml = `
          <div class="post-images-grid" style="display: grid; grid-template-columns: repeat(${imageCount >= 3 ? 3 : 2}, 1fr); gap: 4px; margin-top: 12px; border-radius: 12px; overflow: hidden;">
            ${post.images.map(img => `
              <img src="${img}" alt="post" style="width: 100%; height: 120px; object-fit: cover; cursor: pointer;" onclick="CommunityModule.viewImage('${img}')">
            `).join('')}
          </div>
        `;
      }
    } else if (post.image) {
      imagesHtml = `<img src="${post.image}" class="post-image" alt="post" style="width: 100%; border-radius: 12px; margin-top: 12px;">`;
    }

    // Render poll
    let pollHtml = '';
    if (post.poll && post.poll.question) {
      const totalVotes = post.poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
      pollHtml = `
        <div class="post-poll" style="margin-top: 12px; padding: 16px; background: linear-gradient(135deg, #f8f9fa, #fff); border-radius: 12px; border: 1px solid #e5e7eb;">
          <div style="font-weight: 600; color: #333; margin-bottom: 12px;">📊 ${post.poll.question}</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${post.poll.options.map((opt, idx) => {
              const voteCount = opt.votes?.length || 0;
              const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
              return `
                <div class="poll-option" onclick="CommunityModule.votePoll('${post._id}', ${idx})" style="position: relative; padding: 12px 16px; background: #fff; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; overflow: hidden; transition: all 0.2s;">
                  <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${percentage}%; background: linear-gradient(90deg, rgba(232,67,147,0.15), rgba(253,121,168,0.1)); transition: width 0.3s;"></div>
                  <div style="position: relative; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #333;">${opt.text}</span>
                    <span style="color: #888; font-size: 13px;">${voteCount} (${percentage}%)</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div style="margin-top: 10px; font-size: 12px; color: #888;">სულ: ${totalVotes} ხმა ${post.poll.isMultiple ? '• მრავალჯერადი არჩევანი' : ''}</div>
        </div>
      `;
    }

    return `
      <div class="post-card" data-id="${post._id}">
        <div class="post-header">
          <div class="post-avatar">${(author.firstName || 'M')[0]}</div>
          <div class="post-meta">
            <span class="post-author">${authorName}</span>
            <span class="post-time">${timeAgo}</span>
          </div>
          <button class="post-dm-btn" onclick="CommunityModule.startChat('${author._id || ''}', '${authorName}')" title="მესიჯის გაგზავნა">✉️</button>
          <button class="post-menu-btn">⋯</button>
        </div>
        <div class="post-content">${this.formatContent(post.content || '')}</div>
        ${imagesHtml}
        ${pollHtml}
        
        <!-- Facebook/Instagram style stats -->
        <div class="post-stats-fb" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; margin: 12px 0 0 0; font-size: 14px; color: #65676b;">
          <div class="stats-left" style="display: flex; align-items: center; gap: 4px;">
            <span style="display: flex; align-items: center;">
              <span style="background: linear-gradient(135deg, #e84393, #fd79a8); border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px;">❤️</span>
            </span>
            <span class="like-count-${post._id}">${post.likes || post.reactionCount || 0}</span>
          </div>
          <div class="stats-right" style="display: flex; gap: 12px;">
            <span class="comment-count-text-${post._id}" style="cursor: pointer;" onclick="CommunityModule.toggleInlineComments('${post._id}')">${post.comments || post.commentCount || 0} კომენტარი</span>
          </div>
        </div>
        
        <!-- Facebook/Instagram style action buttons -->
        <div class="post-actions-fb" style="display: flex; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
          <button class="fb-action-btn ${isLiked ? 'liked' : ''}" onclick="CommunityModule.toggleLike('${post._id}')" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 0; background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 600; color: ${isLiked ? '#e84393' : '#65676b'}; transition: all 0.2s; border-radius: 4px;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="${isLiked ? '#e84393' : 'none'}" stroke="${isLiked ? '#e84393' : '#65676b'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            მოწონება
          </button>
          <button class="fb-action-btn" onclick="CommunityModule.toggleInlineComments('${post._id}')" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 0; background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 600; color: #65676b; transition: all 0.2s; border-radius: 4px;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#65676b" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            კომენტარი
          </button>
          <button class="fb-action-btn" onclick="CommunityModule.sharePost('${post._id}')" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 0; background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 600; color: #65676b; transition: all 0.2s; border-radius: 4px;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#65676b" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
            გაზიარება
          </button>
        </div>
        
        <!-- Inline comments section with GIF & Emoji -->
        <div class="inline-comments" id="comments-${post._id}" style="display: none; padding-top: 8px; position: relative;">
          <div class="comments-list-inline" id="commentsList-${post._id}" style="max-height: 300px; overflow-y: auto;">
            <div style="text-align: center; padding: 10px; color: #888;">იტვირთება...</div>
          </div>
          
          <!-- Comment input area like Facebook -->
          <div class="add-comment-fb" style="display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 8px 0; position: relative;">
            <div class="comment-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #e84393, #fd79a8); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; flex-shrink: 0;">თქ</div>
            <div class="comment-input-wrapper" style="flex: 1; position: relative; background: #f0f2f5; border-radius: 20px; display: flex; align-items: center; padding: 0 8px;">
              <input type="text" id="commentInput-${post._id}" placeholder="დაწერე კომენტარი..." style="flex: 1; padding: 10px 8px; background: none; border: none; font-size: 14px; outline: none;" onkeypress="if(event.key==='Enter' && !event.shiftKey) CommunityModule.addInlineComment('${post._id}')">
              <div class="comment-tools" style="display: flex; gap: 4px; align-items: center;">
                <button type="button" onclick="event.preventDefault(); event.stopPropagation(); CommunityModule.toggleEmojiPicker('${post._id}')" style="background: none; border: none; cursor: pointer; font-size: 18px; padding: 4px; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#e4e6e9'" onmouseout="this.style.background='none'" title="Emoji">😊</button>
                <button type="button" onclick="event.preventDefault(); event.stopPropagation(); CommunityModule.openGifPicker('${post._id}')" style="background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 700; padding: 4px 6px; color: #65676b; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='#e4e6e9'" onmouseout="this.style.background='none'" title="GIF">GIF</button>
              </div>
              
              <!-- Emoji picker inside input wrapper -->
              <div id="emojiPicker-${post._id}" class="emoji-picker-popup" style="display: none; position: absolute; bottom: 45px; right: 0; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); padding: 12px; z-index: 1000; width: 280px;"></div>
            </div>
            <button type="button" onclick="CommunityModule.addInlineComment('${post._id}')" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #e84393, #fd79a8); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          
          <!-- GIF preview (hidden by default) -->
          <div id="gifPreview-${post._id}" style="display: none; margin-top: 8px; position: relative;"></div>
        </div>
      </div>
    `;
  },

  // პოსტის შექმნა
  createPost: async function() {
    const textarea = document.getElementById('newPostText');
    const content = textarea?.value?.trim();

    // If no content and no photos and no poll - error
    if (!content && this.selectedPhotos.length === 0 && !this.pendingPoll) {
      showToast('ჩაწერეთ ტექსტი ან დაამატეთ ფოტო/გამოკითხვა', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('გაიარეთ ავტორიზაცია', 'error');
        return;
      }

      // Use FormData for file upload
      const formData = new FormData();
      formData.append('content', content || (this.pendingPoll ? this.pendingPoll.question : 'ფოტო'));
      
      // Add photos
      this.selectedPhotos.forEach(file => {
        formData.append('images', file);
      });

      // Add poll
      if (this.pendingPoll) {
        formData.append('poll', JSON.stringify(this.pendingPoll));
        formData.append('type', 'poll');
      } else if (this.selectedPhotos.length > 0) {
        formData.append('type', 'image');
      }

      const response = await fetch(`${API_URL}/api/community/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to create post');

      // Clear everything
      textarea.value = '';
      textarea.placeholder = 'გაუზიარე რაიმე საინტერესო...';
      this.selectedPhotos = [];
      this.pendingPoll = null;
      
      const photoPreview = document.getElementById('photoPreviewContainer');
      if (photoPreview) photoPreview.remove();
      
      const pollPreview = document.getElementById('pollPreviewContainer');
      if (pollPreview) pollPreview.remove();

      showToast('პოსტი გამოქვეყნდა! 🎉', 'success');
      await this.loadPosts();

    } catch (error) {
      console.error('Create post error:', error);
      showToast('შეცდომა: ' + error.message, 'error');
    }
  },

  // Like/Unlike
  toggleLike: async function(postId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('გაიარეთ ავტორიზაცია', 'error');
        return;
      }

      const response = await fetch(`${API_URL}/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed');
      
      const data = await response.json();
      
      // Обновляем UI поста - Facebook style
      const postCard = document.querySelector(`.post-card[data-id="${postId}"]`);
      if (postCard) {
        const likeBtn = postCard.querySelector('.fb-action-btn');
        const likeCount = postCard.querySelector(`.like-count-${postId}`);
        
        if (likeBtn) {
          const svg = likeBtn.querySelector('svg');
          if (data.liked) {
            likeBtn.style.color = '#e84393';
            if (svg) {
              svg.setAttribute('fill', '#e84393');
              svg.setAttribute('stroke', '#e84393');
            }
          } else {
            likeBtn.style.color = '#65676b';
            if (svg) {
              svg.setAttribute('fill', 'none');
              svg.setAttribute('stroke', '#65676b');
            }
          }
        }
        
        if (likeCount) {
          likeCount.textContent = data.likes;
        }
      }
      
      showToast(data.liked ? 'მოიწონეთ! ❤️' : 'მოწონება მოხსნილია', 'success');

    } catch (error) {
      console.error('Like error:', error);
      showToast('შეცდომა', 'error');
    }
  },

  // Toggle inline comments under post
  toggleInlineComments: async function(postId) {
    const container = document.getElementById(`comments-${postId}`);
    if (!container) return;

    if (container.style.display === 'none') {
      container.style.display = 'block';
      await this.loadInlineComments(postId);
    } else {
      container.style.display = 'none';
    }
  },

  // Load comments inline under post
  loadInlineComments: async function(postId) {
    const container = document.getElementById(`commentsList-${postId}`);
    if (!container) return;

    try {
      const response = await fetch(`${API_URL}/api/community/posts/${postId}/comments`);
      if (!response.ok) throw new Error('Failed');
      
      const comments = await response.json();
      
      if (comments.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 15px; color: #888;">
            <span style="font-size: 24px;">💬</span>
            <p style="margin: 5px 0 0; font-size: 13px;">ჯერ არ არის კომენტარები. იყავი პირველი!</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = comments.map(comment => `
        <div class="comment-inline-item" style="display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f5f5f5;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #e84393, #fd79a8); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; flex-shrink: 0;">
            ${(comment.author?.firstName || 'U')[0]}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="background: #f0f2f5; border-radius: 18px; padding: 8px 12px;">
              <span style="font-weight: 600; font-size: 13px; color: #050505;">${comment.author?.firstName || 'მომხმარებელი'}</span>
              <p style="margin: 2px 0 0; font-size: 14px; color: #050505; word-break: break-word;">${comment.content}</p>
            </div>
            ${comment.gif ? `
              <div style="margin-top: 6px;">
                <img src="${comment.gif}" alt="GIF" style="max-width: 200px; border-radius: 12px; cursor: pointer;" onclick="window.open('${comment.gif}', '_blank')">
              </div>
            ` : ''}
            <div style="display: flex; gap: 12px; margin-top: 4px; padding-left: 12px;">
              <button style="background: none; border: none; font-size: 12px; font-weight: 600; color: #65676b; cursor: pointer;" onclick="CommunityModule.likeComment('${comment._id}')">მოწონება</button>
              <button style="background: none; border: none; font-size: 12px; font-weight: 600; color: #65676b; cursor: pointer;" onclick="CommunityModule.replyComment('${postId}', '${comment._id}', '${comment.author?.firstName || ''}')">პასუხი</button>
              <span style="font-size: 11px; color: #65676b;">${this.timeAgo(comment.createdAt)}</span>
            </div>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Load inline comments error:', error);
      container.innerHTML = '<div style="text-align: center; padding: 10px; color: #e74c3c;">შეცდომა კომენტარების ჩატვირთვისას</div>';
    }
  },

  // Add inline comment
  addInlineComment: async function(postId) {
    const input = document.getElementById(`commentInput-${postId}`);
    const content = input?.value?.trim();
    const gifUrl = this.pendingCommentGif && this.pendingCommentGif[postId];
    
    if (!content && !gifUrl) {
      showToast('ჩაწერეთ კომენტარი ან აირჩიეთ GIF', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('კომენტარის დასამატებლად გაიარეთ ავტორიზაცია', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: content || '🎬',
          gif: gifUrl 
        })
      });

      if (!response.ok) throw new Error('Failed');

      input.value = '';
      // Clear GIF preview
      this.removeGifPreview(postId);
      
      showToast('კომენტარი დაემატა! 💬', 'success');
      
      // Reload comments
      await this.loadInlineComments(postId);
      
      // Update comment count in stats
      const postCard = document.querySelector(`.post-card[data-id="${postId}"]`);
      if (postCard) {
        const commentCountEl = postCard.querySelector(`.comment-count-text-${postId}`);
        if (commentCountEl) {
          const currentCount = parseInt(commentCountEl.textContent.match(/\d+/) || 0);
          commentCountEl.textContent = `${currentCount + 1} კომენტარი`;
        }
      }

    } catch (error) {
      console.error('Add comment error:', error);
      showToast('შეცდომა', 'error');
    }
  },

  // Показать комментарии (modal - old method)
  showComments: async function(postId) {
    try {
      const token = localStorage.getItem('token');
      
      // Создаем модальное окно для комментариев
      const modal = document.createElement('div');
      modal.className = 'community-modal';
      modal.id = 'commentsModal';
      modal.innerHTML = `
        <div class="modal-overlay" onclick="CommunityModule.closeModal()"></div>
        <div class="modal-content" style="max-height: 80vh; overflow-y: auto;">
          <div class="modal-header">
            <h3>💬 კომენტარები</h3>
            <button class="modal-close" onclick="CommunityModule.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div id="commentsList" class="comments-list">
              <div class="loading">იტვირთება...</div>
            </div>
            ${token ? `
              <div class="add-comment-form" style="margin-top: 16px; display: flex; gap: 8px;">
                <input type="text" id="newCommentText" placeholder="დაწერეთ კომენტარი..." style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 20px;">
                <button class="btn btn-primary" onclick="CommunityModule.addComment('${postId}')" style="padding: 10px 16px; border-radius: 20px;">➤</button>
              </div>
            ` : `<p style="text-align: center; color: #666; margin-top: 16px;">კომენტარის დასამატებლად გაიარეთ ავტორიზაცია</p>`}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('open'), 10);
      
      // Загружаем комментарии
      await this.loadComments(postId);
      
    } catch (error) {
      console.error('Show comments error:', error);
      showToast('შეცდომა', 'error');
    }
  },

  // Загрузить комментарии
  loadComments: async function(postId) {
    const container = document.getElementById('commentsList');
    if (!container) return;
    
    try {
      const response = await fetch(`${API_URL}/api/community/posts/${postId}/comments`);
      
      if (!response.ok) throw new Error('Failed');
      
      const comments = await response.json();
      
      if (comments.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="padding: 20px; text-align: center;">
            <span style="font-size: 32px;">💬</span>
            <p style="color: #666; margin-top: 8px;">ჯერ არ არის კომენტარები</p>
            <p style="color: #999; font-size: 12px;">იყავი პირველი!</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = comments.map(comment => `
        <div class="comment-item" style="display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <div class="comment-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #e84393, #fd79a8); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
            ${(comment.author?.firstName || 'U')[0]}
          </div>
          <div class="comment-body" style="flex: 1;">
            <div class="comment-header" style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 13px;">${comment.author?.firstName || 'მომხმარებელი'} ${comment.author?.lastName || ''}</span>
              <span style="color: #9ca3af; font-size: 11px;">${this.timeAgo(comment.createdAt)}</span>
            </div>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #374151;">${comment.content}</p>
          </div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Load comments error:', error);
      container.innerHTML = '<p style="text-align: center; color: #999;">შეცდომა კომენტარების ჩატვირთვისას</p>';
    }
  },

  // Добавить комментарий
  addComment: async function(postId) {
    const input = document.getElementById('newCommentText');
    const content = input?.value?.trim();
    
    if (!content) {
      showToast('დაწერეთ კომენტარი', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('გაიარეთ ავტორიზაცია', 'error');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) throw new Error('Failed');
      
      input.value = '';
      showToast('კომენტარი დაემატა! 💬', 'success');
      await this.loadComments(postId);
      
    } catch (error) {
      console.error('Add comment error:', error);
      showToast('შეცდომა', 'error');
    }
  },

  // Поделиться постом
  sharePost: function(postId) {
    const url = `${window.location.origin}/community/post/${postId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Beauty Pass Community',
        text: 'შეხედე ამ პოსტს!',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        showToast('ბმული დაკოპირდა! 📋', 'success');
      });
    }
  },

  // Emoji Picker for comments
  toggleEmojiPicker: function(postId) {
    const existingPicker = document.getElementById(`emojiPicker-${postId}`);
    
    if (!existingPicker) {
      console.error('Emoji picker not found for post:', postId);
      return;
    }
    
    // Close all other emoji pickers
    document.querySelectorAll('.emoji-picker-popup').forEach(p => {
      if (p.id !== `emojiPicker-${postId}`) p.style.display = 'none';
    });
    
    if (existingPicker.style.display === 'none' || !existingPicker.innerHTML) {
      // Popular emojis for beauty/social context
      const emojis = [
        '😊', '😍', '🥰', '😘', '💕', '💖', '💗', '💓', '❤️', '🧡', '💛', '💚', '💙', '💜',
        '😂', '🤣', '😭', '🥺', '😢', '😅', '😆', '😁', '😄', '🙂', '🙃', '😉', '😌', '😋',
        '🔥', '✨', '💫', '⭐', '🌟', '💯', '👏', '🙌', '👍', '👎', '🤝', '💪', '🦋', '🌸',
        '💅', '💄', '👑', '💎', '🎀', '🌺', '🌹', '🌷', '💐', '🍀', '☀️', '🌈', '🎉', '🎊',
        '😎', '🤩', '😇', '🥳', '🤗', '🤭', '🤫', '🤔', '😏', '😈', '👀', '👁️', '💋', '👄'
      ];
      
      existingPicker.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600; color: #333;">Emoji</span>
          <button type="button" onclick="document.getElementById('emojiPicker-${postId}').style.display='none'" style="background: none; border: none; cursor: pointer; font-size: 16px;">✕</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; max-height: 200px; overflow-y: auto;">
          ${emojis.map(e => `
            <button type="button" onclick="CommunityModule.insertEmoji('${postId}', '${e}')" style="background: none; border: none; cursor: pointer; font-size: 22px; padding: 4px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='none'">${e}</button>
          `).join('')}
        </div>
      `;
      existingPicker.style.display = 'block';
    } else {
      existingPicker.style.display = 'none';
    }
  },

  // Insert emoji into comment input
  insertEmoji: function(postId, emoji) {
    const input = document.getElementById(`commentInput-${postId}`);
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = input.value;
      input.value = text.substring(0, start) + emoji + text.substring(end);
      input.focus();
      input.selectionStart = input.selectionEnd = start + emoji.length;
    }
    document.getElementById(`emojiPicker-${postId}`).style.display = 'none';
  },

  // GIF Picker for comments
  openGifPicker: function(postId) {
    // Create GIF picker modal
    const modal = document.createElement('div');
    modal.className = 'gif-modal';
    modal.id = 'gifModal';
    modal.innerHTML = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: center; justify-content: center;" onclick="if(event.target === this) this.remove()">
        <div style="background: white; border-radius: 16px; width: 90%; max-width: 480px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: #333;">🎬 GIF-ის არჩევა</h3>
            <button onclick="this.closest('.gif-modal').remove()" style="background: none; border: none; cursor: pointer; font-size: 20px;">✕</button>
          </div>
          <div style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <input type="text" id="gifSearchInput" placeholder="მოძებნე GIF..." oninput="CommunityModule.searchGifs(this.value, '${postId}')" style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 24px; font-size: 14px; outline: none; box-sizing: border-box;" onfocus="this.style.borderColor='#e84393'" onblur="this.style.borderColor='#e5e7eb'">
          </div>
          <div id="gifResults" style="flex: 1; overflow-y: auto; padding: 12px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            <div style="grid-column: span 2; text-align: center; color: #888; padding: 40px 20px;">
              ჩაწერე საძიებო სიტყვა GIF-ის მოსაძებნად
            </div>
          </div>
          <div style="padding: 12px; border-top: 1px solid #e5e7eb; text-align: center;">
            <span style="font-size: 11px; color: #888;">Powered by GIPHY</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('gifSearchInput').focus();
    
    // Store current post ID
    this.currentGifPostId = postId;
  },

  // Search GIFs (using GIPHY API)
  searchGifs: async function(query, postId) {
    const resultsContainer = document.getElementById('gifResults');
    
    if (!query.trim()) {
      resultsContainer.innerHTML = `
        <div style="grid-column: span 2; text-align: center; color: #888; padding: 40px 20px;">
          ჩაწერე საძიებო სიტყვა GIF-ის მოსაძებნად
        </div>
      `;
      return;
    }
    
    resultsContainer.innerHTML = `
      <div style="grid-column: span 2; text-align: center; color: #888; padding: 40px 20px;">
        <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
        იძებნება...
      </div>
    `;
    
    try {
      // Using GIPHY API (free tier)
      const apiKey = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65'; // Public beta key
      const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g&lang=en`);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        resultsContainer.innerHTML = data.data.map(gif => `
          <div onclick="CommunityModule.selectGif('${postId}', '${gif.images.fixed_height.url}')" style="cursor: pointer; border-radius: 8px; overflow: hidden; aspect-ratio: 1; position: relative;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <img src="${gif.images.fixed_height_small.url}" alt="${gif.title}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        `).join('');
      } else {
        resultsContainer.innerHTML = `
          <div style="grid-column: span 2; text-align: center; color: #888; padding: 40px 20px;">
            GIF ვერ მოიძებნა 😢
          </div>
        `;
      }
    } catch (error) {
      console.error('GIF search error:', error);
      resultsContainer.innerHTML = `
        <div style="grid-column: span 2; text-align: center; color: #888; padding: 40px 20px;">
          შეცდომა GIF-ის ძებნისას
        </div>
      `;
    }
  },

  // Select GIF
  selectGif: function(postId, gifUrl) {
    // Store selected GIF
    this.pendingCommentGif = this.pendingCommentGif || {};
    this.pendingCommentGif[postId] = gifUrl;
    
    // Close modal
    const modal = document.getElementById('gifModal');
    if (modal) modal.remove();
    
    // Show preview
    const previewContainer = document.getElementById(`gifPreview-${postId}`);
    if (previewContainer) {
      previewContainer.style.display = 'block';
      previewContainer.innerHTML = `
        <div style="position: relative; display: inline-block; max-width: 200px;">
          <img src="${gifUrl}" style="width: 100%; border-radius: 12px;">
          <button onclick="CommunityModule.removeGifPreview('${postId}')" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px;">✕</button>
        </div>
      `;
    }
    
    showToast('GIF არჩეულია! დააჭირეთ გაგზავნას', 'success');
  },

  // Remove GIF preview
  removeGifPreview: function(postId) {
    if (this.pendingCommentGif) {
      delete this.pendingCommentGif[postId];
    }
    const previewContainer = document.getElementById(`gifPreview-${postId}`);
    if (previewContainer) {
      previewContainer.style.display = 'none';
      previewContainer.innerHTML = '';
    }
  },

  // Like comment
  likeComment: async function(commentId) {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('გაიარეთ ავტორიზაცია', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/community/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        showToast('👍', 'success');
      }
    } catch (error) {
      console.error('Like comment error:', error);
    }
  },

  // Reply to comment
  replyComment: function(postId, commentId, authorName) {
    const input = document.getElementById(`commentInput-${postId}`);
    if (input) {
      input.value = `@${authorName} `;
      input.focus();
      input.dataset.replyTo = commentId;
    }
  },

  // ჯგუფების რენდერი
  renderGroups: async function(container) {
    container.innerHTML = `
      <div class="groups-container">
        <!-- Create Group Button -->
        <button class="create-group-btn" onclick="CommunityModule.showCreateGroupModal()">
          ➕ ახალი ჯგუფის შექმნა
        </button>

        <!-- Groups List -->
        <div class="groups-list" id="groupsList">
          <div class="loading">იტვირთება...</div>
        </div>
      </div>
    `;

    await this.loadGroups();
  },

  // ჯგუფების ჩატვირთვა
  loadGroups: async function() {
    const container = document.getElementById('groupsList');
    if (!container) return;

    try {
      // Groups are public
      const response = await fetch(`${API_URL}/api/community/groups`);

      if (!response.ok) throw new Error('Failed to load groups');

      const data = await response.json();
      this.groups = data.groups || data || [];

      if (this.groups.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">👥</span>
            <p>ჯერ არ არის ჯგუფები</p>
            <p class="sub-text">შექმენი პირველი!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = this.groups.map(g => this.renderGroupCard(g)).join('');

    } catch (error) {
      console.error('Load groups error:', error);
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">❌</span>
          <p>ჯგუფების ჩატვირთვა ვერ მოხერხდა</p>
        </div>
      `;
    }
  },

  // ჯგუფის ბარათი
  renderGroupCard: function(group) {
    const isMember = group.isMember || false;
    // Group avatar - either cover image or icon/initial
    const avatarContent = group.coverImage 
      ? `<img src="${group.coverImage}" style="width: 100%; height: 100%; object-fit: cover;">` 
      : `${group.icon || group.name?.charAt(0) || '👥'}`;
    const avatarStyle = group.coverImage 
      ? 'overflow: hidden;' 
      : '';
    
    return `
      <div class="group-card" onclick="CommunityModule.openGroup('${group._id}')" data-group-id="${group._id}">
        <div class="group-icon" style="${avatarStyle}">${avatarContent}</div>
        <div class="group-info">
          <h4 class="group-name">${group.name}</h4>
          <p class="group-desc">${group.description || ''}</p>
          <span class="group-members" id="members-${group._id}">👥 ${group.memberCount || group.membersCount || 0} წევრი</span>
        </div>
        <button class="join-btn ${isMember ? 'joined' : ''}" id="join-btn-${group._id}" onclick="event.stopPropagation(); CommunityModule.joinGroup('${group._id}')">
          ${isMember ? '✓ წევრი' : 'შესვლა'}
        </button>
      </div>
    `;
  },

  // ჯგუფის გახსნა
  openGroup: async function(groupId) {
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // ჯგუფის ინფორმაციის მიღება
      const response = await fetch(`${API_URL}/api/community/groups/${groupId}`, { headers });
      if (!response.ok) throw new Error('Failed');
      const group = await response.json();
      
      // Check if current user is admin/creator
      const isAdmin = group.creator?._id === currentUser._id || 
                     group.admins?.some(a => a._id === currentUser._id || a === currentUser._id);
      
      // Group avatar
      const avatarHtml = group.coverImage 
        ? `<img src="${group.coverImage}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">`
        : `<span style="font-size: 32px;">${group.icon || '👥'}</span>`;
      
      // მოდალის შექმნა
      const modal = document.createElement('div');
      modal.className = 'community-modal';
      modal.id = 'groupViewModal';
      modal.innerHTML = `
        <div class="modal-overlay" onclick="CommunityModule.closeModal()"></div>
        <div class="modal-content group-view-modal" style="max-width: 600px; max-height: 85vh; overflow-y: auto;">
          <div class="modal-header" style="position: sticky; top: 0; background: white; z-index: 10;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #e84393, #fd79a8); border-radius: 50%; overflow: hidden;">
                ${avatarHtml}
                ${isAdmin ? `
                  <input type="file" id="editGroupCoverInput" accept="image/*" style="display: none;" onchange="CommunityModule.updateGroupCover('${groupId}', event)">
                  <button onclick="document.getElementById('editGroupCoverInput').click()" style="position: absolute; bottom: 0; right: 0; width: 22px; height: 22px; background: #e84393; border: 2px solid white; border-radius: 50%; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center;">📷</button>
                ` : ''}
              </div>
              <div>
                <h3 style="margin: 0;">${group.name}</h3>
                <span style="color: #666; font-size: 12px;">👥 ${group.memberCount || 0} წევრი</span>
                ${isAdmin ? '<span style="color: #e84393; font-size: 10px; margin-left: 8px;">👑 ადმინი</span>' : ''}
              </div>
            </div>
            <button class="modal-close" onclick="CommunityModule.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            ${group.description ? `<p style="color: #666; margin-bottom: 16px;">${group.description}</p>` : ''}
            
            <!-- ახალი პოსტის დამატება -->
            ${token ? `
            <div class="group-create-post" style="background: #f9fafb; padding: 12px; border-radius: 12px; margin-bottom: 16px;">
              <textarea id="groupPostText" placeholder="დაწერეთ რამე ჯგუფში..." style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; resize: none; min-height: 60px;"></textarea>
              <button class="btn btn-primary" onclick="CommunityModule.createGroupPost('${groupId}')" style="margin-top: 8px;">გამოქვეყნება</button>
            </div>
            ` : ''}
            
            <!-- ჯგუფის პოსტები -->
            <div id="groupPosts" class="group-posts">
              <div class="loading">პოსტები იტვირთება...</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('open'), 10);
      
      // პოსტების ჩატვირთვა
      await this.loadGroupPosts(groupId);
      
    } catch (error) {
      console.error('Open group error:', error);
      showToast('ჯგუფის გახსნა ვერ მოხერხდა', 'error');
    }
  },

  // Update group cover image
  updateGroupCover: async function(groupId, event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showToast('ფოტო ძალიან დიდია (მაქს 5MB)', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('გაიარეთ ავტორიზაცია', 'error');
        return;
      }
      
      const formData = new FormData();
      formData.append('coverImage', file);
      
      const response = await fetch(`${API_URL}/api/community/groups/${groupId}/cover`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed');
      
      showToast('ფოტო განახლდა! 📷', 'success');
      this.closeModal();
      await this.loadGroups();
      
    } catch (error) {
      console.error('Update group cover error:', error);
      showToast('შეცდომა', 'error');
    }
  },

  // ჯგუფის პოსტების ჩატვირთვა
  loadGroupPosts: async function(groupId) {
    const container = document.getElementById('groupPosts');
    if (!container) return;
    
    try {
      const response = await fetch(`${API_URL}/api/community/groups/${groupId}/posts`);
      if (!response.ok) throw new Error('Failed');
      
      const data = await response.json();
      const posts = data.posts || [];
      
      if (posts.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="padding: 30px; text-align: center;">
            <span style="font-size: 48px;">📝</span>
            <p style="color: #666;">ჯგუფში ჯერ პოსტები არ არის</p>
            <p style="color: #999; font-size: 12px;">იყავით პირველი!</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = posts.map(post => this.renderPost(post)).join('');
      
    } catch (error) {
      console.error('Load group posts error:', error);
      container.innerHTML = '<p style="text-align: center; color: #999;">პოსტების ჩატვირთვა ვერ მოხერხდა</p>';
    }
  },

  // ჯგუფში პოსტის დამატება
  createGroupPost: async function(groupId) {
    const textarea = document.getElementById('groupPostText');
    const content = textarea?.value?.trim();
    
    if (!content) {
      showToast('ჩაწერეთ ტექსტი', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('გაიარეთ ავტორიზაცია', 'error');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, groupId })
      });
      
      if (!response.ok) throw new Error('Failed');
      
      textarea.value = '';
      showToast('პოსტი გამოქვეყნდა! 🎉', 'success');
      await this.loadGroupPosts(groupId);
      
    } catch (error) {
      console.error('Create group post error:', error);
      showToast('შეცდომა', 'error');
    }
  },

  // ჯგუფში გაწევრიანება
  joinGroup: async function(groupId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('გაიარეთ ავტორიზაცია', 'error');
        return;
      }

      const response = await fetch(`${API_URL}/api/community/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed');
      
      const data = await response.json();
      console.log('Join response:', data, 'GroupId:', groupId);
      
      // განახლება UI-ში
      const btn = document.getElementById(`join-btn-${groupId}`);
      const membersSpan = document.getElementById(`members-${groupId}`);
      
      console.log('Found btn:', btn, 'Found members:', membersSpan);
      
      if (data.joined) {
        showToast('გაწევრიანდით! 🎉', 'success');
        if (btn) {
          btn.textContent = '✓ წევრი';
          btn.classList.add('joined');
        }
      } else {
        showToast('გამოხვედით ჯგუფიდან', 'info');
        if (btn) {
          btn.textContent = 'შესვლა';
          btn.classList.remove('joined');
        }
      }
      
      if (membersSpan) {
        membersSpan.textContent = `👥 ${data.memberCount} წევრი`;
      }
      
      // თუ ელემენტები ვერ მოიძებნა - გადატვირთავს სიას
      if (!btn) {
        await this.loadGroups();
      }

    } catch (error) {
      console.error('Join group error:', error);
      showToast('შეცდომა', 'error');
    }
  },

  // ჯგუფის შექმნის მოდალი
  showCreateGroupModal: function() {
    const modal = document.createElement('div');
    modal.className = 'community-modal';
    modal.id = 'createGroupModal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="CommunityModule.closeModal()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>➕ ახალი ჯგუფი</h3>
          <button class="modal-close" onclick="CommunityModule.closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <!-- Group Cover Photo -->
          <div class="form-group" style="text-align: center; margin-bottom: 20px;">
            <div id="groupCoverPreview" onclick="document.getElementById('groupCoverInput').click()" style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #e84393, #fd79a8); margin: 0 auto; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; border: 3px solid #fff; box-shadow: 0 4px 15px rgba(232,67,147,0.3);">
              <span style="font-size: 40px; color: white;">📷</span>
            </div>
            <input type="file" id="groupCoverInput" accept="image/*" style="display: none;" onchange="CommunityModule.previewGroupCover(event)">
            <p style="color: #888; font-size: 12px; margin-top: 8px;">დააჭირეთ ფოტოს დასამატებლად</p>
          </div>
          <div class="form-group">
            <label>ჯგუფის სახელი</label>
            <input type="text" id="groupName" placeholder="მაგ: თმის მოვლა" maxlength="50">
          </div>
          <div class="form-group">
            <label>აღწერა</label>
            <textarea id="groupDescription" placeholder="რაზეა ჯგუფი?" maxlength="200"></textarea>
          </div>
          <div class="form-group">
            <label>კატეგორია</label>
            <select id="groupCategory" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <option value="general">ზოგადი</option>
              <option value="beauty">სილამაზე</option>
              <option value="hair">თმის მოვლა</option>
              <option value="nails">ფრჩხილები</option>
              <option value="skincare">კანის მოვლა</option>
              <option value="makeup">მაკიაჟი</option>
              <option value="wellness">ველნესი</option>
              <option value="fashion">მოდა</option>
              <option value="memes">მემები</option>
            </select>
          </div>
          <button class="btn btn-primary btn-full" onclick="CommunityModule.createGroup()">შექმნა</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('open'), 10);
  },

  // Preview group cover
  groupCoverFile: null,
  
  previewGroupCover: function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showToast('ფოტო ძალიან დიდია (მაქს 5MB)', 'error');
      return;
    }
    
    this.groupCoverFile = file;
    const preview = document.getElementById('groupCoverPreview');
    const url = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">`;
  },

  // ჯგუფის შექმნა
  createGroup: async function() {
    const name = document.getElementById('groupName')?.value?.trim();
    const description = document.getElementById('groupDescription')?.value?.trim();
    const category = document.getElementById('groupCategory')?.value || 'general';

    if (!name) {
      showToast('შეიყვანეთ სახელი', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('გაიარეთ ავტორიზაცია', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description || '');
      formData.append('category', category);
      
      if (this.groupCoverFile) {
        formData.append('coverImage', this.groupCoverFile);
      }

      const response = await fetch(`${API_URL}/api/community/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed');

      this.groupCoverFile = null;
      this.closeModal();
      showToast('ჯგუფი შეიქმნა! 🎉', 'success');
      await this.loadGroups();

    } catch (error) {
      console.error('Create group error:', error);
      showToast('შეცდომა', 'error');
    }
  },

  // მესიჯების რენდერი
  renderMessages: async function(container) {
    container.innerHTML = `
      <div class="messages-container">
        <!-- Conversations List -->
        <div class="conversations-list" id="conversationsList">
          <div class="loading">იტვირთება...</div>
        </div>

        <!-- Chat Window (hidden by default) -->
        <div class="dm-chat-window" id="dmChatWindow" style="display: none;">
          <div class="dm-chat-header">
            <button class="back-btn" onclick="CommunityModule.closeChat()">←</button>
            <span class="chat-partner" id="dmChatPartner"></span>
          </div>
          <div class="dm-messages" id="dmMessages"></div>
          <!-- Media Preview Area -->
          <div id="dmMediaPreview" style="display: none; padding: 8px; background: #f9f9f9; border-top: 1px solid #eee;"></div>
          <div class="dm-input-area" style="display: flex; flex-direction: column; gap: 8px; padding: 12px; background: #fff; border-top: 1px solid #f0f0f0;">
            <!-- Media buttons row -->
            <div class="dm-media-btns" style="display: flex; gap: 8px;">
              <button onclick="CommunityModule.openDMEmoji()" title="ემოჯი" style="padding: 8px 12px; border: none; background: #f5f5f5; border-radius: 20px; cursor: pointer; font-size: 16px;">😊</button>
              <button onclick="CommunityModule.openDMGif()" title="GIF" style="padding: 8px 12px; border: none; background: #f5f5f5; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: bold;">GIF</button>
              <button onclick="CommunityModule.selectDMPhoto()" title="ფოტო" style="padding: 8px 12px; border: none; background: #f5f5f5; border-radius: 20px; cursor: pointer; font-size: 16px;">📷</button>
              <button onclick="CommunityModule.selectDMVideo()" title="ვიდეო" style="padding: 8px 12px; border: none; background: #f5f5f5; border-radius: 20px; cursor: pointer; font-size: 16px;">🎬</button>
              <input type="file" id="dmPhotoInput" accept="image/*" style="display: none;" onchange="CommunityModule.handleDMPhoto(event)">
              <input type="file" id="dmVideoInput" accept="video/*" style="display: none;" onchange="CommunityModule.handleDMVideo(event)">
            </div>
            <!-- Input row -->
            <div style="display: flex; gap: 8px;">
              <input type="text" id="dmInput" placeholder="შეტყობინება..." style="flex: 1; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 24px; outline: none; font-size: 14px;" onkeypress="if(event.key==='Enter')CommunityModule.sendDM()">
              <button class="send-dm-btn" onclick="CommunityModule.sendDM()" style="padding: 12px 20px; background: linear-gradient(135deg, #e84393, #fd79a8); color: white; border: none; border-radius: 24px; cursor: pointer; font-size: 16px;">➤</button>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadConversations();
  },

  // კონვერსაციების ჩატვირთვა
  loadConversations: async function() {
    const container = document.getElementById('conversationsList');
    if (!container) return;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">💬</span>
            <p>შეტყობინებების სანახავად გაიარეთ ავტორიზაცია</p>
          </div>
        `;
        return;
      }

      const response = await fetch(`${API_URL}/api/community/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      this.conversations = data.conversations || [];

      if (this.conversations.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">💬</span>
            <p>ჯერ არ გაქვთ მიმოწერა</p>
            <p class="sub-text">დაიწყეთ საუბარი ფიდში</p>
          </div>
        `;
        return;
      }

      container.innerHTML = this.conversations.map(c => this.renderConversation(c)).join('');

    } catch (error) {
      console.error('Load conversations error:', error);
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">💬</span>
          <p>ჯერ არ გაქვთ მიმოწერა</p>
        </div>
      `;
    }
  },

  // კონვერსაციის ბარათი
  renderConversation: function(conv) {
    const partner = conv.partner || {};
    const partnerName = `${partner.firstName || 'მომხმარებელი'} ${partner.lastName || ''}`;
    const lastMsg = conv.lastMessage || '';
    const time = this.timeAgo(conv.updatedAt);

    return `
      <div class="conversation-card" onclick="CommunityModule.openConversation('${conv._id}', '${partnerName}')">
        <div class="conv-avatar">${(partner.firstName || 'M')[0]}</div>
        <div class="conv-info">
          <span class="conv-name">${partnerName}</span>
          <p class="conv-preview">${lastMsg.substring(0, 40)}${lastMsg.length > 40 ? '...' : ''}</p>
        </div>
        <div class="conv-meta">
          <span class="conv-time">${time}</span>
          ${conv.unreadCount ? `<span class="unread-dot"></span>` : ''}
        </div>
      </div>
    `;
  },

  // კონვერსაციის გახსნა
  openConversation: async function(convId, partnerName) {
    this.currentConversation = convId;
    
    document.getElementById('conversationsList').style.display = 'none';
    document.getElementById('dmChatWindow').style.display = 'flex';
    document.getElementById('dmChatPartner').textContent = partnerName;

    await this.loadMessages(convId);
  },

  // შეტყობინებების ჩატვირთვა
  loadMessages: async function(convId) {
    const container = document.getElementById('dmMessages');
    if (!container) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/community/conversations/${convId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      const messages = data.messages || [];
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      container.innerHTML = messages.map(msg => {
        const isOwn = msg.sender === currentUser._id || msg.sender?._id === currentUser._id;
        
        // Build message content (text, image, gif, video)
        let contentHtml = '';
        if (msg.image) {
          contentHtml += `<img src="${msg.image}" style="max-width: 200px; border-radius: 12px; margin-bottom: 4px; cursor: pointer;" onclick="CommunityModule.viewImage('${msg.image}')">`;
        }
        if (msg.gif) {
          contentHtml += `<img src="${msg.gif}" style="max-width: 200px; border-radius: 12px; margin-bottom: 4px;">`;
        }
        if (msg.video) {
          contentHtml += `<video src="${msg.video}" controls style="max-width: 200px; border-radius: 12px; margin-bottom: 4px;"></video>`;
        }
        if (msg.content) {
          contentHtml += `<span>${msg.content}</span>`;
        }
        
        return `
          <div class="dm-message ${isOwn ? 'own' : 'other'}">
            <div class="dm-bubble" style="display: flex; flex-direction: column;">${contentHtml}</div>
            <span class="dm-time">${this.timeAgo(msg.createdAt)}</span>
          </div>
        `;
      }).join('');

      container.scrollTop = container.scrollHeight;

    } catch (error) {
      console.error('Load messages error:', error);
      container.innerHTML = '<p class="error-text">შეცდომა</p>';
    }
  },

  // DM Media state
  dmMediaFile: null,
  dmMediaType: null, // 'image', 'video', 'gif'
  dmGifUrl: null,

  // Open emoji picker
  openDMEmoji: function() {
    const emojis = ['😊', '😂', '❤️', '😍', '🥰', '😘', '🤗', '😎', '🔥', '💯', '👍', '👏', '🎉', '💖', '✨', '💅', '💄', '💋', '🌸', '🌺', '💜', '💕', '😇', '🤩', '😋', '🥺', '😢', '😭', '🙄', '😤'];
    
    const picker = document.createElement('div');
    picker.id = 'emojiPicker';
    picker.style.cssText = 'position: fixed; bottom: 120px; left: 50%; transform: translateX(-50%); background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); padding: 12px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; z-index: 999999; max-width: 280px;';
    picker.innerHTML = emojis.map(e => `
      <button onclick="CommunityModule.insertEmoji('${e}')" style="font-size: 24px; border: none; background: none; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">${e}</button>
    `).join('') + `
      <button onclick="document.getElementById('emojiPicker').remove()" style="grid-column: span 6; padding: 8px; border: none; background: #f5f5f5; border-radius: 8px; cursor: pointer; margin-top: 8px;">დახურვა</button>
    `;
    
    document.getElementById('emojiPicker')?.remove();
    document.body.appendChild(picker);
  },

  insertEmoji: function(emoji) {
    const input = document.getElementById('dmInput');
    if (input) {
      input.value += emoji;
      input.focus();
    }
    document.getElementById('emojiPicker')?.remove();
  },

  // Open GIF picker (using Giphy)
  openDMGif: function() {
    const modal = document.createElement('div');
    modal.className = 'community-modal';
    modal.id = 'gifModal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="CommunityModule.closeGifModal()"></div>
      <div class="modal-content" style="max-width: 400px; max-height: 80vh;">
        <div class="modal-header">
          <h3>🎬 GIF არჩევა</h3>
          <button class="modal-close" onclick="CommunityModule.closeGifModal()">✕</button>
        </div>
        <div class="modal-body" style="padding: 12px;">
          <input type="text" id="gifSearch" placeholder="მოძებნე GIF..." style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 12px; box-sizing: border-box;" oninput="CommunityModule.searchGifs(this.value)">
          <div id="gifResults" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; max-height: 400px; overflow-y: auto;">
            ${this.getDefaultGifs()}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('open'), 10);
  },

  getDefaultGifs: function() {
    // Popular beauty/reaction GIFs (static URLs)
    const defaultGifs = [
      'https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif',
      'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
      'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
      'https://media.giphy.com/media/l4JyOCNEfXvVYEqB2/giphy.gif',
      'https://media.giphy.com/media/3oz8xZvvOZRmKay4xy/giphy.gif',
      'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif',
    ];
    return defaultGifs.map(url => `
      <img src="${url}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer;" onclick="CommunityModule.selectGif('${url}')">
    `).join('');
  },

  searchGifs: async function(query) {
    // Simple search - for demo using static GIFs
    // In production, use Giphy API
    const container = document.getElementById('gifResults');
    if (!query.trim()) {
      container.innerHTML = this.getDefaultGifs();
      return;
    }
    container.innerHTML = '<p style="text-align: center; color: #888; grid-column: span 2;">იძებნება...</p>';
    // For demo, show same GIFs
    setTimeout(() => {
      container.innerHTML = this.getDefaultGifs();
    }, 500);
  },

  selectGif: function(gifUrl) {
    this.dmGifUrl = gifUrl;
    this.dmMediaType = 'gif';
    this.closeGifModal();
    this.showDMMediaPreview();
  },

  closeGifModal: function() {
    const modal = document.getElementById('gifModal');
    if (modal) {
      modal.classList.remove('open');
      setTimeout(() => modal.remove(), 300);
    }
  },

  // Select photo
  selectDMPhoto: function() {
    document.getElementById('dmPhotoInput').click();
  },

  handleDMPhoto: function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      showToast('ფაილი ძალიან დიდია (მაქს 10MB)', 'error');
      return;
    }
    
    this.dmMediaFile = file;
    this.dmMediaType = 'image';
    this.showDMMediaPreview();
    event.target.value = '';
  },

  // Select video
  selectDMVideo: function() {
    document.getElementById('dmVideoInput').click();
  },

  handleDMVideo: function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      showToast('ვიდეო ძალიან დიდია (მაქს 50MB)', 'error');
      return;
    }
    
    this.dmMediaFile = file;
    this.dmMediaType = 'video';
    this.showDMMediaPreview();
    event.target.value = '';
  },

  // Show media preview
  showDMMediaPreview: function() {
    const preview = document.getElementById('dmMediaPreview');
    if (!preview) return;

    let html = '';
    if (this.dmMediaType === 'image' && this.dmMediaFile) {
      const url = URL.createObjectURL(this.dmMediaFile);
      html = `<img src="${url}" style="max-height: 100px; border-radius: 8px;">`;
    } else if (this.dmMediaType === 'video' && this.dmMediaFile) {
      const url = URL.createObjectURL(this.dmMediaFile);
      html = `<video src="${url}" style="max-height: 100px; border-radius: 8px;" muted></video>`;
    } else if (this.dmMediaType === 'gif' && this.dmGifUrl) {
      html = `<img src="${this.dmGifUrl}" style="max-height: 100px; border-radius: 8px;">`;
    }

    if (html) {
      preview.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          ${html}
          <button onclick="CommunityModule.clearDMMedia()" style="padding: 8px; background: #f3f4f6; border: none; border-radius: 50%; cursor: pointer;">✕</button>
        </div>
      `;
      preview.style.display = 'block';
    }
  },

  clearDMMedia: function() {
    this.dmMediaFile = null;
    this.dmMediaType = null;
    this.dmGifUrl = null;
    const preview = document.getElementById('dmMediaPreview');
    if (preview) {
      preview.style.display = 'none';
      preview.innerHTML = '';
    }
  },

  // DM გაგზავნა
  sendDM: async function() {
    const input = document.getElementById('dmInput');
    const content = input?.value?.trim();

    // Must have content OR media
    if (!content && !this.dmMediaFile && !this.dmGifUrl) return;
    if (!this.currentConversation) return;

    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (this.dmMediaFile) {
        formData.append(this.dmMediaType === 'video' ? 'video' : 'image', this.dmMediaFile);
      }
      if (this.dmGifUrl) {
        formData.append('gif', this.dmGifUrl);
      }
      
      const response = await fetch(`${API_URL}/api/community/conversations/${this.currentConversation}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed');

      input.value = '';
      this.clearDMMedia();
      await this.loadMessages(this.currentConversation);

    } catch (error) {
      console.error('Send DM error:', error);
      showToast('შეცდომა', 'error');
    }
  },

  // ჩათის დახურვა
  closeChat: function() {
    document.getElementById('conversationsList').style.display = 'block';
    document.getElementById('dmChatWindow').style.display = 'none';
    this.currentConversation = null;
  },

  // ახალი ჩათის დაწყება (მომხმარებელთან)
  startChat: async function(userId, userName) {
    if (!userId) {
      showToast('მომხმარებელი ვერ მოიძებნა', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('გაიარეთ ავტორიზაცია', 'error');
      return;
    }

    try {
      // შევამოწმოთ არის თუ არა უკვე ჩათი ამ მომხმარებელთან
      const response = await fetch(`${API_URL}/api/community/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: userId })
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      
      // გადავიდეთ შეტყობინებების ტაბზე
      this.switchTab('messages');
      
      // გავხსნათ ჩათი
      setTimeout(() => {
        this.currentConversation = data.conversation._id;
        document.getElementById('conversationsList').style.display = 'none';
        document.getElementById('dmChatWindow').style.display = 'flex';
        document.getElementById('dmChatPartner').textContent = userName;
        this.loadMessages(data.conversation._id);
      }, 300);

    } catch (error) {
      console.error('Start chat error:', error);
      showToast('შეცდომა', 'error');
    }
  },

  // მოდალის დახურვა
  closeModal: function() {
    // Закрываем все возможные модальные окна
    const modals = document.querySelectorAll('.community-modal');
    modals.forEach(modal => {
      modal.classList.remove('open');
      setTimeout(() => modal.remove(), 300);
    });
  },

  // პოსტის გაზიარება
  sharePost: function(postId) {
    if (navigator.share) {
      navigator.share({
        title: 'Beauty Pass Post',
        url: window.location.href
      });
    } else {
      showToast('გაზიარების ლინკი დაკოპირდა!', 'success');
    }
  },

  // ფოტოს დამატება - selectedPhotos storage
  selectedPhotos: [],

  // ფოტოს დამატება
  addPhoto: function() {
    // Create file input
    let fileInput = document.getElementById('photoFileInput');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'photoFileInput';
      fileInput.accept = 'image/*';
      fileInput.multiple = true;
      fileInput.style.display = 'none';
      fileInput.onchange = (e) => this.handlePhotoSelect(e);
      document.body.appendChild(fileInput);
    }
    fileInput.click();
  },

  // Handle photo selection
  handlePhotoSelect: function(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Max 5 photos
    if (this.selectedPhotos.length + files.length > 5) {
      showToast('მაქსიმუმ 5 ფოტო!', 'error');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        showToast('ფოტო ძალიან დიდია (მაქს 5MB)', 'error');
        return;
      }
      this.selectedPhotos.push(file);
    });

    this.updatePhotoPreview();
    showToast(`${files.length} ფოტო დაემატა 📸`, 'success');
    
    // Reset input
    e.target.value = '';
  },

  // Update photo preview
  updatePhotoPreview: function() {
    let preview = document.getElementById('photoPreviewContainer');
    
    if (!preview) {
      const postCard = document.querySelector('.new-post-card');
      if (!postCard) return;
      
      preview = document.createElement('div');
      preview.id = 'photoPreviewContainer';
      preview.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 8px;';
      
      const inputArea = postCard.querySelector('.post-input-area');
      if (inputArea) {
        inputArea.after(preview);
      }
    }

    if (this.selectedPhotos.length === 0) {
      preview.remove();
      return;
    }

    preview.innerHTML = this.selectedPhotos.map((file, index) => {
      const url = URL.createObjectURL(file);
      return `
        <div style="position: relative; width: 80px; height: 80px;">
          <img src="${url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
          <button onclick="CommunityModule.removePhoto(${index})" style="position: absolute; top: -5px; right: -5px; width: 20px; height: 20px; border-radius: 50%; background: #e84393; color: white; border: none; cursor: pointer; font-size: 12px;">✕</button>
        </div>
      `;
    }).join('');
  },

  // Remove photo from selection
  removePhoto: function(index) {
    this.selectedPhotos.splice(index, 1);
    this.updatePhotoPreview();
  },

  // გამოკითხვის მონაცემები
  pendingPoll: null,

  // გამოკითხვის დამატება
  addPoll: function() {
    // Create poll modal
    const modal = document.createElement('div');
    modal.className = 'community-modal';
    modal.id = 'pollModal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="CommunityModule.closePollModal()"></div>
      <div class="modal-content" style="max-width: 450px;">
        <div class="modal-header">
          <h3>📊 გამოკითხვის შექმნა</h3>
          <button class="modal-close" onclick="CommunityModule.closePollModal()">✕</button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">კითხვა:</label>
            <input type="text" id="pollQuestion" placeholder="დასვით კითხვა..." style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; box-sizing: border-box;">
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">პასუხები:</label>
            <div id="pollOptionsContainer">
              <div class="poll-option-row" style="display: flex; gap: 8px; margin-bottom: 8px;">
                <input type="text" class="poll-option-input" placeholder="პასუხი 1" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <button onclick="CommunityModule.removePollOption(this)" style="padding: 10px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer;">🗑️</button>
              </div>
              <div class="poll-option-row" style="display: flex; gap: 8px; margin-bottom: 8px;">
                <input type="text" class="poll-option-input" placeholder="პასუხი 2" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <button onclick="CommunityModule.removePollOption(this)" style="padding: 10px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer;">🗑️</button>
              </div>
            </div>
            <button onclick="CommunityModule.addPollOption()" style="width: 100%; padding: 10px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; color: #666;">+ დაამატე პასუხი</button>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="pollMultiple" style="width: 18px; height: 18px;">
              <span style="color: #666;">მრავალჯერადი არჩევანი</span>
            </label>
          </div>
          
          <button onclick="CommunityModule.confirmPoll()" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #e84393, #fd79a8); color: white; border: none; border-radius: 12px; font-weight: 600; font-size: 16px; cursor: pointer;">
            ✓ დაამატე გამოკითხვა
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('open'), 10);
  },

  // Add poll option
  addPollOption: function() {
    const container = document.getElementById('pollOptionsContainer');
    const optionCount = container.querySelectorAll('.poll-option-row').length;
    
    if (optionCount >= 6) {
      showToast('მაქსიმუმ 6 პასუხი', 'error');
      return;
    }
    
    const row = document.createElement('div');
    row.className = 'poll-option-row';
    row.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px;';
    row.innerHTML = `
      <input type="text" class="poll-option-input" placeholder="პასუხი ${optionCount + 1}" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <button onclick="CommunityModule.removePollOption(this)" style="padding: 10px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer;">🗑️</button>
    `;
    container.appendChild(row);
  },

  // Remove poll option
  removePollOption: function(btn) {
    const container = document.getElementById('pollOptionsContainer');
    if (container.querySelectorAll('.poll-option-row').length <= 2) {
      showToast('მინიმუმ 2 პასუხი საჭიროა', 'error');
      return;
    }
    btn.parentElement.remove();
  },

  // Confirm poll creation
  confirmPoll: function() {
    const question = document.getElementById('pollQuestion')?.value?.trim();
    const optionInputs = document.querySelectorAll('.poll-option-input');
    const options = Array.from(optionInputs).map(i => i.value.trim()).filter(v => v);
    const isMultiple = document.getElementById('pollMultiple')?.checked;

    if (!question) {
      showToast('ჩაწერეთ კითხვა', 'error');
      return;
    }

    if (options.length < 2) {
      showToast('მინიმუმ 2 პასუხი საჭიროა', 'error');
      return;
    }

    this.pendingPoll = {
      question,
      options: options.map(text => ({ text, votes: [] })),
      isMultiple
    };

    // Update textarea to show poll is attached
    const textarea = document.getElementById('newPostText');
    if (textarea && !textarea.value.includes('📊')) {
      textarea.placeholder = '📊 გამოკითხვა დამატებულია! ჩაწერეთ დამატებითი ტექსტი...';
    }

    this.closePollModal();
    this.showPollPreview();
    showToast('გამოკითხვა დამატებულია! 📊', 'success');
  },

  // Show poll preview
  showPollPreview: function() {
    let preview = document.getElementById('pollPreviewContainer');
    
    if (!preview) {
      const postCard = document.querySelector('.new-post-card');
      if (!postCard) return;
      
      preview = document.createElement('div');
      preview.id = 'pollPreviewContainer';
      preview.style.cssText = 'margin: 10px 0; padding: 15px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 12px; border-left: 4px solid #e84393;';
      
      const inputArea = postCard.querySelector('.post-input-area');
      if (inputArea) {
        inputArea.after(preview);
      }
    }

    if (!this.pendingPoll) {
      preview.remove();
      return;
    }

    preview.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong style="color: #e84393;">📊 ${this.pendingPoll.question}</strong>
        <button onclick="CommunityModule.removePoll()" style="background: none; border: none; cursor: pointer; font-size: 16px;">✕</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${this.pendingPoll.options.map(opt => `
          <div style="padding: 8px 12px; background: white; border-radius: 8px; font-size: 14px; color: #666;">
            ○ ${opt.text}
          </div>
        `).join('')}
      </div>
      ${this.pendingPoll.isMultiple ? '<small style="color: #888; margin-top: 8px; display: block;">მრავალჯერადი არჩევანი</small>' : ''}
    `;
  },

  // Remove poll
  removePoll: function() {
    this.pendingPoll = null;
    const preview = document.getElementById('pollPreviewContainer');
    if (preview) preview.remove();
    
    const textarea = document.getElementById('newPostText');
    if (textarea) {
      textarea.placeholder = 'გაუზიარე რაიმე საინტერესო...';
    }
  },

  // Close poll modal
  closePollModal: function() {
    const modal = document.getElementById('pollModal');
    if (modal) {
      modal.classList.remove('open');
      setTimeout(() => modal.remove(), 300);
    }
  },

  // Vote on a poll
  votePoll: async function(postId, optionIndex) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('გაიარეთ ავტორიზაცია', 'error');
        return;
      }

      const response = await fetch(`${API_URL}/api/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ optionIndex })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to vote');
      }

      showToast('ხმა მიღებულია! 📊', 'success');
      await this.loadPosts();

    } catch (error) {
      console.error('Vote error:', error);
      showToast(error.message || 'შეცდომა', 'error');
    }
  },

  // View full-size image
  viewImage: function(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-viewer-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 999999; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    modal.onclick = () => modal.remove();
    modal.innerHTML = `
      <img src="${imageUrl}" style="max-width: 90%; max-height: 90%; border-radius: 8px; object-fit: contain;">
      <button style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 20px; cursor: pointer;">✕</button>
    `;
    document.body.appendChild(modal);
  },

  // კონტენტის ფორმატირება
  formatContent: function(text) {
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
    
    // Convert hashtags
    const hashtagRegex = /#(\w+)/g;
    text = text.replace(hashtagRegex, '<span class="hashtag">#$1</span>');
    
    return text;
  },

  // დროის ფორმატირება
  timeAgo: function(date) {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return 'ახლახანს';
    if (diff < 3600) return `${Math.floor(diff / 60)} წთ წინ`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} სთ წინ`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} დღის წინ`;
    return past.toLocaleDateString('ka-GE');
  },

  // სტილების დამატება
  addStyles: function() {
    if (document.getElementById('communityStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'communityStyles';
    styles.textContent = `
      /* Reset and Base */
      #communityContainer.community-container {
        max-width: 600px !important;
        margin: 0 auto !important;
        padding: 20px !important;
        padding-bottom: 100px !important;
        min-height: auto !important;
        background: #f5f5f7 !important;
        box-sizing: border-box !important;
        display: block !important;
        width: 100% !important;
        overflow-y: visible !important;
        overflow-x: hidden !important;
      }
      
      #communityContainer.community-container * {
        box-sizing: border-box !important;
      }
      
      #community.page-section {
        display: none !important;
        background: #f5f5f7 !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        height: auto !important;
        min-height: 100vh !important;
      }
      
      #community.page-section.active {
        display: block !important;
      }

      /* Header */
      #communityContainer .community-header {
        text-align: center !important;
        margin-bottom: 20px !important;
        padding: 24px 16px !important;
        background: white !important;
        border-radius: 16px !important;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
        display: block !important;
      }

      #communityContainer .community-header h2 {
        font-size: 1.5rem !important;
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        margin: 0 0 8px 0 !important;
        padding: 0 !important;
        display: block !important;
      }

      #communityContainer .community-header p {
        color: #666 !important;
        margin: 0 !important;
        font-size: 14px !important;
        display: block !important;
      }

      /* Tabs - HORIZONTAL LAYOUT */
      #communityContainer .community-tabs {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        gap: 6px !important;
        margin-bottom: 20px !important;
        background: white !important;
        padding: 6px !important;
        border-radius: 14px !important;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
        width: 100% !important;
      }

      #communityContainer .community-tab {
        flex: 1 1 0 !important;
        min-width: 0 !important;
        padding: 12px 8px !important;
        border: none !important;
        background: transparent !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        font-size: 12px !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;
        color: #666 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      #communityContainer .community-tab:hover {
        background: rgba(232, 67, 147, 0.08) !important;
        color: #e84393 !important;
      }

      #communityContainer .community-tab.active {
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        color: white !important;
        box-shadow: 0 4px 12px rgba(232, 67, 147, 0.3) !important;
      }

      #communityContainer .tab-badge {
        background: white !important;
        color: #e84393 !important;
        font-size: 10px !important;
        padding: 2px 5px !important;
        border-radius: 8px !important;
        margin-left: 2px !important;
      }

      /* Content Area */
      #communityContainer .community-content {
        display: block !important;
        width: 100% !important;
      }

      /* Feed Container */
      #communityContainer .feed-container {
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
        width: 100% !important;
        padding-bottom: 80px !important;
        overflow: visible !important;
      }
      
      /* Post Cards */
      #communityContainer .new-post-card,
      #communityContainer .post-card {
        background: white !important;
        border-radius: 16px !important;
        padding: 16px !important;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
        border: 1px solid rgba(0,0,0,0.04) !important;
        display: block !important;
        width: 100% !important;
      }

      #communityContainer .post-input-area {
        display: flex !important;
        flex-direction: row !important;
        gap: 12px !important;
        margin-bottom: 12px !important;
        width: 100% !important;
      }
      
      #communityContainer .posts-list {
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
        width: 100% !important;
        overflow: visible !important;
        padding-bottom: 20px !important;
      }

      #communityContainer .user-avatar,
      #communityContainer .post-avatar {
        width: 40px !important;
        height: 40px !important;
        min-width: 40px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: white !important;
        font-weight: bold !important;
        flex-shrink: 0 !important;
        font-size: 16px !important;
      }

      #communityContainer .post-input-area textarea {
        flex: 1 !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 12px !important;
        padding: 12px !important;
        resize: none !important;
        min-height: 70px !important;
        font-family: inherit !important;
        font-size: 14px !important;
        width: 100% !important;
      }

      #communityContainer .post-actions {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: center !important;
        gap: 8px !important;
      }

      #communityContainer .post-media-btns {
        display: flex !important;
        flex-direction: row !important;
        gap: 6px !important;
      }

      #communityContainer .media-btn {
        padding: 6px 10px !important;
        border: none !important;
        background: #f3f4f6 !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-size: 12px !important;
      }

      #communityContainer .post-submit-btn {
        padding: 10px 20px !important;
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        color: white !important;
        border: none !important;
        border-radius: 20px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        font-size: 13px !important;
      }

      #communityContainer .post-header {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 10px !important;
        margin-bottom: 12px !important;
      }

      #communityContainer .post-meta {
        flex: 1 !important;
      }

      #communityContainer .post-author {
        font-weight: 600 !important;
        display: block !important;
        font-size: 14px !important;
      }

      #communityContainer .post-time {
        color: #9ca3af !important;
        font-size: 12px !important;
      }

      #communityContainer .post-dm-btn {
        background: none !important;
        border: none !important;
        font-size: 14px !important;
        cursor: pointer !important;
        color: #9ca3af !important;
        padding: 4px 8px !important;
        margin-left: auto !important;
        transition: color 0.2s !important;
      }
      
      #communityContainer .post-dm-btn:hover {
        color: #e84393 !important;
      }

      #communityContainer .post-menu-btn {
        background: none !important;
        border: none !important;
        font-size: 18px !important;
        cursor: pointer !important;
        color: #9ca3af !important;
        padding: 4px !important;
      }

      #communityContainer .post-content {
        line-height: 1.5 !important;
        margin-bottom: 12px !important;
        font-size: 14px !important;
      }

      #communityContainer .post-stats {
        display: flex !important;
        flex-direction: row !important;
        gap: 16px !important;
        color: #6b7280 !important;
        font-size: 13px !important;
        padding-bottom: 10px !important;
        border-bottom: 1px solid #f3f4f6 !important;
        margin-bottom: 8px !important;
      }

      #communityContainer .post-actions-bar {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-around !important;
      }

      #communityContainer .action-btn {
        flex: 1 !important;
        padding: 8px !important;
        border: none !important;
        background: none !important;
        cursor: pointer !important;
        font-size: 13px !important;
        border-radius: 8px !important;
        transition: background 0.2s !important;
      }

      #communityContainer .action-btn:hover {
        background: #f3f4f6 !important;
      }

      /* Groups */
      #communityContainer .groups-container {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
        width: 100% !important;
      }
      
      #communityContainer .groups-list {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
        width: 100% !important;
      }

      #communityContainer .create-group-btn {
        width: 100% !important;
        padding: 14px !important;
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        color: white !important;
        border: none !important;
        border-radius: 12px !important;
        font-size: 15px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
      }

      #communityContainer .group-card {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 12px !important;
        background: white !important;
        padding: 14px !important;
        border-radius: 12px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
        cursor: pointer !important;
        width: 100% !important;
      }

      #communityContainer .group-icon {
        width: 50px !important;
        height: 50px !important;
        min-width: 50px !important;
        background: linear-gradient(135deg, #7c3aed, #a855f7) !important;
        border-radius: 12px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 20px !important;
        color: white !important;
      }

      #communityContainer .group-info {
        flex: 1 !important;
        min-width: 0 !important;
      }

      #communityContainer .group-name {
        font-weight: 600 !important;
        margin: 0 0 4px 0 !important;
        font-size: 14px !important;
      }

      #communityContainer .group-desc {
        color: #6b7280 !important;
        font-size: 12px !important;
        margin: 0 0 4px 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      #communityContainer .group-members {
        font-size: 12px !important;
        color: #9ca3af !important;
      }

      #communityContainer .join-btn {
        padding: 8px 16px !important;
        background: #f3f4f6 !important;
        border: none !important;
        border-radius: 16px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        font-size: 12px !important;
        white-space: nowrap !important;
        transition: all 0.2s !important;
      }
      
      #communityContainer .join-btn:hover {
        background: #e5e7eb !important;
      }
      
      #communityContainer .join-btn.joined {
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        color: white !important;
      }

      /* Messages */
      #communityContainer .messages-container {
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
      }
      
      #communityContainer .conversations-list {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        width: 100% !important;
      }

      #communityContainer .conversation-card {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 12px !important;
        background: white !important;
        padding: 12px !important;
        border-radius: 12px !important;
        cursor: pointer !important;
        width: 100% !important;
      }

      #communityContainer .conv-avatar {
        width: 44px !important;
        height: 44px !important;
        min-width: 44px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: white !important;
        font-weight: bold !important;
      }

      #communityContainer .conv-info {
        flex: 1 !important;
        min-width: 0 !important;
      }

      #communityContainer .conv-name {
        font-weight: 600 !important;
        display: block !important;
        font-size: 14px !important;
      }

      #communityContainer .conv-preview {
        color: #6b7280 !important;
        font-size: 13px !important;
        margin: 4px 0 0 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      #communityContainer .conv-meta {
        text-align: right !important;
      }

      #communityContainer .conv-time {
        font-size: 11px !important;
        color: #9ca3af !important;
      }

      /* Empty State */
      #communityContainer .empty-state {
        text-align: center !important;
        padding: 40px 20px !important;
        color: #6b7280 !important;
        background: white !important;
        border-radius: 16px !important;
      }

      #communityContainer .empty-icon {
        font-size: 40px !important;
        display: block !important;
        margin-bottom: 12px !important;
      }

      #communityContainer .loading,
      #communityContainer .loading-posts {
        text-align: center !important;
        padding: 40px !important;
        color: #9ca3af !important;
      }

      /* DM Chat */
      #communityContainer .dm-chat-window {
        display: flex !important;
        flex-direction: column !important;
        height: 450px !important;
        background: white !important;
        border-radius: 16px !important;
        overflow: hidden !important;
      }

      #communityContainer .dm-chat-header {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 12px !important;
        padding: 14px !important;
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        color: white !important;
      }

      #communityContainer .back-btn {
        background: none !important;
        border: none !important;
        color: white !important;
        font-size: 18px !important;
        cursor: pointer !important;
        padding: 4px !important;
      }

      #communityContainer .dm-messages {
        flex: 1 !important;
        overflow-y: auto !important;
        padding: 12px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }

      #communityContainer .dm-message {
        max-width: 75% !important;
      }

      #communityContainer .dm-message.own {
        align-self: flex-end !important;
      }

      #communityContainer .dm-message.other {
        align-self: flex-start !important;
      }

      #communityContainer .dm-bubble {
        padding: 10px 14px !important;
        border-radius: 14px !important;
        line-height: 1.4 !important;
        font-size: 14px !important;
      }

      #communityContainer .dm-message.own .dm-bubble {
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        color: white !important;
      }

      #communityContainer .dm-message.other .dm-bubble {
        background: #f3f4f6 !important;
      }

      #communityContainer .dm-input-area {
        display: flex !important;
        flex-direction: row !important;
        gap: 8px !important;
        padding: 12px !important;
        background: #f9fafb !important;
      }

      #communityContainer .dm-input-area input {
        flex: 1 !important;
        padding: 10px 14px !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 20px !important;
        outline: none !important;
        font-size: 14px !important;
      }

      #communityContainer .send-dm-btn {
        width: 40px !important;
        height: 40px !important;
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        border: none !important;
        border-radius: 50% !important;
        color: white !important;
        font-size: 16px !important;
        cursor: pointer !important;
      }

      /* Modal */
      .community-modal {
        position: fixed !important;
        inset: 0 !important;
        z-index: 10000 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        opacity: 0 !important;
        transition: opacity 0.3s !important;
      }

      .community-modal.open {
        opacity: 1 !important;
      }

      .modal-overlay {
        position: absolute !important;
        inset: 0 !important;
        background: rgba(0,0,0,0.5) !important;
      }

      .modal-content {
        position: relative !important;
        background: white !important;
        border-radius: 16px !important;
        width: 90% !important;
        max-width: 360px !important;
      }

      .modal-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 14px 16px !important;
        border-bottom: 1px solid #f3f4f6 !important;
      }

      .modal-header h3 {
        margin: 0 !important;
        font-size: 16px !important;
      }

      .modal-close {
        background: none !important;
        border: none !important;
        font-size: 18px !important;
        cursor: pointer !important;
        color: #9ca3af !important;
      }

      .modal-body {
        padding: 16px !important;
      }

      #communityContainer .form-group {
        margin-bottom: 14px !important;
      }

      #communityContainer .form-group label {
        display: block !important;
        margin-bottom: 6px !important;
        font-weight: 500 !important;
        font-size: 13px !important;
      }

      #communityContainer .form-group input,
      #communityContainer .form-group textarea {
        width: 100% !important;
        padding: 10px !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 8px !important;
        font-family: inherit !important;
        font-size: 14px !important;
      }

      #communityContainer .form-group textarea {
        min-height: 70px !important;
        resize: vertical !important;
      }

      #communityContainer .btn-full {
        width: 100% !important;
      }

      #communityContainer .btn-primary {
        background: linear-gradient(135deg, #e84393, #fd79a8) !important;
        color: white !important;
        border: none !important;
        padding: 12px 20px !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        font-size: 14px !important;
      }

      /* Responsive */
      @media (max-width: 480px) {
        #communityContainer.community-container {
          padding: 12px !important;
        }
        
        #communityContainer .community-tab {
          padding: 10px 6px !important;
          font-size: 11px !important;
        }
        
        #communityContainer .post-media-btns {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styles);
  }
};

// გლობალური ფუნქციები
window.showCommunity = function() {
  const mainContent = document.querySelector('.main-content') || document.getElementById('mainContent');
  if (mainContent) {
    mainContent.innerHTML = '<div id="communityContent"></div>';
    CommunityModule.render(document.getElementById('communityContent'));
  }
};

// Auto init
CommunityModule.init();
window.CommunityModule = CommunityModule;

// CommunityApp alias для совместимости с HTML
window.CommunityApp = {
  show: function() {
    console.log('✅ CommunityApp.show() called');
    
    // Скрываем все секции
    document.querySelectorAll('.page-section').forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    
    // Показываем секцию community
    const communitySection = document.getElementById('community');
    if (communitySection) {
      communitySection.classList.add('active');
      communitySection.style.display = 'block';
      console.log('✅ Community section activated');
    } else {
      console.error('❌ Community section not found');
    }
    
    // Рендерим контент
    const container = document.getElementById('communityContainer');
    if (container) {
      CommunityModule.render(container);
      console.log('✅ Community rendered');
    } else {
      console.error('❌ Community container not found');
    }
    
    // Обновляем навигацию
    document.querySelectorAll('.nav-link, .nav-links a').forEach(l => l.classList.remove('active'));
    const communityLink = document.querySelector('.community-nav-link');
    if (communityLink) communityLink.classList.add('active');
    
    // Скроллим вверх
    window.scrollTo(0, 0);
  }
};

console.log('✅ CommunityApp loaded and ready');
