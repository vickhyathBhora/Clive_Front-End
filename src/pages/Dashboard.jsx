import React, { useEffect } from 'react';
import Contacts from './Contacts';
import Messages from './Messages';
import { TopNav } from './TopNav';
import './Dashboard.css';
import { ChatProvider, useChat } from './ChatContext'; // 👈 FIX 1: Import ChatProvider
import { initSocket } from './socket';

// 👈 FIX 2: Separate Content Component so useChat() works INSIDE ChatProvider
function DashboardContent() {
  const { addContactsBatch ,setSocket} = useChat();

  useEffect(() => {
    // 1. Initialize socket with auth token
    const socket = initSocket();

    setSocket(socket);
    socket.on('connect', () => {
      console.log('✅ Connected to socket server with ID:', socket.id);

      // 2. Request initial dashboard data
      socket.emit('request_initial_data');
    });

    // 3. Receive initial dataset from server
    socket.on('initial_data', (response) => {
      console.log('📦 Initial Data Received from Server:', response);
      
      // 🎯 Passes response.res straight to ChatContext state!
      if (response?.res) {
        addContactsBatch(response.res);
      }
    });

    // Handle connection or authentication errors
    socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
    });

    // Clean up socket listener on unmount
    return () => {
      socket.disconnect();
    };
  }, [addContactsBatch]);

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <header className="dashboard-topnav">
        <TopNav />
      </header>

      {/* Main Body Layout */}
      <div className="dashboard-body">
        <aside className="contacts-section">
          <Contacts />
        </aside>
        <main className="messages-section">
          <Messages />
        </main>
      </div>
    </div>
  );
}

// Main Export wraps the Content in ChatProvider
export function Dashboard() {
  return (
    <ChatProvider>
      <DashboardContent />
    </ChatProvider>
  );
}