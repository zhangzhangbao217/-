<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="goBack" class="header-btn" />
        <div class="chat-info">
          <span class="chat-name">💕 甜蜜私聊</span>
          <span v-if="isPartnerTyping" class="chat-status typing">对方正在输入...</span>
          <span v-else class="chat-status" :class="{ online: isPartnerOnline, connecting: isConnecting }" @click="!isPartnerOnline && initChat()">
            {{ isConnecting ? '连接中...' : (isPartnerOnline ? '在线' : '离线') }}
            <el-icon v-if="!isPartnerOnline && !isConnecting" class="refresh-icon"><Refresh /></el-icon>
          </span>
        </div>
        <div class="header-actions">
          <el-button :icon="VideoCamera" circle @click="startCall('video')" class="header-btn" />
          <el-button :icon="Phone" circle @click="startCall('voice')" class="header-btn" />
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
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef" v-loading="isInitialLoading">
      <div class="identity-notice">
        <el-tag size="small" effect="plain" type="danger">
          当前身份: {{ currentUser.name }}
        </el-tag>
      </div>
      <div v-for="(msg, index) in messages" :key="index" 
           :class="['message-item', msg.from === currentUser.id ? 'mine' : 'other']">
        <el-avatar 
            :size="40" 
            :src="msg.from === user1.id ? user1.avatar : user2.avatar" 
            :class="['avatar', msg.from === user1.id ? 'avatar-user1' : 'avatar-user2']"
          >
            <!-- 备用显示：如果图片加载失败，显示名字首字母 -->
            {{ msg.from === user1.id ? user1.name[0] : user2.name[0] }}
          </el-avatar>
        <div class="message-content">
          <div class="message-info">
            <span class="sender-name">{{ msg.from === user1.id ? user1.name : user2.name }}</span>
            <span class="send-time">{{ formatTime(msg.time) }}</span>
          </div>
          <div class="bubble">
            <!-- 发送状态标识 -->
            <div v-if="msg.from === currentUser.id" class="message-status">
              <el-icon v-if="msg.status === 'sending'" class="status-icon is-loading"><Loading /></el-icon>
              <el-icon v-if="msg.status === 'error'" class="status-icon error"><Warning /></el-icon>
            </div>
            
            <template v-if="msg.contentType === 'text'">
              <div class="text-content">
                {{ msg.content }}
              </div>
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
            <template v-else-if="msg.contentType === 'call_log'">
              <div class="call-log-content">
                <div class="call-log-body">
                  <el-icon class="call-icon">
                    <VideoCamera v-if="JSON.parse(msg.content).callType === 'video'" />
                    <Phone v-else />
                  </el-icon>
                  <div class="call-info">
                    <span class="call-status">
                      {{ 
                        JSON.parse(msg.content).status === 'completed' ? '通话完成' :
                        JSON.parse(msg.content).status === 'missed' ? '未接听' :
                        JSON.parse(msg.content).status === 'declined' ? '已拒绝' : '通话结束'
                      }}
                    </span>
                    <span v-if="JSON.parse(msg.content).status === 'completed'" class="call-duration">
                      {{ formatDuration(JSON.parse(msg.content).duration) }}
                    </span>
                  </div>
                </div>
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
          :icon="isRecording ? VideoPlay : Microphone" 
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
    <div class="dev-tools">
      <el-tag effect="dark" type="info" @click="handleToggleUser" style="cursor: pointer">
        身份: {{ currentUser.name }}
      </el-tag>
    </div>

    <!-- 身份选择弹窗 -->
    <el-dialog
      v-model="showIdentityDialog"
      title="💝 欢迎回来"
      width="85%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      center
      class="identity-dialog"
    >
      <div class="identity-selection">
        <p class="select-tip">请选择你在这台设备上的身份：</p>
        <div class="user-cards">
          <div class="user-card" @click="selectIdentity(user1)">
            <el-avatar :size="60" :src="user1.avatar" />
            <span class="name">{{ user1.name }}</span>
          </div>
          <div class="user-card" @click="selectIdentity(user2)">
            <el-avatar :size="60" :src="user2.avatar" />
            <span class="name">{{ user2.name }}</span>
          </div>
        </div>
        <p class="warning-text">⚠️ 选错身份将无法正常同步消息！</p>
      </div>
    </el-dialog>

    <!-- 通话界面覆盖层 -->
    <transition name="fade">
      <div v-if="callStatus !== 'idle'" class="call-overlay">
        <!-- 动态背景模糊 -->
        <div class="call-bg-blur" :style="{ backgroundImage: `url(${partnerInfo.avatar})` }"></div>
        
        <!-- 呼叫中/收到呼叫 -->
        <div v-if="callStatus === 'calling' || callStatus === 'receiving'" class="call-pending">
          <div class="call-user-info">
            <el-avatar :size="120" :src="partnerInfo.avatar" class="call-avatar pulse" />
            <h2 class="call-name">{{ partnerInfo.name }}</h2>
            <p class="call-status-text">
              {{ callStatus === 'calling' ? (isWaitingForAck ? '正在唤醒对方设备...' : `正在呼叫对方${callType === 'video' ? '视频' : '语音'}...`) : `发来${callType === 'video' ? '视频' : '语音'}通话...` }}
            </p>
          </div>
          
          <div class="call-actions">
            <template v-if="callStatus === 'receiving'">
              <div class="action-item">
                <el-button type="success" :icon="Check" circle @click="handleAccept" class="action-btn accept" />
                <span>接听</span>
              </div>
              <div class="action-item">
                <el-button type="danger" :icon="Close" circle @click="handleHangup" class="action-btn decline" />
                <span>拒绝</span>
              </div>
            </template>
            <template v-else>
              <div class="action-item">
                <el-button type="danger" :icon="Close" circle @click="handleHangup" class="action-btn decline" />
                <span>取消</span>
              </div>
            </template>
          </div>
        </div>

        <!-- 通话中 -->
        <div v-if="callStatus === 'connected'" class="call-connected" :class="{ 'is-video': callType === 'video' }">
          <!-- 隐藏的远程音频 -->
          <audio ref="remoteAudioRef" autoplay playsinline style="display: none;"></audio>

          <div v-if="callType === 'video'" class="video-container">
            <video ref="remoteVideoRef" autoplay playsinline class="remote-video"></video>
            <div class="local-video-wrapper">
              <video ref="localVideoRef" autoplay playsinline muted class="local-video"></video>
            </div>
            <div class="video-timer">{{ formatDuration(callDurationSeconds) }}</div>
          </div>
          
          <div v-else class="voice-container">
            <el-avatar :size="140" :src="partnerInfo.avatar" class="call-avatar pulse" />
            <h2 class="call-name">{{ partnerInfo.name }}</h2>
            <p class="call-timer">{{ formatDuration(callDurationSeconds) }}</p>
          </div>

          <div class="call-controls">
            <div class="control-item">
              <el-button :type="isMuted ? 'danger' : 'info'" :icon="isMuted ? MuteNotification : Microphone" circle @click="toggleMute" class="control-btn" />
              <span>{{ isMuted ? '取消静音' : '静音' }}</span>
            </div>
            <div class="control-item">
              <el-button type="danger" :icon="Close" circle @click="handleHangup" class="hangup-btn" />
              <span>挂断</span>
            </div>
            <div class="control-item" v-if="callType === 'video'">
              <el-button :type="isCameraOff ? 'danger' : 'info'" :icon="isCameraOff ? VideoPlay : VideoCamera" circle @click="toggleCamera" class="control-btn" />
              <span>{{ isCameraOff ? '摄像头' : '摄像头' }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  ArrowLeft, 
  MoreFilled, 
  Picture, 
  Star, 
  Microphone, 
  VideoPlay, 
  Service,
  VideoCamera,
  Phone,
  Close,
  Refresh,
  Loading,
  Warning,
  MuteNotification
} from '@element-plus/icons-vue';
import { TextMessage } from 'leancloud-realtime';
import * as RealtimeModule from 'leancloud-realtime';
// @ts-ignore
import AV from 'leancloud-storage';
import { 
  globalConversation, 
  globalIsOnline, 
  isPartnerOnline as partnerOnlineState,
  isConnecting, 
  isPartnerTyping,
  currentUser, 
  messages,
  initChat,
  parseMessage,
  saveMessages,
  loadLocalHistory,
  user1,
  user2,
  CALL_RING_URL
} from '../services/chatManager';
import { 
  callStatus, 
  callType, 
  localStream, 
  remoteStream, 
  startCall, 
  acceptCall, 
  handleHangup, 
  isMuted, 
  isCameraOff,
  callDurationSeconds,
  isWaitingForAck,
  setSignalingSender,
  setCallLogSender,
  toggleMute,
  toggleCamera
} from '../services/webrtcService';

