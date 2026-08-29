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

  // 2. Handle delete chat history response
  const handleChatRes = (response) => {
    console.log('📩 delete_chat_history_res response:', response);

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
    console.log("hello");
    console.log('📩 get_messages_res response:', response);

    if (response?.success) {
      if (setMessages) {
        setMessages(response.messages || response.data || []);
      }
    } else {
      console.error('Get messages failed:', response?.message);
    }
  };

  const handleSendMessageRes = (response) => {
    console.log('📩 [FRONTEND] sendmessageres event triggered');
    console.log('📩 [FRONTEND] Full raw sendmessageres response:', response);

    if (!response?.success || !response?.data) {
      console.error('❌ [FRONTEND] Send message failed or response missing data:', response?.message);
      return;
    }

    const newMessage = response.data;
    const targetId = String(newMessage.contact_id);
    console.log('✅ [FRONTEND] Parsed new sent message:', newMessage);
    console.log('🎯 [FRONTEND] Target contact ID for sendmessageres:', targetId);

    // 1. Update Messages Array (Push to end, max 10 items)
    if (setMessages) {
      console.log('🔄 [FRONTEND] setMessages context function exists. Updating messages array...');
      setMessages((prevMessages) => {
        console.log('📦 [FRONTEND] Current prevMessages count:', prevMessages.length);
        const updated = [...prevMessages, newMessage];
        if (updated.length > 10) {
          console.log('✂️ [FRONTEND] Messages array length exceeds 10. Shifting oldest message...');
          updated.shift(); // Remove oldest message
        }
        console.log('✅ [FRONTEND] Updated messages array result:', updated);
        return updated;
      });
    } else {
      console.warn('⚠️ [FRONTEND] setMessages is undefined inside handleSendMessageRes!');
    }

    // 2. Update Contacts UI State (If rank > 1)
    if (setContacts) {
      console.log('🔄 [FRONTEND] setContacts context function exists. Checking contact rank shift...');
      setContacts((prevContacts) => {
        console.log('📋 [FRONTEND] Checking prevContacts list for rank shift...');
        const targetIndex = prevContacts.findIndex(
          (c) => String(c.contact_id) === targetId
        );
        console.log(`🔍 [FRONTEND] Contact targetIndex in UI state: ${targetIndex}`);

        if (targetIndex > 0) {
          console.log(`⬆️ [FRONTEND] Target contact is at index ${targetIndex} (Rank > 1). Moving to Rank 1...`);
          const updatedContacts = [...prevContacts];
          const [targetContact] = updatedContacts.splice(targetIndex, 1);

          targetContact.rank = 1;
          updatedContacts.unshift(targetContact);

          for (let i = 1; i <= targetIndex; i++) {
            updatedContacts[i].rank = Number(updatedContacts[i].rank) + 1;
          }

          console.log('✅ [FRONTEND] Updated contacts UI array result:', updatedContacts);
          return updatedContacts;
        }

        console.log('ℹ️ [FRONTEND] Contact is already at Rank 1 or not found in state array. No UI rank shift needed.');
        return prevContacts;
      });
    } else {
      console.warn('⚠️ [FRONTEND] setContacts is undefined inside handleSendMessageRes!');
    }

    // 3. Update Local Storage Cache
    console.log('💾 [FRONTEND] Reading chat_contacts_state from localStorage...');
    const cacheRaw = localStorage.getItem('chat_contacts_state');
    if (cacheRaw) {
      console.log('📦 [FRONTEND] Raw cache retrieved from localStorage.');
      const cache = JSON.parse(cacheRaw);
      const targetMeta = cache.contacts_meta?.find(
        (item) => String(item.id) === targetId
      );
      console.log('🔍 [FRONTEND] Target metadata in cache:', targetMeta);

      if (targetMeta && Number(targetMeta.rank) > 1) {
        const oldRank = Number(targetMeta.rank);
        console.log(`⬆️ [FRONTEND] Updating cache metadata ranks. Old rank was ${oldRank}...`);

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

        console.log('💾 [FRONTEND] Saving updated cache back to localStorage:', cache);
        localStorage.setItem('chat_contacts_state', JSON.stringify(cache));
      } else {
        console.log('ℹ️ [FRONTEND] Cache targetMeta null or rank is already 1. Skipping cache shift.');
      }
    } else {
      console.log('ℹ️ [FRONTEND] No chat_contacts_state found in localStorage.');
    }
  };

  const handleNewMessage = (response) => {
    console.log('📩 [FRONTEND] new_message event triggered');
    console.log('📩 [FRONTEND] Full raw new_message response:', response);

    if (!response?.success || !response?.data) {
      console.warn('⚠️ [FRONTEND] Invalid or unsuccessful new_message payload structure:', response);
      return;
    }

    const newMessage = response.data;
    const targetId = String(newMessage.contact_id);
    console.log('✅ [FRONTEND] Parsed incoming new_message:', newMessage);
    console.log('🎯 [FRONTEND] Target contact ID for new_message:', targetId);
    console.log('💬 [FRONTEND] Current selectedChat state object:', selectedChat);

    // Direct state evaluation (No .current)
    const isActiveChat =
      selectedChat &&
      String(selectedChat.contact_id) === targetId;

    console.log(`💬 [FRONTEND] Is incoming message for active visible chat? ${isActiveChat}`);

    // 1. Web Push Notification (Only for background chats)
    if (!isActiveChat && 'Notification' in window && Notification.permission === 'granted') {
      console.log('🔔 [FRONTEND] Chat is in background. Triggering browser desktop Notification...');
      new Notification(`New message from ${newMessage.sender_name || 'Contact'}`, {
        body: newMessage.content,
        icon: newMessage.sender_avatar || '/default-avatar.png',
      });
    } else if (!isActiveChat) {
      console.log('ℹ️ [FRONTEND] Background chat notification skipped (Notifications API not permitted or unsupported).');
    }

    // 2. Append to Active Messages State (Max 10)
    if (isActiveChat && setMessages) {
      console.log('➕ [FRONTEND] Appending incoming message to active chat message state...');
      setMessages((prevMessages) => {
        console.log('📦 [FRONTEND] Current prevMessages count:', prevMessages.length);
        const updated = [...prevMessages, newMessage];
        if (updated.length > 10) {
          console.log('✂️ [FRONTEND] Active messages length > 10. Trimming oldest...');
          updated.shift();
        }
        console.log('✅ [FRONTEND] Updated active messages array:', updated);
        return updated;
      });
    } else if (isActiveChat && !setMessages) {
      console.warn('⚠️ [FRONTEND] Chat is active but setMessages function is missing!');
    }

    // 3. ONLY execute state & cache shift logic if message belongs to a BACKGROUND chat!
    if (!isActiveChat) {
      console.log('⚙️ [FRONTEND] Processing background chat shift & unseen count update...');

      if (setContacts) {
        console.log('🔄 [FRONTEND] Updating contacts state for background message...');
        setContacts((prevContacts) => {
          const targetIndex = prevContacts.findIndex(
            (c) => String(c.contact_id || c.id) === targetId
          );
          console.log(`🔍 [FRONTEND] Background contact targetIndex: ${targetIndex}`);

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

          console.log('✅ [FRONTEND] Updated background contacts array result:', updatedContacts);
          return updatedContacts;
        });
      } else {
        console.warn('⚠️ [FRONTEND] setContacts is undefined inside background handleNewMessage!');
      }

      // 4. Update Local Storage Cache
      console.log('💾 [FRONTEND] Reading chat_contacts_state for background message cache update...');
      const cacheRaw = localStorage.getItem('chat_contacts_state');
      if (cacheRaw) {
        console.log('📦 [FRONTEND] Raw cache retrieved for background update.');
        const cache = JSON.parse(cacheRaw);
        const targetMeta = cache.contacts_meta?.find(
          (item) => String(item.id) === targetId
        );
        console.log('🔍 [FRONTEND] Target metadata in background cache:', targetMeta);

        if (targetMeta) {
          const oldRank = Number(targetMeta.rank);

          if (oldRank > 1) {
            console.log('🔄 [FRONTEND] Re-ranking cache items for background contact...');
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

          console.log('💾 [FRONTEND] Saving background updated cache to localStorage:', cache);
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
    console.log('📩 Invite socket event received:', response);
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
  console.log('✅ Accept invite response received:', response);
if (typeof setIsAccepting === 'function') {
    setIsAccepting(false);
  }
const targetId = String(response?.contactId || '');
  console.log('🔍 Target Contact ID:', targetId);

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

            console.log('🎉 Pushing updatedContact into contacts array:', updatedContact);
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
    console.log('✅ LocalStorage updated successfully!');
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
