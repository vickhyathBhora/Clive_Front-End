// ChatContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext(null);

export const ChatProvider = ({ children } = {}) => {
  const [contacts, setContacts] = useState([]);
  const [socket, setSocket] = useState(null);
  const [messages,setMessages]=useState([]);
  const [selectedChat,setSelectedChat]=useState();

  /**
   * Appends newly fetched contacts batch to state.
   */
  const addContactsBatch = useCallback((incomingData) => {
    const newBatch = Array.isArray(incomingData)
      ? incomingData
      : incomingData?.res || [];

    if (!Array.isArray(newBatch) || newBatch.length === 0) return;

    setContacts((prev) => {
      if (prev.length === 0) return newBatch;

      const existingIds = new Set(
        prev.map((item) => item.contact?.id || item.contact_id || item.id)
      );

      const filteredNew = newBatch.filter((item) => {
        const id = item.contact?.id || item.contact_id || item.id;
        return id && !existingIds.has(id);
      });

      return [...prev, ...filteredNew];
    });
  }, []);

  /**
   * Moves a contact to the end of the contacts list by target ID
   */
  const moveContactToLast = useCallback((targetId) => {
    setContacts((prev) => {
      const index = prev.findIndex((item) => {
        const id = item.contact?.id || item.contact_id || item.id;
        return String(id) === String(targetId);
      });

      if (index === -1 || index === prev.length - 1) return prev;

      const updated = [...prev];
      const [movedItem] = updated.splice(index, 1);
      // Empty messages array when pushed to last
      movedItem.messages = [];
      updated.push(movedItem);

      return updated;
    });
  }, []);

  const moveContactToIndex = useCallback((fromIndex, toIndex) => {
    setContacts((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }

      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);

      return updated;
    });
  }, []);

  const moveContactByUserId = useCallback((contactUserId, targetIndex = 0) => {
    setContacts((prev) => {
      const currentIndex = prev.findIndex(
        (item) => (item.contact?.id || item.contact_id || item.id) === contactUserId
      );

      if (currentIndex === -1 || currentIndex === targetIndex) return prev;

      const updated = [...prev];
      const [movedItem] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, movedItem);

      return updated;
    });
  }, []);

  const clearAllData = useCallback(() => {
    setContacts([]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        socket,
        setSocket,
        contacts,
        setContacts,
        messages,
        setMessages,
        selectedChat,
        setSelectedChat,
        addContactsBatch,
        moveContactToLast,
        moveContactToIndex,
        moveContactByUserId,
        clearAllData,
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