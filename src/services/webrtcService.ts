import { ref } from 'vue';
import { TextMessage } from 'leancloud-realtime';

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'calling' | 'receiving' | 'connected';

export const callStatus = ref<CallStatus>('idle');
export const callType = ref<CallType>('voice');
export const localStream = ref<MediaStream | null>(null);
export const remoteStream = ref<MediaStream | null>(null);
export const isMuted = ref(false);
export const isCameraOff = ref(false);
export const callDurationSeconds = ref(0);


let peerConnection: RTCPeerConnection | null = null;
let pendingCandidates: RTCIceCandidateInit[] = [];
let callInviteTimer: any = null;
let callTimeoutTimer: any = null;
let currentCallId: string | null = null;

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.xten.com' },
    { urls: 'stun:stun.rixtelecom.se' },
    { urls: 'stun:stun.schlund.de' },
    { urls: 'stun:stun.ideasip.com' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
  ],
  iceCandidatePoolSize: 10,
};

export const isWaitingForAck = ref(false);

// 铃声资源
const RINGTONE_OUTGOING = 'https://assets.mixkit.co/active_storage/sfx/135/135-preview.mp3'; // 拨出音
const RINGTONE_INCOMING = 'https://assets.mixkit.co/active_storage/sfx/1354/1354-preview.mp3'; // 接入音

let outgoingAudio: HTMLAudioElement | null = null;
let incomingAudio: HTMLAudioElement | null = null;

const playRingtone = (type: 'outgoing' | 'incoming') => {
  stopRingtones();
  if (type === 'outgoing') {
    outgoingAudio = new Audio(RINGTONE_OUTGOING);
    outgoingAudio.loop = true;
    outgoingAudio.play().catch(e => console.log('播放拨出铃声失败:', e));
  } else {
    incomingAudio = new Audio(RINGTONE_INCOMING);
    incomingAudio.loop = true;
    incomingAudio.play().catch(e => console.log('播放接入铃声失败:', e));
  }
};

const stopRingtones = () => {
  if (outgoingAudio) {
    outgoingAudio.pause();
    outgoingAudio = null;
  }
  if (incomingAudio) {
    incomingAudio.pause();
    incomingAudio = null;
  }
};

// 外部传入的发送信号函数，避免循环依赖
let signalingSender: ((data: any, options?: any) => Promise<void>) | null = null;

export const setSignalingSender = (sender: (data: any, options?: any) => Promise<void>) => {
  signalingSender = sender;
};

// 外部传入的发送通话记录函数
let callLogSender: ((log: any) => Promise<void>) | null = null;
export const setCallLogSender = (sender: (log: any) => Promise<void>) => {
  callLogSender = sender;
};

// 发送信令消息
export const sendSignalingMessage = async (data: any, options: any = { transient: true }) => {
  if (signalingSender) {
    try {
      await signalingSender(data, options);
    } catch (e) {
      console.error('发送信令异常:', e);
    }
  }
};

// 初始化本地媒体流
export const initLocalStream = async (type: CallType) => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('您的浏览器不支持音视频通话功能，请使用 Chrome 或 Safari 浏览器打开');
    }

    const constraints = {
      audio: true,
      video: type === 'video' ? {
        facingMode: 'user',
        // 移动端使用更保守的理想分辨率
        width: { ideal: 640 },
        height: { ideal: 480 }
      } : false
    };

    console.log('正在请求媒体权限:', constraints);
    localStream.value = await navigator.mediaDevices.getUserMedia(constraints);
    return true;
  } catch (error: any) {
    console.error('获取媒体流失败:', error);
    let errorMsg = '无法访问摄像头或麦克风';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMsg = '请允许浏览器访问您的摄像头和麦克风以进行通话';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMsg = '未找到可用的摄像头或麦克风设备';
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    alert(errorMsg);
    return false;
  }
};

