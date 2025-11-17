import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export const recruitersAPI = {
  getAllAccounts: async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, { credentials: "include" });
      if (!res.ok) {
        console.warn(`recruitersAPI: users list status ${res.status}, returning empty list`);
        return [];
      }
      const data = await res.json();
      // Backend liefert reines Array von Accounts
      if (Array.isArray(data)) return data;
      // Fallback für alternative Shapes
      if (data?.success && Array.isArray(data.accounts)) return data.accounts;
      return [];
    } catch (err: any) {
      console.error('recruitersAPI: Error in getAllAccounts:', err);
      return [];
    }
  },

  /**
   * Abrufen aller Recruiter für ein Event
   */
  getEventRecruiters: async (eventId: number) => {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/recruiters`, {
        credentials: "include"
      });

      if (!res.ok) {
        console.warn(`recruitersAPI: Got status ${res.status}, returning empty list`);
        return [];
      }

      const data = await res.json();
      if (data.success) {
        return data.recruiters || [];
      }
      console.warn('recruitersAPI: Response success=false:', data.message);
      return [];
    } catch (err: any) {
      console.error('recruitersAPI: Error in getEventRecruiters:', err);
      return [];
    }
  },

  /**
   * Event-Registrierungen abrufen
   */
  getEventRegistrations: async (eventId: number) => {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/registrations`, {
        credentials: "include"
      });

      if (!res.ok) {
        console.warn(`recruitersAPI: Got status ${res.status}, returning 0 registrations`);
        return { count: 0, registrations: [] };
      }

      const data = await res.json();
      if (data.success) {
        return {
          count: data.count || 0,
          registrations: data.registrations || []
        };
      }
      console.warn('recruitersAPI: Response success=false:', data.message);
      return { count: 0, registrations: [] };
    } catch (err: any) {
      console.error('recruitersAPI: Error in getEventRegistrations:', err);
      return { count: 0, registrations: [] };
    }
  },

  /**
   * Recruiter zu Event hinzufügen
   */
  addRecruiterToEvent: async (eventId: number, recruiterId: number) => {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/recruiters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recruiter_id: recruiterId })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success) {
        return data;
      }
      throw new Error(data.message || "Fehler beim Hinzufügen des Recruiters");
    } catch (err: any) {
      console.error('recruitersAPI: Error in addRecruiterToEvent:', err);
      throw err;
    }
  },

  /**
   * Recruiter vom Event entfernen
   */
  removeRecruiterFromEvent: async (eventId: number, recruiterId: number) => {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/recruiters/${recruiterId}`, {
        method: "DELETE",
        credentials: "include"
      });

      // Wichtig: Beim DELETE kann der Server 204 No Content senden, was kein JSON ist.
      if (res.status === 204) {
        return { success: true, message: "Recruiter removed" };
      }

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Server error: ${res.statusText}`;
        try {
          const errData = JSON.parse(errorText);
          errorMessage = errData.message || errorMessage;
        } catch (e) {
          // Text war kein JSON
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (data.success) {
        return data;
      }
      throw new Error(data.message || "Fehler beim Entfernen des Recruiters");
    } catch (err: any) {
      console.error('recruitersAPI: Error in removeRecruiterFromEvent:', err);
      throw err;
    }
  },

  /**
   * Kandidat zu Event-Registrierung hinzufügen
   */
  addCandidateToEvent: async (eventId: number, candidateId: number) => {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ candidate_id: candidateId })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success) {
        return data;
      }
      throw new Error(data.message || "Fehler beim Hinzufügen des Kandidaten");
    } catch (err: any) {
      console.error('recruitersAPI: Error in addCandidateToEvent:', err);
      throw err;
    }
  },

  /**
   * Kandidat von Event-Registrierung entfernen
   */
  removeCandidateFromEvent: async (eventId: number, candidateId: number) => {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/registrations/${candidateId}`, {
        method: "DELETE",
        credentials: "include"
      });

      // Wichtig: Beim DELETE kann der Server 204 No Content senden, was kein JSON ist.
      if (res.status === 204) {
        return { success: true, message: "Candidate removed" };
      }

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Server error: ${res.statusText}`;
        try {
          const errData = JSON.parse(errorText);
          errorMessage = errData.message || errorMessage;
        } catch (e) {
          // Text war kein JSON
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (data.success) {
        return data;
      }
      throw new Error(data.message || "Fehler beim Entfernen des Kandidaten");
    } catch (err: any) {
      console.error('recruitersAPI: Error in removeCandidateFromEvent:', err);
      throw err;
    }
  }
};