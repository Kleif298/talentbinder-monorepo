export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UserData {
  id: number;
  email: string;
  name?: string; // Full name (firstName + lastName)
  firstName?: string;
  lastName?: string;
  role: string;
  isAdmin: boolean;
}