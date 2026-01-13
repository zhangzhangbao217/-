<template>
  <div class="chat-content-wrapper">
    <div class="chat-header">
      <div class="header-content">
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
                <el-dropdown-item command="test_notify">测试后台通知</el-dropdown-item>
                <el-dropdown-item command="clear">清空聊天记录</el-dropdown-item>
                <el-dropdown-item command="export">导出聊天记录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- PWA 引导提示 -->
    <div v-if="showPWAGuide" class="pwa-guide-banner">
      <el-icon><InfoFilled /></el-icon>
      <span>添加到主屏幕，后台收消息更稳定</span>
      <el-button size="small" type="primary" link @click="showPWAGuide = false">知道了</el-button>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef" v-loading="isInitialLoading">
      <div class="identity-notice">
        <el-tag size="small" effect="plain" type="danger">
          当前身份: {{ currentUser.name }}
        </el-tag>
        <el-button 
          v-if="showNotificationBtn" 
          size="small" 
          type="warning" 
          link 
          @click="requestNotificationPermission"
        >
          开启消息通知
        </el-button>
      </div>
      
      <template v-for="(msg, index) in messages" :key="msg.id || index">
        <!-- 时间戳显示：距离上一条超过 5 分钟显示 -->
        <div v-if="shouldShowTime(index)" class="message-time-divider">
          <span>{{ formatTime(msg.time) }}</span>
        </div>

        <!-- 系统消息 -->
        <div v-if="msg.contentType === 'system'" class="system-message">
          <span class="system-text">
            <el-icon v-if="msg.content.includes('红包')"><Money /></el-icon>
            {{ msg.content }}
          </span>
        </div>

        <div v-else :class="['message-item', msg.from === currentUser.id ? 'mine' : 'other']">
          <el-avatar 
            :size="40" 
            :src="msg.from === user1.id ? user1.avatar : user2.avatar" 
            :class="['avatar', msg.from === user1.id ? 'avatar-user1' : 'avatar-user2']"
          >
            {{ msg.from === user1.id ? user1.name[0] : user2.name[0] }}
          </el-avatar>
          <div class="message-content">
            <div class="message-info">
              <span class="sender-name">{{ msg.from === user1.id ? user1.name : user2.name }}</span>
            </div>
          <div :class="['bubble', msg.contentType === 'red_packet' ? 'bubble-clear' : '']">
            <!-- 发送状态标识 -->
            <div v-if="msg.from === currentUser.id" class="message-status">
              <el-icon v-if="msg.status === 'sending'" class="status-icon is-loading"><Loading /></el-icon>
              <el-icon v-if="msg.status === 'error'" class="status-icon error" @click="retryMessage(msg)" title="点击重试"><Warning /></el-icon>
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
          <template v-else-if="msg.contentType === 'red_packet'">
            <div 
              class="red-packet-bubble" 
              :class="{ 'is-opened': openedRedPacketIds.has(msg.id) }" 
              @click="handleOpenRedPacket(msg)"
            >
              <div class="rp-content">
                <div class="rp-icon">
                  <el-icon><Money /></el-icon>
                </div>
                <div class="rp-text">
                  <p class="rp-title">{{ JSON.parse(msg.content).title || '恭喜发财，大吉大利' }}</p>
                  <p class="rp-desc">
                    {{ openedRedPacketIds.has(msg.id) ? '已领取' : (msg.from === currentUser.id ? '查看红包' : '领取红包') }}
                  </p>
                </div>
              </div>
              <div class="rp-footer">
                <span>{{ JSON.parse(msg.content).type === 'transfer' ? '直接转账' : '甜蜜红包' }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </template>
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
        <el-button 
          :icon="Money" 
          circle 
          class="tool-btn" 
          @click="showPaymentDialog = true"
          title="发红包/转账"
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

    <!-- 支付功能弹窗 -->
    <el-dialog
      v-model="showPaymentDialog"
      title="💝 发送甜蜜红包"
      width="320px"
      center
      class="payment-dialog"
    >
      <el-tabs v-model="paymentType" class="payment-tabs">
        <el-tab-pane label="甜蜜红包" name="red_packet">
          <div class="payment-form">
            <el-input v-model="redPacketForm.amount" placeholder="金额 (¥)" type="number">
              <template #prefix>¥</template>
            </el-input>
            <el-input v-model="redPacketForm.title" placeholder="恭喜发财，大吉大利" />
            <div class="quick-amounts">
              <el-tag @click="redPacketForm.amount = '5.20'" effect="plain">5.20</el-tag>
              <el-tag @click="redPacketForm.amount = '13.14'" effect="plain">13.14</el-tag>
              <el-tag @click="redPacketForm.amount = '52.00'" effect="plain">52.0</el-tag>
              <el-tag @click="redPacketForm.amount = '66.66'" effect="plain">66.66</el-tag>
            </div>
            <el-button type="danger" class="pay-btn" @click="sendRedPacket('red_packet')">
              塞钱进红包
            </el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="直接转账" name="transfer">
          <div class="payment-form">
             <div class="qr-placeholder">
               <p>请上传你的收款码，对方扫码支付</p>
               <el-upload
                 action="#"
                 :auto-upload="false"
                 :show-file-list="false"
                 @change="handleQrUpload"
               >
                 <div v-if="myQrCode" class="qr-preview">
                   <img :src="myQrCode" />
                 </div>
                 <el-button v-else :icon="Picture">上传收款码</el-button>
               </el-upload>
             </div>
             <el-button type="success" class="pay-btn" @click="sendRedPacket('transfer')" :disabled="!myQrCode">
               发送收款码
             </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 红包详情弹窗 -->
    <el-dialog
      v-model="showRedPacketDetail"
      width="320px"
      class="rp-detail-dialog"
      modal-class="rp-detail-dialog-overlay"
      :show-close="false"
      destroy-on-close
      :modal="true"
      :align-center="true"
      :append-to-body="true"
    >
      <div class="rp-detail-content" :class="{ 'is-opened': isRedPacketOpened }">
        <div class="rp-top-section">
          <div class="rp-header-bg"></div>
          <div class="rp-detail-user">
            <el-avatar :src="currentRedPacket?.avatar" :size="60" />
            <p class="rp-sender-name">{{ currentRedPacket?.sender }}</p>
            <p class="rp-send-tip" v-if="!isRedPacketOpened">给你发了一个红包</p>
          </div>
          
          <div class="rp-detail-main" v-if="!isRedPacketOpened">
            <p class="rp-blessing-large">{{ currentRedPacket?.title || '恭喜发财，大吉大利' }}</p>
            <div 
              class="rp-open-btn" 
              :class="{ 'is-rotating': isOpeningRedPacket }"
              @click="confirmOpenRedPacket"
              v-if="currentRedPacket?.type === 'red_packet' && !currentRedPacket?.fromMe"
            >
              <span>開</span>
            </div>
            <div v-else class="rp-transfer-prompt">
              <p>请长按/扫码进行转账</p>
            </div>
          </div>

          <div class="rp-opened-main" v-else>
            <template v-if="currentRedPacket?.type === 'red_packet'">
              <p class="rp-blessing-small">{{ currentRedPacket?.title }}</p>
              <h1 class="rp-amount-display">{{ currentRedPacket?.amount }}<span class="unit">元</span></h1>
              <p class="rp-status-text">{{ currentRedPacket?.fromMe ? '红包已被对方领取' : '已存入零钱，可用于发红包' }}</p>
            </template>
            <template v-else>
               <div class="rp-qr-display">
                 <img :src="currentRedPacket?.qrCode" class="rp-qr-img" />
                 <p class="rp-qr-tip">扫码向对方转账</p>
                 <el-button type="primary" link size="small" @click="saveQrCode">保存二维码到相册</el-button>
               </div>
             </template>
          </div>
        </div>

        <div class="rp-detail-footer" v-if="isRedPacketOpened">
          <div class="rp-record-list">
            <div class="rp-record-item">
              <el-avatar :size="24" :src="currentRedPacket.fromMe ? partnerInfo.avatar : currentUser.avatar" />
              <div class="rp-record-info">
                <p class="rp-record-name">{{ currentRedPacket.fromMe ? partnerInfo.name : currentUser.name }}</p>
                <p class="rp-record-time">{{ formatTime(Date.now()) }}</p>
              </div>
              <p class="rp-record-amount" v-if="currentRedPacket?.type === 'red_packet'">{{ currentRedPacket?.amount }}元</p>
            </div>
          </div>
          <span @click="showRedPacketDetail = false" class="rp-view-all">查看领取详情 ></span>
        </div>

        <div class="rp-close-outer" @click="showRedPacketDetail = false">
          <el-icon><Close /></el-icon>
        </div>
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
import { ref, onMounted, onUnmounted, nextTick, watch, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  MoreFilled, 
  Picture, 
  Star, 
  Microphone, 
  VideoPlay, 
  Service,
  VideoCamera,
  Phone,
  Close,
  Check,
  Refresh,
  Loading,
  Warning,
  MuteNotification,
  Money,
  InfoFilled
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
  CALL_RING_URL,
  openedRedPacketIds
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
const showPaymentDialog = ref(false);
const isRedPacketOpened = ref(false);
const isOpeningRedPacket = ref(false);
const showRedPacketDetail = ref(false);
const paymentType = ref('red_packet');
const myQrCode = ref('');
const currentRedPacket = ref<any>(null);
const redPacketForm = reactive({
  amount: '',
  title: ''
});

const handleQrUpload = (file: any) => {
  myQrCode.value = URL.createObjectURL(file.raw);
};

const sendRedPacket = async (type: string) => {
  if (type === 'red_packet' && !redPacketForm.amount) {
    ElMessage.warning('请输入金额');
    return;
  }
  
  if (!globalConversation.value) {
    ElMessage.error('聊天未连接');
    return;
  }

  const packetData = {
    type,
    amount: redPacketForm.amount,
    title: redPacketForm.title || '恭喜发财，大吉大利',
    qrCode: type === 'transfer' ? myQrCode.value : null, // 真实场景应上传到服务器获取 URL
    timestamp: Date.now()
  };

  try {
    const msgText = `__RED_PACKET__:${JSON.stringify(packetData)}`;
    const message = new TextMessage(msgText);
    await globalConversation.value.send(message);
    
    // 手动添加到本地消息列表
    const parsedMsg = parseMessage(message);
    // 修正 content 为 JSON 字符串以便模板解析
    parsedMsg.contentType = 'red_packet';
    parsedMsg.content = JSON.stringify(packetData);
    
    messages.value.push(parsedMsg);
    saveMessages();
    scrollToBottom();
    
    showPaymentDialog.value = false;
    redPacketForm.amount = '';
    redPacketForm.title = '';
    ElMessage.success('发送成功');
  } catch (e) {
    ElMessage.error('发送失败');
  }
};

const handleOpenRedPacket = (msg: any) => {
  try {
    const data = JSON.parse(msg.content);
    currentRedPacket.value = {
      ...data,
      sender: msg.sender,
      avatar: msg.avatar,
      fromMe: msg.from === currentUser.value.id,
      msgId: msg.id
    };
    
    // 如果是自己发的，点击只能查看，不能领取（除非对方已经领了，或者为了看一眼金额）
    // 逻辑：如果是自己发的，直接显示已拆开状态（显示金额），但不会触发“领取”动作
    if (currentRedPacket.value.fromMe) {
      isRedPacketOpened.value = true;
    } else {
      // 对方发的，检查本地是否记录过已领取
      isRedPacketOpened.value = openedRedPacketIds.value.has(msg.id);
    }
    
    isOpeningRedPacket.value = false;
    showRedPacketDetail.value = true;
  } catch (e) {
    console.error(e);
  }
};

const confirmOpenRedPacket = () => {
  if (isOpeningRedPacket.value || isRedPacketOpened.value) return;
  
  // 再次校验：自己不能领自己的
  if (currentRedPacket.value?.fromMe) {
    ElMessage.warning('这是你发出的红包');
    return;
  }
  
  isOpeningRedPacket.value = true;
  
  // 模拟旋转动画后的开启效果
  setTimeout(() => {
    isOpeningRedPacket.value = false;
    isRedPacketOpened.value = true;
    
    // 播放音效
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});

    if (currentRedPacket.value.msgId) {
      const newSet = new Set(openedRedPacketIds.value);
      newSet.add(currentRedPacket.value.msgId);
      openedRedPacketIds.value = newSet;
    }
    
    // 发送一个“已领取”的暂态消息告知对方
    if (globalConversation.value && currentRedPacket.value.type === 'red_packet') {
      const notifyMsg = new TextMessage(`__RP_RECEIVED__:${JSON.stringify({
        amount: currentRedPacket.value.amount,
        title: currentRedPacket.value.title,
        packetId: currentRedPacket.value.msgId
      })}`);
      globalConversation.value.send(notifyMsg, { transient: true }).catch(() => {});
      
      // 领取方本地显示一条系统消息 (增加唯一 ID 防止重复)
      const sysMsgId = `sys_rp_rcv_${currentRedPacket.value.msgId}`;
      if (!messages.value.find(m => m.id === sysMsgId)) {
        const systemMsg = {
          id: sysMsgId,
          contentType: 'system',
          content: `你领取了 ${currentRedPacket.value.sender} 的红包`,
          time: Date.now()
        };
        messages.value.push(systemMsg);
        saveMessages();
      }
    }
  }, 1200);
};

