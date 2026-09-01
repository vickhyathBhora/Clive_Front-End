// TopNav.jsx
import React, { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment, Tooltip, IconButton, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ChatIcon from '@mui/icons-material/Chat';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import { useChat } from './ChatContext';
import { USER_SEARCH_URL,USERNAME_UPDATE } from '../utils/constant';
import { apiGet } from '../utils/api';
import './TopNav.css';

export function TopNav() {
  const user = JSON.parse(localStorage.getItem('user'));
  const searchTimerRef = useRef(null);
  const { contacts, reqContacts, socket, handleSelectContact } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchLevel, setSearchLevel] = useState(0);
const [isSubmitting, setIsSubmitting] = useState(false);
  // Mobile search state
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  const handleOpenModal = () => {
    setNewName(user?.name || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!newName.trim()) return;

  try {
    // Make API call sending the new name and authorization header
    const response = await fetch(USERNAME_UPDATE, {
      method: 'PUT', // adjust endpoint path and HTTP method according to your backend route
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName.trim() })
    });

    if (response.ok) {
      // 1. Get current user object from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user')) || {};

      // 2. Update local storage with updated user name
      const updatedUser = { ...currentUser, name: newName.trim() };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // 3. Close modal & reset input state
      setIsModalOpen(false);
      setNewName('');
    } else {
      console.error('Failed to update user name');
    }
  } catch (error) {
    console.error('Error updating user name:', error);
  }finally {
    setIsSubmitting(false); // Re-enable button regardless of success or failure
  }
};

  const searchServerDatabase = async (queryText) => {
    try {
      const response = await apiGet(USER_SEARCH_URL(queryText));
      const serverUsers = response?.users || [];

      if (serverUsers.length > 0) {
        setFilteredContacts(serverUsers);
      } else {
        setFilteredContacts([]);
        setSearchLevel(2);
      }
    } catch (err) {
      console.error('Server search failed:', err);
      setFilteredContacts([]);
      setSearchLevel(2);
    }
  };

  const handleInputChange = (e) => {
    const searchText = e.target.value;
    setSearchQuery(searchText);

    const trimmed = searchText.trim().toLowerCase();

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!trimmed) {
      setFilteredContacts([]);
      setSearchLevel(0);
      return;
    }

    const safeContacts = Array.isArray(contacts) ? contacts : [];
    const safeReqContacts = Array.isArray(reqContacts) ? reqContacts : [];

    const allContactsToSearch = [...safeContacts, ...safeReqContacts];

    const localMatches = allContactsToSearch.filter((item) => {
      const contactObj = item?.contact || {};
      const name = (contactObj.name || item.name || '').toLowerCase();
      const email = (contactObj.email || item.email || '').toLowerCase();
      return name.includes(trimmed) || email.includes(trimmed);
    });

    if (localMatches.length > 0) {
      setFilteredContacts(localMatches);
      setSearchLevel(0);
    } else {
      setFilteredContacts([]);

      searchTimerRef.current = setTimeout(async () => {
        setSearchLevel(1);
        await searchServerDatabase(trimmed);
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const handleSelectUser = (userItem) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (searchLevel === 0) {
      handleSelectContact(userItem);
    } else if (searchLevel === 1) {
      socket.emit('send_invite', userItem.id);
    }

    setSearchQuery('');
    setFilteredContacts([]);
    setSearchLevel(0);
    setIsMobileSearchOpen(false);
  };

  return (
    <header className="top-nav-container">
      {/* 1. LEFT: LOGO */}
      <div className={`top-nav-left ${isMobileSearchOpen ? 'mobile-hidden' : ''}`}>
        <div className="top-nav-brand">
          <img
            src="/logo.png"
            alt="ChatLive Logo"
            className="google-chat-logo"
            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
          />
          <span className="top-nav-title">ChatLive</span>
        </div>
      </div>

      {/* 2. CENTER: SEARCH BAR */}
      <div className={`top-nav-center ${isMobileSearchOpen ? 'mobile-expanded' : ''}`}>
        {isMobileSearchOpen && (
          <IconButton
            className="mobile-search-back-btn"
            onClick={() => setIsMobileSearchOpen(false)}
            sx={{ color: '#c4c6d0', mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        <div className="search-input-wrapper">
          <TextField
            fullWidth
            placeholder="Search chat or enter email to invite..."
            value={searchQuery}
            onChange={handleInputChange}
            className="google-search-field"
            slotProps={{
              input: {
                autoComplete: 'off',
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#c4c6d0' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery.trim() ? (
                  <InputAdornment position="end">
                    <Tooltip title={searchLevel === 2 ? 'Send Email Invite' : 'Action'}>
                      <IconButton size="small">
                        <SendIcon sx={{ color: '#a8c7fa', fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ) : null
              }
            }}
          />

          {/* Floating Search Dropdown */}
          {searchQuery.trim().length > 0 && (
            <div className="search-dropdown">
              {filteredContacts.length > 0 ? (
                <div className="dropdown-section">
                  <span className="dropdown-label">
                    {searchLevel === 0 ? 'Contacts' : 'Global Users'}
                  </span>
                  {filteredContacts.map((item, index) => {
                    const contactObj = item?.contact || item;
                    const targetId = contactObj.id || item.contact_id || index;
                    const name = contactObj.name || 'Unknown User';
                    const email = contactObj.email || '';
                    const avatar = contactObj.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

                    return (
                      <div
                        key={targetId}
                        className="dropdown-item"
                        onClick={() => handleSelectUser(item)}
                      >
                        <img src={avatar} alt={name} className="dropdown-avatar" />
                        <div className="dropdown-info">
                          <span className="dropdown-name">{name}</span>
                          <span className="dropdown-email">{email}</span>
                        </div>
                        {searchLevel === 0 ? (
                          <ChatIcon sx={{ color: '#a8c7fa', fontSize: 18, marginLeft: 'auto' }} />
                        ) : (
                          <PersonAddIcon sx={{ color: '#34d399', fontSize: 18, marginLeft: 'auto' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : searchLevel === 2 ? (
                <div className="invite-wrapper">
                  <div className="dropdown-item invite-action" style={{ cursor: 'default' }}>
                    <div className="dropdown-info">
                      <span className="dropdown-name" style={{ color: '#8e918f' }}>
                        No user found
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT: SETTINGS & AVATAR */}
      <div className={`top-nav-right ${isMobileSearchOpen ? 'mobile-hidden' : ''}`}>
        <IconButton
          className="mobile-search-trigger-btn"
          onClick={() => setIsMobileSearchOpen(true)}
          sx={{ color: '#c4c6d0' }}
        >
          <SearchIcon />
        </IconButton>

        <Tooltip title="Logout">
          <IconButton
            className="nav-icon-btn logout"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/Portfolio';
            }}
            sx={{ color: '#c4c6d0' }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>

        <Avatar
          onClick={handleOpenModal}
          src={user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=currentUser'}
          alt={user?.name || 'Profile'}
          className="top-nav-avatar clickable-avatar"
          slotProps={{
            img: { referrerPolicy: 'no-referrer' }
          }}
        />
      </div>

      {/* 4. MODAL OVERLAY */}
      {isModalOpen && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-card">
            <h2 className="profile-modal-title">Update Name</h2>

            <form onSubmit={handleSubmit} className="profile-modal-form">
              <div className="profile-input-group">
                <label className="profile-input-label">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new name"
                  className="profile-modal-input"
                  autoFocus
                />
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="profile-btn profile-btn-cancel"
                >
                  Cancel
                </button>
             <button
  type="submit"
  disabled={isSubmitting || !newName.trim()}
  className={`profile-btn profile-btn-submit ${isSubmitting ? 'disabled' : ''}`}
>
  {isSubmitting ? 'Updating...' : 'Submit'}
</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}