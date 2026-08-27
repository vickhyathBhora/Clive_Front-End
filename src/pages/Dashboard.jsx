import React, { useEffect } from 'react';
import Contacts from './Contacts';
import Messages from './Messages';
import { TopNav } from './TopNav';
import './Dashboard.css';
import { ChatProvider, useChat } from './ChatContext';
import { initSocket } from './socket';
import { rearrangeRanks } from '../utils/constant';

function DashboardContent() {
  const { setSocket, organizeContacts } = useChat();

  async function fetchOfflineUnseen() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No auth token found in localStorage.');
      return null;
    }
    try {
      const response = await fetch('https://clive-back-end.vercel.app/api/contacts/offline_unseen', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching offline unseen contacts:', error);
      throw error;
    }
  }

  useEffect(() => {
    const LOCAL_CACHE_KEY = 'chat_contacts_state';
    const socket = initSocket();
    setSocket(socket);

    // 1. Unified sync & socket connection logic
    const initFlow = async () => {
      try {
        // Fetch offline unseen rows first
        const response = await fetchOfflineUnseen();
        const offlineContacts = response?.data || [];
        console.log('📥 Offline unseen contacts:', offlineContacts);

        let payloadToSend = null;

        if (offlineContacts.length > 0) {
          // Branch 1: Handle offline updates and re-rank
          const { dirty_slice, slicePayload } = rearrangeRanks(offlineContacts) || {};

          if (slicePayload && slicePayload.length > 0) {
            payloadToSend = {
              dirty_slice,
              contacts_meta: slicePayload
            };
            console.log('🔄 Re-ranked Contacts Payload Ready:', payloadToSend);
          }

        } else {
          // Branch 2: No offline contacts, check local cache dirty slice
          const rawCache = localStorage.getItem(LOCAL_CACHE_KEY);

          if (rawCache) {
            const cache = JSON.parse(rawCache);
            const toRank = Number(cache.dirty_slice?.to_rank || 0);

            if (toRank >= 1) {
              const filteredMeta = (cache.contacts_meta || []).filter((item) => {
                const rank = Number(item.rank);
                return rank >= 1 && rank <= toRank;
              });

              console.log(`📦 Filtered metadata slice (ranks 1 to ${toRank}):`, filteredMeta);

              payloadToSend = {
                dirty_slice: cache.dirty_slice,
                contacts_meta: filteredMeta
              };

              // Clean up old state after pulling slice
              localStorage.removeItem(LOCAL_CACHE_KEY);
            }
          } else {
            console.warn('⚠️ No local cache found to filter ranks.');
          }
        }

        // 2. Decide next socket action
        if (payloadToSend && payloadToSend.contacts_meta?.length > 0) {
          console.log('🔄 Sync pending found. Syncing local changes to server...', payloadToSend);
          socket.emit('update_contact_rows', payloadToSend);
        } else {
          console.log('📡 No pending changes. Requesting initial data from server...');
          socket.emit('request_initial_data');
        }

      } catch (err) {
        console.error('❌ Failed during sync init flow:', err);
        // Fallback: request initial data anyway if offline fetch fails
        socket.emit('request_initial_data');
      }
    };

    const handleConnect = () => {
      console.log('✅ Connected to socket server with ID:', socket.id);
      initFlow();
    };

    // 3. Attach socket listeners
    socket.on('connect', handleConnect);

    socket.on('update_contact_rows_res', (res) => {
      console.log('✅ Server acknowledged contact row update:', res);
      if (res) {
        localStorage.removeItem(LOCAL_CACHE_KEY);
        socket.emit('request_initial_data');
      }
    });

    socket.on('initial_data', (response) => {
      console.log('📦 Initial Data Received from Server:', response);
      if (response?.res) {
        const contacts = response.res;
        organizeContacts(contacts);

        const freshCache = {
          sync_pending: false,
          dirty_slice: { from_rank: 1, to_rank: 0 },
          contacts_meta: contacts.map((c) => ({
            id: String(c.contact_id || c.id),
            rank: Number(c.rank || 0)
          }))
        };

        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(freshCache));
        console.log('💾 Synced contacts state with LocalStorage');
      }
    });

    // 4. Manual trigger if socket connected before listener attachment
    if (socket.connected) {
      handleConnect();
    }

    // 5. Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('update_contact_rows_res');
      socket.off('initial_data');
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