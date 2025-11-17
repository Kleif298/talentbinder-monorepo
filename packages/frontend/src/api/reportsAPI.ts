/**
 * Reports API Service
 * Zentrale Stelle für alle Report-API-Aufrufe
 */

import type { EventReport, ReportForm } from "../types/Report";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export const reportsAPI = {
  /**
   * Report für einen Kandidaten bei einem Event erstellen
   */
  createReport: async (eventId: number, reportData: ReportForm): Promise<EventReport> => {
    const res = await fetch(`${API_BASE}/events/${eventId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        candidate_id: reportData.candidateId,
        status: reportData.status,
        attendance: reportData.attendance,
        comment: reportData.comment
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Bitte melden Sie sich an, um fortzufahren.");
      } else if (res.status === 403) {
        throw new Error("Sie haben keine Berechtigung für diese Aktion.");
      }
      throw new Error(data.message || "Server error: " + res.statusText);
    }

    if (data.success) {
      return data.report;
    }
    throw new Error(data.message || "Fehler beim Erstellen des Reports");
  },

  /**
   * Report aktualisieren
   */
  updateReport: async (eventId: number, candidateId: number, reportData: ReportForm): Promise<EventReport> => {
    const res = await fetch(`${API_BASE}/events/${eventId}/attendance/${candidateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        status: reportData.status,
        attendance: reportData.attendance,
        comment: reportData.comment
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Bitte melden Sie sich an, um fortzufahren.");
      } else if (res.status === 403) {
        throw new Error("Sie haben keine Berechtigung für diese Aktion.");
      }
      throw new Error(data.message || "Server error: " + res.statusText);
    }

    if (data.success) {
      return data.report;
    }
    throw new Error(data.message || "Fehler beim Aktualisieren des Reports");
  },

  /**
   * Alle Reports für ein Event abrufen
   */
  getEventReports: async (eventId: number): Promise<EventReport[]> => {
    const res = await fetch(`${API_BASE}/events/${eventId}/attendance`, {
      credentials: "include"
    });

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
    if (data.success && Array.isArray(data.reports)) {
      return data.reports as EventReport[];
    }
    throw new Error(data.message || "Fehler beim Abrufen der Reports");
  },

  /**
   * Report löschen
   */
  deleteReport: async (eventId: number, candidateId: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/events/${eventId}/attendance/${candidateId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.status === 204) {
      return;
    }

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
  }
};
