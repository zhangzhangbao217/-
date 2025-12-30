<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="goBack" class="header-btn" />
        <div class="chat-info">
          <span class="chat-name">💕 甜蜜私聊</span>
          <span class="chat-status" :class="{ online: isPartnerOnline, connecting: isConnecting }">
            {{ isConnecting ? '连接中...' : (isPartnerOnline ? '在线' : '离线') }}
          </span>
        </div>
        <el-dropdown @command="handleMoreCommand">
          <el-button :icon="MoreFilled" circle class="header-btn" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="clear">清空聊天记录</el-dropdown-item>
              <el-dropdown-item command="export">导出聊天记录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef" v-loading="isInitialLoading">
      <div v-for="(msg, index) in messages" :key="index" :class="['message-item', msg.type]">
        <el-avatar :size="40" :src="msg.avatar" class="avatar" />
        <div class="message-content">
          <div class="message-info">
            <span class="sender-name">{{ msg.sender }}</span>
            <span class="send-time">{{ formatTime(msg.time) }}</span>
          </div>
          <div class="bubble">
            <template v-if="msg.contentType === 'text'">
              {{ msg.content }}
            </template>
            <template v-else-if="msg.contentType === 'image'">
              <el-image :src="msg.content" :preview-src-list="[msg.content]" fit="cover" class="msg-image" />
            </template>
            <template v-else-if="msg.contentType === 'voice'">
              <div class="voice-bubble" @click="playVoice(msg.content)">
                <el-icon class="voice-icon"><Service /></el-icon>
                <span class="voice-duration">{{ msg.duration }}''</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <div class="input-tools">
        <el-upload
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          @change="handleImageUpload"
        >
          <el-button :icon="Picture" circle class="tool-btn" />
        </el-upload>
        <el-popover placement="top" :width="300" trigger="click">
          <template #reference>
            <el-button :icon="Star" circle class="tool-btn" />
          </template>
          <div class="emoji-picker">
            <span v-for="emoji in emojis" :key="emoji" @click="addEmoji(emoji)" class="emoji-item">
              {{ emoji }}
            </span>
          </div>
        </el-popover>
        <el-button 
          :type="isRecording ? 'danger' : 'info'"
          :icon="isRecording ? VideoPause : Microphone" 
          circle 
          @mousedown="startRecording"
          @mouseup="stopRecording"
          @touchstart.prevent="startRecording"
          @touchend.prevent="stopRecording"
          class="tool-btn voice-btn"
        />
      </div>
      <div class="input-wrapper">
        <el-input
          v-model="inputMsg"
          type="textarea"
          :rows="1"
          autosize
          placeholder="说点甜言蜜语吧..."
          @keydown.enter.prevent="sendMessage"
        />
        <el-button type="primary" :disabled="!inputMsg.trim()" @click="sendMessage" class="send-btn">
          发送
        </el-button>
      </div>
    </div>

    <!-- 模拟切换用户按钮 (仅开发测试用) -->
    <div class="dev-tools" v-if="isDev">
      <el-tag effect="dark" type="info" @click="toggleUser" style="cursor: pointer">
        当前身份: {{ currentUser.name }} (点击切换)
      </el-tag>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { Realtime } from 'leancloud-realtime';

// --- 全局状态实现 (实现跨页面持久连接) ---
// 这些变量定义在 script 块中，属于模块作用域，在所有组件实例间共享
// 只要不刷新浏览器，这些状态就会一直保持
let globalChatClient: any = null;
let globalConversation: any = null;
let globalRealtime: any = null;
const globalIsOnline = ref(false);

export default {
  name: 'ChatRoom'
}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import { ArrowLeft, MoreFilled, Picture, Star, Microphone, VideoPause, Service, ChatDotRound } from '@element-plus/icons-vue';
import { TextMessage } from 'leancloud-realtime';
import * as RealtimeModule from 'leancloud-realtime';
// @ts-ignore
import AV from 'leancloud-storage';

const { ImageMessage, AudioMessage } = RealtimeModule as any;

