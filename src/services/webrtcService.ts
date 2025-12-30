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

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.xten.com' },
    { urls: 'stun:stun.rixtelecom.se' },
    { urls: 'stun:stun.schlund.de' },
  ],
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

  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection?.connectionState);
    if (peerConnection?.connectionState === 'disconnected' || 
        peerConnection?.connectionState === 'failed' || 
        peerConnection?.connectionState === 'closed') {
      handleHangup(false);
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

  await sendSignalingMessage({
    type: 'offer',
    offer,
    callType: type
  });
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
  // 如果是点击事件，shouldNotify 会是事件对象，也是 true
  const notify = typeof shouldNotify === 'boolean' ? shouldNotify : true;
  
  if (notify) {
    sendSignalingMessage({ type: 'hangup' });
  }

  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop());
    localStream.value = null;
  }
  
  if (remoteStream.value) {
    remoteStream.value.getTracks().forEach(track => track.stop());
    remoteStream.value = null;
  }
  
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
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
      if (callStatus.value !== 'idle') {
        // 忙线中，自动拒绝
        sendSignalingMessage({ type: 'busy' });
        return;
      }
      callType.value = incomingType;
      callStatus.value = 'receiving';
      // 先保存 offer，等接听时再处理
      sessionStorage.setItem('pending_offer', JSON.stringify(offer));
      break;

    case 'answer':
      if (peerConnection && callStatus.value === 'calling') {
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
