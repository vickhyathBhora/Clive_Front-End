// socketListener.js

/**
 * Initializes socket listeners for contact-related operations (delete contact, clear history).
 * @param {Object} socket - Active Socket.io instance
 * @param {Function} setContacts - State setter function for contacts list
 */
export const initContactsSocketListeners = (socket, setContacts) => {
  if (!socket) return () => {};

  // 1. Handle delete contact response -> REMOVE ENTIRELY FROM ARRAY
  const handleContactRes = (response) => {
    console.log('📩 delete_contact_res response:', response);

    if (response?.success) {
      if (setContacts) {
        setContacts((prevContacts) =>
          prevContacts.filter((item) => {
            const id = item.contact?.id || item.contact_id || item.id;
            return String(id) !== String(response.targetId);
          })
        );
      }
    } else {
      console.error('Delete contact failed:', response?.message);
    }
  };

  // 2. Handle delete chat response -> CLEAR MESSAGES & MOVE TO LAST POSITION
  const handleChatRes = (response) => {
    console.log('📩 delete_chat_history_res response:', response);

    if (response?.success) {
      if (setContacts) {
        setContacts((prevContacts) => {
          const targetId = response.targetId;
          const targetIndex = prevContacts.findIndex((item) => {
            const id = item.contact?.id || item.contact_id || item.id;
            return String(id) === String(targetId);
          });

          // If target contact isn't found, keep array unchanged
          if (targetIndex === -1) return prevContacts;

          const updated = [...prevContacts];
          const [targetContact] = updated.splice(targetIndex, 1);

          // Clear messages and push to the end of the array
          targetContact.messages = [];
          updated.push(targetContact);

          return updated;
        });
      }
    } else {
      console.error('Delete chat history failed:', response?.message);
    }
  };

  // Register contact listeners
  socket.on('delete_contact_res', handleContactRes);
  socket.on('delete_chat_history_res', handleChatRes);

  // Return cleanup function to unregister listeners
  return () => {
    socket.off('delete_contact_res', handleContactRes);
    socket.off('delete_chat_history_res', handleChatRes);
  };
};

/**
 * Initializes socket listeners for message operations (fetching chat history, receiving messages).
 * @param {Object} socket - Active Socket.io instance
 * @param {Function} setMessages - State setter function for messages list
 */
export const initMessagesSocketListeners = (socket, setMessages) => {
  if (!socket) return () => {};

  // Handle incoming messages response for selected chat
  const handleGetMessagesRes = (response) => {
    console.log('📩 get_messages_res response:', response);

    if (response?.success) {
      if (setMessages) {
        setMessages(response.messages || response.data || []);
      }
    } else {
      console.error('Get messages failed:', response?.message);
    }
  };

  // Register message listeners
  socket.on('get_messages_res', handleGetMessagesRes);

  // Return cleanup function to unregister listeners
  return () => {
    socket.off('get_messages_res', handleGetMessagesRes);
  };
};
/**
 * Socket listener for TopNav to handle invite responses and new incoming invites.
 * 
 * @param {Object} socket - Active Socket.io instance
 * @param {Function} setContacts - React setContacts state dispatcher
 * @returns {Function} Cleanup function
 */
export const initInviteSocketListeners = (socket, setContacts) => {
 
  if (!socket) return () => {};

  const handleInvite = (response) => {
    console.log('📩 Invite socket event received:', response);

    // Extract the contact object (handles both wrapped { success, contact } and direct object)
    const incomingContact = response?.contact || response;

    if (!incomingContact) return;

    // Set contacts to [z, a, b, c, d, e] (new contact prepended at index 0)
    setContacts((prev) => [incomingContact, ...prev]);
  };

  // Register listeners
  socket.on('send_invite_res', handleInvite);
  socket.on('new_invite_received', handleInvite);

  // Unregister listeners on cleanup
  return () => {
    socket.off('send_invite_res', handleInvite);
    socket.off('new_invite_received', handleInvite);
  };
};