// Contacts.jsx
import React, { useState, useEffect } from 'react';
import {
  IconButton,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { useChat } from './ChatContext';
import './Contacts.css';
import { initContactsSocketListeners } from './socketListener';

const Contacts = () => {
  // Track active menu state: { id: targetId, anchorEl: HTMLElement }
  const [activeMenu, setActiveMenu] = useState(null);

  // Access contacts, setContacts, activeChat setter, and socket from ChatContext
  const {
    contacts = [],
    setContacts,
    socket,
    setActiveChat,
    setSelectedChat,
    reqContacts = [],
    setReqContacts,
  } = useChat();

  const [showRequests, setShowRequests] = useState(false);

  // Dynamically compute the active list
  const currentList = showRequests ? reqContacts : contacts;

  // 🎯 Attach socket listeners on mount or socket update
  useEffect(() => {
    if (!socket) return;

    // Initialize listeners and pass state updater
    const cleanup = initContactsSocketListeners(socket, setContacts);

    return () => {
      cleanup();
    };
  }, [socket, setContacts]);

  // 5. Select active chat
  const handleSelectContact = (item) => {
    console.log(item);
    setSelectedChat(item);
  };

  const handleToggleView = () => {
    setShowRequests((prev) => !prev);
  };

  return (
    <div className="contacts-container">
      <div
        className="contacts-header"
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3>{showRequests ? 'Contact Requests' : 'Contacts'}</h3>
        <button className="toggle-contacts-btn" onClick={handleToggleView}>
          {showRequests
            ? `Show Contacts (${contacts.length})`
            : `Show Requests (${reqContacts.length})`}
        </button>
      </div>

      {currentList && currentList.length > 0 ? (
        <div className="contacts-list">
          {currentList.map((item, index) => {
            const contactObj = item.contact || {};
            const targetId = contactObj.id || item.contact_id || index;
            const name = contactObj.name || 'Unknown User';
            const email = contactObj.email || '';
            const avatar =
              contactObj.avatar_url ||
              'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

            const isMenuOpen = activeMenu?.id === targetId;

            return (
              <div
                key={targetId}
                className="contact-item"
                onClick={() => handleSelectContact(item)}
              >
                <div className="contact-card">
                  <img src={avatar} alt={name} className="contact-avatar" />
                  <div className="contact-info">
                    <h4 className="contact-name">{name}</h4>
                    {email && <p className="contact-email">{email}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: '#94a3b8', padding: '16px', textAlign: 'center' }}>
          {showRequests
            ? 'No contact requests available.'
            : 'No contacts available.'}
        </p>
      )}
    </div>
  );
};

export default Contacts;