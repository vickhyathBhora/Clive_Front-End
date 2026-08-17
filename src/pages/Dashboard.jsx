import React, { useEffect } from 'react';
import Contacts from './Contacts';
import Messages from './Messages';
import { TopNav } from './TopNav';
import './Dashboard.css';
import { ChatProvider, useChat } from './ChatContext'; // 👈 FIX 1: Import ChatProvider
import { initSocket } from './socket';

// 👈 FIX 2: Separate Content Component so useChat() works INSIDE ChatProvider
function DashboardContent() {
  const { addContactsBatch ,setSocket,organizeContacts} = useChat();

 useEffect(() => {
  const LOCAL_CACHE_KEY = 'chat_contacts_state';

  // 1. Initialize socket with auth token
  const socket = initSocket();
  setSocket(socket);

  socket.on('connect', () => {
    console.log('✅ Connected to socket server with ID:', socket.id);

    // Read local cache status
    const rawCache = localStorage.getItem(LOCAL_CACHE_KEY);
    const localData = rawCache ? JSON.parse(rawCache) : null;

    // Check directly if sync is pending
    if (localData?.sync_pending) {
      console.log('🔄 Sync pending found. Syncing local changes to server...');
      
      // Send dirty slice to update server
      socket.emit('update_contact_rows', {
        dirty_slice: localData.dirty_slice,
        contacts_meta: localData.contacts_meta
      });
    } else {
      console.log('📡 No pending sync. Fetching initial data from server...');
      socket.emit('request_initial_data');
    }
  });

  // 2. Response after dirty slice updates successfully on server
  socket.on('update_contact_rows_res', (res) => {
    console.log('✅ Server acknowledged contact row update:', res);
    
    // Remove old cache entirely - initial_data will build fresh cache
    localStorage.removeItem(LOCAL_CACHE_KEY);

    // Now request fresh initial data
    socket.emit('request_initial_data');
  });

  // 3. Receive initial dataset from server
  socket.on('initial_data', (response) => {
    console.log('📦 Initial Data Received from Server:', response);
    
    if (response?.res) {
      const contacts = response.res;
      
     organizeContacts(contacts);

      // Create brand new fresh LocalStorage cache structure
      const freshCache = {
        sync_pending: false,
        dirty_slice: {
          from_rank: 0,
          to_rank: 0
        },
        contacts_meta: contacts.map((c) => ({
          id: c.id,
          rank: c.rank || 0,
          unseen: c.unread || 0
        }))
      };

      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(freshCache));
      console.log('💾 Synced contacts state with LocalStorage');
    }
  });

  // Clean up socket listeners on unmount
  return () => {
    socket.off('connect');
    socket.off('update_contact_rows_res');
    socket.off('initial_data');
    socket.disconnect();
  };
}, []);



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