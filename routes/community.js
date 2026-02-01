// routes/community.js - API для Community платформы
const express = require('express');
const router = express.Router();
const { Group, Post, Comment, DirectMessage, Conversation, Notification, Follow } = require('../models/Community');
const User = require('../models/User');
const { authMiddleware: auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Настройка загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/community/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Только изображения и видео!'));
  }
});

// ==========================================
// ГРУППЫ
// ==========================================

// Получить все группы
router.get('/groups', async (req, res) => {
  try {
    const { category, search, sort = 'popular' } = req.query;
    let query = { isPublic: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    let sortOption = {};
    switch(sort) {
      case 'popular': sortOption = { memberCount: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      case 'active': sortOption = { postCount: -1 }; break;
      default: sortOption = { memberCount: -1 };
    }
    
    const groups = await Group.find(query)
      .populate('creator', 'firstName lastName')
      .sort(sortOption)
      .limit(50);
    
    res.json({ groups: groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать группу (с поддержкой загрузки фото)
router.post('/groups', auth, upload.single('coverImage'), async (req, res) => {
  try {
    console.log('Creating group, user:', req.user?._id);
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const { name, nameEn, description, descriptionEn, category, icon, isPublic, rules, tags } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название группы обязательно' });
    }
    
    const group = new Group({
      name,
      nameEn,
      description,
      descriptionEn,
      category: category || 'general',
      icon: icon || '💬',
      coverImage: req.file ? `/uploads/community/${req.file.filename}` : undefined,
      isPublic: isPublic !== false,
      creator: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
      memberCount: 1,
      rules,
      tags
    });
    
    await group.save();
    console.log('Group created:', group._id);
    
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Ошибка создания группы' });
  }
});

// Получить группу по ID
router.get('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'firstName lastName')
      .populate('admins', 'firstName lastName');
    
    if (!group) {
      return res.status(404).json({ message: 'Группа не найдена' });
    }
    
    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Вступить/выйти из группы
router.post('/groups/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Группа не найдена' });
    }
    
    const userId = req.user._id.toString();
    const isMember = group.members.some(m => m.toString() === userId);
    
    if (isMember) {
      // Выйти
      group.members = group.members.filter(m => m.toString() !== userId);
      group.memberCount = Math.max(0, group.memberCount - 1);
    } else {
      // Вступить
      group.members.push(req.user._id);
      group.memberCount += 1;
    }
    
    await group.save();
    
    console.log('Join group result:', { joined: !isMember, memberCount: group.memberCount, userId });
    
    res.json({ 
      joined: !isMember, 
      memberCount: group.memberCount 
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить обложку группы (только для админов)
router.put('/groups/:id/cover', auth, upload.single('coverImage'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Группа не найдена' });
    }
    
    // Проверяем права админа
    const userId = req.user._id.toString();
    const isAdmin = group.creator.toString() === userId || 
                   group.admins.some(a => a.toString() === userId);
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Только админы могут изменять группу' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }
    
    group.coverImage = `/uploads/community/${req.file.filename}`;
    await group.save();
    
    res.json({ message: 'Обложка обновлена', coverImage: group.coverImage });
  } catch (error) {
    console.error('Error updating group cover:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==========================================
// ПОСТЫ
// ==========================================

// Получить посты группы
router.get('/groups/:id/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const posts = await Post.find({ group: req.params.id })
      .populate('author', 'firstName lastName')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Форматируем посты как в общем фиде
    const formattedPosts = posts.map(post => ({
      _id: post._id,
      content: post.content,
      image: post.images?.[0] || post.image,
      author: post.author,
      likes: post.likeCount || 0,
      comments: post.commentCount || 0,
      createdAt: post.createdAt,
      likedByMe: false
    }));
    
    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить ленту (все посты из групп пользователя)
router.get('/feed', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Находим группы пользователя
    const userGroups = await Group.find({ members: req.user._id }).select('_id');
    const groupIds = userGroups.map(g => g._id);
    
    const posts = await Post.find({ group: { $in: groupIds } })
      .populate('author', 'firstName lastName')
      .populate('group', 'name icon')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить все посты (общая лента)
router.get('/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const posts = await Post.find({})
      .populate('author', 'firstName lastName')
      .populate('group', 'name icon')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Формируем ответ с likes/comments count
    const formattedPosts = posts.map(post => ({
      _id: post._id,
      author: post.author,
      content: post.content,
      images: post.images,
      gif: post.gif,
      type: post.type,
      poll: post.poll, // Include poll data for voting
      likes: post.reactions?.like?.length || 0,
      comments: post.commentCount || 0,
      isLiked: false, // TODO: check if user liked
      createdAt: post.createdAt
    }));
    
    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Лайк/анлайк поста
router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }
    
    // Инициализируем reactions если нет
    if (!post.reactions) {
      post.reactions = { like: [], love: [], haha: [], wow: [], sad: [], fire: [] };
    }
    if (!post.reactions.like) {
      post.reactions.like = [];
    }
    
    const userIdStr = req.user._id.toString();
    const isLiked = post.reactions.like.some(id => id.toString() === userIdStr);
    
    if (isLiked) {
      // Убираем лайк
      post.reactions.like = post.reactions.like.filter(id => id.toString() !== userIdStr);
    } else {
      // Добавляем лайк
      post.reactions.like.push(req.user._id);
    }
    
    post.reactionCount = post.reactions.like.length;
    await post.save();
    
    res.json({ 
      liked: !isLiked, 
      likes: post.reactions.like.length 
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать пост
router.post('/posts', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { groupId, content, type, gif, poll } = req.body;
    
    // Если группа указана - проверяем членство
    let group = null;
    if (groupId) {
      group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Группа не найдена' });
      }
      
      if (!group.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Вы не состоите в этой группе' });
      }
    }
    
    // Извлекаем хештеги и упоминания
    const hashtags = content.match(/#[\wа-яА-ЯёЁ]+/g) || [];
    const mentionMatches = content.match(/@[\wа-яА-ЯёЁ]+/g) || [];
    
    // Ищем упомянутых пользователей
    const mentions = [];
    for (const mention of mentionMatches) {
      const username = mention.slice(1);
      const user = await User.findOne({ 
        $or: [{ firstName: username }, { login: username }]
      });
      if (user) mentions.push(user._id);
    }
    
    const images = req.files ? req.files.map(f => `/uploads/community/${f.filename}`) : [];
    
    const post = new Post({
      group: groupId || undefined,
      author: req.user._id,
      content,
      type: type || (images.length > 0 ? 'image' : 'text'),
      images,
      gif,
      poll: poll ? JSON.parse(poll) : undefined,
      hashtags: hashtags.map(h => h.slice(1)),
      mentions
    });
    
    await post.save();
    
    // Обновляем счетчик постов в группе (если есть группа)
    if (group) {
      group.postCount += 1;
      await group.save();
    }
    
    // Создаем уведомления для упомянутых
    for (const userId of mentions) {
      await Notification.create({
        user: userId,
        type: 'mention',
        actor: req.user._id,
        post: post._id,
        group: groupId,
        message: 'упомянул(а) вас в посте'
      });
    }
    
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'firstName lastName');
    
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Ошибка создания поста' });
  }
});

// Голосование в опросе
router.post('/posts/:id/vote', auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }
    
    if (!post.poll || !post.poll.options) {
      return res.status(400).json({ message: 'Это не опрос' });
    }
    
    if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
      return res.status(400).json({ message: 'Неверный вариант' });
    }
    
    const userId = req.user._id.toString();
    
    // Check if already voted (for non-multiple choice)
    if (!post.poll.isMultiple) {
      const alreadyVoted = post.poll.options.some(opt => 
        opt.votes && opt.votes.some(v => v.toString() === userId)
      );
      
      if (alreadyVoted) {
        // Remove previous vote
        post.poll.options.forEach(opt => {
          if (opt.votes) {
            opt.votes = opt.votes.filter(v => v.toString() !== userId);
          }
        });
      }
    }
    
    // Check if already voted for this option
    const option = post.poll.options[optionIndex];
    if (!option.votes) option.votes = [];
    
    const voteIndex = option.votes.findIndex(v => v.toString() === userId);
    if (voteIndex >= 0) {
      // Remove vote (toggle)
      option.votes.splice(voteIndex, 1);
    } else {
      // Add vote
      option.votes.push(req.user._id);
    }
    
    await post.save();
    
    res.json({ 
      message: 'Голос учтен',
      poll: post.poll 
    });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Реакция на пост
router.post('/posts/:id/react', auth, async (req, res) => {
  try {
    const { reaction } = req.body; // like, love, haha, wow, sad, fire
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }
    
    const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'fire'];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({ message: 'Неверный тип реакции' });
    }
    
    // Убираем все предыдущие реакции пользователя
    for (const r of validReactions) {
      post.reactions[r] = post.reactions[r].filter(u => u.toString() !== req.user._id);
    }
    
    // Добавляем новую реакцию
    post.reactions[reaction].push(req.user._id);
    
    // Пересчитываем общее количество
    post.reactionCount = validReactions.reduce((sum, r) => sum + post.reactions[r].length, 0);
    
    await post.save();
    
    // Уведомление автору
    if (post.author.toString() !== req.user._id) {
      await Notification.create({
        user: post.author,
        type: 'like',
        actor: req.user._id,
        post: post._id,
        message: `отреагировал(а) ${reaction} на ваш пост`
      });
    }
    
    res.json({ reactions: post.reactions, reactionCount: post.reactionCount });
  } catch (error) {
    console.error('Error reacting to post:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==========================================
// КОММЕНТАРИИ
// ==========================================

// Получить комментарии поста
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id, parentComment: null })
      .populate('author', 'firstName lastName')
      .sort({ createdAt: 1 });
    
    // Загружаем ответы
    for (let comment of comments) {
      const replies = await Comment.find({ parentComment: comment._id })
        .populate('author', 'firstName lastName')
        .sort({ createdAt: 1 });
      comment._doc.replies = replies;
    }
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Добавить комментарий
router.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    const { content, parentCommentId, gif, image } = req.body;
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }
    
    const comment = new Comment({
      post: req.params.id,
      author: req.user._id,
      content,
      parentComment: parentCommentId || null,
      gif,
      image
    });
    
    await comment.save();
    
    // Обновляем счетчики
    post.commentCount += 1;
    await post.save();
    
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, { $inc: { replyCount: 1 } });
    }
    
    // Уведомление автору поста
    if (post.author.toString() !== req.user._id) {
      await Notification.create({
        user: post.author,
        type: 'comment',
        actor: req.user._id,
        post: post._id,
        comment: comment._id,
        message: 'прокомментировал(а) ваш пост'
      });
    }
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'firstName lastName');
    
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==========================================
// ЛИЧНЫЕ СООБЩЕНИЯ
// ==========================================

// Получить список бесед
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'firstName lastName')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });
    
    // Преобразуем для фронтенда - добавляем partner
    const formattedConversations = conversations.map(conv => {
      const partner = conv.participants.find(p => p._id.toString() !== req.user._id.toString());
      return {
        _id: conv._id,
        partner: partner || { firstName: 'Unknown', lastName: '' },
        lastMessage: conv.lastMessage?.content || '',
        unreadCount: conv.unreadCount?.get(req.user._id.toString()) || 0,
        updatedAt: conv.lastMessageAt || conv.updatedAt
      };
    });
    
    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Начать беседу с пользователем (или получить существующую)
router.post('/conversations/start', auth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ message: 'Укажите получателя' });
    }
    
    // Проверяем что получатель существует
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Ищем существующую беседу
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] }
    });
    
    // Если нет - создаем новую
    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, recipientId],
        unreadCount: new Map()
      });
      await conversation.save();
    }
    
    res.json({ conversation });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить сообщения беседы по ID беседы
