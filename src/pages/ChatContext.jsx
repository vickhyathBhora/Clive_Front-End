// ChatContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

import { initContactsSocketListeners, initMessagesSocketListeners, initInviteSocketListeners } from './socketListener'
const ChatContext = createContext(null);

export const ChatProvider = ({ children } = {}) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [reqContacts, setReqContacts] = useState([]);

  // 2. Function to organize contacts based on rank
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
    }
  };

  useEffect(() => {
    if (!socket) return;

    // 1. Contact operation listeners (delete contact, clear chat history)
    const cleanupContacts = initContactsSocketListeners(socket, setContacts, setMessages);

    // 2. Message operation listeners (fetch/receive messages)
    const cleanupMessages = initMessagesSocketListeners(socket, setMessages, setContacts, selectedChat);

    // 3. Invite operation listeners (send, accept, reject invites)
    const cleanupInvites = initInviteSocketListeners(
      socket,
      setContacts,
      setReqContacts,
      setSelectedChat,
      setIsRejecting,
      setMessages,
      setIsAccepting
    );

    // Cleanup all listeners on unmount or socket change
    return () => {
      cleanupContacts();
      cleanupMessages();
      cleanupInvites();
    };
  }, [socket, selectedChat]);

  return (
    <ChatContext.Provider
      value={{
        isAccepting,
        setIsAccepting,
        isRejecting,
        setIsRejecting,
        socket,
        setSocket,
        contacts,
        setContacts,
        reqContacts,
        setReqContacts,
        messages,
        setMessages,
        selectedChat,
        setSelectedChat,
        handleSelectContact
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};