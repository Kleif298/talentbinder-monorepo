/**
 * Candidates API Service
 * Zentrale Stelle für alle Kandidaten-API-Aufrufe
 */

import type { Candidate, CandidateForm } from "../types/Candidate";
import { API_BASE_URL } from "../config/api";

const API_BASE = `${API_BASE_URL}/candidates`;

export const candidatesAPI = {
  /**
   * Abrufen aller Kandidaten mit Filtern und Sortierung
   */
  getAll: async (search: string = "", status: string = "", sortBy: string = "createdAtDesc"): Promise<Candidate[]> => {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append("search", search);
    if (status) queryParams.append("status", status);
    if (sortBy) queryParams.append("sort_by", sortBy);

    const url = `${API_BASE}?${queryParams.toString()}`;
    const res = await fetch(url, { 
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch (e) {
        // Fallback, wenn die Antwort kein valides JSON ist
        throw new Error("Server error: " + res.statusText);
      }
      throw new Error(errorData.message || "Server error: " + res.statusText);
    }

    const data = await res.json();

    console.log("Alle Kandidaten:", data);
    console.log("Anzahl Kandidaten:", data.candidates?.length || 0);

    if (data.success && Array.isArray(data.candidates)) {
      return data.candidates as Candidate[];
    }
    throw new Error(data.message || "Fehler beim Abrufen der Kandidaten");
  },

  /**
   * Neuen Kandidaten erstellen
   */
  create: async (candidate: CandidateForm): Promise<Candidate> => {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        status: candidate.status,
        // send apprenticeshipId (legacy single) and apprenticeshipIds (array) so backend can persist associations
        apprenticeshipId: candidate.apprenticeshipId,
        apprenticeshipIds: candidate.apprenticeshipIds,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      // Spezifische Fehlerbehandlung für Authentifizierungsfehler
      if (res.status === 401) {
        throw new Error("Bitte melden Sie sich an, um fortzufahren.");
      } else if (res.status === 403) {
        throw new Error("Sie haben keine Berechtigung für diese Aktion.");
      }
      throw new Error(data.message || "Server error: " + res.statusText);
    }

    if (data.success) {
      return data.candidate;
    }
    throw new Error(data.message || "Fehler beim Erstellen des Kandidaten");
  },

  /**
   * Kandidaten aktualisieren
   */
  update: async (id: number, candidate: Partial<CandidateForm>): Promise<void> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        status: candidate.status,
        apprenticeshipId: candidate.apprenticeshipId,
        apprenticeshipIds: candidate.apprenticeshipIds,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      // Spezifische Fehlerbehandlung für Authentifizierungsfehler
      if (res.status === 401) {
        throw new Error("Bitte melden Sie sich an, um fortzufahren.");
      } else if (res.status === 403) {
        throw new Error("Sie haben keine Berechtigung für diese Aktion.");
      }
      throw new Error(data.message || "Server error: " + res.statusText);
    }

    if (!data.success) {
      throw new Error(data.message || "Fehler beim Aktualisieren des Kandidaten");
    }
  },

  /**
   * Kandidaten löschen
   */
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    // Wichtig: Beim DELETE kann der Server 204 No Content senden, was kein JSON ist.
    if (res.status === 204) {
      return; // Erfolgreich gelöscht, kein Body erwartet
    }

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
    if (!data.success) {
      throw new Error(data.message || "Fehler beim Löschen des Kandidaten");
    }
  },
};
