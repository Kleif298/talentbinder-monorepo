import { useState, useEffect, useCallback } from "react";
import "~/components/EventCard/EventCard.scss";
import type { EventCardProps } from "../../types/Event";
import { FaRegCalendarAlt, FaUserCheck, FaCalendarCheck, FaUserPlus } from 'react-icons/fa';
import { getAdminStatus, getAccountId, isOwnerOfEvent } from "~/utils/auth";
import { candidatesAPI } from "~/api/candidatesAPI";
import { recruitersAPI } from "~/api/recruitersAPI";
import { formatTimeForDisplay, formatDateForDisplay } from "~/utils/formatSyntax";

interface Candidate {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

interface RegisteredCandidate {
    candidateId: number;
    firstName: string;
    lastName: string;
    email: string;
}

interface CardState {
    isOwner: boolean;
    isAdmin: boolean;
    canEdit: boolean;
    showAddCandidate: boolean;
    showRegisteredCandidates: boolean;
    registeredCandidates: RegisteredCandidate[];
    availableCandidates: Candidate[];
    loading: boolean;
    loadingOwner: boolean;
}

const EventCard = ({ event, onEdit, onView, registrationCount = 0, onRefresh, readonly = false, onReport }: EventCardProps) => {
    const currentUserId = getAccountId();
    
    // Consolidated state
    const [state, setState] = useState<CardState>({
        isOwner: false,
        isAdmin: false,
        canEdit: false,
        showAddCandidate: false,
        showRegisteredCandidates: false,
        registeredCandidates: [],
        availableCandidates: [],
        loading: false,
        loadingOwner: true
    });

    // Format date and time separately for events
    const eventDate = event.dateAt ? formatDateForDisplay(event.dateAt) : '';
    const eventStartTime = event.startingAt ? formatTimeForDisplay(event.startingAt) : '';
    const eventEndTime = event.endingAt ? formatTimeForDisplay(event.endingAt) : '';
    
    // Check if event is upcoming by combining date and time
    const isUpcoming = event.dateAt && event.startingAt 
        ? new Date(`${event.dateAt}T${event.startingAt}`) > new Date()
        : false;

    const loadRegisteredCandidates = useCallback(async () => {
        try {
            const registrations = await recruitersAPI.getEventRegistrations(event.id);
            console.log('Registrations API response:', registrations);
            
            const registered = (registrations.registrations || []).map((r: any) => {
                console.log('Mapping registration:', r);
                return {
                    candidateId: r.candidateId || r.candidate_id,
                    firstName: r.firstName || r.first_name,
                    lastName: r.lastName || r.last_name,
                    email: r.email
                };
            });
            
            console.log('Registered candidates after mapping:', registered);
            
            setState(prev => ({
                ...prev,
                registeredCandidates: registered
            }));
        } catch (err) {
            console.error('Fehler beim Laden der Registrierungen:', err);
        }
    }, [event.id]);

    // Initialize ownership and permissions on mount
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const isAdminUser = await getAdminStatus();
                const ownerStatus = await isOwnerOfEvent(event.createdByAccountId);
                const canEditEvent = isAdminUser || (currentUserId && event.createdByAccountId && Number(event.createdByAccountId) === Number(currentUserId));
                
                setState(prev => ({
                    ...prev,
                    isAdmin: isAdminUser,
                    isOwner: ownerStatus,
                    canEdit: canEditEvent || isAdminUser,
                    loadingOwner: false
                }));

                // Load registered candidates if owner
                if (ownerStatus && event.id) {
                    loadRegisteredCandidates();
                }
            } catch (err) {
                console.error('Error checking permissions:', err);
                setState(prev => ({ ...prev, loadingOwner: false }));
            }
        };

        checkPermissions();
    }, [event.id, event.createdByAccountId, loadRegisteredCandidates]);

    const loadAvailableCandidates = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        try {
            const allCandidates = await candidatesAPI.getAll();
            const registeredIds = state.registeredCandidates.map(r => r.candidateId);
            const available = allCandidates.filter(c => !registeredIds.includes(c.id));
            
            console.log('Available candidates:', available);

            setState(prev => ({
                ...prev,
                availableCandidates: available,
                loading: false
            }));
        } catch (err) {
            console.error('Fehler beim Laden der Kandidaten:', err);
            setState(prev => ({
                ...prev,
                availableCandidates: [],
                loading: false
            }));
        }
    }, [state.registeredCandidates]);

    const handleShowAddCandidate = useCallback(() => {
        loadAvailableCandidates();
        setState(prev => ({ ...prev, showAddCandidate: true }));
    }, [state.registeredCandidates, loadAvailableCandidates]);

    const handleAddCandidate = useCallback(async (candidateId: number) => {
        try {
            await recruitersAPI.addCandidateToEvent(event.id, candidateId);
            await loadRegisteredCandidates();
            setState(prev => ({ ...prev, showAddCandidate: false }));
            if (onRefresh) {
                onRefresh();
            }
        } catch (err: any) {
            alert(`Fehler: ${err.message}`);
        }
    }, [event.id, onRefresh, loadRegisteredCandidates]);

    const handleCancelAddCandidate = useCallback(() => {
        setState(prev => ({
            ...prev,
            showAddCandidate: false,
            availableCandidates: []
        }));
    }, []);

    const toggleCandidatesView = useCallback(() => {
        setState(prev => ({
            ...prev,
            showRegisteredCandidates: !prev.showRegisteredCandidates
        }));
    }, []);

    return (
        <div className="event-card">
            <div className="event-card-content">
                <div className="event-card-header">
                    <div className="event-title-section">
                        <h3 className="event-title">{event.title}</h3>
                        {isUpcoming && <span className="event-badge upcoming">Bevorstehend</span>}
                    </div>
                    <div className="header-buttons">
                        {!readonly && state.canEdit && (
                            <button 
                                className="edit-button-icon" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(event);
                                }}
                                aria-label="Bearbeiten"
                            >
                                ✏️
                            </button>
                        )}
                        {readonly && onReport && (
                            <button 
                                className="report-button-icon" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReport(event);
                                }}
                                aria-label="Report erstellen"
                            >
                                📋
                            </button>
                        )}
                        <button 
                            className="info-button-icon" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onView(event);
                            }}
                            aria-label="Details anzeigen"
                        >
                                i
                        </button>
                    </div>
                </div>
                
                <p className="event-description">{event.description}</p>
                
                <div className="event-meta">
                    <div className="meta-item primary">
                        <FaRegCalendarAlt className="meta-icon" />
                        <div className="meta-content">
                            <span className="meta-label">Datum & Zeit</span>
                            <span className="meta-value">{eventDate} • {eventStartTime} - {eventEndTime}</span>
                        </div>
                    </div>

                    <div className="meta-item">
                        <FaUserCheck className="meta-icon" />
                        <div className="meta-content">
                            <span className="meta-label">Anmeldungen</span>
                            <span className="meta-value">{registrationCount}</span>
                        </div>
                    </div>

                    {event.registrationsSendingAt && (
                        <div className="meta-item">
                            <FaCalendarCheck className="meta-icon" />
                            <div className="meta-content">
                                <span className="meta-label">Versanddatum</span>
                                <span className="meta-value">
                                    {formatDateForDisplay(event.registrationsSendingAt)}
                                </span>
                            </div>
                        </div>
                    )}

                    {event.registrationsClosingAt && (
                        <div className="meta-item">
                            <FaCalendarCheck className="meta-icon" />
                            <div className="meta-content">
                                <span className="meta-label">Anmeldeschluss</span>
                                <span className="meta-value">
                                    {formatDateForDisplay(event.registrationsClosingAt)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Registrierte Kandidaten anzeigen - nur für Owner (und nicht im readonly-Modus) */}
                {!readonly && state.isOwner && state.registeredCandidates.length > 0 && (
                    <div className="registered-candidates-section">
                        <div className="registered-candidates-header">
                            <h4>Registrierte Kandidaten ({state.registeredCandidates.length})</h4>
                            <button 
                                className="toggle-candidates-btn" 
                                onClick={toggleCandidatesView}
                            >
                                {state.showRegisteredCandidates ? '▼' : '▶'}
                            </button>
                        </div>
                        {state.showRegisteredCandidates && (
                            <div className="registered-candidates-list">
                                {state.registeredCandidates.map((candidate: RegisteredCandidate, index: number) => (
                                    <div key={`registered-${candidate.candidateId}-${index}`} className="registered-candidate-item">
                                        {candidate.firstName} {candidate.lastName}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Kandidaten hinzufügen Section - nur für Owner (und nicht im readonly-Modus) */}
                {!readonly && state.isOwner && !state.showAddCandidate && (
                    <div className="add-candidate-footer">
                        <button 
                            className="btn-add-candidate-card" 
                            onClick={handleShowAddCandidate}
                        >
                            <FaUserPlus /> Kandidat hinzufügen
                        </button>
                    </div>
                )}

                {/* Kandidaten-Auswahl Dropdown (nur nicht im readonly-Modus) */}
                {!readonly && state.isOwner && state.showAddCandidate && (
                    <div className="candidate-dropdown">
                        <div className="candidate-dropdown-header">
                            <h4>Kandidat auswählen</h4>
                            <button 
                                className="close-dropdown" 
                                onClick={handleCancelAddCandidate}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="candidate-dropdown-list">
                            {state.loading ? (
                                <div className="loading-state">Lade Kandidaten...</div>
                            ) : state.availableCandidates.length > 0 ? (
                                state.availableCandidates.map((candidate: Candidate, index: number) => (
                                    <div 
                                        key={`${candidate.id}-${index}`}
                                        className="candidate-dropdown-item"
                                        onClick={() => handleAddCandidate(candidate.id)}
                                    >
                                        <span className="candidate-name">
                                            {candidate.firstName} {candidate.lastName}
                                        </span>
                                        <span className="candidate-email">{candidate.email}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="no-candidates">Alle Kandidaten sind bereits registriert</div>
                            )}
                        </div>
                    </div>
                )}
                <div className="event-footer">
                    <span className="event-creator">
                        {event.createdByFirstName} {event.createdByLastName}
                    </span>
                    <span className="event-date">
                        {formatDateForDisplay(event.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default EventCard;