const { ImageMessage, AudioMessage } = RealtimeModule as any;

const router = useRouter();
const messageListRef = ref<any>(null);
const localVideoRef = ref<HTMLVideoElement | null>(null);
const remoteVideoRef = ref<HTMLVideoElement | null>(null);
const remoteAudioRef = ref<HTMLAudioElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// 设置 WebRTC 信令发送器
setSignalingSender(async (data, options = { transient: true }) => {
  if (globalConversation.value) {
    const message = new TextMessage(`__SIGNAL__:${JSON.stringify(data)}`);
    // 允许通过 options 控制是否为 transient
    await globalConversation.value.send(message, options);
  }
});

// 设置通话记录发送器
setCallLogSender(async (logData) => {
  if (globalConversation.value) {
    const message = new TextMessage(`__CALL_LOG__:${JSON.stringify(logData)}`);
    await globalConversation.value.send(message);
  }
});

const inputMsg = ref('');
const isPartnerOnline = partnerOnlineState;
const isDev = ref(true); 
const isInitialLoading = ref(false);
const isRecording = ref(false);
const showIdentityDialog = ref(false);

const callDuration = ref(0);
let callTimer: any = null;
// 正在输入状态发送逻辑
let lastTypingTime = 0;
watch(inputMsg, (newVal) => {
  if (newVal && Date.now() - lastTypingTime > 2000) {
    lastTypingTime = Date.now();
    sendTypingSignal();
  }
});

