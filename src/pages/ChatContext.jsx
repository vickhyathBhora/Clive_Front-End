// ChatContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext(null);

export const ChatProvider = ({ children } = {}) => {
  const [socket, setSocket] = useState(null);
  const [messages,setMessages]=useState([]);
  const [selectedChat,setSelectedChat]=useState();
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

  return (
    <ChatContext.Provider
      value={{
        isAccepting, setIsAccepting,
        isRejecting, setIsRejecting,
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