const router = useRouter();
const messageListRef = ref<HTMLElement | null>(null);

// LeanCloud 配置
const APP_ID = 'il767G7CLSIfR9SinxIBROH6-gzGzoHsz';
const APP_KEY = 'FyOvCD2YFzhmbeabWLjLeeGz';
const SERVER_URL = 'https://il767g7c.lc-cn-n1-shared.com';
const CONVERSATION_ID = 'sweet_love_chat_v1'; // 固定的对话ID

// 用户定义
const user1 = {
  id: 'Hgtzsx',
  name: '张张包',
  avatar: '/df49bc6ca7d5b77ace3eeaec5d0008c6.jpg'
};

const user2 = {
  id: 'Partner',
  name: '小黄包',
  avatar: '/df49bc6ca7d5b77ace3eeaec5d0008c6.jpg'
};

const currentUser = ref(user1);

const getRealtime = () => {
  if (!globalRealtime) {
    globalRealtime = new Realtime({
      appId: APP_ID,
      appKey: APP_KEY,
      server: SERVER_URL,
      noBinary: true,
    });
  }
  return globalRealtime;
};

const inputMsg = ref('');
const isPartnerOnline = globalIsOnline; // 绑定全局状态
const isDev = ref(true); 
const isInitialLoading = ref(false); // 仅用于第一次进入页面时的全屏加载
const isConnecting = ref(false);     // 用于顶部的“连接中”状态
const isRecording = ref(false);
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordingTimer: any = null;
const recordingDuration = ref(0);
const NOTIFY_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

// 消息列表数据
interface Message {
  id: string;
  sender: string;
  avatar: string;
  type: 'mine' | 'other';
  contentType: 'text' | 'image' | 'voice';
  content: string;
  duration?: number; // 语音时长
  time: number;
}

const messages = ref<Message[]>([]);

// 表情包
const emojis = [
  '❤️', '😘', '🥰', '😍', '🌹', '💕', '✨', '🧸', '🍭', '🌈', 
  '🍦', '🍩', '🌸', '🎁', '💌', '💏', '👫', '💍', '💎', '🌙',
  '🎈', '🎉', '🥂', '🍫', '🍓', '🍒', '🐱', '🐰', '🐼', '🐣',
  '🌟', '🔥', '💧', '🍀', '🎵', '📸', '💌', '🏠', '🌍', '🚀'
];

onMounted(async () => {
  // 从本地存储恢复身份
  const savedUserId = localStorage.getItem('chat_user_id');
  if (savedUserId) {
    currentUser.value = savedUserId === user1.id ? user1 : user2;
  }

  // 初始化 LeanCloud Storage
  AV.init({
    appId: APP_ID,
    appKey: APP_KEY,
    serverURL: SERVER_URL
  });

  // 如果没有消息，显示初始加载
  if (messages.value.length === 0) {
    isInitialLoading.value = true;
  }

  await initLeanCloud();
  
  // 监听页面可见性变化，自动重连
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 请求浏览器通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // 从 localStorage 加载缓存的历史消息
  const savedMessages = localStorage.getItem('chat_history');
  if (savedMessages) {
    messages.value = JSON.parse(savedMessages);
  }
  
  scrollToBottom();
  isInitialLoading.value = false;
});

onUnmounted(async () => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  // 不再在卸载时关闭连接，实现跨页面持久连接
});

const handleOnline = () => {
  console.log('网络已恢复，尝试同步状态...');
  handleVisibilityChange();
};

const handleOffline = () => {
  console.log('网络已断开');
  globalIsOnline.value = false;
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    console.log('页面可见，检查连接状态...');
    // 只有在完全断开时才尝试重连
    if (!globalChatClient || (globalChatClient && globalChatClient.status === 'closed')) {
      console.log('连接已关闭，尝试静默恢复...');
      initLeanCloud(true); // 静默模式
    } else if (globalChatClient && globalChatClient.status === 'opened') {
      console.log('连接状态正常');
      globalIsOnline.value = true;
    }
  }
};