// 创建 PeerConnection
const createPeerConnection = () => {
  if (peerConnection) {
    peerConnection.close();
  }

  peerConnection = new RTCPeerConnection(ICE_SERVERS);

  // 添加本地流轨道
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => {
      peerConnection!.addTrack(track, localStream.value!);
    });
  }

  // 监听远程流
  peerConnection.ontrack = (event) => {
    console.log('收到远程轨道:', event.track.kind);
    if (event.streams && event.streams[0]) {
      remoteStream.value = event.streams[0];
      console.log('设置远程流成功');
    }
  };

  // 监听 ICE Candidate
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('生成 ICE Candidate');
      sendSignalingMessage({
        type: 'candidate',
        candidate: event.candidate
      });
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log('ICE 状态变化:', peerConnection?.iceConnectionState);
    if (peerConnection?.iceConnectionState === 'failed') {
      console.log('ICE 连接失败，尝试重启 ICE...');
      peerConnection.restartIce();
    }
  };

  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection?.connectionState);
    if (peerConnection?.connectionState === 'disconnected' || 
        peerConnection?.connectionState === 'failed' || 
        peerConnection?.connectionState === 'closed') {
      // 延迟检查，防止瞬时断连导致挂断
      setTimeout(() => {
        if (peerConnection?.connectionState !== 'connected' && callStatus.value === 'connected') {
          handleHangup(false);
        }
      }, 3000);
    }
  };
};

// 发起呼叫
export const startCall = async (type: CallType) => {
  if (callStatus.value !== 'idle') return;
  
  const success = await initLocalStream(type);
  if (!success) return;

  callType.value = type;
  callStatus.value = 'calling';
  isWaitingForAck.value = true;
  playRingtone('outgoing');
  currentCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  createPeerConnection();

  const offer = await peerConnection!.createOffer();
  await peerConnection!.setLocalDescription(offer);

  const signalData = {
    type: 'offer',
    offer,
    callType: type,
    callId: currentCallId,
    timestamp: Date.now()
  };

  // 发送初始邀请 (持久化消息，确保对方上线后能收到)
  await sendSignalingMessage(signalData, { transient: false });

  // 增加更激进的重发机制
  let retryCount = 0;
  const startRetryTimer = () => {
    callInviteTimer = setInterval(async () => {
      if (callStatus.value === 'calling') {
        retryCount++;
        // 前 5 秒每秒发送一次，之后每 3 秒发送一次
        if (retryCount <= 5 || retryCount % 3 === 0) {
          if (retryCount > 20) { // 最多重试约 45 秒
            clearInterval(callInviteTimer);
            return;
          }
          console.log(`正在尝试第 ${retryCount} 次呼叫重连...`);
          // 只有前 3 次重发使用持久化，之后使用瞬时消息以减轻压力
          const isTransient = retryCount > 3;
          await sendSignalingMessage(signalData, { transient: isTransient });
        }
      } else {
        clearInterval(callInviteTimer);
      }
    }, 1000);
  };

  startRetryTimer();

  // 30秒无人接听自动挂断
  callTimeoutTimer = setTimeout(() => {
    if (callStatus.value === 'calling') {
      console.log('通话超时未接听');
      alert('对方暂时无人接听');
      handleHangup();
    }
  }, 30000);
};

// 接听呼叫
export const acceptCall = async () => {
  if (callStatus.value !== 'receiving') return;
  
  stopRingtones();
  const success = await initLocalStream(callType.value);
  if (!success) {
    handleHangup();
    return;
  }

  createPeerConnection();
  
  // 处理挂起的 offer
  const offerStr = sessionStorage.getItem('pending_offer');
  if (offerStr && peerConnection) {
    const offer = JSON.parse(offerStr);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    sessionStorage.removeItem('pending_offer');
  }

  callStatus.value = 'connected';

  // 处理挂起的 candidates
  for (const candidate of pendingCandidates) {
    await peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
  }
  pendingCandidates = [];

  const answer = await peerConnection!.createAnswer();
  await peerConnection!.setLocalDescription(answer);

  await sendSignalingMessage({
    type: 'answer',
    answer
  });
};

