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
              <el-dropdown-item command="settings">通知设置 (PushDeer)</el-dropdown-item>
              <el-dropdown-item command="test_push">测试推送 (检查手机)</el-dropdown-item>
              <el-dropdown-item command="clear">清空聊天记录</el-dropdown-item>
              <el-dropdown-item command="export">导出聊天记录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef" v-loading="isInitialLoading">
      <div class="identity-notice">
        <el-tag size="small" effect="plain" type="danger">
          当前身份: {{ currentUser.name }}
        </el-tag>
      </div>
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
        <el-tooltip
          v-if="!partnerPushKey"
          content="对方未配置 PushKey，消息可能无法送达手机通知"
          placement="top"
        >
          <el-icon class="push-warning" @click="showSettings = true"><Warning /></el-icon>
        </el-tooltip>
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
      <el-tag effect="dark" type="info" @click="handleToggleUser" style="cursor: pointer">
        当前身份: {{ currentUser.name }} (点击切换)
      </el-tag>
    </div>

    <!-- 通知设置弹窗 -->
    <el-dialog v-model="showSettings" title="🔔 通知设置" width="90%" class="settings-dialog">
      <el-form label-position="top">
        <el-form-item label="你的 PushDeer Key">
          <el-input v-model="myPushKey" placeholder="请输入你的 PushKey" />
          <div class="tip-text">用于接收对方发给你的消息通知</div>
        </el-form-item>
        <el-form-item label="对方的 PushDeer Key">
          <el-input v-model="partnerPushKey" placeholder="请输入对方的 PushKey" />
          <div class="tip-text">用于当你给对方发消息时，触发对方的手机通知</div>
        </el-form-item>
        
        <div class="permission-tips">
          <p><strong>💡 小米/移动端用户必读：</strong></p>
          <p>1. 请确保手机已安装 PushDeer App。</p>
          <p>2. <strong>重要：</strong>在手机设置 -> 应用管理 -> PushDeer -> 开启<strong>“自启动”</strong>。</p>
          <p>3. 在省电策略中设置为<strong>“无限制”</strong>。</p>
          <p>4. 确保通知权限中的“悬浮通知”和“锁屏通知”已开启。</p>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  ArrowLeft, 
  MoreFilled, 
  Picture, 
  Star, 
  Microphone, 
  VideoPause, 
  Service,
  Warning
} from '@element-plus/icons-vue';
import { TextMessage } from 'leancloud-realtime';
import * as RealtimeModule from 'leancloud-realtime';
// @ts-ignore
import AV from 'leancloud-storage';
import { 
  globalConversation, 
  globalIsOnline, 
  isConnecting, 
  currentUser, 
  messages,
  initChat,
  parseMessage,
  saveMessages,
  sendExternalPush,
  user1,
  user2
} from '../services/chatManager';

const { ImageMessage, AudioMessage } = RealtimeModule as any;

const router = useRouter();
const messageListRef = ref<HTMLElement | null>(null);

const inputMsg = ref('');
const isPartnerOnline = globalIsOnline;
const isDev = ref(true); 
const isInitialLoading = ref(false);
const isRecording = ref(false);
const showSettings = ref(false);
const myPushKey = ref('');
const partnerPushKey = ref('');

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordingTimer: any = null;
const recordingDuration = ref(0);

// 表情包
const emojis = [
  '❤️', '😘', '🥰', '😍', '🌹', '💕', '✨', '🧸', '🍭', '🌈', 
  '🍦', '🍩', '🌸', '🎁', '💌', '💏', '👫', '💍', '💎', '🌙',
  '🎈', '🎉', '🥂', '🍫', '🍓', '🍒', '🐱', '🐰', '🐼', '🐣',
  '🌟', '🔥', '💧', '🍀', '🎵', '📸', '💌', '🏠', '🌍', '🚀'
];

// 初始化加载设置
onMounted(async () => {
  // 确保连接已初始化
  await initChat();
  
  // 加载推送 Key
  const isUser1 = currentUser.value.id === user1.id;
  myPushKey.value = localStorage.getItem(isUser1 ? 'push_key_user1' : 'push_key_user2') || '';
  partnerPushKey.value = localStorage.getItem(isUser1 ? 'push_key_user2' : 'push_key_user1') || '';

  scrollToBottom();
  isInitialLoading.value = false;
});

const saveSettings = () => {
  const isUser1 = currentUser.value.id === user1.id;
  if (isUser1) {
    localStorage.setItem('push_key_user1', myPushKey.value);
    localStorage.setItem('push_key_user2', partnerPushKey.value);
  } else {
    localStorage.setItem('push_key_user2', myPushKey.value);
    localStorage.setItem('push_key_user1', partnerPushKey.value);
  }
  showSettings.value = false;
  ElMessage.success('通知设置已保存');
};