const initLeanCloud = async (silent = false) => {
  // 如果已有活跃连接，且用户 ID 匹配，直接同步状态并返回
  if (globalChatClient && globalChatClient.id === currentUser.value.id) {
    const status = globalChatClient.status;
    if (status === 'opened' || status === 'connecting' || status === 'reconnecting') {
      console.log(`检测到已有状态为 ${status} 的连接，跳过重新初始化`);
      if (status === 'opened') globalIsOnline.value = true;
      
      // 确保对话已获取
      if (!globalConversation) {
        globalConversation = await globalChatClient.getConversation(CONVERSATION_ID);
      }
      setupMessageListeners();
      return;
    }
  }

  if (isConnecting.value) return;
  if (!silent) isConnecting.value = true;
  
  // 设置一个超时保护
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('连接超时')), 15000)
  );
  
  try {
    // 1. 获取单例 Realtime
    const realtime = getRealtime();

    // 2. 创建并等待客户端连接
    console.log(`正在为用户 ${currentUser.value.id} 创建连接...`);
    
    // 准备好新客户端后再清理旧的
    const newClient = await Promise.race([
      realtime.createIMClient(currentUser.value.id),
      timeoutPromise
    ]) as any;

    if (globalChatClient && globalChatClient !== newClient) {
      try {
        globalChatClient.off();
        await globalChatClient.close();
      } catch (e) {}
    }
    globalChatClient = newClient;
    
    // 3. 获取对话
    globalConversation = await globalChatClient.getConversation(CONVERSATION_ID);
    if (!globalConversation) {
      globalConversation = await globalChatClient.createConversation({
        members: [user1.id, user2.id],
        name: '我们的甜蜜私聊',
        unique: true
      });
    }

    globalIsOnline.value = true; 
    
    // 4. 加载历史
    if (messages.value.length === 0) {
      await loadHistory();
    }

    // 5. 设置监听器
    setupMessageListeners();
    
    console.log('聊天连接成功');

  } catch (error: any) {
    console.error('聊天初始化失败:', error);
    globalIsOnline.value = false;
    
    // 只有非静默模式才显示重连逻辑
    if (!silent) {
      console.log('连接失败，5秒后自动重试...');
      setTimeout(() => {
        isConnecting.value = false;
        initLeanCloud();
      }, 5000);
    }
  } finally {
    isConnecting.value = false;
  }
};

const loadHistory = async () => {
  if (!globalConversation) return;
  try {
    const iter = globalConversation.createMessagesIterator({ limit: 50 });
    const result = await iter.next();
    if (result.value) {
      messages.value = result.value.map((msg: any) => parseLeanCloudMessage(msg));
      saveMessages(); 
      scrollToBottom();
    }
  } catch (e) {
    console.error('加载历史失败:', e);
  }
};

const setupMessageListeners = () => {
  if (!globalChatClient) return;
  
  globalChatClient.off('message'); // 先移除旧监听
  globalChatClient.on('message', (message: any) => {
    const parsedMsg = parseLeanCloudMessage(message);
    if (!messages.value.find(m => m.id === parsedMsg.id)) {
      messages.value.push(parsedMsg);
      saveMessages();
      scrollToBottom();
      
      if (message.from !== currentUser.value.id) {
        notifyNewMessage(parsedMsg);
      }
    }
  });

  // 状态监听
  const handleStatusChange = (status: boolean, isConnectingStatus = false) => {
    globalIsOnline.value = status;
    isConnecting.value = isConnectingStatus;
    console.log('连接状态变更:', status ? '在线' : (isConnectingStatus ? '连接中' : '离线'));
  };

  globalChatClient.off('disconnect');
  globalChatClient.off('reconnect');
  globalChatClient.off('reconnecting');
  globalChatClient.on('disconnect', () => handleStatusChange(false));
  globalChatClient.on('reconnect', () => handleStatusChange(true));
  globalChatClient.on('reconnecting', () => handleStatusChange(false, true));
};