router.get('/conversations/:convId/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    // Находим беседу
    const conversation = await Conversation.findById(req.params.convId);
    if (!conversation) {
      return res.status(404).json({ message: 'Беседа не найдена' });
    }
    
    // Проверяем, что пользователь участник
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Нет доступа' });
    }
    
    // Находим другого участника
    const otherUserId = conversation.participants.find(p => p.toString() !== req.user._id.toString());
    
    const messages = await DirectMessage.find({
      $or: [
        { sender: req.user._id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user._id }
      ],
      deletedFor: { $ne: req.user._id }
    })
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Отмечаем как прочитанные
    await DirectMessage.updateMany(
      { sender: otherUserId, recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отправить сообщение в существующую беседу (с поддержкой медиа)
router.post('/conversations/:convId/messages', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { content, gif, sticker } = req.body;
    
    // Находим беседу
    const conversation = await Conversation.findById(req.params.convId);
    if (!conversation) {
      return res.status(404).json({ message: 'Беседа не найдена' });
    }
    
    // Проверяем, что пользователь участник
    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Нет доступа' });
    }
    
    // Находим получателя
    const recipientId = conversation.participants.find(p => p.toString() !== req.user._id.toString());
    
    // Process uploaded files
    let image = null;
    let video = null;
    
    if (req.files?.image?.[0]) {
      image = `/uploads/community/${req.files.image[0].filename}`;
    }
    if (req.files?.video?.[0]) {
      video = `/uploads/community/${req.files.video[0].filename}`;
    }
    
    const message = new DirectMessage({
      sender: req.user._id,
      recipient: recipientId,
      content: content || '',
      image,
      video,
      gif,
      sticker
    });
    
    await message.save();
    
    // Обновляем беседу
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    const currentUnread = conversation.unreadCount.get(recipientId.toString()) || 0;
    conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);
    await conversation.save();
    
    const populatedMessage = await DirectMessage.findById(message._id)
      .populate('sender', 'firstName lastName');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message to conversation:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отправить личное сообщение (создать новую беседу)
router.post('/messages', auth, async (req, res) => {
  try {
    const { recipientId, content, image, gif, sticker } = req.body;
    
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Получатель не найден' });
    }
    
    const message = new DirectMessage({
      sender: req.user._id,
      recipient: recipientId,
      content,
      image,
      gif,
      sticker
    });
    
    await message.save();
    
    // Обновляем или создаем беседу
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] }
    });
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, recipientId]
      });
    }
    
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Увеличиваем счетчик непрочитанных
    const currentUnread = conversation.unreadCount.get(recipientId) || 0;
    conversation.unreadCount.set(recipientId, currentUnread + 1);
    
    await conversation.save();
    
    // Уведомление получателю
    await Notification.create({
      user: recipientId,
      type: 'message',
      actor: req.user._id,
      message: 'отправил(а) вам сообщение'
    });
    
    const populatedMessage = await DirectMessage.findById(message._id)
      .populate('sender', 'firstName lastName');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==========================================
// УВЕДОМЛЕНИЯ
// ==========================================

router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('actor', 'firstName lastName')
      .populate('post', 'content')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/notifications/read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/notifications/unread/count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==========================================
// ПОДПИСКИ
// ==========================================

router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: req.params.userId
    });
    
    if (existingFollow) {
      // Отписаться
      await Follow.deleteOne({ _id: existingFollow._id });
      res.json({ following: false });
    } else {
      // Подписаться
      await Follow.create({
        follower: req.user._id,
        following: req.params.userId
      });
      
      // Уведомление
      await Notification.create({
        user: req.params.userId,
        type: 'follow',
        actor: req.user._id,
        message: 'подписался(ась) на вас'
      });
      
      res.json({ following: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Поиск пользователей
router.get('/users/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const users = await User.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    })
      .select('firstName lastName email')
      .limit(20);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
