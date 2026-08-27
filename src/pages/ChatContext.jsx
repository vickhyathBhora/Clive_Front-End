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
  const organizeContacts = (allContacts) => {
    const required = allContacts.filter((contact) => contact.rank === 0);
    const remaining = allContacts.filter((contact) => contact.rank !== 0);

    setReqContacts(required);
    setContacts(remaining);
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
        organizeContacts
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