const parseLeanCloudMessage = (msg: any): Message => {
  // 必须动态获取最新的 currentUser.id
  const isMine = msg.from === currentUser.value.id;
  const senderInfo = msg.from === user1.id ? user1 : user2;
  
  let contentType: 'text' | 'image' | 'voice' = 'text';
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

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTo({
        top: messageListRef.value.scrollHeight,
        behavior: 'smooth'
      });
    }
  });
};

const formatTime = (time: number) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const sendMessage = async () => {
  if (!inputMsg.value.trim() || isConnecting.value) return;

  if (!globalConversation) {
    ElMessage.error('聊天未连接，请稍候...');
    initLeanCloud();
    return;
  }

  const text = inputMsg.value.trim();
  inputMsg.value = ''; // 立即清空，提升体验

  try {
    const message = new TextMessage(text);
    await globalConversation.send(message);
    
    const newMsg = parseLeanCloudMessage(message);
    messages.value.push(newMsg);
    saveMessages();
    scrollToBottom();
  } catch (error: any) {
    inputMsg.value = text; // 发送失败恢复内容
    ElMessage.error('消息发送失败: ' + (error.message || '未知错误'));
  }
};

const handleImageUpload = async (uploadFile: any) => {
  if (!globalConversation) {
    ElMessage.error('聊天未连接，无法发送图片');
    return;
  }

  try {
    const file = new AV.File(uploadFile.name, uploadFile.raw);
    await file.save();
    
    const message = new ImageMessage(file);
    await globalConversation.send(message);

    const newMsg = parseLeanCloudMessage(message);
    messages.value.push(newMsg);
    saveMessages();
    scrollToBottom();
  } catch (error) {
    ElMessage.error('图片发送失败');
  }
};

const addEmoji = (emoji: string) => {
  inputMsg.value += emoji;
};

// 语音相关功能
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      if (recordingDuration.value < 1) {
        ElMessage.warning('录制时间太短啦');
        return;
      }
      await sendVoiceMessage(audioBlob, recordingDuration.value);
    };

    isRecording.value = true;
    recordingDuration.value = 0;
    mediaRecorder.start();
    
    recordingTimer = setInterval(() => {
      recordingDuration.value++;
      if (recordingDuration.value >= 60) {
        stopRecording();
      }
    }, 1000);
    
    ElMessage({
      message: '正在录音... 松开即可发送',
      type: 'info',
      duration: 0,
      customClass: 'recording-message'
    });
  } catch (error) {
    ElMessage.error('无法访问麦克风，请确保已授权');
  }
};

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
    clearInterval(recordingTimer);
    ElMessage.closeAll();
  }
};

const sendVoiceMessage = async (blob: Blob, duration: number) => {
  if (!globalConversation) {
    ElMessage.error('聊天未连接，无法发送语音');
    return;
  }
  
  try {
    const file = new AV.File(`voice_${Date.now()}.webm`, blob);
    file.metaData('duration', duration);
    await file.save();
    
    const message = new AudioMessage(file);
    await globalConversation.send(message);

    const newMsg = parseLeanCloudMessage(message);
    messages.value.push(newMsg);
    saveMessages();
    scrollToBottom();
  } catch (error) {
    ElMessage.error('语音发送失败');
  }
};

const playVoice = (url: string) => {
  const audio = new Audio(url);
  audio.play().catch(() => {
    ElMessage.error('播放失败');
  });
};

const notifyNewMessage = (msg: Message) => {
  // 1. 播放提示音
  const audio = new Audio(NOTIFY_SOUND_URL);
  audio.volume = 0.5;
  audio.play().catch(() => {});

  // 2. 浏览器系统通知 (如果页面在后台)
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(`💕 来自 ${msg.sender} 的新消息`, {
      body: msg.contentType === 'text' ? msg.content : `[${msg.contentType === 'image' ? '图片' : '语音'}]`,
      icon: msg.avatar
    });
  }

  // 3. 应用内顶部弹窗通知 (如果没开系统通知)
  if (!document.hidden) {
    ElNotification({
      title: `新消息: ${msg.sender}`,
      message: msg.contentType === 'text' ? msg.content : `[${msg.contentType === 'image' ? '图片' : '语音'}]`,
      type: 'success',
      position: 'top-right',
      duration: 3000
    });
  }
};

