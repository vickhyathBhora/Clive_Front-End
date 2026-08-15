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
  const [deletingId, setDeletingId] = useState(null);

  // Track active menu state: { id: targetId, anchorEl: HTMLElement }
  const [activeMenu, setActiveMenu] = useState(null);

  // Access contacts, setContacts, activeChat setter, and socket from ChatContext
  const { contacts, setContacts, socket, setActiveChat, setSelectedChat} = useChat();

  // 🎯 Attach socket listeners on mount or socket update
  useEffect(() => {
    if (!socket) return;

    // Initialize listeners and pass state updater
    const cleanup = initContactsSocketListeners(socket, setContacts);

    return () => {
      cleanup();
    };
  }, [socket, setContacts]);

  // 1. Unified Handler for Deletion
  const handleDeleteOption = async (targetId, actionType) => {
    console.log(`Action: ${actionType} for Target ID: ${targetId}`);
    setDeletingId(targetId);

    try {
      if (actionType === 'chat') {
        if (socket) {
          socket.emit('delete_chat_history', { targetId });
        }
      } else if (actionType === 'contact') {
        if (socket) {
          socket.emit('delete_contact', { targetId });
        }
      }
    } catch (error) {
      console.error('Failed to perform deletion:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // 2. Open menu for specific contact row
  const handleOpenMenu = (event, targetId) => {
    event.stopPropagation();
    setActiveMenu({ id: targetId, anchorEl: event.currentTarget });
  };

  // 3. Close menu
  const handleCloseMenu = (event) => {
    if (event) event.stopPropagation();
    setActiveMenu(null);
  };

  // 4. Handle menu option choice
  const handleSelectOption = (event, targetId, actionType) => {
    event.stopPropagation();
    handleCloseMenu(event);
    handleDeleteOption(targetId, actionType);
  };

  // 5. Select active chat
  const handleSelectContact = (item) => {
  console.log(item);
  setSelectedChat(item);
  };

  return (
    <div className="contacts-container">
      {contacts && contacts.length > 0 ? (
        <div className="contacts-list">
          {contacts.map((item, index) => {
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

                <div>
                  {/* Delete Trigger Button */}
                  <IconButton
                    color="error"
                    aria-label="delete options"
                    onClick={(e) => handleOpenMenu(e, targetId)}
                    disabled={deletingId === targetId}
                  >
                    {deletingId === targetId ? (
                      <CircularProgress size={24} color="error" />
                    ) : (
                      <DeleteIcon />
                    )}
                  </IconButton>

                  {/* Delete Options Menu */}
                  <Menu
                    anchorEl={activeMenu?.anchorEl}
                    open={isMenuOpen}
                    onClose={handleCloseMenu}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MenuItem
                      onClick={(e) => handleSelectOption(e, targetId, 'chat')}
                    >
                      <ListItemIcon>
                        <ChatIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText primary="Delete Chat" />
                    </MenuItem>

                    <MenuItem
                      onClick={(e) => handleSelectOption(e, targetId, 'contact')}
                    >
                      <ListItemIcon>
                        <PersonRemoveIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText primary="Delete Contact" />
                    </MenuItem>
                  </Menu>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: '#94a3b8', padding: '16px', textAlign: 'center' }}>
          No contacts available.
        </p>
      )}
    </div>
  );
};

export default Contacts;