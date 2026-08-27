// 1. Dynamic Base URL (Uses Netlify env variable first, falls back to live backend)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://clive-back-end.onrender.com';

// 2. Fixed Endpoints (All use API_BASE_URL)
export const GOOGLE_AUTH_URL = `${API_BASE_URL}/api/auth/google-auth`;
export const SEND_OTP_URL = `${API_BASE_URL}/api/auth/send-otp`;
export const GET_ALL_CONTACTS_URL = `${API_BASE_URL}/api/contacts/list`;
export const ADD_CONTACT_URL = `${API_BASE_URL}/api/contacts/add`;
export const DELETE_CONTACT_URL = `${API_BASE_URL}/api/contacts/delete`;

export const USER_SEARCH_URL = (queryText) =>
  `${API_BASE_URL}/api/contacts/search?query=${encodeURIComponent(queryText)}`;

export const SOCKET_URL = API_BASE_URL;

// 3. Contact Rank Re-ordering Utility
export function rearrangeRanks(offlineContacts) {
  const LOCAL_CACHE_KEY = 'chat_contacts_state';

  // Fetch current cached state from localStorage
  const rawCache = localStorage.getItem(LOCAL_CACHE_KEY);
  if (!rawCache) {
    console.warn('⚠️ No local cache found to rearrange ranks.');
    return null;
  }

  let cache;
  try {
    cache = JSON.parse(rawCache);
  } catch (err) {
    console.error('⚠️ Failed to parse local cache JSON:', err);
    return null;
  }

  const contactsMeta = cache.contacts_meta || [];
  const dirty_slice = cache.dirty_slice || { from_rank: 1, to_rank: 0 };

  // If no offline contacts provided, clear cache & return empty slice payload
  if (!offlineContacts || !Array.isArray(offlineContacts) || offlineContacts.length === 0) {
    localStorage.removeItem(LOCAL_CACHE_KEY);
    return { dirty_slice, slicePayload: [] };
  }

  // Safe max rank calculation
  const validRanks = offlineContacts
    .map((item) => Number(item.rank))
    .filter((r) => !isNaN(r));

  const maxOfflineRank = validRanks.length > 0 ? Math.max(...validRanks) : 0;

  if (maxOfflineRank > (dirty_slice.to_rank || 0)) {
    dirty_slice.to_rank = maxOfflineRank;
  }
  dirty_slice.from_rank = 1;

  // Clean and standardize offlineContacts to continuous ranks (1..K)
  const cleanedOfflineContacts = offlineContacts.map((contact, index) => ({
    id: String(contact.contact_id || contact.id),
    rank: index + 1
  }));

  const K = cleanedOfflineContacts.length;

  // Collect all offline IDs for set-based O(1) deduplication
  const offlineIds = new Set(cleanedOfflineContacts.map((c) => String(c.id)));

  // Filter contactsMeta: remove duplicate IDs and skip rank === 0 entries
  const validMeta = contactsMeta.filter((contact) => {
    const contactId = String(contact.id);
    return !offlineIds.has(contactId) && Number(contact.rank) !== 0;
  });

  // Sort remaining meta entries by their existing rank ascending
  validMeta.sort((a, b) => Number(a.rank) - Number(b.rank));

  // Re-rank leftovers starting from (K + 1)
  const reRankedMeta = validMeta.map((contact, index) => ({
    id: String(contact.id),
    rank: K + index + 1
  }));

  // Merge into continuous final contacts array (1..K, then K+1..N)
  const finalContacts = [...cleanedOfflineContacts, ...reRankedMeta];

  // Filter slice payload strictly from rank 1 to to_rank
  const slicePayload = finalContacts.filter(
    (item) => Number(item.rank) <= dirty_slice.to_rank
  );

  return {
    dirty_slice,
    slicePayload
  };
}