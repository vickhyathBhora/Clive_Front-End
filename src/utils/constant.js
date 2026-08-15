export const API_BASE_URL = 'http://localhost:5000';

export const GOOGLE_AUTH_URL = `${API_BASE_URL}/api/auth/google-auth`;
export const SEND_OTP_URL = `${API_BASE_URL}/api/auth/send-otp`;
export const GET_ALL_CONTACTS_URL = `${API_BASE_URL}/api/contacts/list`;
export const ADD_CONTACT_URL = `${API_BASE_URL}/api/contacts/add`;
export const DELETE_CONTACT_URL = '/api/contacts/delete';
export const USER_SEARCH_URL = (queryText) => 
  `/api/contacts/search?query=${encodeURIComponent(queryText)}`;
export const SOCKET_URL = 'http://localhost:5000';
