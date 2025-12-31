import { ref, reactive } from 'vue';
import { Realtime, TextMessage } from 'leancloud-realtime';
import * as RealtimeModule from 'leancloud-realtime';
// @ts-ignore
import AV from 'leancloud-storage';
import { ElNotification, ElMessage } from 'element-plus';
import axios from 'axios';
import { handleSignaling } from './webrtcService';

const { ImageMessage, AudioMessage } = RealtimeModule as any;

// LeanCloud 配置
const APP_ID = 'il767G7CLSIfR9SinxIBROH6-gzGzoHsz';
const APP_KEY = 'FyOvCD2YFzhmbeabWLjLeeGz';
const SERVER_URL = 'https://il767g7c.lc-cn-n1-shared.com';
const CONVERSATION_ID = 'sweet_love_chat_v1';
const NOTIFY_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
export const CALL_RING_URL = 'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3';

// 用户定义
export const user1 = reactive({
  id: 'Hgtzsx',
  name: '张张包',
  gender: 'female',
  avatar: '/nv.jpg'
});

export const user2 = reactive({
  id: 'Partner',
  name: '小黄包',
  gender: 'male',
  avatar: '/nan.jpg'
});

// 全局状态
export const globalChatClient = ref<any>(null);
export const globalConversation = ref<any>(null);
export const globalIsOnline = ref(false);
export const isPartnerOnline = ref(false);
export const isConnecting = ref(false);
export const isPartnerTyping = ref(false);
export const openedRedPacketIds = ref(new Set<string>());
let typingTimer: any = null;
let heartbeatTimer: any = null;
let partnerOnlineTimer: any = null;

// 开启心跳检查
const startHeartbeat = () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    if (globalChatClient.value && globalChatClient.value.status === 'opened') {
      try {
        // 简单尝试获取会话信息作为心跳
        await globalChatClient.value.getConversation(CONVERSATION_ID);
        globalIsOnline.value = true;
        
        // 发送自己的在线状态给对方
        if (globalConversation.value) {
          const msg = new TextMessage('__ONLINE__');
          globalConversation.value.send(msg, { transient: true }).catch(() => {});
        }
      } catch (e) {
        console.warn('心跳检查失败，尝试重连...');
        initChat(true);
      }
    }
  }, 30000); // 每 30 秒检查一次
};

// 初始化当前用户：尝试从本地存储恢复，默认 user1
const getInitialUser = () => {
  const savedUserId = localStorage.getItem('chat_user_id');
  if (savedUserId === user2.id) return user2;
  return user1;
};

export const currentUser = ref(getInitialUser());

// 初始化时从本地存储加载历史记录
const getInitialMessages = () => {
  try {
    const savedMessages = localStorage.getItem('chat_history');
    if (!savedMessages) return [];
    const parsed = JSON.parse(savedMessages);
    
    // 数据迁移和补全：确保消息有 from, sender, avatar 字段
    return parsed.map((msg: any) => {
      // 如果没有 from，根据 sender 补全
      if (!msg.from) {
        if (msg.sender === user1.name) msg.from = user1.id;
        else if (msg.sender === user2.name) msg.from = user2.id;
      }
      // 根据 from 重新校准最新的名字和头像
      const senderInfo = msg.from === user1.id ? user1 : user2;
      msg.sender = senderInfo.name;
      msg.avatar = senderInfo.avatar;
      return msg;
    });
  } catch (e) {
    return [];
  }
};

export const messages = ref<any[]>(getInitialMessages());

export const loadLocalHistory = () => {
  messages.value = getInitialMessages();
};

export const saveMessages = () => {
  localStorage.setItem('chat_history', JSON.stringify(messages.value.slice(-100)));
};

