/**
 * Initializes socket listeners for contact-related operations (delete contact, clear history).
 * @param {Object} socket - Active Socket.io instance
 * @param {Function} setContacts - State setter function for contacts list
 * @param {Function} setMessages - State setter function for active messages
 */
export const initContactsSocketListeners = (socket, setContacts, setMessages) => {
  if (!socket) return () => { };

  // 1. Handle delete contact response -> REMOVE ENTIRELY FROM ARRAY
  const handleContactRes = (response) => {

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

  // 2. Handle delete chat history response
  const handleChatRes = (response) => {

    if (response?.success) {
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
export const initMessagesSocketListeners = (socket, setMessages, setContacts, selectedChat) => {
  if (!socket) return () => { };

  // Handle incoming messages response for selected chat
  const handleGetMessagesRes = (response) => {
   

    if (response?.success) {
      if (setMessages) {
        setMessages(response.messages || response.data || []);
      }
    } else {
      console.error('Get messages failed:', response?.message);
    }
  };

  const handleSendMessageRes = (response) => {


    if (!response?.success || !response?.data) {
      console.error('❌ [FRONTEND] Send message failed or response missing data:', response?.message);
      return;
    }

    const newMessage = response.data;
    const targetId = String(newMessage.contact_id);


    // 1. Update Messages Array (Push to end, max 10 items)
    if (setMessages) {
      setMessages((prevMessages) => {
        const updated = [...prevMessages, newMessage];
        if (updated.length > 20) {
          updated.shift(); // Remove oldest message
        }
        return updated;
      });
    } else {
      console.warn('⚠️ [FRONTEND] setMessages is undefined inside handleSendMessageRes!');
    }

    // 2. Update Contacts UI State (If rank > 1)
    if (setContacts) {
      setContacts((prevContacts) => {
        const targetIndex = prevContacts.findIndex(
          (c) => String(c.contact_id) === targetId
        );

        if (targetIndex > 0) {
          const updatedContacts = [...prevContacts];
          const [targetContact] = updatedContacts.splice(targetIndex, 1);

          targetContact.rank = 1;
          updatedContacts.unshift(targetContact);

          for (let i = 1; i <= targetIndex; i++) {
            updatedContacts[i].rank = Number(updatedContacts[i].rank) + 1;
          }

          return updatedContacts;
        }

        return prevContacts;
      });
    } else {
    }

    // 3. Update Local Storage Cache
    const cacheRaw = localStorage.getItem('chat_contacts_state');
    if (cacheRaw) {
      const cache = JSON.parse(cacheRaw);
      const targetMeta = cache.contacts_meta?.find(
        (item) => String(item.id) === targetId
      );

      if (targetMeta && Number(targetMeta.rank) > 1) {
        const oldRank = Number(targetMeta.rank);

        cache.contacts_meta.forEach((item) => {
          const itemRank = Number(item.rank);

          if (String(item.id) === targetId) {
            item.rank = 1;
          } else if (itemRank >= 1 && itemRank < oldRank) {
            item.rank = itemRank + 1;
          }
        });
        const existingToRank = Number(cache.dirty_slice?.to_rank || 0);
        const highestToRank = Math.max(existingToRank, oldRank);

        cache.sync_pending = true;
        cache.dirty_slice = {
          from_rank: 1,
          to_rank: highestToRank,
        };

        localStorage.setItem('chat_contacts_state', JSON.stringify(cache));
      } else {
      }
    } else {
    }
  };

  const handleNewMessage = (response) => {

    if (!response?.success || !response?.data) {
      console.warn('⚠️ [FRONTEND] Invalid or unsuccessful new_message payload structure:', response);
      return;
    }

    const newMessage = response.data;
    const targetId = String(newMessage.contact_id);
 
    // Direct state evaluation (No .current)
    const isActiveChat =
      selectedChat &&
      String(selectedChat.contact_id) === targetId;


    // 1. Web Push Notification (Only for background chats)
    if (!isActiveChat && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`New message from ${newMessage.sender_name || 'Contact'}`, {
        body: newMessage.content,
        icon: newMessage.sender_avatar || '/default-avatar.png',
      });
    } else if (!isActiveChat) {
    }

    // 2. Append to Active Messages State (Max 10)
    if (isActiveChat && setMessages) {
      setMessages((prevMessages) => {
        const updated = [...prevMessages, newMessage];
        if (updated.length > 10) {
          updated.shift();
        }
        return updated;
      });
    } else if (isActiveChat && !setMessages) {
      console.warn('⚠️ [FRONTEND] Chat is active but setMessages function is missing!');
    }

    // 3. ONLY execute state & cache shift logic if message belongs to a BACKGROUND chat!
    if (!isActiveChat) {

      if (setContacts) {
        setContacts((prevContacts) => {
          const targetIndex = prevContacts.findIndex(
            (c) => String(c.contact_id || c.id) === targetId
          );

          if (targetIndex === -1) {
            console.warn('⚠️ [FRONTEND] Incoming message contact not found in current prevContacts state array.');
            return prevContacts;
          }

          const updatedContacts = [...prevContacts];
          const [targetContact] = updatedContacts.splice(targetIndex, 1);

          targetContact.unseen = Number(targetContact.unseen || 0) + 1;
          targetContact.rank = 1;
          updatedContacts.unshift(targetContact);

          for (let i = 1; i <= targetIndex; i++) {
            updatedContacts[i].rank = Number(updatedContacts[i].rank) + 1;
          }

          return updatedContacts;
        });
      } else {
        console.warn('⚠️ [FRONTEND] setContacts is undefined inside background handleNewMessage!');
      }

      // 4. Update Local Storage Cache
      const cacheRaw = localStorage.getItem('chat_contacts_state');
      if (cacheRaw) {
        const cache = JSON.parse(cacheRaw);
        const targetMeta = cache.contacts_meta?.find(
          (item) => String(item.id) === targetId
        );

        if (targetMeta) {
          const oldRank = Number(targetMeta.rank);

          if (oldRank > 1) {
            cache.contacts_meta.forEach((item) => {
              const itemRank = Number(item.rank);

              if (String(item.id) === targetId) {
                item.rank = 1;
              } else if (itemRank >= 1 && itemRank < oldRank) {
                item.rank = itemRank + 1;
              }
            });

            const existingToRank = cache.dirty_slice?.to_rank || 0;
            const highestToRank = Math.max(existingToRank, oldRank);

            cache.sync_pending = true;
            cache.dirty_slice = {
              from_rank: 1,
              to_rank: highestToRank,
            };
          }

          localStorage.setItem('chat_contacts_state', JSON.stringify(cache));
        } else {
          console.log('ℹ️ [FRONTEND] Background targetMeta not found in cache.');
        }
      } else {
        console.log('ℹ️ [FRONTEND] No chat_contacts_state in localStorage during background handleNewMessage.');
      }
    } else {
      console.log('ℹ️ [FRONTEND] Skipping background contacts re-order because incoming message belongs to ACTIVE chat.');
    }
  };
  // Register listeners
  // Register listeners
  socket.on('get_messages_res', handleGetMessagesRes);
  socket.on('send_message_res', handleSendMessageRes);
  socket.on('new_message', handleNewMessage);

  // Cleanup function
  return () => {
    socket.off('get_messages_res', handleGetMessagesRes);
    socket.off('send_message_res', handleSendMessageRes);
    socket.off('new_message', handleNewMessage);
  };
};

export const initInviteSocketListeners = (
  socket,
  setContacts,
  setReqContacts,
  setSelectedChat,
  setIsRejecting,
  setMessages,
  setIsAccepting
) => {
  if (!socket) return () => { };

  const handleInvite = (response) => {
    if (!response?.success) {
      console.error('⚠️ Invite failed:', response?.message);
      return;
    }
    if (response.type === "new") {
      alert(`Got New Request From ${response.contact.contact.name}`);
    }

    // Handle contact update if returning user contact info
    if (response?.contact) {
      setReqContacts?.((prev) => [response.contact, ...(prev || [])]);
    }
  };


  const handleAcceptInviteRes = (response) => {
if (typeof setIsAccepting === 'function') {
    setIsAccepting(false);
  }
const targetId = String(response?.contactId || '');

  if (!response?.success || !targetId) {
    console.warn('⚠️ Missing success status or valid contact ID in payload:', response);
    return;
  }

  if (typeof setReqContacts === 'function') {
    setReqContacts((prev = []) => {
      // 1. Find target contact in current state
      const found = prev.find((item) => String(item?.contact_id) === targetId);

      if (found) {
        const updatedContact = {
          ...found,
          rank: 1,
          status: 'accepted',
        };

        // 2. Safely trigger setContacts INSIDE where updatedContact exists
        if (typeof setContacts === 'function') {
          setContacts((prevContacts = []) => {
            const shiftedContacts = (prevContacts || []).map((contact) => ({
              ...contact,
              rank: Number(contact.rank || 0) + 1,
            }));

            return [updatedContact, ...shiftedContacts];
          });
        }

        if (response.type === 'new') {
          const name = updatedContact?.name || updatedContact?.contact?.name;
          if (name) alert(`🎉 ${name} accepted your contact request!`);
        }
      } else {
        console.warn('⚠️ Target ID not found in pending requests array!');
      }

      // 3. Filter out matched item from pending requests
      return prev.filter((item) => String(item?.contact_id) !== targetId);
    });
  }
  // Update LocalStorage (chat_contacts_state)
  const STORAGE_KEY = 'chat_contacts_state';

  try {
    const rawMeta = localStorage.getItem(STORAGE_KEY);
    const parsed = rawMeta ? JSON.parse(rawMeta) : { contacts_meta: [] };

    const updatedList = (parsed.contacts_meta || []).map((item) => {
      const isTargetContact = String(item.id) === targetId;
      const currentRank = Number(item.rank);

      if (!isTargetContact && currentRank !== 0) {
        return {
          ...item,
          rank: currentRank + 1,
        };
      }

      if (isTargetContact) {
        return {
          ...item,
          rank: 1,
        };
      }

      return item;
    });

    const objectToSave = { ...parsed, contacts_meta: updatedList };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(objectToSave));
  } catch (err) {
    console.error('Failed to update local storage Chat_contacts_state:', err);
  }

  // Initialize Messages and Open Active Chat
  if (typeof setMessages === 'function') {
    setMessages([]);
  }

  if (typeof setSelectedChat === 'function') {
    setSelectedChat(null);
  }
};

    // Register listeners
    socket.on('send_invite_res', handleInvite);
    socket.on('new_invite_received', handleInvite);

    socket.on('accept_invite_res', handleAcceptInviteRes);
    socket.on('accepted_your_invite', handleAcceptInviteRes);


  
    return () => {
      socket.off('send_invite_res', handleInvite);
      socket.off('new_invite_received', handleInvite);


      socket.off('accept_invite_res', handleAcceptInviteRes);
      socket.off('accepted_your_invite', handleAcceptInviteRes);

    };
  }
