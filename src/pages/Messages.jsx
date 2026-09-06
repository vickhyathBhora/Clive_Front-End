// Messages.js
import React, { useEffect, useState, useRef } from 'react';
import { useChat } from './ChatContext';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // CHANGED: Imported back icon
import './Messages.css';

export const Messages = () => {
  const {
    messages,
    setMessages,
    selectedChat,
    setSelectedChat, // CHANGED: Added setSelectedChat from context
    socket,
    user,
    isAccepting,
    setIsAccepting,
    isRejecting,
    showNewMsg,SenderContact
  } = useChat();

  const messagesEndRef = useRef(null);

  const contactId = selectedChat?.contact_id;
  const targetUserId = selectedChat?.contact?.id;
  const contactName = selectedChat?.contact?.name || selectedChat?.name || 'User';
  const chatStatus = selectedChat?.status;

  const [textInput, setTextInput] = useState('');
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = storedUser?.id || user?.id || socket?.user?.id || socket?.userId;
  const receiverId = selectedChat?.contact?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    const trimmedText = textInput.trim();
    if (!trimmedText) return;

    socket.emit('send_message', {
      sender_id: currentUserId,
      receiver_id: receiverId,
      contact_id: contactId,
      content: trimmedText,
    });

    setTextInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAccept = () => {
    if (isAccepting || isRejecting || !targetUserId) return;
    setIsAccepting(true);
    socket.emit('accept_invite', { targetUserId: targetUserId });
  };

  useEffect(() => {
    if (!selectedChat?.contact_id || !socket) return;

    setMessages([]);

    if (chatStatus === 'accepted') {
      socket.emit('get_messages', { contactId: contactId });
    }
  }, [contactId, chatStatus, socket, setMessages]);

  if (!selectedChat) {
    return <div className="no-chat">Select a contact to start messaging</div>;
  }

  // Handle Pending Status
  if (chatStatus === 'pending') {
    const isSentByMe = String(selectedChat.initiated_by) === String(currentUserId);

    if (isSentByMe) {
      return (
        <div className="pending-container" style={{ padding: '20px', color: '#fff' }}>
          {/* CHANGED: Mobile back button for pending sent view */}
          <IconButton 
            className="mobile-back-btn" 
            onClick={() => setSelectedChat(null)}
            style={{ color: '#fff', marginBottom: '10px' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <h3>Waiting for Response</h3>
          <p>Invitation sent to <strong>{contactName}</strong>. Waiting for them to accept.</p>
        </div>
      );
    }

    return (
      <div className="pending-container" style={{ padding: '20px', color: '#fff' }}>
        {/* CHANGED: Mobile back button for pending received view */}
        <IconButton 
          className="mobile-back-btn" 
          onClick={() => setSelectedChat(null)}
          style={{ color: '#fff', marginBottom: '10px' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <h3>Connection Request</h3>
        <p><strong>{contactName}</strong> sent you a connection request.</p>
        <div className="action-buttons" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button
            style={{
              padding: '8px 16px',
              background: isAccepting || isRejecting ? '#86efac' : '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isAccepting || isRejecting ? 'not-allowed' : 'pointer',
              opacity: isAccepting || isRejecting ? 0.7 : 1,
            }}
            disabled={isAccepting || isRejecting}
            onClick={handleAccept}
          >
            {isAccepting ? 'Accepting...' : 'Accept'}
          </button>
        </div>
      </div>
    );
  }

  const messageList = Array.isArray(messages) ? messages : [];

  return (
    <div className="messages-container">
      {showNewMsg && SenderContact && (
  <div className="new-message-toast">
    <div className="toast-avatar-wrapper">
      <img
        src={SenderContact.avatar_url || '/default-avatar.png'}
        alt={SenderContact.name || 'User'}
        className="toast-avatar"
      />
      <span className="toast-online-badge"></span>
    </div>

    <div className="toast-content">
      <div className="toast-header">
        <span className="toast-name">{SenderContact.name || 'New Message'}</span>
        <span className="toast-label">Now</span>
      </div>
      <p className="toast-message">
        {SenderContact.content || 'Sent you a new message'}
      </p>
    </div>
  </div>
)}
      <div className="messages-header" style={{ display: 'flex', alignItems: 'center' }}>
        {/* CHANGED: Added Back Button for Mobile view */}
        <IconButton 
          className="mobile-back-btn" 
          onClick={() => setSelectedChat(null)}
          style={{ color: '#fff', marginRight: '8px' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <h3 style={{ margin: 0 }}>Chat with {contactName}</h3>
      </div>

      <div className="messages-list">
        {messageList.map((msg, index) => {
          const isMyMessage = String(msg.sender_id) === String(currentUserId);
          return (
            <div
              key={msg.id || index}
              className={`message-wrapper ${isMyMessage ? 'sent' : 'received'}`}
            >
              <div className="message-bubble">
                <span className="text">{msg.content}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <Box className="chat-input-wrapper">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          multiline              
          maxRows={4}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="chat-input-field"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end" sx={{ alignSelf: 'center', margin: 0 }}>
  <IconButton onClick={handleSend} className="chat-send-btn">
    <SendIcon />
  </IconButton>
</InputAdornment>
              ),
            },
          }}
        />
      </Box>
    </div>
  );
  
};

export default Messages;