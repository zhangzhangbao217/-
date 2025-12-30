import { ref } from 'vue';
import { Realtime, TextMessage } from 'leancloud-realtime';
import * as RealtimeModule from 'leancloud-realtime';
// @ts-ignore
import AV from 'leancloud-storage';
import { ElNotification, ElMessage } from 'element-plus';
import axios from 'axios';

const { ImageMessage, AudioMessage } = RealtimeModule as any;

// LeanCloud 配置
const APP_ID = 'il767G7CLSIfR9SinxIBROH6-gzGzoHsz';
const APP_KEY = 'FyOvCD2YFzhmbeabWLjLeeGz';
const SERVER_URL = 'https://il767g7c.lc-cn-n1-shared.com';
const CONVERSATION_ID = 'sweet_love_chat_v1';
const NOTIFY_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

// 外部推送配置 (PushDeer)
// 用户 1 (张张包) 的推送密钥 - 用于接收对方发给张张包的消息
const DEFAULT_PUSH_KEY_USER1 = ''; 
// 用户 2 (小黄包) 的推送密钥 - 用于接收对方发给小黄包的消息
const DEFAULT_PUSH_KEY_USER2 = ''; 

const getTargetPushKey = () => {
  // 优先从本地存储读取
  const customKey1 = localStorage.getItem('push_key_user1'); // 张张包的 Key
  const customKey2 = localStorage.getItem('push_key_user2'); // 小黄包的 Key
  
  const key1 = customKey1 || DEFAULT_PUSH_KEY_USER1;
  const key2 = customKey2 || DEFAULT_PUSH_KEY_USER2;

  // 如果当前登录的是 张张包 (user1)，消息发给 小黄包 (user2)，所以用 key2
  // 如果当前登录的是 小黄包 (user2)，消息发给 张张包 (user1)，所以用 key1
  const targetKey = currentUser.value.id === user1.id ? key2 : key1;
  console.log(`[Push] 当前发送者: ${currentUser.value.name}, 目标接收者 Key: ${targetKey}`);
  return targetKey;
};

const getMyPushKey = () => {
  const customKey1 = localStorage.getItem('push_key_user1');
  const customKey2 = localStorage.getItem('push_key_user2');
  
  const key1 = customKey1 || DEFAULT_PUSH_KEY_USER1;
  const key2 = customKey2 || DEFAULT_PUSH_KEY_USER2;

  // 我自己的 Key
  return currentUser.value.id === user1.id ? key1 : key2;
};

// 用户定义
export const user1 = {
  id: 'Hgtzsx',
  name: '张张包',
  avatar: '/df49bc6ca7d5b77ace3eeaec5d0008c6.jpg'
};

export const user2 = {
  id: 'Partner',
  name: '小黄包',
  avatar: '/df49bc6ca7d5b77ace3eeaec5d0008c6.jpg'
};

// 全局状态
export const globalChatClient = ref<any>(null);
export const globalConversation = ref<any>(null);
export const globalIsOnline = ref(false);
export const isConnecting = ref(false);
export const currentUser = ref(user1);

// 初始化时从本地存储加载历史记录
const getInitialMessages = () => {
  try {
    const savedMessages = localStorage.getItem('chat_history');
    return savedMessages ? JSON.parse(savedMessages) : [];
  } catch (e) {
    return [];
  }
};

export const messages = ref<any[]>(getInitialMessages());

export const saveMessages = () => {
  localStorage.setItem('chat_history', JSON.stringify(messages.value.slice(-100)));
};

let realtime: any = null;

// 初始化存储
AV.init({
  appId: APP_ID,
  appKey: APP_KEY,
  serverURL: SERVER_URL
});

export const getRealtime = () => {
  if (!realtime) {
    realtime = new Realtime({
      appId: APP_ID,
      appKey: APP_KEY,
      server: SERVER_URL,
      noBinary: true,
    });
  }
  return realtime;
};

export const initChat = async (silent = false) => {
  // 从本地存储恢复身份
  const savedUserId = localStorage.getItem('chat_user_id');
  if (savedUserId) {
    currentUser.value = savedUserId === user1.id ? user1 : user2;
  }

  if (globalChatClient.value && globalChatClient.value.id === currentUser.value.id) {
    const status = globalChatClient.value.status;
    if (status === 'opened' || status === 'connecting' || status === 'reconnecting') {
      if (status === 'opened') globalIsOnline.value = true;
      if (!globalConversation.value) {
        globalConversation.value = await globalChatClient.value.getConversation(CONVERSATION_ID);
      }
      return;
    }
  }

  if (isConnecting.value) return;
  if (!silent) isConnecting.value = true;

  try {
    const rt = getRealtime();
    const newClient = await rt.createIMClient(currentUser.value.id);

    if (globalChatClient.value && globalChatClient.value !== newClient) {
      globalChatClient.value.off();
      await globalChatClient.value.close().catch(() => {});
    }

    globalChatClient.value = newClient;
    
    globalConversation.value = await newClient.getConversation(CONVERSATION_ID);
    if (!globalConversation.value) {
      globalConversation.value = await newClient.createConversation({
        members: [user1.id, user2.id],
        name: '我们的甜蜜私聊',
        unique: true
      });
    }

    globalIsOnline.value = true;
    setupGlobalListeners();
    
    // 监听页面可见性变化，回到前台时立即同步（确保只绑定一次）
    if (!(window as any).visibilityListenerBound) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          console.log('页面回到前台，检查连接...');
          if (!globalIsOnline.value) {
            initChat(true);
          }
        }
      });
      (window as any).visibilityListenerBound = true;
    }
    console.log('全局聊天连接成功');
  } catch (error) {
    console.error('全局聊天初始化失败:', error);
    globalIsOnline.value = false;
    if (!silent) {
      setTimeout(() => initChat(), 5000);
    }
  } finally {
    isConnecting.value = false;
  }
};

