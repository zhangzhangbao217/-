import { ref } from 'vue';
import { globalConversation, currentUser, user1, user2 } from './chatManager';
import { TextMessage } from 'leancloud-realtime';

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'calling' | 'receiving' | 'connected';

export const callStatus = ref<CallStatus>('idle');
export const callType = ref<CallType>('voice');
export const localStream = ref<MediaStream | null>(null);
export const remoteStream = ref<MediaStream | null>(null);
export const isMuted = ref(false);
export const isCameraOff = ref(false);

let peerConnection: RTCPeerConnection | null = null;
let pendingCandidates: RTCIceCandidateInit[] = [];

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// 发送信令消息
const sendSignalingMessage = async (data: any) => {
  if (!globalConversation.value) return;
  const message = new TextMessage(`__SIGNAL__:${JSON.stringify(data)}`);
  await globalConversation.value.send(message);
};

// 初始化本地媒体流
export const initLocalStream = async (type: CallType) => {
  try {
    const constraints = {
      audio: true,
      video: type === 'video' ? {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } : false
    };
    localStream.value = await navigator.mediaDevices.getUserMedia(constraints);
    return true;
  } catch (error) {
    console.error('获取媒体流失败:', error);
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
    if (event.streams && event.streams[0]) {
      remoteStream.value = event.streams[0];
    }
  };

  // 监听 ICE Candidate
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
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
  if (!success) {
    alert('无法访问摄像头或麦克风');
    return;
  }

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
    alert('无法访问摄像头或麦克风');
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
  
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  remoteStream.value = null;
  callStatus.value = 'idle';
  pendingCandidates = [];
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
        callStatus.value = 'connected';
      }
      break;

    case 'candidate':
      if (peerConnection && peerConnection.remoteDescription) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ice candidate', e);
        }
      } else {
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
