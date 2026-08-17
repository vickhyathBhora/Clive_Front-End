import React, { useEffect } from 'react';
import { useChat } from './ChatContext';
import { initMessagesSocketListeners } from './socketListener';

export const Messages = () => {
  const { messages, setMessages, selectedChat, socket, user , isAccepting,setIsAccepting, setIsRejecting,isRejecting} = useChat();



const handleAccept = () => {
  if (isAccepting || isRejecting || !selectedChat?.contact.id) return;

  setIsAccepting(true);
  socket.emit('accept_invite', { contactId: selectedChat.contact.id });
};

const handleReject = () => {
  if (isAccepting || isRejecting || !selectedChat?.contact.id) return;

  setIsRejecting(true);
  socket.emit('reject_invite', { contactId: selectedChat.contact.id });
};


  // 1. Get current logged-in user ID
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = storedUser?.id || user?.id || socket?.user?.id || socket?.userId;

  // 2. Extract target user details based on your exact object structure
  const targetUserId = selectedChat?.contact?.id;
  const contactName = selectedChat?.contact?.name || 'User';
  const chatStatus = selectedChat?.status;

  // 3. Fetch messages when selectedChat changes
  useEffect(() => {
    if (!selectedChat || !socket || !targetUserId) return;

    console.log('[Chat UI] Selected targetUserId:', targetUserId);
    setMessages([]);

    if (chatStatus === 'accepted') {
      // Pass both selectedChat object and targetUserId directly
      socket.emit('get_messages', { selectedChat, targetUserId });
    }
  }, [selectedChat, targetUserId, chatStatus, socket, setMessages]);

  // 4. Register socket listener for get_messages_res
  useEffect(() => {
    if (!socket) return;

    const cleanup = initMessagesSocketListeners(socket, setMessages);
    return () => cleanup();
  }, [socket, setMessages]);

  // 5. Check if chat is selected
  if (!selectedChat) {
    return <div className="no-chat">Select a contact to start messaging</div>;
  }

  // 6. Handle Pending Status
  if (chatStatus === 'pending') {
    const isSentByMe = String(selectedChat.reqsentby) === String(currentUserId);

    if (isSentByMe) {
      return (
        <div className="pending-container" style={{ padding: '20px', color: '#fff' }}>
          <h3>Waiting for Response</h3>
          <p>Invitation sent to <strong>{contactName}</strong>. Waiting for them to accept.</p>
        </div>
      );
    }

    return (
      <div className="pending-container" style={{ padding: '20px', color: '#fff' }}>
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
    opacity: isAccepting || isRejecting ? 0.7 : 1
  }}
  disabled={isAccepting || isRejecting}
  onClick={handleAccept}
>
  {isAccepting ? 'Accepting...' : 'Accept'}
</button>

<button 
  style={{ 
    padding: '8px 16px', 
    background: isAccepting || isRejecting ? '#fca5a5' : '#ef4444', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: isAccepting || isRejecting ? 'not-allowed' : 'pointer',
    opacity: isAccepting || isRejecting ? 0.7 : 1
  }}
  disabled={isAccepting || isRejecting}
  onClick={handleReject}
>
  {isRejecting ? 'Rejecting...' : 'Reject'}
</button>
        </div>
      </div>
    );
  }

  // 7. Render Chat View (Accepted Status)
  return (
    <div className="messages-container">
      <h3>Chat with {contactName}</h3>
      <div className="messages-list">
        {messages.map((msg, index) => (
          <div key={msg.id || index} className="message-item">
            <span className="sender">{msg.sender_id}: </span>
            <span className="text">{msg.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Messages;