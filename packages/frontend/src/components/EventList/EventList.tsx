import { useEffect, useState } from "react";
import EventCard from "../EventCard/EventCard";
import { eventsAPI } from "../../api/eventsAPI";
import { recruitersAPI } from "../../api/recruitersAPI";
import type { Event } from "../../types/Event";
    
interface EventListProps {
    onEditStart?: (event: Event) => void;
    onViewStart?: (event: Event) => void;
    refreshKey?: number;
    searchTerm?: string;
}

interface EventWithRegistrations extends Event {
    registrationCount?: number;
}

const EventList = ({ onEditStart, onViewStart, refreshKey, searchTerm = "" }: EventListProps) => {

    const [events, setEvents] = useState<EventWithRegistrations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [localRefreshKey, setLocalRefreshKey] = useState(0);

    async function handleEditEvent(event: Event) {
        if (onEditStart) {
            onEditStart(event);
        }
    }

    const handleRefresh = () => {
        setLocalRefreshKey(prev => prev + 1);
    };

    async function fetchEventsData(): Promise<EventWithRegistrations[]> {
        try {
            const eventsData = await eventsAPI.getAll();
            
            // Lade Registrierungsanzahl für jedes Event
            const eventsWithRegistrations = await Promise.all(
                eventsData.map(async (event) => {
                    try {
                        const registrations = await recruitersAPI.getEventRegistrations(event.id);
                        return {
                            ...event,
                            registrationCount: registrations.count
                        };
                    } catch (err) {
                        console.error(`Fehler beim Laden der Registrierungen für Event ${event.id}:`, err);
                        return {
                            ...event,
                            registrationCount: 0
                        };
                    }
                })
            );
            
            return eventsWithRegistrations;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    useEffect (() => {
        async function loadEvents() {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchEventsData();
                setEvents(data);
            } catch (err: any) {
                setError("Fehler beim Laden der Eventdaten: " + err.message);
            } finally {
                setIsLoading(false);
            }
        }
        loadEvents();
    }, [refreshKey, localRefreshKey]);
    
    if (isLoading) {
        return (
            <div className="event-list-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Lade Events...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="event-list-container">
                <div className="error-state">
                    <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3>Fehler beim Laden</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="event-list-container">
                <div className="empty-state">
                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3>Keine Events gefunden</h3>
                    <p>Erstellen Sie Ihr erstes Event, um loszulegen.</p>
                </div>
            </div>
        );
    }

    // Filter events by search term
    const filteredEvents = searchTerm
        ? events.filter(event => 
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : events;

    if (filteredEvents.length === 0 && searchTerm) {
        return (
            <div className="event-list-container">
                <div className="empty-state">
                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3>Keine Ergebnisse gefunden</h3>
                    <p>Keine Events passen zu "{searchTerm}"</p>
                </div>
            </div>
        );
    }

    const handleViewEvent = async (event: Event) => {
        if (onViewStart) {
            onViewStart(event);
        }
    }

    return (
        <div className="event-list-container">
            {filteredEvents.map((e) => (
                <EventCard 
                    onEdit={handleEditEvent} 
                    onView={handleViewEvent}
                    onRefresh={handleRefresh}
                    key={e.id} 
                    event={e}
                    registrationCount={e.registrationCount || 0}
                />
            ))}
        </div>
    );
};
export default EventList;
