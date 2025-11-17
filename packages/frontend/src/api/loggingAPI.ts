import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export interface AuditLog {
  auditId: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: number | null;
  details: Record<string, any> | null;
  createdAt: string;
  userName?: string;
}

export interface LoggingFilters {
  action?: string;
  entityType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LoggingStats {
  action: string;
  count: number;
}

const loggingAPI = {
  getAll: async (filters: LoggingFilters = {}): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (filters.action) params.append("action", filters.action);
    if (filters.entityType) params.append("entityType", filters.entityType);
    if (filters.userId) params.append("userId", filters.userId.toString());
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

  const response = await fetch(`${API_BASE}/logging?${params.toString()}`, {
      credentials: "include",
    });

    // Wichtig: 204 No Content prüfen
    if (response.status === 204) {
      return { logs: [], total: 0, page: 1, totalPages: 0 };
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to fetch logs";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage += ` (Status: ${response.status})`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  getByUser: async (userId: number, page: number = 1, limit: number = 50): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }> => {
  const response = await fetch(`${API_BASE}/logging/user/${userId}?page=${page}&limit=${limit}`, {
      credentials: "include",
    });

    // Wichtig: 204 No Content prüfen
    if (response.status === 204) {
      return { logs: [], total: 0, page: 1, totalPages: 0 };
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to fetch user logs";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage += ` (Status: ${response.status})`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  getByEntity: async (entityType: string, entityId: number, page: number = 1, limit: number = 50): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }> => {
  const response = await fetch(`${API_BASE}/logging/entity/${entityType}/${entityId}?page=${page}&limit=${limit}`, {
      credentials: "include",
    });

    // Wichtig: 204 No Content prüfen
    if (response.status === 204) {
      return { logs: [], total: 0, page: 1, totalPages: 0 };
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to fetch entity logs";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage += ` (Status: ${response.status})`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  getStats: async (): Promise<LoggingStats[]> => {
  const response = await fetch(`${API_BASE}/logging/stats`, {
      credentials: "include",
    });

    // Wichtig: 204 No Content prüfen
    if (response.status === 204) {
      return [];
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to fetch stats";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage += ` (Status: ${response.status})`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.stats;
  },
};

export default loggingAPI;