const saveQrCode = () => {
  ElMessage.success('二维码已保存到相册');
};

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

const showNotificationBtn = ref(false);
const showPWAGuide = ref(false);

// 初始化加载设置
onMounted(async () => {
  // 检查通知权限
  if ('Notification' in window && Notification.permission !== 'granted') {
    showNotificationBtn.value = true;
  }

  // 判断是否为移动端且未添加到主屏幕
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
  if (isMobile && !isStandalone) {
    showPWAGuide.value = true;
  }

  // 检查是否已选择身份
  const savedUserId = localStorage.getItem('chat_user_id');
  if (!savedUserId) {
    showIdentityDialog.value = true;
  }

  isInitialLoading.value = true;
  // 确保连接已初始化
  initChat().finally(() => {
    isInitialLoading.value = false;
    nextTick(() => {
      scrollToBottom();
    });
  });
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

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    ElMessage.warning('您的浏览器不支持桌面通知');
    return;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showNotificationBtn.value = false;
      ElMessage.success('通知已开启');
      // 尝试播放一次声音以解锁音频上下文
      new Audio(CALL_RING_URL).play().catch(() => {});
    } else {
      ElMessage.warning('您拒绝了通知权限，可能无法收到新消息提醒');
    }
  } catch (e) {
    console.error(e);
  }
};

