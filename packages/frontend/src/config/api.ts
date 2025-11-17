/**
 * Centralized API Configuration
 * Single source of truth for API base URL
 */

const getApiBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    // Production or custom URL: use explicit URL
    return `${apiUrl.replace(/\/$/, '')}/api`;
  }
  
  // Development: use Vite proxy (proxies to http://localhost:3023)
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();
