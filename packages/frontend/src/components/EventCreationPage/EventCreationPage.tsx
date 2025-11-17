import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import "./EventCreationPage.scss";
import type { Event, EventForm, Session } from "../../types/Event";
import { eventsAPI } from "../../api/eventsAPI";
import { lookupAPI, type Location, type EventType } from "../../api/lookupAPI";
import { formatDateForInput, formatTimeForInput } from "../../utils/formatSyntax";


interface EventCreationPageProps {
  event?: Event | null;
  onBack: () => void;
  onSuccess?: () => void;
}

// Simplified candidate display interface
interface CandidateDisplay {
  id: string;
  name: string;
  email: string;
}

const EventCreationPage = ({ event, onBack, onSuccess }: EventCreationPageProps) => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([
    { id: "1", date: "", startTime: "09:00", endTime: "17:00", location: "" }
  ]);
  const [candidates, setCandidates] = useState<CandidateDisplay[]>([]);
  const [candidateSearch, setCandidateSearch] = useState("");
  
  const [formData, setFormData] = useState<EventForm>({
    title: "",
    description: "",
    branchId: undefined,
    templateId: undefined,
    locationId: undefined,
    registrationRequired: false,
    dateAt: "",
    startingAt: "",
    endingAt: "",
    invitationsSendingAt: "",
    registrationsClosingAt: "",
  });

  // Load locations and event types on mount
  useEffect(() => {
    const loadLookupData = async () => {
      setLoadingLookups(true);
      try {
        const [locationsData, eventTypesData] = await Promise.all([
          lookupAPI.getLocations(),
          lookupAPI.getEventTypes(),
        ]);
        setLocations(locationsData);
        setEventTypes(eventTypesData);
      } catch (err: any) {
        console.error("Error loading data:", err);
      } finally {
        setLoadingLookups(false);
      }
    };
    loadLookupData();
  }, []);

  // Pre-fill form if editing an event
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        branchId: event.branchId || undefined,
        templateId: event.templateId || undefined,
        locationId: event.locationId || undefined,
        registrationRequired: event.registrationRequired || false,
        dateAt: formatDateForInput(event.dateAt) || "",
        startingAt: formatTimeForInput(event.startingAt) || "",
        endingAt: formatTimeForInput(event.endingAt) || "",
        invitationsSendingAt: formatDateForInput(event.invitationsSendingAt) || "",
        registrationsClosingAt: formatDateForInput(event.registrationsClosingAt) || "",
      });

      // Pre-fill sessions if they exist
      if (event.sessions && event.sessions.length > 0) {
        setSessions(event.sessions.map((s, index) => ({
          id: s.id?.toString() || index.toString(),
          date: formatDateForInput(s.date) || "",
          startTime: formatTimeForInput(s.startTime) || "",
          endTime: formatTimeForInput(s.endTime) || "",
          location: s.location || ""
        })));
      }

      // Pre-fill candidates if they exist
      if (event.candidates && event.candidates.length > 0) {
        setCandidates(event.candidates.map(c => ({
          id: c.id.toString(),
          name: `${c.firstName} ${c.lastName}`,
          email: c.email
        })));
      }
    }
  }, [event]);

  // Auto-fill from template when template is selected
  const handleTemplateChange = (templateValue: string) => {
    if (!templateValue) {
      setFormData(prev => ({ ...prev, templateId: undefined }));
      return;
    }
    const templateId = Number(templateValue);
    const selectedTemplate = eventTypes.find(t => t.templateId === templateId);
    if (selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        templateId,
        title: selectedTemplate.title,
        description: selectedTemplate.description || prev.description,
        locationId: selectedTemplate.locationId,
        registrationRequired: selectedTemplate.registrationsRequired,
        startingAt: selectedTemplate.startingAt || prev.startingAt,
        endingAt: selectedTemplate.endingAt || prev.endingAt,
      }));
    } else {
      setFormData(prev => ({ ...prev, templateId }));
    }
  };

  const handleRegistrationToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      registrationRequired: checked,
      invitationsSendingAt: checked ? prev.invitationsSendingAt : "",
      registrationsClosingAt: checked ? prev.registrationsClosingAt : "",
    }));
  };

  const addSession = () => {
    setSessions([
      ...sessions,
      {
        id: Date.now().toString(),
        date: "",
        startTime: "09:00",
        endTime: "17:00",
        location: ""
      }
    ]);
  };

  const updateSession = (id: string, field: keyof Session, value: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSession = (id: string) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter(s => s.id !== id));
    }
  };

  const addCandidate = (candidate: CandidateDisplay) => {
    if (!candidates.some(c => c.email === candidate.email)) {
      setCandidates([...candidates, candidate]);
    }
    setCandidateSearch("");
  };

  const removeCandidate = (id: string) => {
    setCandidates(candidates.filter(c => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      if (event) {
        await eventsAPI.update(event.id, formData);
      } else {
        await eventsAPI.create(formData);
      }

      if (onSuccess) {
        onSuccess();
      }
      onBack();
    } catch (err: any) {
      console.error("Error saving event:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-creation-page">
      <div className="event-creation-header">
        <button className="back-button" onClick={onBack} type="button">
          <FaArrowLeft />
          <span>Zurück</span>
        </button>
        <div>
          <h1 className="page-title">{event ? "Edit Event" : "Create Event"}</h1>
          <p className="page-subtitle">Select a template to get started quickly</p>
        </div>
      </div>

      <div className="event-creation-content">
        {loadingLookups ? (
          <div className="loading-state">
            <p>Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="event-form">
            {/* Event Template Card */}
            <div className="form-card">
              <div className="card-header">
                <h3 className="card-title">Event Template</h3>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <select
                    className="form-select"
                    value={formData.templateId || ""}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                  >
                    <option value="">Select a template...</option>
                    {eventTypes.map((template) => (
                      <option key={template.templateId} value={template.templateId}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Show form only if template is selected */}
            {formData.templateId && (
              <>
                {/* Event Information Card */}
                <div className="form-card">
                  <div className="card-header">
                    <h3 className="card-title">Event Information</h3>
                  </div>
                  <div className="card-content">
                    <div className="form-group">
                      <label htmlFor="title" className="form-label">
                        Title
                      </label>
                      <input
                        id="title"
                        type="text"
                        className="form-input"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="description" className="form-label">
                        Description
                      </label>
                      <textarea
                        id="description"
                        className="form-textarea"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="location" className="form-label">
                        Location
                      </label>
                      <select
                        id="location"
                        className="form-select"
                        value={formData.locationId || ""}
                        onChange={(e) => setFormData({ ...formData, locationId: Number(e.target.value) || undefined })}
                        required
                      >
                        <option value="">Select location...</option>
                        {locations.map((location) => (
                          <option key={location.locationId} value={location.locationId}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Registration & Candidates Card */}
                <div className="form-card">
                  <div className="card-header">
                    <h3 className="card-title">Registration & Candidates</h3>
                  </div>
                  <div className="card-content">
                    <div className="checkbox-wrapper">
                      <input
                        id="needsRegistration"
                        type="checkbox"
                        className="form-checkbox"
                        checked={formData.registrationRequired || false}
                        onChange={(e) => handleRegistrationToggle(e.target.checked)}
                      />
                      <label htmlFor="needsRegistration" className="checkbox-label">
                        This event requires registration
                      </label>
                    </div>

                    {formData.registrationRequired && (
                      <div className="registration-dates">
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="invitationsSendingAt" className="form-label">
                              Registration Opens
                            </label>
                            <input
                              id="invitationsSendingAt"
                              type="date"
                              className="form-input"
                              value={formData.invitationsSendingAt}
                              onChange={(e) => setFormData({ ...formData, invitationsSendingAt: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="registrationsClosingAt" className="form-label">
                              Registration Closes
                            </label>
                            <input
                              id="registrationsClosingAt"
                              type="date"
                              className="form-input"
                              value={formData.registrationsClosingAt}
                              onChange={(e) => setFormData({ ...formData, registrationsClosingAt: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="candidates-section">
                      <label className="form-label">
                        Registered Candidates ({candidates.length})
                      </label>
                      <div className="candidates-list">
                        {candidates.map((candidate) => (
                          <div key={candidate.id} className="candidate-item">
                            <div className="candidate-info">
                              <p className="candidate-name">{candidate.name}</p>
                              <p className="candidate-email">{candidate.email}</p>
                            </div>
                            <button
                              type="button"
                              className="remove-button"
                              onClick={() => removeCandidate(candidate.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                        <div className="candidate-search">
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Search by email or name..."
                            value={candidateSearch}
                            onChange={(e) => setCandidateSearch(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && candidateSearch.trim()) {
                                e.preventDefault();
                                addCandidate({
                                  id: Date.now().toString(),
                                  name: candidateSearch,
                                  email: candidateSearch
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Card */}
                <div className="form-card">
                  <div className="card-header">
                    <h3 className="card-title">Schedule - Daily Sessions</h3>
                  </div>
                  <div className="card-content">
                    {sessions.map((session, idx) => (
                      <div key={session.id} className="session-item">
                        <div className="session-content">
                          <div className="session-fields">
                            <div className="form-row-three">
                              <div className="form-group">
                                <label className="form-label-small">Day {idx + 1}</label>
                                <input
                                  type="date"
                                  className="form-input"
                                  value={session.date}
                                  onChange={(e) => updateSession(session.id, "date", e.target.value)}
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label-small">Start</label>
                                <input
                                  type="time"
                                  className="form-input"
                                  value={session.startTime}
                                  onChange={(e) => updateSession(session.id, "startTime", e.target.value)}
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label-small">End</label>
                                <input
                                  type="time"
                                  className="form-input"
                                  value={session.endTime}
                                  onChange={(e) => updateSession(session.id, "endTime", e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                            <div className="form-group">
                              <label className="form-label-small">Location</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Room 101"
                                value={session.location}
                                onChange={(e) => updateSession(session.id, "location", e.target.value)}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => removeSession(session.id)}
                            disabled={sessions.length === 1}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="add-button" onClick={addSession}>
                      <FaPlus />
                      <span>Add Day</span>
                    </button>
                  </div>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? "Saving..." : event ? "Save Changes" : "Create Event"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default EventCreationPage;