// 监听消息变化，自动滚动
watch(messages, () => {
  scrollToBottom();
}, { deep: true });

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

  if (!globalConversation.value) {
    ElMessage.error('聊天未连接，请稍候...');
    initChat();
    return;
  }

  const text = inputMsg.value.trim();
  inputMsg.value = '';

  try {
    const message = new TextMessage(text);
    await globalConversation.value.send(message);
    
    const newMsg = parseMessage(message);
    if (!messages.value.find(m => m.id === newMsg.id)) {
      messages.value.push(newMsg);
      saveMessages();
    }
    scrollToBottom();
    // 发送外部推送
    sendExternalPush(text);
  } catch (error: any) {
    inputMsg.value = text;
    ElMessage.error('消息发送失败: ' + (error.message || '未知错误'));
  }
};

const handleImageUpload = async (uploadFile: any) => {
  if (!globalConversation.value) {
    ElMessage.error('聊天未连接，无法发送图片');
    return;
  }

  try {
    const file = new AV.File(uploadFile.name, uploadFile.raw);
    await file.save();
    
    const message = new ImageMessage(file);
    await globalConversation.value.send(message);

    const newMsg = parseMessage(message);
    messages.value.push(newMsg);
    saveMessages();
    scrollToBottom();
    // 发送外部推送
    sendExternalPush(`[图片消息]`);
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
  if (!globalConversation.value) {
    ElMessage.error('聊天未连接，无法发送语音');
    return;
  }
  
  try {
    const file = new AV.File(`voice_${Date.now()}.webm`, blob);
    file.metaData('duration', duration);
    await file.save();
    
    const message = new AudioMessage(file);
    await globalConversation.value.send(message);

    const newMsg = parseMessage(message);
    messages.value.push(newMsg);
    saveMessages();
    scrollToBottom();
    // 发送外部推送
    sendExternalPush(`[语音消息]`);
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

const handleToggleUser = async () => {
  const targetUser = currentUser.value.id === user1.id ? user2 : user1;
  currentUser.value = targetUser;
  localStorage.setItem('chat_user_id', targetUser.id);
  
  ElMessage.info(`正在切换身份为: ${targetUser.name}...`);
  isInitialLoading.value = true;
  messages.value = [];
  
  await initChat();
  
  isInitialLoading.value = false;
  ElMessage.success(`已成功切换为: ${currentUser.value.name}`);
};

const handleMoreCommand = async (command: string) => {
  if (command === 'settings') {
    showSettings.value = true;
  } else if (command === 'test_push') {
    if (!partnerPushKey.value) {
      ElMessage.warning('请先在“通知设置”中填入对方的 PushKey');
      showSettings.value = true;
      return;
    }
    ElMessage.info('正在发送测试推送...');
    const success = await sendExternalPush('这是一条测试推送，如果你收到这条消息，说明配置成功啦！❤️');
    if (success) {
      ElMessage.success('测试推送指令已发出，请检查对方手机通知');
    } else {
      ElMessage.error('推送发送失败，请检查网络或 Key 是否正确');
    }
  } else if (command === 'clear') {
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
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  margin-top: 2px;
}

.chat-status.online {
  color: #4caf50;
}

.chat-status.online::before {
  content: '●';
  margin-right: 4px;
}

.chat-status.connecting {
  color: #ff9800;
}

.header-btn {
  border: none;
  background: rgba(230, 57, 70, 0.05);
  color: #e63946;
}

.header-btn:hover {
  background: rgba(230, 57, 70, 0.1);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.identity-notice {
  text-align: center;
  margin-bottom: 10px;
  opacity: 0.8;
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

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mine .message-content {
  align-items: flex-end;
}

.message-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.bubble {
  padding: 10px 15px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-all;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
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
  border-radius: 12px;
  cursor: pointer;
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

.input-area {
  padding: 15px 20px;
  background: white;
  border-top: 1px solid rgba(230, 57, 70, 0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-tools {
  display: flex;
  gap: 15px;
}

.tool-btn {
  border: none;
  background: rgba(230, 57, 70, 0.05);
  color: #e63946;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.send-btn {
  padding: 0 20px;
  height: 32px;
  background: #e63946;
  border: none;
}

.send-btn:hover {
  background: #d62839;
}

.push-warning {
  color: #e6a23c;
  font-size: 20px;
  cursor: pointer;
  margin-right: 5px;
  transition: transform 0.2s;
}

.push-warning:hover {
  transform: scale(1.2);
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  padding: 10px;
}

.emoji-item {
  font-size: 20px;
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}

.emoji-item:hover {
  transform: scale(1.2);
}

.dev-tools {
  position: absolute;
  bottom: 80px;
  right: 20px;
  z-index: 100;
}

/* 滚动条美化 */
.message-list::-webkit-scrollbar {
  width: 4px;
}

.message-list::-webkit-scrollbar-thumb {
  background: rgba(230, 57, 70, 0.2);
  border-radius: 2px;
}

.recording-message {
  background: #e63946 !important;
  color: white !important;
  border: none !important;
}
.tip-text {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
  margin-top: 4px;
}

.permission-tips {
  margin-top: 20px;
  padding: 15px;
  background: #fff5f7;
  border-radius: 8px;
  font-size: 13px;
  color: #e63946;
  line-height: 1.6;
}

.permission-tips p {
  margin-bottom: 5px;
}

.settings-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
}
</style>