const sendTypingSignal = async () => {
  if (globalConversation.value) {
    try {
      const msg = new TextMessage('__TYPING__');
      // 使用 transient 参数发送暂态消息，不存储在历史记录中
      await globalConversation.value.send(msg, { transient: true });
    } catch (e) {
      // 忽略发送失败
    }
  }
};

let ringAudio: HTMLAudioElement | null = null;

const playRing = () => {
  if (!ringAudio) {
    ringAudio = new Audio(CALL_RING_URL);
    ringAudio.loop = true;
  }
  ringAudio.play().catch(() => {});
};

const stopRing = () => {
  if (ringAudio) {
    ringAudio.pause();
    ringAudio.currentTime = 0;
  }
};

const partnerInfo = computed(() => {
  // 这里必须实时响应 currentUser 的变化
  return currentUser.value.id === user1.id ? user2 : user1;
});

// 监听流变化并绑定到 media 标签
watch([localStream, localVideoRef], ([stream, videoEl]) => {
  if (stream && videoEl) {
    videoEl.srcObject = stream;
    videoEl.play().catch(err => console.error('Local video play error:', err));
  }
}, { immediate: true });

watch([remoteStream, remoteVideoRef], ([stream, videoEl]) => {
  if (stream && videoEl) {
    videoEl.srcObject = stream;
    videoEl.play().catch(err => console.error('Remote video play error:', err));
  }
}, { immediate: true });

watch([remoteStream, remoteAudioRef], ([stream, audioEl]) => {
  if (stream && audioEl) {
    audioEl.srcObject = stream;
    audioEl.play().catch(err => console.error('Remote audio play error:', err));
  }
}, { immediate: true });

// 监听通话状态
watch(callStatus, (status) => {
  if (status === 'calling' || status === 'receiving') {
    playRing();
  } else {
    stopRing();
  }

  if (status === 'connected') {
    callDurationSeconds.value = 0;
    callTimer = setInterval(() => {
      callDurationSeconds.value++;
    }, 1000);
  } else if (status === 'idle') {
    clearInterval(callTimer);
  }
});

const handleAccept = async () => {
  await acceptCall();
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

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
  // 检查是否已选择身份
  const savedUserId = localStorage.getItem('chat_user_id');
  if (!savedUserId) {
    showIdentityDialog.value = true;
  }

  // 确保连接已初始化
  await initChat();
  
  scrollToBottom();
  isInitialLoading.value = false;
});

