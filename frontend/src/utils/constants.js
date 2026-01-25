
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const SOCKET_URL = API_BASE_URL.replace('/api', '');

console.log('Current API URL:', API_BASE_URL);
console.log('Current SOCKET URL:', SOCKET_URL);