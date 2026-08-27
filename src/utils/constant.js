export const API_BASE_URL = 'http://localhost:5000';

export const GOOGLE_AUTH_URL = `${API_BASE_URL}/api/auth/google-auth`;
export const SEND_OTP_URL = `${API_BASE_URL}/api/auth/send-otp`;
export const GET_ALL_CONTACTS_URL = `${API_BASE_URL}/api/contacts/list`;
export const ADD_CONTACT_URL = `${API_BASE_URL}/api/contacts/add`;
export const DELETE_CONTACT_URL = '/api/contacts/delete';
export const USER_SEARCH_URL = (queryText) => 
  `/api/contacts/search?query=${encodeURIComponent(queryText)}`;
export const SOCKET_URL = 'http://localhost:5000';

export function rearrangeRanks(offlineContacts) {
  const LOCAL_CACHE_KEY = 'chat_contacts_state';

  // 1. Fetch current cached state from localStorage
  const rawCache = localStorage.getItem(LOCAL_CACHE_KEY);
  if (!rawCache) {
    console.warn('⚠️ No local cache found to rearrange ranks.');
    return null;
  }

  const cache = JSON.parse(rawCache);
  const contactsMeta = cache.contacts_meta || [];
  const dirty_slice = cache.dirty_slice || { from_rank: 1, to_rank: 0 };

  // If no offline contacts provided, clear cache & return empty slice payload
  if (!offlineContacts || offlineContacts.length === 0) {
    localStorage.removeItem(LOCAL_CACHE_KEY);
    return { dirty_slice, slicePayload: [] };
  }

  // 2. Expand dirty_slice.to_rank if an offline rank exceeds it
  const maxOfflineRank = Math.max(...offlineContacts.map((item) => Number(item.rank)));
  if (maxOfflineRank > (dirty_slice.to_rank || 0)) {
    dirty_slice.to_rank = maxOfflineRank;
  }
  dirty_slice.from_rank = 1;

  // 3. Clean and standardize offlineContacts to continuous ranks (1..K)
  const cleanedOfflineContacts = offlineContacts.map((contact, index) => ({
    id: String(contact.contact_id || contact.id),
    rank: index + 1
  }));

  const K = cleanedOfflineContacts.length;

  // 4. Collect all offline IDs for set-based O(1) deduplication
  const offlineIds = new Set(cleanedOfflineContacts.map((c) => String(c.id)));

  // 5. Filter contactsMeta: remove duplicate IDs and skip rank === 0 entries
  const validMeta = contactsMeta.filter((contact) => {
    const contactId = String(contact.id);
    return !offlineIds.has(contactId) && Number(contact.rank) !== 0;
  });

  // 6. Sort remaining meta entries by their existing rank ascending
  validMeta.sort((a, b) => Number(a.rank) - Number(b.rank));

  // 7. Re-rank leftovers starting from (K + 1)
  const reRankedMeta = validMeta.map((contact, index) => ({
    id: String(contact.id),
    rank: K + index + 1
  }));

  // 8. Merge into continuous final contacts array (1..K, then K+1..N)
  const finalContacts = [...cleanedOfflineContacts, ...reRankedMeta];

  // 9. Filter slice payload strictly from rank 1 to to_rank
  const slicePayload = finalContacts.filter(
    (item) => Number(item.rank) <= dirty_slice.to_rank
  );

  // 10. CLEANUP: Delete old local cache state as requested
  localStorage.removeItem(LOCAL_CACHE_KEY);
  console.log('🗑️ [FRONTEND] Cleared chat_contacts_state from localStorage');

  // Return ready-to-emit payload
  return {
    dirty_slice,
    slicePayload
  };
}