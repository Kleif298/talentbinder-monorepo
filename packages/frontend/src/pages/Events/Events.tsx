import { useState } from "react";
import Header from "~/components/Header/Header.tsx";
import EventList from "~/components/EventList/EventList.tsx";
import EventCreationPage from "~/components/EventCreationPage/EventCreationPage.tsx";
import InfoModal from "~/components/InfoModal/InfoModal.tsx";
import MessageBanner, { type Message } from "~/components/MessageBanner/MessageBanner.tsx";
import type { Event } from "~/types/Event";

import "./Events.scss";

const Events = () => {
    const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showCreationPage, setShowCreationPage] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [message, setMessage] = useState<Message | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const handleCreateEventClick = () => {
        setEventToEdit(null);
        setShowCreationPage(true);
    };

    const handleEditEventClick = (event: Event) => {
        setEventToEdit(event);
        setShowCreationPage(true);
    };

    const handleCreationSuccess = () => {
        setMessage({ type: "success", text: eventToEdit ? "Event erfolgreich aktualisiert!" : "Event erfolgreich erstellt!" });
        setRefreshKey(prev => prev + 1);
    };

    const handleBackFromCreation = () => {
        setShowCreationPage(false);
        setEventToEdit(null);
    };

    // If showing creation page, render it instead of the event list
    if (showCreationPage) {
        return (
            <div className="event-dashboard-page">
                <Header />
                <MessageBanner message={message} onClose={() => setMessage(null)} />
                <EventCreationPage
                    event={eventToEdit}
                    onBack={handleBackFromCreation}
                    onSuccess={handleCreationSuccess}
                />
            </div>
        );
    }

    return (
        <div className="event-dashboard-page">
            <Header />
            <MessageBanner message={message} onClose={() => setMessage(null)} />
            <div className={`event-frame ${selectedEvent ? 'split-view' : ''}`}>
                <div className="event-list-section">
                    <div className="head-of-list">
                        <div className="head-of-list-content">
                            <input 
                                className="event-search" 
                                type="text" 
                                placeholder="Nach Events suchen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button 
                                className="create-event-button" 
                                onClick={handleCreateEventClick}
                            >
                                + Event erstellen
                            </button>
                        </div>
                    </div>
                    <EventList 
                        refreshKey={refreshKey}
                        searchTerm={searchTerm}
                        onEditStart={handleEditEventClick}
                        onViewStart={(event) => setSelectedEvent(event)}
                    />
                </div>
                {selectedEvent && (
                    <InfoModal
                        event={selectedEvent}
                        isOpen={!!selectedEvent}
                        onClose={() => setSelectedEvent(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default Events;
