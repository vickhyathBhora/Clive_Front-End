// TopNav.jsx
import React, { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment, Tooltip, IconButton, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // UI CHANGE: Added back icon for mobile search state
import { useChat } from './ChatContext';
import { USER_SEARCH_URL } from '../utils/constant';
import { apiGet } from '../utils/api';
import './TopNav.css';
import { validateEmail } from '../utils/validation';

export function TopNav() {
  const user = JSON.parse(localStorage.getItem('user'));
  const searchTimerRef = useRef(null);
  const { contacts, reqContacts, socket, setSelectedChat } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchLevel, setSearchLevel] = useState(0);
  const [emailError, setEmailError] = useState('');
  
  // UI CHANGE: Track mobile overlay state for compact screens
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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
      console.log('Opening chat with contact:', userItem);
      setSelectedChat(userItem.contact.id);
    } else if (searchLevel === 1) {
      console.log('Sending connection request to user:', userItem);
      socket.emit('send_invite', userItem.id);
    }

    setSearchQuery('');
    setFilteredContacts([]);
    setSearchLevel(0);
    setIsMobileSearchOpen(false); // UI CHANGE: Close mobile view after selection
  };

  return (
    <header className="top-nav-container">
      {/* 1. LEFT: LOGO */}
      <div className={`top-nav-left ${isMobileSearchOpen ? 'mobile-hidden' : ''}`}>
        <div className="top-nav-brand">
          <svg className="google-chat-logo" viewBox="0 0 24 24" width="28" height="28">
            <path fill="#00AC47" d="M12 2C6.48 2 2 6.48 2 12c0 2.17.69 4.19 1.87 5.84L2 22l4.34-1.74C7.94 21.36 9.89 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
          </svg>
          <span className="top-nav-title">ChatLive</span>
        </div>
      </div>

      {/* 2. CENTER: SEARCH BAR */}
      <div className={`top-nav-center ${isMobileSearchOpen ? 'mobile-expanded' : ''}`}>
        {/* UI CHANGE: Mobile Back Arrow button to close open search bar */}
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
                    <Tooltip title={searchLevel === 2 ? "Send Email Invite" : "Action"}>
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
        {/* UI CHANGE: Added standalone mobile toggle search button */}
        <IconButton 
          className="mobile-search-trigger-btn"
          onClick={() => setIsMobileSearchOpen(true)}
          sx={{ color: '#c4c6d0' }}
        >
          <SearchIcon />
        </IconButton>

        <Tooltip title="Settings">
          <IconButton className="nav-icon-btn" sx={{ color: '#c4c6d0' }}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Avatar
          src={user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=currentUser'}
          alt={user?.name || 'Profile'}
          className="top-nav-avatar"
          slotProps={{
            img: { referrerPolicy: 'no-referrer' }
          }}
        />
      </div>
    </header>
  );
}