// 挂断
export const handleHangup = (shouldNotify: any = true) => {
  console.log('正在执行挂断清理...');
  // 清理所有定时器
  if (callInviteTimer) {
    clearInterval(callInviteTimer);
    callInviteTimer = null;
  }
  if (callTimeoutTimer) {
    clearTimeout(callTimeoutTimer);
    callTimeoutTimer = null;
  }

  // 如果是点击事件，shouldNotify 会是事件对象，也是 true
  const notify = typeof shouldNotify === 'boolean' ? shouldNotify : true;
  
  if (notify) {
    sendSignalingMessage({ type: 'hangup' });
    
    // 生成并发送通话记录
    if (callLogSender) {
      let status: 'completed' | 'missed' | 'declined' | 'busy' = 'completed';
      
      if (callStatus.value === 'calling') {
        status = 'missed'; // 我拨出的，对方没接
      } else if (callStatus.value === 'receiving') {
        status = 'declined'; // 对方拨给我的，我没接
      } else if (callStatus.value === 'connected') {
        status = 'completed'; // 通话已完成
      }
      
      callLogSender({
        type: 'call_log',
        callType: callType.value,
        status: status,
        duration: callDurationSeconds.value,
        callId: currentCallId,
        timestamp: Date.now()
      });
    }
  }

  if (localStream.value) {
    localStream.value.getTracks().forEach(track => {
      track.stop();
      console.log('停止本地轨道:', track.kind);
    });
    localStream.value = null;
  }
  
  if (remoteStream.value) {
    remoteStream.value.getTracks().forEach(track => {
      track.stop();
      console.log('停止远程轨道:', track.kind);
    });
    remoteStream.value = null;
  }
  
  if (peerConnection) {
    peerConnection.ontrack = null;
    peerConnection.onicecandidate = null;
    peerConnection.onconnectionstatechange = null;
    peerConnection.oniceconnectionstatechange = null;
    peerConnection.close();
    peerConnection = null;
    console.log('PeerConnection 已关闭');
  }

  stopRingtones();
  callStatus.value = 'idle';
  callDurationSeconds.value = 0;
  isWaitingForAck.value = false;
  currentCallId = null;
  isMuted.value = false;
  isCameraOff.value = false;
  pendingCandidates = [];
  sessionStorage.removeItem('pending_offer');
};

export const toggleMute = () => {
  if (localStream.value) {
    const audioTrack = localStream.value.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      isMuted.value = !audioTrack.enabled;
    }
  }
};

export const toggleCamera = () => {
  if (localStream.value) {
    const videoTrack = localStream.value.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      isCameraOff.value = !videoTrack.enabled;
    }
  }
};

// 处理接收到的信令
export const handleSignaling = async (data: any) => {
  const { type, offer, answer, candidate, callType: incomingType, callId } = data;

  switch (type) {
    case 'offer':
      // 如果是当前正在进行的通话（同 callId），或者是已经连接成功的通话，直接忽略
      if (currentCallId === callId || callStatus.value === 'connected') {
        if (!currentCallId) currentCallId = callId; // 同步 callId
        // 即便是重复的 offer，也回一个 ack，确保对方知道我们收到了
        sendSignalingMessage({ type: 'signal_ack', callId });
        console.log('收到重复或已处理的 offer，发送 ACK 并忽略后续处理');
        return;
      }

      if (callStatus.value !== 'idle' && callStatus.value !== 'receiving') {
        console.log('确实忙线中:', callStatus.value);
        sendSignalingMessage({ type: 'busy', callId });
        return;
      }
      
      // 收到新呼叫，立即回复 ACK
      sendSignalingMessage({ type: 'signal_ack', callId });
      
      currentCallId = callId;
      callType.value = incomingType;
      callStatus.value = 'receiving';
      playRingtone('incoming');
      
      // 先保存 offer，等接听时再处理
      sessionStorage.setItem('pending_offer', JSON.stringify(offer));
      break;

    case 'signal_ack':
      if (callId === currentCallId && callStatus.value === 'calling') {
        console.log('收到呼叫确认 ACK，对方已收到信号');
        isWaitingForAck.value = false;
      }
      break;

    case 'answer':
      if (peerConnection && (callStatus.value === 'calling' || callStatus.value === 'connected')) {
    // 收到 Answer 意味着肯定收到信号了
    isWaitingForAck.value = false;
    stopRingtones();
    // 停止重发邀请和超时计时
        if (callInviteTimer) clearInterval(callInviteTimer);
        if (callTimeoutTimer) clearTimeout(callTimeoutTimer);
        
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('成功设置 RemoteDescription (Answer)');
        
        // 处理暂存的 candidates
        console.log('处理暂存的 Candidates:', pendingCandidates.length);
        for (const cand of pendingCandidates) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.error('Error adding pending ice candidate', e);
          }
        }
        pendingCandidates = [];
        
        callStatus.value = 'connected';
      }
      break;

    case 'candidate':
      if (peerConnection && peerConnection.remoteDescription) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('成功添加 ICE Candidate');
        } catch (e) {
          console.error('Error adding ice candidate', e);
        }
      } else {
        console.log('暂存 ICE Candidate (等待 remoteDescription)');
        pendingCandidates.push(candidate);
      }
      break;

    case 'hangup':
      handleHangup(false);
      break;

    case 'busy':
      // 只有当 busy 信号对应的是当前的呼叫 ID 时，才处理挂断
      if (callId === currentCallId) {
        alert('对方正忙');
        handleHangup(false);
      }
      break;
  }
};
