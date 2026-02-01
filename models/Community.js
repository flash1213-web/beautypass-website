// models/Community.js - Модели для Community платформы
const mongoose = require('mongoose');

// === ГРУППА/КАНАЛ ===
const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Название группы
  nameEn: { type: String }, // Название на английском
  description: { type: String }, // Описание
  descriptionEn: { type: String },
  category: { 
    type: String, 
    enum: ['beauty', 'hair', 'nails', 'skincare', 'makeup', 'wellness', 'fashion', 'lifestyle', 'memes', 'general'],
    default: 'general'
  },
  icon: { type: String, default: '💬' }, // Эмодзи иконка
  coverImage: { type: String }, // Обложка группы
  isPublic: { type: Boolean, default: true }, // Публичная или приватная
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  memberCount: { type: Number, default: 0 },
  postCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false }, // Закрепленная группа
  rules: [{ type: String }], // Правила группы
  tags: [{ type: String }], // Теги для поиска
}, { timestamps: true });

// === ПОСТ В ГРУППЕ ===
const PostSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // Не обязательно - может быть общий пост
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }, // Текст поста
  images: [{ type: String }], // Массив URL изображений
  video: { type: String }, // URL видео
  gif: { type: String }, // URL GIF
  type: { 
    type: String, 
    enum: ['text', 'image', 'video', 'poll', 'meme'],
    default: 'text'
  },
  // Опрос
  poll: {
    question: { type: String },
    options: [{
      text: { type: String },
      votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    endsAt: { type: Date },
    isMultiple: { type: Boolean, default: false }
  },
  // Реакции
  reactions: {
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    haha: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sad: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    fire: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  reactionCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // @упоминания
  hashtags: [{ type: String }], // #хештеги
}, { timestamps: true });

// === КОММЕНТАРИЙ ===
const CommentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  image: { type: String }, // Картинка в комментарии
  gif: { type: String }, // GIF в комментарии
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // Ответ на комментарий
  reactions: {
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  reactionCount: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
  isEdited: { type: Boolean, default: false },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// === ЛИЧНОЕ СООБЩЕНИЕ ===
const DirectMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  image: { type: String },
  video: { type: String }, // Видео сообщение
  gif: { type: String },
  sticker: { type: String }, // Стикер
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Удалено для конкретных пользователей
}, { timestamps: true });

// === БЕСЕДА (для группировки личных сообщений) ===
const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'DirectMessage' },
  lastMessageAt: { type: Date },
  unreadCount: { type: Map, of: Number, default: {} }, // userId -> count
  isArchived: { type: Map, of: Boolean, default: {} }, // userId -> isArchived
  isPinned: { type: Map, of: Boolean, default: {} }, // userId -> isPinned
}, { timestamps: true });

// === УВЕДОМЛЕНИЕ ===
const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['like', 'comment', 'mention', 'follow', 'message', 'group_invite', 'post'],
    required: true
  },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Кто вызвал уведомление
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  message: { type: String }, // Текст уведомления
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

// === ПОДПИСКА (Следование) ===
const FollowSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Индексы
GroupSchema.index({ name: 'text', description: 'text' });
GroupSchema.index({ tags: 1 });
GroupSchema.index({ category: 1, memberCount: -1 });
PostSchema.index({ group: 1, createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });
CommentSchema.index({ post: 1, createdAt: 1 });
DirectMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
ConversationSchema.index({ participants: 1 });
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

const Group = mongoose.model('Group', GroupSchema);
const Post = mongoose.model('Post', PostSchema);
const Comment = mongoose.model('Comment', CommentSchema);
const DirectMessage = mongoose.model('DirectMessage', DirectMessageSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
const Follow = mongoose.model('Follow', FollowSchema);

module.exports = { Group, Post, Comment, DirectMessage, Conversation, Notification, Follow };