const shouldShowTime = (index: number) => {
  if (index === 0) return true;
  const currentMsg = messages.value[index];
  const prevMsg = messages.value[index - 1];
  return currentMsg.time - prevMsg.time > 5 * 60 * 1000; // 5分钟
};

const retryMessage = async (msg: any) => {
  // 仅支持文本消息重试
  if (msg.contentType !== 'text') {
    ElMessage.warning('暂只支持文本消息重发，请重新发送图片/语音');
    return;
  }
  
  // 移除旧的错误消息
  const index = messages.value.findIndex(m => m.id === msg.id);
  if (index !== -1) {
    messages.value.splice(index, 1);
  }
  
  // 重新填入输入框并自动触发发送（或者直接调用发送逻辑）
  inputMsg.value = msg.content;
  await sendMessage();
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
  if (command === 'test_notify') {
    ElMessage.info('将在 5 秒后发送测试通知，请立即将 App 切换到后台或锁屏');
    setTimeout(() => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title: '💝 恋爱窝测试通知',
            body: '看到这条消息说明你的后台通知配置成功啦！',
            icon: currentUser.value.avatar
          }
        });
      } else {
        // 如果 SW 没准备好，尝试直接通知
        new Notification('💝 恋爱窝测试通知', {
          body: 'Service Worker 未就绪，这是直接通知测试',
          icon: currentUser.value.avatar
        });
      }
    }, 5000);
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
</script>

