import { useState, useEffect } from "react";
import Header from "~/components/Header/Header.tsx";
import EventCard from "~/components/EventCard/EventCard.tsx";
import ReportCreationPage from "~/components/ReportCreationPage/ReportCreationPage.tsx";
import MessageBanner, { type Message } from "~/components/MessageBanner/MessageBanner.tsx";
import type { Event } from "~/types/Event";
import { eventsAPI } from "~/api/eventsAPI";
import { recruitersAPI } from "~/api/recruitersAPI";
import "./Reports.scss";

interface EventWithRegistrations extends Event {
  registrationCount?: number;
}

const Reports = () => {
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventForReport, setSelectedEventForReport] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allEvents = await eventsAPI.getAll();

      // Load registration counts for each event
      const eventsWithCounts = await Promise.all(
        allEvents.map(async (event) => {
          try {
            const registrations = await recruitersAPI.getEventRegistrations(event.id);
            return {
              ...event,
              registrationCount: registrations.count
            };
          } catch (err) {
            console.error(`Error loading registrations for event ${event.id}:`, err);
            return {
              ...event,
              registrationCount: 0
            };
          }
        })
      );

      setEvents(eventsWithCounts);
    } catch (err: any) {
      setError(`Fehler beim Laden der Events: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportClick = (event: Event) => {
    setSelectedEventForReport(event);
  };

  const handleReportSuccess = () => {
    setMessage({ type: "success", text: "Report erfolgreich erstellt!" });
  };

  const handleCloseReport = () => {
    setSelectedEventForReport(null);
  };

  // Filter events based on search term
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If a report is being created, show the report creation page
  if (selectedEventForReport) {
    return (
      <div className="reports-page">
        <Header />
        <ReportCreationPage
          event={selectedEventForReport}
          onBack={handleCloseReport}
          onSuccess={handleReportSuccess}
        />
      </div>
    );
  }

  // Otherwise show the event list
  return (
    <div className="reports-page">
      <Header />
      <MessageBanner message={message} onClose={() => setMessage(null)} />

      <div className="reports-container">
        <div className="reports-header">
          <div className="reports-header-content">
            <div className="reports-title-section">
              <h1>Reports</h1>
              <p>Events, für die ich verantwortlich bin</p>
            </div>
            <input
              className="reports-search"
              type="text"
              placeholder="Nach Events suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="reports-content">
          {isLoading ? (
            <div className="loading-state">
              <p>Lade Events...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>⚠️ {error}</p>
              <button className="retry-button" onClick={loadEvents}>
                Erneut versuchen
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? (
                <>
                  <p>Keine Events gefunden, die "{searchTerm}" entsprechen</p>
                  <button 
                    className="clear-search-button"
                    onClick={() => setSearchTerm("")}
                  >
                    Suche löschen
                  </button>
                </>
              ) : (
                <p>Keine Events vorhanden. Erstellen Sie ein Event, um hier Reports zu erstellen.</p>
              )}
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={() => {}} // No editing on Reports page
                  onView={() => {}} // Could implement info view if needed
                  registrationCount={event.registrationCount || 0}
                  readonly={true}
                  onReport={handleReportClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