const setupGlobalListeners = () => {
  if (!globalChatClient.value) return;

  globalChatClient.value.off('message');
  globalChatClient.value.on('message', (message: any) => {
    const parsedMsg = parseMessage(message);
    
    // 如果不在聊天页面，或者消息不是自己发的，显示通知
    const isChatPage = window.location.pathname === '/chat';
    const isMine = message.from === currentUser.value.id;

    if (!isMine) {
      notifyNewMessage(parsedMsg, isChatPage);
    }

    // 同步到全局消息列表（如果需要）
    if (!messages.value.find(m => m.id === parsedMsg.id)) {
      messages.value.push(parsedMsg);
      saveMessages();
    }
  });

  globalChatClient.value.on('disconnect', () => {
    globalIsOnline.value = false;
  });
  globalChatClient.value.on('reconnect', () => {
    globalIsOnline.value = true;
    isConnecting.value = false;
  });
  globalChatClient.value.on('reconnecting', () => {
    isConnecting.value = true;
  });
};

export const parseMessage = (msg: any) => {
  const isMine = msg.from === currentUser.value.id;
  const senderInfo = msg.from === user1.id ? user1 : user2;
  
  let contentType = 'text';
  let content = '';
  let duration = 0;

  if (msg instanceof TextMessage) {
    contentType = 'text';
    content = msg.getText();
  } else if (msg instanceof ImageMessage) {
    contentType = 'image';
    content = msg.getFile().url();
  } else if (msg instanceof AudioMessage) {
    contentType = 'voice';
    content = msg.getFile().url();
    duration = Math.round(msg.getFile().get('metaData').duration || 0);
  }

  return {
    id: msg.id || Math.random().toString(36).substr(2, 9),
    sender: senderInfo.name,
    avatar: senderInfo.avatar,
    type: isMine ? 'mine' : 'other',
    contentType,
    content,
    duration,
    time: msg.timestamp ? msg.timestamp.getTime() : Date.now()
  };
};

const notifyNewMessage = (msg: any, isChatPage: boolean) => {
  // 1. 播放提示音
  const audio = new Audio(NOTIFY_SOUND_URL);
  audio.volume = 0.5;
  audio.play().catch(() => {});

  // 2. 浏览器系统通知 (如果页面不在前台)
  if (document.hidden) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`💕 来自 ${msg.sender} 的新消息`, {
        body: msg.contentType === 'text' ? msg.content : `[${msg.contentType === 'image' ? '图片' : '语音'}]`,
        icon: msg.avatar
      });
    }
    
    // 3. 额外保险：如果页面在后台，且没能弹出系统通知（比如移动端浏览器限制），则尝试发一个外部推送给自己
     const myKey = getMyPushKey();
     if (myKey) {
       const text = msg.contentType === 'text' ? msg.content : `[${msg.contentType === 'image' ? '图片' : '语音'}]`;
       const url = `https://api2.pushdeer.com/message/push?pushkey=${myKey}&text=${encodeURIComponent('💕 收到新消息')}&desp=${encodeURIComponent(text)}&type=text`;
       fetch(url, { method: 'GET', keepalive: true, mode: 'no-cors' }).catch(() => {});
     }
  }

  // 4. 应用内顶部弹窗通知 (如果不在聊天页，或者页面在前台但不在聊天页)
  if (!isChatPage) {
    ElNotification({
      title: `新消息: ${msg.sender}`,
      message: msg.contentType === 'text' ? msg.content : `[${msg.contentType === 'image' ? '图片' : '语音'}]`,
      type: 'success',
      position: 'top-right',
      duration: 3000
    });
  }
};

// 发送外部推送通知
export const sendExternalPush = async (text: string) => {
  const key = getTargetPushKey();
  if (!key) {
    console.warn('[Push] 未配置接收者 Key，跳过推送');
    return false;
  }

  console.log(`[Push] 尝试向 Key(${key.substring(0, 8)}...) 发送推送`);

  try {
    // 使用 fetch 并开启 keepalive，确保即使页面关闭/切后台也能尽量完成请求
    const url = `https://api2.pushdeer.com/message/push?pushkey=${key}&text=${encodeURIComponent('💕 恋爱窝新消息')}&desp=${encodeURIComponent(text)}&type=text`;
    
    const response = await fetch(url, {
      method: 'GET',
      keepalive: true,
      mode: 'no-cors' // 避免 CORS 预检请求阻塞
    });
    
    console.log('[Push] 外部推送请求已发出');
    return true;
  } catch (error) {
    console.error('[Push] 外部推送发送失败:', error);
    return false;
  }
};
