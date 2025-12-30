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

// 外部传入的发送信号函数，避免循环依赖
let signalingSender: ((data: any) => Promise<void>) | null = null;

export const setSignalingSender = (sender: (data: any) => Promise<void>) => {
  signalingSender = sender;
};

let peerConnection: RTCPeerConnection | null = null;
let pendingCandidates: RTCIceCandidateInit[] = [];
let callInviteTimer: any = null;
let callTimeoutTimer: any = null;

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

// 发送信令消息
const sendSignalingMessage = async (data: any) => {
  if (signalingSender) {
    await signalingSender(data);
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

  createPeerConnection();

  const offer = await peerConnection!.createOffer();
  await peerConnection!.setLocalDescription(offer);

  const signalData = {
    type: 'offer',
    offer,
    callType: type,
    timestamp: Date.now()
  };

  // 发送初始邀请
  await sendSignalingMessage(signalData);

  // 增加心跳重发机制：每 3 秒重发一次邀请，直到对方响应或超时
  let retryCount = 0;
  callInviteTimer = setInterval(async () => {
    if (callStatus.value === 'calling' && retryCount < 10) {
      console.log('重发通话邀请...', retryCount + 1);
      await sendSignalingMessage(signalData);
      retryCount++;
    } else {
      clearInterval(callInviteTimer);
    }
  }, 3000);

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

  callStatus.value = 'idle';
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
  const { type, offer, answer, candidate, callType: incomingType } = data;

  switch (type) {
    case 'offer':
      // 如果已经连接成功，说明是由于网络延迟收到的重复 offer，直接忽略，不要发 busy
      if (callStatus.value === 'connected') {
        console.log('已在通话中，忽略重发的 offer');
        return;
      }

      if (callStatus.value !== 'idle' && callStatus.value !== 'receiving') {
        // 只有在真正的忙线状态（比如你正在呼叫别人）时，才发送 busy
        sendSignalingMessage({ type: 'busy' });
        return;
      }
      
      // 如果已经在显示接收界面，且是同一个呼叫的重发，则不重复处理逻辑
      if (callStatus.value === 'receiving') {
        const pending = sessionStorage.getItem('pending_offer');
        if (pending && JSON.stringify(offer) === pending) {
          return;
        }
      }

      callType.value = incomingType;
      callStatus.value = 'receiving';
      // 先保存 offer，等接听时再处理
      sessionStorage.setItem('pending_offer', JSON.stringify(offer));
      break;

    case 'answer':
      if (peerConnection && callStatus.value === 'calling') {
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
      alert('对方正忙');
      handleHangup(false);
      break;
  }
};
