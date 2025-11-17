/**
 * Lookup API Service
 * Für Referenzdaten wie Apprenticeships und Branches
 */

export interface Apprenticeship {
  id: number;
  name: string;
  branchId: number;
}

export interface Branch {
  id: number;
  name: string;
}

export interface Location {
  locationId: number;
  name: string;
  address: string;
  city: string;
  plz: string;
}

export interface EventType {
  templateId: number;
  title: string;
  description?: string;
  locationId: number;
  registrationsRequired: boolean;
  startingAt?: string;
  endingAt?: string;
  multipleSessions: boolean;
  locationName?: string;
  locationAddress?: string;
  locationCity?: string;
  locationPlz?: string;
}

import { API_BASE_URL } from "../config/api";

const API_BASE = `${API_BASE_URL}/lookups`;

export const lookupAPI = {
  /**
   * Abrufen aller Lehrstellen
   */
  getApprenticeships: async (): Promise<Apprenticeship[]> => {
  const res = await fetch(`${API_BASE}/apprenticeships`, { credentials: "include" });

    if (!res.ok) {
      // Lesen als Text, um 'Unexpected end of JSON input' zu vermeiden
      let errorData;
      try {
        const errorText = await res.text();
        errorData = JSON.parse(errorText);
      } catch (e) {
        // Fallback, wenn die Antwort kein valides JSON ist
        throw new Error(`Server error: ${res.statusText} (Status: ${res.status})`);
      }
      
      // Spezifische Fehlerbehandlung für Authentifizierungsfehler
      if (res.status === 401) {
        throw new Error("Bitte melden Sie sich an, um fortzufahren.");
      } else if (res.status === 403) {
        throw new Error("Sie haben keine Berechtigung für diese Aktion.");
      }
      throw new Error(errorData.message || "Server error: " + res.statusText);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.apprenticeships)) {
      return data.apprenticeships as Apprenticeship[];
    }
    throw new Error(data.message || "Fehler beim Abrufen der Lehrstellen");
  },

  /**
   * Abrufen aller Branchen
   */
  getBranches: async (): Promise<Branch[]> => {
  const res = await fetch(`${API_BASE}/branches`, { credentials: "include" });

    if (!res.ok) {
      // Lesen als Text, um 'Unexpected end of JSON input' zu vermeiden
      let errorData;
      try {
        const errorText = await res.text();
        errorData = JSON.parse(errorText);
      } catch (e) {
        // Fallback, wenn die Antwort kein valides JSON ist
        throw new Error(`Server error: ${res.statusText} (Status: ${res.status})`);
      }
      
      // Spezifische Fehlerbehandlung für Authentifizierungsfehler
      if (res.status === 401) {
        throw new Error("Bitte melden Sie sich an, um fortzufahren.");
      } else if (res.status === 403) {
        throw new Error("Sie haben keine Berechtigung für diese Aktion.");
      }
      throw new Error(errorData.message || "Server error: " + res.statusText);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.branches)) {
      return data.branches as Branch[];
    }
    throw new Error(data.message || "Fehler beim Abrufen der Branchen");
  },

  /**
   * Hilfsfunktion: Apprenticeship ID → Name konvertieren
   */
  getApprenticeshipName: async (apprenticeshipId: number | undefined): Promise<string> => {
    if (!apprenticeshipId) return "Nicht zugeordnet";
    
    try {
      const apprenticeships = await lookupAPI.getApprenticeships();
      const found = apprenticeships.find((a) => a.id === apprenticeshipId);
      return found ? found.name : "Unbekannt";
    } catch {
      return "Fehler beim Laden";
    }
  },

  /**
   * Hilfsfunktion: Branch ID → Name konvertieren
   */
  getBranchName: async (branchId: number | undefined): Promise<string> => {
    if (!branchId) return "Nicht zugeordnet";
    
    try {
      const branches = await lookupAPI.getBranches();
      const found = branches.find((b) => b.id === branchId);
      return found ? found.name : "Unbekannt";
    } catch {
      return "Fehler beim Laden";
    }
  },

  /**
   * Abrufen aller Standorte
   */
  getLocations: async (): Promise<Location[]> => {
    const res = await fetch(`${API_BASE}/locations`, { credentials: "include" });

    if (!res.ok) {
      let errorData;
      try {
        const errorText = await res.text();
        errorData = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Server error: ${res.statusText} (Status: ${res.status})`);
      }
      
      if (res.status === 401) {
        throw new Error("Bitte melden Sie sich an, um fortzufahren.");
      } else if (res.status === 403) {
        throw new Error("Sie haben keine Berechtigung für diese Aktion.");
      }
      throw new Error(errorData.message || "Server error: " + res.statusText);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.locations)) {
      return data.locations as Location[];
    }
    throw new Error(data.message || "Fehler beim Abrufen der Standorte");
  },

  /**
   * Abrufen aller Event-Typen/Templates
   */
  getEventTypes: async (): Promise<EventType[]> => {
    const res = await fetch(`${API_BASE}/event-types`, { credentials: "include" });

    if (!res.ok) {
      let errorData;
      try {
        const errorText = await res.text();
        errorData = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Server error: ${res.statusText} (Status: ${res.status})`);
      }
      
      if (res.status === 401) {
        throw new Error("Bitte melden Sie sich an, um fortzufahren.");
      } else if (res.status === 403) {
        throw new Error("Sie haben keine Berechtigung für diese Aktion.");
      }
      throw new Error(errorData.message || "Server error: " + res.statusText);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.eventTypes)) {
      return data.eventTypes as EventType[];
    }
    throw new Error(data.message || "Fehler beim Abrufen der Event-Typen");
  },
};
