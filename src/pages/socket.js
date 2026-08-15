// socket.js
import { io } from 'socket.io-client';
import {SOCKET_URL} from '../utils/constant';
 // Replace with your server URL

export const initSocket = () => {
  const token = localStorage.getItem('token'); // Retrieve stored token

  return io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket']
  });
};