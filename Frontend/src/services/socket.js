import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = useAuthStore.getState().accessToken;
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};

export const joinScanRoom = (scanId) => {
  connectSocket().emit('join:scan', scanId);
};

export const joinPcapRoom = (scanId) => {
  connectSocket().emit('join:pcap', scanId);
};