const saveMessages = () => {
  localStorage.setItem('chat_history', JSON.stringify(messages.value));
};

const toggleUser = async () => {
  const targetUser = currentUser.value.id === user1.id ? user2 : user1;
  currentUser.value = targetUser;
  
  // 持久化选择
  localStorage.setItem('chat_user_id', targetUser.id);
  
  ElMessage.info(`正在切换身份为: ${targetUser.name}...`);
  
  // 切换身份需要显示加载状态
  isInitialLoading.value = true;
  messages.value = []; // 清空当前视图消息，准备加载新身份的消息
  
  // 重新初始化聊天客户端
  await initLeanCloud();
  
  isInitialLoading.value = false;
  ElMessage.success(`已成功切换为: ${currentUser.value.name}`);
};

const handleMoreCommand = (command: string) => {
  if (command === 'clear') {
    ElMessageBox.confirm('确定要清空所有聊天记录吗？', '提示', {
      type: 'warning'
    }).then(() => {
      messages.value = [];
      localStorage.removeItem('chat_history');
      ElMessage.success('记录已清空');
    });
  } else if (command === 'export') {
    const data = JSON.stringify(messages.value, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `love_chat_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

const goBack = () => {
  router.push('/home');
};
</script>

<style scoped>
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fff5f7 0%, #ffeef2 100%);
  position: relative;
  overflow: hidden;
}

.chat-header {
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(230, 57, 70, 0.1);
  z-index: 10;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-btn {
  background: rgba(230, 57, 70, 0.1);
  border: none;
  color: #e63946;
  font-size: 18px;
  transition: all 0.3s;
}

.header-btn:hover {
  background: rgba(230, 57, 70, 0.2);
  transform: scale(1.1);
}

.tool-btn {
  background: white;
  border: 1px solid rgba(230, 57, 70, 0.2);
  color: #e63946;
  font-size: 18px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.tool-btn:hover {
  background: #fff5f7;
  border-color: #e63946;
  transform: translateY(-2px);
}

.voice-btn.el-button--info {
  background: #f4f4f5;
  border-color: #e9e9eb;
  color: #909399;
}

.voice-btn.el-button--danger {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(245, 108, 108, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 108, 108, 0); }
}

.chat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chat-name {
  font-size: 18px;
  font-weight: bold;
  color: #e63946;
}

.chat-status {
  font-size: 12px;
  color: #999;
}

.chat-status.online {
  color: #52c41a;
}

.chat-status.connecting {
  color: #1890ff;
}

.chat-status.online::before {
  content: '●';
  margin-right: 4px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message-item.mine {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-item.other {
  align-self: flex-start;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-info {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.mine .message-info {
  flex-direction: row-reverse;
}

.bubble {
  padding: 10px 16px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-all;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.voice-bubble {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  min-width: 60px;
}

.voice-icon {
  font-size: 18px;
}

.voice-duration {
  font-size: 13px;
}

.mine .bubble {
  background: #e63946;
  color: white;
  border-top-right-radius: 4px;
}

.other .bubble {
  background: white;
  color: #333;
  border-top-left-radius: 4px;
}

.msg-image {
  max-width: 200px;
  border-radius: 8px;
  cursor: zoom-in;
}

.input-area {
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(230, 57, 70, 0.1);
}

.input-tools {
  max-width: 800px;
  margin: 0 auto 10px;
  display: flex;
  gap: 15px;
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.send-btn {
  padding: 0 20px;
  height: 40px;
  border-radius: 20px;
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 10px;
}

.emoji-item {
  font-size: 24px;
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}

.emoji-item:hover {
  transform: scale(1.3);
}

.dev-tools {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 100;
}

@media (max-width: 768px) {
  .message-item {
    max-width: 90%;
  }
  
  .input-area {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
