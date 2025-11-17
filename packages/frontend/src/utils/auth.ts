const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = API_URL ? `${API_URL}/api` : '/api';

interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
}

// In-memory cache for user data (to avoid excessive API calls)
let cachedUser: UserData | null = null;
let userFetchPromise: Promise<UserData | null> | null = null;

/**
 * Fetch current user from backend (reads JWT from httpOnly cookie)
 */
export async function getUserData(): Promise<UserData | null> {
  // Return cached user if available
  if (cachedUser) return cachedUser;
  
  // If a fetch is already in progress, wait for it
  if (userFetchPromise) return userFetchPromise;
  
  // Start new fetch
  userFetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        cachedUser = null;
        return null;
      }
      
      const data = await response.json();
      if (data.success && data.user) {
        cachedUser = data.user;
        return cachedUser;
      }
      
      cachedUser = null;
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      cachedUser = null;
      return null;
    } finally {
      userFetchPromise = null;
    }
  })();
  
  return userFetchPromise;
}

/**
 * Clear cached user data (call after logout)
 */
export function clearUserCache(): void {
  cachedUser = null;
  userFetchPromise = null;
}

/**
 * Update cached user data after login
 */
export function setCachedUser(user: UserData): void {
  cachedUser = user;
}

export async function isOwnerOfEvent(eventCreatorId: number): Promise<boolean> {
  const userData = await getUserData();
  if (!userData) return false;
  
  if (userData.isAdmin) return true;
  
  return userData.id === eventCreatorId;
}

export async function getAdminStatus(): Promise<boolean> {
  const userData = await getUserData();
  return userData?.isAdmin === true;
}

export async function getAccountId(): Promise<number | null> {
  const userData = await getUserData();
  return userData?.id || null;
}

export async function getAccountEmail(): Promise<string | null> {
  const userData = await getUserData();
  return userData?.email || null;
}

export async function getAccountRole(): Promise<string | null> {
  const userData = await getUserData();
  return userData?.role || null;
}