import React, { useEffect } from 'react';
import Contacts from './Contacts';
import Messages from './Messages';
import { TopNav } from './TopNav';
import './Dashboard.css';
import { ChatProvider, useChat} from './ChatContext';
import { initSocket } from './socket';
import { organizeContacts, rearrangeRanks } from 'vickycliveimpfunsquarys';

function DashboardContent() {
  const { setSocket, selectedChat ,setReqContacts,
setContacts} = useChat();

  async function fetchOfflineUnseen() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No auth token found in localStorage.');
      return null;
    }
    try {
      const response = await fetch('https://cliveback-end-production.up.railway.app/api/contacts/offline_unseen', {
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

    const initFlow = async () => {
      try {
        const response = await fetchOfflineUnseen();
        const offlineContacts = response?.data || [];

        let payloadToSend = null;

        if (offlineContacts.length > 0) {
          const { dirty_slice, slicePayload } = rearrangeRanks(offlineContacts) || {};

          if (slicePayload && slicePayload.length > 0) {
            payloadToSend = {
              dirty_slice,
              contacts_meta: slicePayload
            };
          }

        } else {
          const rawCache = localStorage.getItem(LOCAL_CACHE_KEY);

          if (rawCache) {
            const cache = JSON.parse(rawCache);
            const toRank = Number(cache.dirty_slice?.to_rank || 0);

            if (toRank >= 1) {
              const filteredMeta = (cache.contacts_meta || []).filter((item) => {
                const rank = Number(item.rank);
                return rank >0 && rank <= toRank;
              });
console.log(filteredMeta);
              payloadToSend = {
                dirty_slice: cache.dirty_slice,
                contacts_meta: filteredMeta
              };

              localStorage.removeItem(LOCAL_CACHE_KEY);
            }
          }
        }

        if (payloadToSend && payloadToSend.contacts_meta?.length > 0) {
          socket.emit('update_contact_rows', payloadToSend);
        } else {
          socket.emit('request_initial_data');
        }

      } catch (err) {
        console.error('❌ Failed during sync init flow:', err);
        socket.emit('request_initial_data');
      }
    };

    const handleConnect = () => {
      initFlow();
    };

    socket.on('connect', handleConnect);

    socket.on('update_contact_rows_res', (res) => {
      if (res) {
        localStorage.removeItem(LOCAL_CACHE_KEY);
        socket.emit('request_initial_data');
      }
    });

    socket.on('initial_data', (response) => {
      if (response?.res) {
        const contacts = response.res;
        const c= organizeContacts(contacts);
setReqContacts(c.required);
setContacts(c.remaining);
        const freshCache = {
          sync_pending: false,
          dirty_slice: { from_rank: 1, to_rank: 0 },
          contacts_meta: contacts.map((c) => ({
            id: String(c.contact_id),
            rank: Number(c.rank) === -1 ? 0 : Number(c.rank || 0)
          }))
        };

        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(freshCache));
      }
    });

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('update_contact_rows_res');
      socket.off('initial_data');
    };
  }, []);

  const isChatActive = Boolean(
    selectedChat && 
    (selectedChat.id || selectedChat._id || selectedChat.contact_id || Object.keys(selectedChat).length > 0)
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-topnav">
        <TopNav />
      </header>

      <div className={`dashboard-body ${isChatActive ? 'has-active-chat' : ''}`}>
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

export function Dashboard() {
  return (
    <ChatProvider>
      <DashboardContent />
    </ChatProvider>
  );
}