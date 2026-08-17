
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

 const handleChatRes = (response) => {
  console.log('📩 delete_chat_history_res response:', response);

  if (response?.success) {
    // Directly clear active message state
    if (setMessages) {
      setMessages([]);
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
export const initInviteSocketListeners = (
  socket, 
  setContacts, 
  setReqContacts, 
  setSelectedChat, 
  setIsRejecting
) => {
  if (!socket) return () => {};

  const handleInvite = (response) => {
    console.log('📩 Invite socket event received:', response);

    const incomingContact = response?.contact || response;

    if (!incomingContact) return;

    // Prepend new contact
    setContacts((prev) => [incomingContact, ...prev]);
  };

  const handleRejectInviteRes = (response) => {
    console.log('❌ Reject invite response received:', response);

    // Turn off rejecting loading state
    setIsRejecting(false);

  if (response?.success) {
    const targetUserIdToRemove = response?.contactId;

    if (setReqContacts && targetUserIdToRemove) {
      setReqContacts((prev) =>
        prev.filter((item) => {
          // Check item.contact.id or fallback to item.id / item.initiated_by
          const contactUserId = item?.contact?.id || item?.id || item?.initiated_by;
          
          // Keep items that DO NOT match the target contactId
          return contactUserId !== targetUserIdToRemove;
        })
      );
    }

      // Clear the current selected chat
      if (setSelectedChat) {
        setSelectedChat(null);
      }
    }
  };

  // Register listeners
  socket.on('send_invite_res', handleInvite);
  socket.on('new_invite_received', handleInvite);
  socket.on('reject_invite_res', handleRejectInviteRes);

  // Unregister listeners on cleanup
  return () => {
    socket.off('send_invite_res', handleInvite);
    socket.off('new_invite_received', handleInvite);
    socket.off('reject_invite_res', handleRejectInviteRes);
  };
};