<style scoped>
.chat-content-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fff5f7 0%, #ffeef2 100%);
  position: relative;
  overflow: hidden;
  overscroll-behavior: none;
}

.chat-header {
  position: sticky;
  top: 0;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(230, 57, 70, 0.1);
  z-index: 100;
  flex-shrink: 0;
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

.pwa-guide-banner {
  background: #fff4f4;
  color: #ff4757;
  padding: 8px 15px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #ffecec;
  animation: slideDown 0.3s ease;
  z-index: 9;
}

@keyframes slideDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
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

.message-time-divider {
  text-align: center;
  margin: 20px 0 10px;
}

.message-time-divider span {
  background: rgba(0, 0, 0, 0.1);
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
}

.system-message {
  display: flex;
  justify-content: center;
  margin: 15px 0;
  animation: fadeIn 0.4s ease;
}

.system-text {
  background: rgba(0, 0, 0, 0.05);
  color: #999;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.system-text .el-icon {
  font-size: 14px;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;
  margin-bottom: 16px;
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

/* 支付相关样式 */
/* 红包气泡微调 */
.bubble.bubble-clear {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.red-packet-bubble {
  background: #fa9d3b;
  width: 240px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.red-packet-bubble.is-opened {
  background: #fbd69f;
  opacity: 0.8;
}

.red-packet-bubble.is-opened .rp-icon {
  background: #fce4c4;
}

.red-packet-bubble.is-opened .rp-title,
.red-packet-bubble.is-opened .rp-desc {
  color: #cf4e46;
}

.red-packet-bubble:hover {
  filter: brightness(1.05);
}

.rp-content {
  padding: 12px;
  display: flex;
  align-items: center;
}

.rp-icon {
  width: 36px;
  height: 42px;
  background: #fbd69f;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.rp-icon .el-icon {
  font-size: 24px;
  color: #cf4e46;
}

.rp-text {
  flex: 1;
}

.rp-title {
  color: white;
  font-size: 14px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rp-desc {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.rp-footer {
  background: white;
  padding: 4px 12px;
  font-size: 11px;
  color: #999;
  border-top: 1px solid #eee;
}

.payment-dialog .el-dialog__body {
  padding: 10px 20px 20px;
}

.payment-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.quick-amounts {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-amounts .el-tag {
  cursor: pointer;
  min-width: 60px;
  text-align: center;
}

.pay-btn {
  width: 100%;
  margin-top: 10px;
  height: 40px;
  font-size: 16px;
}

.qr-placeholder {
  border: 2px dashed #eee;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #999;
}

.qr-preview img {
  width: 150px;
  height: 150px;
  object-fit: contain;
}

/* 红包详情弹窗增强：彻底移除所有白色背景和边框 */
.rp-detail-dialog {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.rp-detail-dialog :deep(.el-dialog) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  display: flex !important;
  justify-content: center;
  align-items: center;
  overflow: visible !important;
}

.rp-detail-dialog :deep(.el-dialog__header) {
  display: none !important;
}

.rp-detail-dialog :deep(.el-dialog__body) {
  padding: 0 !important;
  background: transparent !important;
}

.rp-detail-dialog :deep(.el-overlay-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent !important;
}

.rp-detail-dialog :deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.75) !important;
  backdrop-filter: blur(8px);
}

.rp-detail-content {
  background: #cf4e46;
  border-radius: 16px;
  overflow: visible;
  position: relative;
  min-height: 420px;
  width: 300px;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  animation: rpPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes rpPopIn {
  from { transform: scale(0.5) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.rp-detail-content.is-opened {
  background: #f1f1f1;
  border-radius: 8px;
}

.rp-top-section {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
}

.rp-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 280px;
  background: #e1564f;
  border-radius: 0 0 50% 50% / 0 0 25% 25%;
  z-index: 1;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  transition: all 0.5s ease;
}

.rp-detail-content.is-opened .rp-header-bg {
  height: 100px;
}

.rp-detail-user {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #fbd69f;
}

.rp-detail-user .el-avatar {
  border: 2px solid #fbd69f;
  margin-bottom: 10px;
}

.rp-sender-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.rp-send-tip {
  font-size: 14px;
  opacity: 0.9;
}

.rp-detail-main {
  position: relative;
  z-index: 2;
  margin-top: 30px;
  text-align: center;
  width: 100%;
}

.rp-blessing-large {
  color: #fbd69f;
  font-size: 20px;
  margin-bottom: 40px;
  padding: 0 20px;
}

.rp-open-btn {
  width: 90px;
  height: 90px;
  background: #fbd69f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  border: 1px solid #f1d08a;
  transition: transform 0.2s;
}

.rp-open-btn:active {
  transform: scale(0.9) rotate(5deg);
}

.rp-open-btn span {
  font-size: 36px;
  color: #333;
  font-weight: bold;
}

.rp-open-btn.is-rotating {
  animation: rotateOpen 1.2s infinite linear;
}

@keyframes rotateOpen {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}

.rp-opened-main {
  position: relative;
  z-index: 2;
  margin-top: 60px;
  text-align: center;
  color: #333;
  width: 100%;
  animation: fadeIn 0.5s ease;
}

.rp-blessing-small {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.rp-amount-display {
  font-size: 48px;
  font-weight: bold;
  color: #cf4e46;
  margin-bottom: 10px;
}

.rp-amount-display .unit {
  font-size: 16px;
  margin-left: 4px;
}

.rp-status-text {
  color: #999;
  font-size: 12px;
}

.rp-qr-display {
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin: 0 20px;
}

.rp-qr-img {
  width: 180px;
  height: 180px;
  object-fit: contain;
}

.rp-qr-tip {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}

.rp-detail-footer {
  padding: 20px;
  text-align: center;
  color: #576b95;
  font-size: 14px;
  z-index: 2;
  border-top: 1px solid rgba(0,0,0,0.05);
  margin-top: 20px;
}

.rp-record-list {
  text-align: left;
  margin-bottom: 20px;
}

.rp-record-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}

.rp-record-info {
  flex: 1;
}

.rp-record-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 2px;
}

.rp-record-time {
  font-size: 11px;
  color: #999;
}

.rp-record-amount {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.rp-view-all {
  cursor: pointer;
  display: inline-block;
  margin-top: 10px;
}

.rp-close-outer {
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 30px;
  cursor: pointer;
  opacity: 0.8;
}

.rp-close-outer:hover {
  opacity: 1;
}

/* 消息进场动画 */
.message-item {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.rp-close-outer:hover {
  opacity: 1;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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

<style>
/* 全局覆盖 Element Plus 对红包弹窗的默认样式，彻底干掉白盒 */
.rp-detail-dialog,
.rp-detail-dialog .el-dialog,
.rp-detail-dialog .el-dialog__content,
.rp-detail-dialog .el-dialog__header,
.rp-detail-dialog .el-dialog__body {
  background: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
  --el-dialog-bg-color: transparent !important;
  --el-dialog-box-shadow: none !important;
}

/* 确保遮罩层是半透明黑，突出悬浮感 */
.rp-detail-dialog-overlay .el-overlay {
  background-color: rgba(0, 0, 0, 0.75) !important;
  backdrop-filter: blur(8px) !important;
}
</style>
