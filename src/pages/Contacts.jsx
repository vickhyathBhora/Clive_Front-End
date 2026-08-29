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

const Contacts = () => {
  // Track active menu state: { id: targetId, anchorEl: HTMLElement }
  const [activeMenu, setActiveMenu] = useState(null);

  // Access contacts, setContacts, activeChat setter, and socket from ChatContext
  const {
    contacts = [],
    setContacts,
    socket,

    setSelectedChat,
    reqContacts = [],

  } = useChat();

  const [showRequests, setShowRequests] = useState(false);

  // Dynamically compute the active list
  const currentList = showRequests ? reqContacts : contacts;
 
  const handleSelectContact = (item) => {
    if (!item) return;

    const contactId = String(item.contact_id);

    // 1. Set Selected Chat
    setSelectedChat(item);
    // 2. Clear unseen badge in React state UI
    if (typeof setContacts === 'function') {
      setContacts((prevContacts) =>
        (prevContacts || []).map((c) => {
          const currentCId = String(c.contact_id);
          if (currentCId === contactId) {
            return { ...c, unseen: 0 };
          }
          return c;
        })
      );
    }

    // 3. Emit socket event to reset unseen in DB
    if (socket &&Number(item.rank)!==0) {
     
      socket.emit('update_unseen', { contact_id: contactId });
      console.log(`⚡ [FRONTEND] Emitted update_unseen for contact_id: ${contactId}`);
    }
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
            const unseend = Number(item.unseen);
            const avatar =
              contactObj.avatar_url ||
              'https://api.dicebear.com/7.x/avataaars/svg?seed=default';


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
                  {unseend > 0 && (
                    <div className="unseen-badge">
                      {unseend > 99 ? '99+' : unseend}
                    </div>
                  )}
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