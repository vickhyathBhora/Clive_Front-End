import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constant';

export const initSocket = (overrideUrl = null) => {
  const token = localStorage.getItem('token');
  const targetUrl = overrideUrl || SOCKET_URL;

  console.log(`🔌 Connecting Socket to: ${targetUrl}...`);

  const socket = io(targetUrl, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket'],
    reconnection: false, // Turned off default reconnection so we control server hops explicitly
  });

  // Catch Server Redirect Signals (Server 1 -> Server 2 -> Server 3 -> Max)
  socket.on('connect_error', (err) => {
    console.warn(`⚠️ Socket connection failed on ${targetUrl}:`, err.message);

    if (err.message === 'SERVER_FULL' || err.message === 'SERVER_HIGH_LOAD') {
      const redirectUrl = err.data?.redirectUrl;

      if (redirectUrl && redirectUrl !== 'SYSTEM_OVERLOAD') {
        console.log(`🔄 Target server is full! Auto-rerouting to next server: ${redirectUrl}`);

        socket.disconnect();
        // Re-initialize socket with the new server URL
        initSocket(redirectUrl);
      } else {
        console.error('💥 ALL SERVERS ARE AT CAPACITY!');
        alert('All chat servers are currently full. Please try again in a few minutes or call CEO at +1-800-CALL-CEO 📞😂');
      }
    }
  });

  return socket;
};