const selectIdentity = async (user: any) => {
  currentUser.value = user;
  localStorage.setItem('chat_user_id', user.id);
  showIdentityDialog.value = false;
  
  ElMessage.success(`欢迎你，${user.name}！`);
  isInitialLoading.value = true;
  
  // 重新加载本地历史
  loadLocalHistory();
  await initChat();
  
  isInitialLoading.value = false;
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

  // 创建临时消息用于即时显示
  const tempId = 'temp_' + Date.now();
  const tempMsg = {
    id: tempId,
    from: currentUser.value.id,
    sender: currentUser.value.name,
    avatar: currentUser.value.avatar,
    type: 'mine',
    contentType: 'text',
    content: text,
    status: 'sending',
    time: Date.now()
  };
  
  messages.value.push(tempMsg);
  scrollToBottom();

  try {
    const message = new TextMessage(text);
    await globalConversation.value.send(message);
    
    // 发送成功，更新消息状态和 ID
    const index = messages.value.findIndex(m => m.id === tempId);
    if (index !== -1) {
      const realMsg = parseMessage(message);
      messages.value[index] = realMsg;
      saveMessages();
    }
  } catch (error: any) {
    // 发送失败，更新状态
    const index = messages.value.findIndex(m => m.id === tempId);
    if (index !== -1) {
      messages.value[index].status = 'error';
    }
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
    
    // 创建临时消息
    const tempId = 'temp_' + Date.now();
    const tempMsg = {
      id: tempId,
      from: currentUser.value.id,
      sender: currentUser.value.name,
      avatar: currentUser.value.avatar,
      type: 'mine',
      contentType: 'image',
      content: URL.createObjectURL(uploadFile.raw), // 预览图
      status: 'sending',
      time: Date.now()
    };
    messages.value.push(tempMsg);
    scrollToBottom();

    await file.save();
    
    const message = new ImageMessage(file);
    await globalConversation.value.send(message);

    const index = messages.value.findIndex(m => m.id === tempId);
    if (index !== -1) {
      const realMsg = parseMessage(message);
      messages.value[index] = realMsg;
      saveMessages();
    }
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
  
  // 重新加载本地历史并切换身份
  loadLocalHistory();
  await initChat();
  
  isInitialLoading.value = false;
  ElMessage.success(`已成功切换为: ${currentUser.value.name}`);
};

const handleMoreCommand = async (command: string) => {
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
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 10px;
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

.refresh-icon {
  margin-left: 4px;
  font-size: 12px;
  vertical-align: middle;
  cursor: pointer;
}

.refresh-icon:hover {
  color: #e63946;
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

/* 通话记录样式 */
.call-log-content {
  padding: 8px 12px;
  background: #f0f2f5;
  border-radius: 8px;
  min-width: 120px;
  max-width: 200px;
}

.mine .call-log-content {
  background: #e1f3d8;
}

.call-log-body {
  display: flex;
  align-items: center;
  gap: 10px;
}

.call-icon {
  font-size: 20px;
  color: #606266;
}

.mine .call-icon {
  color: #67c23a;
}

.call-info {
  display: flex;
  flex-direction: column;
}

.call-status {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.call-duration {
  font-size: 12px;
  color: #909399;
}

.mine .call-duration {
  color: #67c23a;
  opacity: 0.8;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;
  align-items: flex-start;
}

.avatar {
  flex-shrink: 0;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-weight: bold;
}

.avatar-user1 {
  background-color: #fde2e2;
  color: #f56c6c;
}

.avatar-user2 {
  background-color: #e1f3d8;
  color: #67c23a;
}

.avatar :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #fde2e2;
  color: #f56c6c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
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

.chat-status.typing {
  color: #ff80ab;
  font-weight: bold;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.bubble {
  padding: 10px 15px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-all;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  position: relative;
  display: flex;
  align-items: center;
}

.message-status {
  position: absolute;
  left: -24px;
  display: flex;
  align-items: center;
}

.mine .message-status {
  left: auto;
  right: -24px;
}

.status-icon {
  font-size: 16px;
  color: #909399;
}

.status-icon.error {
  color: #f56c6c;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.identity-selection {
  padding: 10px 0;
}

.select-tip {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}

.user-cards {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 15px;
  border-radius: 12px;
  transition: all 0.2s;
}

.user-card:hover {
  background: #fff5f7;
  transform: translateY(-5px);
}

.user-card .name {
  font-weight: bold;
  color: #e63946;
}

.warning-text {
  font-size: 12px;
  color: #999;
  text-align: center;
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

/* 通话界面样式 */
.call-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
}

.call-bg-blur {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  filter: blur(40px) brightness(0.6);
  transform: scale(1.2);
  z-index: -1;
}

.call-pending {
  text-align: center;
  width: 100%;
  padding-top: 100px;
}

.call-user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.call-avatar {
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.call-avatar.pulse {
  animation: avatarPulse 2s infinite;
}

@keyframes avatarPulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(255, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
}

.call-name {
  font-size: 28px;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.call-status-text {
  font-size: 16px;
  opacity: 0.9;
}

.call-actions {
  display: flex;
  justify-content: center;
  gap: 60px;
  width: 100%;
  margin-top: auto;
  padding-bottom: 100px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.action-btn {
  width: 72px;
  height: 72px;
  font-size: 32px;
}

.call-connected {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.voice-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 100px;
}

.call-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  width: 100%;
  margin-top: auto;
  padding-bottom: 80px;
  z-index: 10;
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  opacity: 0.9;
}

.control-btn {
  width: 60px;
  height: 60px;
  font-size: 24px;
}

.hangup-btn {
  width: 72px;
  height: 72px;
  font-size: 32px;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

.remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.local-video-wrapper {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 120px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.local-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-timer {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}


</style>
