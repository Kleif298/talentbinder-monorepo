/**
 * Events API Service
 * Zentrale Stelle für alle Event-API-Aufrufe
 */

import type { Event, EventForm } from "../types/Event";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export const eventsAPI = {
  /**
   * Abrufen aller Events
   */
  getAll: async (): Promise<Event[]> => {
    const res = await fetch(`${API_BASE}/events`, { credentials: "include" });

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
    if (data.success && Array.isArray(data.events)) {
      return data.events as Event[];
    }
    throw new Error(data.message || "Fehler beim Abrufen der Events");
  },

  /**
   * Neues Event erstellen
   */
  create: async (event: EventForm): Promise<Event> => {
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: event.title,
        description: event.description,
        branchId: event.branchId,
        templateId: event.templateId,
        locationId: event.locationId,
        registrationRequired: event.registrationRequired,
        dateAt: event.dateAt,
        startingAt: event.startingAt,
        endingAt: event.endingAt,
        invitationsSendingAt: event.invitationsSendingAt,
        registrationsClosingAt: event.registrationsClosingAt,
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
      return data.event;
    }
    throw new Error(data.message || "Fehler beim Erstellen des Events");
  },

  /**
   * Event aktualisieren
   */
  update: async (id: number, event: EventForm): Promise<Event> => {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: event.title,
        description: event.description,
        branchId: event.branchId,
        templateId: event.templateId,
        locationId: event.locationId,
        registrationRequired: event.registrationRequired,
        dateAt: event.dateAt,
        startingAt: event.startingAt,
        endingAt: event.endingAt,
        invitationsSendingAt: event.invitationsSendingAt,
        registrationsClosingAt: event.registrationsClosingAt,
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
      return data.event;
    }
    throw new Error(data.message || "Fehler beim Aktualisieren des Events");
  },

  /**
   * Event löschen
   */
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/events/${id}`, {
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
      throw new Error(data.message || "Fehler beim Löschen des Events");
    }
  },
};