// 同步云端消息
const syncCloudMessages = async () => {
  if (!globalConversation.value) return;
  
  try {
    // 获取最新的 20 条消息
    const cloudMsgs = await globalConversation.value.queryMessages({
      limit: 20,
    });
    
    // 过滤掉暂态消息和非展示类消息
    const validMsgs = cloudMsgs.filter((m: any) => {
      if (m.transient) return false; // 暂态消息
      if (m instanceof TextMessage) {
        const text = m.getText();
        return !text.startsWith('__SIGNAL__') && 
               !text.startsWith('__TYPING__') && 
               !text.startsWith('__ONLINE__');
      }
      return true;
    });

    const parsedCloudMsgs = validMsgs.map((m: any) => parseMessage(m));
    
    // 合并消息：保留本地的（可能有发送状态），添加云端新的
    const existingIds = new Set(messages.value.map(m => m.id));
    let hasNew = false;
    
    parsedCloudMsgs.forEach((cloudMsg: any) => {
      // 检查是否已存在（通过 ID 或 timestamp 近似匹配防止重复）
      const exists = messages.value.some(localMsg => {
        if (localMsg.id === cloudMsg.id) return true;
        // 如果 ID 不同但内容和时间极其接近（1秒内），也认为是同一条（可能是本地临时 ID 和云端 ID 不一致）
        if (Math.abs(localMsg.time - cloudMsg.time) < 1000 && 
            localMsg.content === cloudMsg.content && 
            localMsg.from === cloudMsg.from) {
          // 更新本地临时 ID 为云端 ID
          if (localMsg.id.startsWith('temp_')) {
            localMsg.id = cloudMsg.id;
            localMsg.status = 'sent'; // 确认已发送
          }
          return true;
        }
        return false;
      });

      if (!exists) {
        messages.value.push(cloudMsg);
        hasNew = true;
      }
    });

    if (hasNew) {
      // 重新排序
      messages.value.sort((a, b) => a.time - b.time);
      saveMessages();
    }
    
    console.log('云端消息同步完成');
  } catch (error) {
    console.error('同步云端消息失败:', error);
  }
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
    
    // 强制设置活跃状态
    globalChatClient.value.on('conflict', () => {
      console.warn('账号在其他地方登录，正在尝试夺回控制权...');
      initChat(true);
    });

    globalConversation.value = await newClient.getConversation(CONVERSATION_ID);
    if (!globalConversation.value) {
      globalConversation.value = await newClient.createConversation({
        members: [user1.id, user2.id],
        name: '我们的甜蜜私聊',
        unique: true
      });
    }

    // 立即同步一次云端历史消息
    await syncCloudMessages();

    globalIsOnline.value = true;
    
    // 连接成功后，立即广播一次在线状态，并查询对方状态
    if (globalConversation.value) {
      const msg = new TextMessage('__ONLINE__');
      globalConversation.value.send(msg, { transient: true }).catch(() => {});
      
      const queryMsg = new TextMessage('__QUERY_ONLINE__');
      globalConversation.value.send(queryMsg, { transient: true }).catch(() => {});
    }

    setupGlobalListeners();
    startHeartbeat();
    
    // 监听页面可见性变化，回到前台时立即同步（确保只绑定一次）
    if (!(window as any).visibilityListenerBound) {
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          console.log('页面回到前台，强制检查并恢复连接...');
          // 无论 globalIsOnline 状态如何，都进行心跳检查或重连
          if (globalChatClient.value) {
            try {
              // 尝试获取会话，如果失败说明连接已失效
              await globalChatClient.value.getConversation(CONVERSATION_ID);
              globalIsOnline.value = true;
              // 回到前台，同步消息
              syncCloudMessages();
            } catch (e) {
              console.log('连接已失效，正在重新初始化...');
              globalIsOnline.value = false;
              initChat(true);
            }
          } else {
            initChat(true);
          }
        }
      });
      (window as any).visibilityListenerBound = true;
    }

    // 监听网络状态变化
    if (!(window as any).networkListenerBound) {
      window.addEventListener('online', () => {
        console.log('网络恢复，正在重新连接聊天...');
        initChat(true);
      });
      window.addEventListener('offline', () => {
        console.log('网络断开');
        globalIsOnline.value = false;
      });
      (window as any).networkListenerBound = true;
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
    // 拦截信令消息
    if (message instanceof TextMessage) {
      const text = message.getText();
      if (text.startsWith('__SIGNAL__:')) {
        const signalData = JSON.parse(text.replace('__SIGNAL__:', ''));
        handleSignaling(signalData);
        return;
      }
      if (text === '__TYPING__') {
        isPartnerTyping.value = true;
        if (typingTimer) clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          isPartnerTyping.value = false;
        }, 3000);
        return;
      }
      if (text === '__ONLINE__') {
        isPartnerOnline.value = true;
        if (partnerOnlineTimer) clearTimeout(partnerOnlineTimer);
        partnerOnlineTimer = setTimeout(() => {
          isPartnerOnline.value = false;
        }, 65000); // 如果 65 秒没收到心跳，认为离线
        return;
      }
      if (text === '__QUERY_ONLINE__') {
        // 收到对方查询，立即回复我在线
        if (globalConversation.value) {
           const msg = new TextMessage('__ONLINE__');
           globalConversation.value.send(msg, { transient: true }).catch(() => {});
        }
        // 既然对方发了查询，说明对方也在线
        isPartnerOnline.value = true;
        if (partnerOnlineTimer) clearTimeout(partnerOnlineTimer);
        partnerOnlineTimer = setTimeout(() => {
          isPartnerOnline.value = false;
        }, 65000);
        return;
      }
      if (text.startsWith('__RP_RECEIVED__:')) {
        try {
          const data = JSON.parse(text.replace('__RP_RECEIVED__:', ''));
          const senderName = message.from === user1.id ? user1.name : user2.name;
          
          // 标记红包为已领取
          if (data.packetId) {
            openedRedPacketIds.value.add(data.packetId);
          }

          const systemMsg = {
            id: 'sys_' + Date.now(),
            contentType: 'system',
            content: `${senderName}领取了你的红包`,
            time: Date.now()
          };
          messages.value.push(systemMsg);
          saveMessages();
          return;
        } catch (e) {}
      }
    }

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
  const fromId = msg.from || (msg.getSender ? msg.getSender() : currentUser.value.id);
  const isMine = fromId === currentUser.value.id;
  const senderInfo = fromId === user1.id ? user1 : user2;
  
  let contentType = 'text';
  let content = '';
  let duration = 0;

  if (msg instanceof TextMessage) {
    const text = msg.getText();
    if (text.startsWith('__CALL_LOG__:')) {
      try {
        const logData = JSON.parse(text.replace('__CALL_LOG__:', ''));
        contentType = 'call_log';
        content = JSON.stringify(logData);
      } catch (e) {
        contentType = 'text';
        content = text;
      }
    } else if (text.startsWith('__RED_PACKET__:')) {
      try {
        const packetData = JSON.parse(text.replace('__RED_PACKET__:', ''));
        contentType = 'red_packet';
        content = JSON.stringify(packetData);
      } catch (e) {
        contentType = 'text';
        content = text;
      }
    } else {
      contentType = 'text';
      content = text;
    }
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
    from: fromId,
    sender: senderInfo.name,
    avatar: senderInfo.avatar,
    type: isMine ? 'mine' : 'other',
    contentType,
    content,
    duration,
    status: 'sent',
    time: msg.timestamp ? (msg.timestamp instanceof Date ? msg.timestamp.getTime() : msg.timestamp) : Date.now()
  };
};

const notifyNewMessage = (msg: any, isChatPage: boolean) => {
  // 1. 播放提示音 (尝试解锁 Audio Context)
  const audio = new Audio(NOTIFY_SOUND_URL);
  audio.volume = 0.5;
  audio.play().catch(e => console.log('自动播放被拦截:', e));

  // 2. 手机震动 (200ms)
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }

  // 3. 优先使用 Service Worker 发送通知（即使在后台也能工作）
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: {
        title: `💕 ${msg.sender}`,
        body: msg.contentType === 'text' ? msg.content : `[${msg.contentType === 'image' ? '图片' : '语音'}]`,
        icon: msg.avatar,
        data: { url: window.location.origin + '/chat' }
      }
    });
  } else if (document.hidden) {
    // 降级方案：传统的浏览器通知
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(`💕 ${msg.sender}`, {
          body: msg.contentType === 'text' ? msg.content : `[${msg.contentType === 'image' ? '图片' : '语音'}]`,
          icon: msg.avatar,
          tag: 'chat-msg',
          requireInteraction: false,
          silent: false
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (e) {
        console.error('Notification error:', e);
      }
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
