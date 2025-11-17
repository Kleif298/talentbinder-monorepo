import React, { useState, useEffect } from "react"
import "./EventModal.scss"
import { eventsAPI } from "../../api/eventsAPI"
import { recruitersAPI } from "../../api/recruitersAPI"
import { usersAPI } from "../../api/usersAPI"
import type { EventForm, Event } from "../../types/Event"

interface Account {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface EventModalProps {
  eventToEdit?: Event | null;
  onSave?: (event: EventForm) => Promise<void>;
  onClose?: () => void;
  onDelete?: (eventId: number) => void;
}

const EventModal = ({ eventToEdit, onSave, onClose, onDelete }: EventModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<number | string>("")
  const [pendingRecruiters, setPendingRecruiters] = useState<number[]>([])
  const [eventRecruiters, setEventRecruiters] = useState<Account[]>([])
  const [recruiterLoading, setRecruiterLoading] = useState(false)
  const [recruiterError, setRecruiterError] = useState("")
  const [formData, setFormData] = useState<EventForm>({
    title: "",
    description: "",
    startingAt: "",
    endingAt: "",
    invitationsSendingAt: "",
    registrationsClosingAt: "",
  });

  // Lade verfügbare Accounts beim Mount
  useEffect(() => {
    const loadAccounts = async () => {
      const accountsData = await usersAPI.getAll();
      setAccounts(accountsData);
    };
    loadAccounts();
  }, []);

  // Wenn eventToEdit sich ändert, lade die Daten ins Form und die Recruiter
  useEffect(() => {
    if (eventToEdit) {
      // Konvertiere ISO-Datum zu datetime-local Format (YYYY-MM-DDTHH:mm)
      const formatDateTimeLocal = (isoString: string | undefined) => {
        if (!isoString) return "";
        try {
          const date = new Date(isoString);
          // Prüfe ob das Datum gültig ist
          if (isNaN(date.getTime())) return "";
          // Format: YYYY-MM-DDTHH:mm
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return "";
        }
      };

      // Konvertiere ISO-Datum zu date Format (YYYY-MM-DD)
      const formatDate = (isoString: string | undefined) => {
        if (!isoString) return "";
        try {
          const date = new Date(isoString);
          if (isNaN(date.getTime())) return "";
          return date.toISOString().split('T')[0];
        } catch {
          return "";
        }
      };

      // Konvertiere endingAt (ISO zu datetime-local Format)
      const formatEndingAt = (endingAt: string | undefined) => {
        if (!endingAt) return "";
        try {
          const date = new Date(endingAt);
          if (isNaN(date.getTime())) return "";
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return "";
        }
      };

      setFormData({
        title: eventToEdit.title || "",
        description: eventToEdit.description || "",
        startingAt: formatDateTimeLocal(eventToEdit.startingAt),
        endingAt: formatEndingAt(eventToEdit.endingAt),
        invitationsSendingAt: formatDate(eventToEdit.invitationsSendingAt),
        registrationsClosingAt: formatDate(eventToEdit.registrationsClosingAt),
      })
      loadEventRecruiters(eventToEdit.id);
      setIsOpen(true)
    }
  }, [eventToEdit])

  const loadEventRecruiters = async (eventId: number) => {
    try {
      const recruiters = await recruitersAPI.getEventRecruiters(eventId);
      setEventRecruiters(recruiters);
    } catch (err: any) {
      console.error("Fehler beim Laden der Event-Recruiter:", err);
      setEventRecruiters([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddRecruiter = () => {
    if (!selectedRecruiterId) {
      setRecruiterError("Bitte wählen Sie einen Recruiter aus");
      return;
    }

    const recruiterId = Number(selectedRecruiterId);

    // Im Create-Modus: Füge zu pending list hinzu
    if (!eventToEdit) {
      if (pendingRecruiters.includes(recruiterId)) {
        setRecruiterError("Dieser Recruiter ist bereits in der Liste");
        return;
      }
      setPendingRecruiters([...pendingRecruiters, recruiterId]);
      setSelectedRecruiterId("");
      setRecruiterError("");
      return;
    }

    // Im Edit-Modus: Füge direkt zur API hinzu
    setRecruiterLoading(true);
    setRecruiterError("");

    recruitersAPI.addRecruiterToEvent(eventToEdit.id, recruiterId)
      .then(() => loadEventRecruiters(eventToEdit.id))
      .then(() => {
        setSelectedRecruiterId("");
        setRecruiterError("");
      })
      .catch((err: any) => {
        setRecruiterError(err.message || "Fehler beim Hinzufügen des Recruiters");
        console.error(err);
      })
      .finally(() => {
        setRecruiterLoading(false);
      });
  };

  const handleRemoveRecruiter = (recruiterId: number) => {
    // Im Create-Modus: Entferne von pending list
    if (!eventToEdit) {
      setPendingRecruiters(pendingRecruiters.filter(id => id !== recruiterId));
      return;
    }

    // Im Edit-Modus: Lösche direkt von der API
    setRecruiterLoading(true);
    setRecruiterError("");

    recruitersAPI.removeRecruiterFromEvent(eventToEdit.id, recruiterId)
      .then(() => loadEventRecruiters(eventToEdit.id))
      .catch((err: any) => {
        setRecruiterError(err.message || "Fehler beim Entfernen des Recruiters");
        console.error(err);
      })
      .finally(() => {
        setRecruiterLoading(false);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.title || !formData.startingAt) {
      setError("Titel und Startdatum sind erforderlich")
      return
    }

    setLoading(true)

    try {
      // Konvertiere datetime-local Format zu ISO-String
      const convertToISO = (dateTimeLocal: string | undefined) => {
        if (!dateTimeLocal) return undefined;
        try {
          const date = new Date(dateTimeLocal);
          if (isNaN(date.getTime())) return undefined;
          return date.toISOString();
        } catch {
          return undefined;
        }
      };

      // Konvertiere date Format zu ISO-String (nur Datum, ohne Zeit)
      const convertDateToISO = (dateString: string | undefined) => {
        if (!dateString) return undefined;
        try {
          // Füge Zeit 00:00:00 hinzu und konvertiere zu ISO
          const date = new Date(dateString + 'T00:00:00');
          if (isNaN(date.getTime())) return undefined;
          return date.toISOString();
        } catch {
          return undefined;
        }
      };

      // Konvertiere endingAt (datetime-local zu ISO)
      const convertEndingAtToISO = (endingAtString: string | undefined) => {
        if (!endingAtString) return undefined;
        try {
          const date = new Date(endingAtString);
          if (isNaN(date.getTime())) return undefined;
          return date.toISOString();
        } catch {
          return undefined;
        }
      };

      const eventDataToSend: EventForm = {
        title: formData.title,
        description: formData.description,
        startingAt: convertToISO(formData.startingAt),
        endingAt: convertEndingAtToISO(formData.endingAt),
        invitationsSendingAt: convertDateToISO(formData.invitationsSendingAt),
        registrationsClosingAt: convertDateToISO(formData.registrationsClosingAt),
      };

      let eventId: number | null = null;

      if (eventToEdit) {
        // Edit-Modus: Event existiert bereits
        if (onSave) {
          await onSave(eventDataToSend)
        }
        eventId = eventToEdit.id
      } else {
        // Create-Modus: Event wird neu erstellt
        if (onSave) {
          await onSave(eventDataToSend);
          // Im Create-Modus haben wir keine eventId zurück von onSave,
          // daher können wir keine Recruiter hinzufügen
          // Das muss in der Parent-Komponente gehandhabt werden
        } else {
          const response = await eventsAPI.create(eventDataToSend)
          eventId = response.id
        }
      }

      // Wenn im Create-Modus ohne onSave und pending Recruiter existieren, füge sie hinzu
      if (!eventToEdit && !onSave && eventId && pendingRecruiters.length > 0) {
        for (const recruiterId of pendingRecruiters) {
          try {
            await recruitersAPI.addRecruiterToEvent(eventId, recruiterId);
          } catch (err) {
            console.error(`Fehler beim Hinzufügen von Recruiter ${recruiterId}:`, err);
          }
        }
      }

      // Bei Erfolg sofort schließen
      handleClose()
    } catch (err: any) {
      // Bei Fehler anzeigen und nicht schließen
      setError(err.message || "Fehler beim Speichern des Events")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setFormData({
      title: "",
      description: "",
      startingAt: "",
      endingAt: "",
      invitationsSendingAt: "",
      registrationsClosingAt: "",
    })
    setError("")
    setSuccess("")
    setPendingRecruiters([])
    setEventRecruiters([])
    setSelectedRecruiterId("")
    setRecruiterError("")
    if (onClose) onClose()
  }

  const handleDelete = () => {
    if (eventToEdit && onDelete && window.confirm("Sind Sie sicher, dass Sie dieses Event löschen möchten?")) {
      onDelete(eventToEdit.id);
      handleClose();
    }
  }

  const modalTitle = eventToEdit ? "Event bearbeiten" : "Event erstellen"

  return (
    <>
      {!eventToEdit && (
        <button className="modal-trigger" onClick={() => setIsOpen(true)}>
          Event erstellen
        </button>
      )}

      {isOpen && (
        <>
          <div className="modal-overlay"/>
          <div className="modal">
            <div className="modal-header">
              <h2>{modalTitle}</h2>
              <button className="modal-close" onClick={handleClose}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="title">Titel *</label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    placeholder="z.B. Recruiting Event 2025"
                    value={formData.title || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Beschreibung</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Beschreibe das Event..."
                    value={formData.description || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startingAt">Startdatum & Zeit *</label>
                    <input
                      id="startingAt"
                      type="datetime-local"
                      name="startingAt"
                      value={formData.startingAt || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endingAt">Enddatum & Zeit</label>
                    <input
                      id="endingAt"
                      type="datetime-local"
                      name="endingAt"
                      placeholder="z.B. Enddatum & Zeit"
                      value={formData.endingAt || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="invitationsSendingAt">Einladungen senden am</label>
                    <input
                      id="invitationsSendingAt"
                      type="date"
                      name="invitationsSendingAt"
                      value={formData.invitationsSendingAt || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="registrationsClosingAt">Anmeldeschluss</label>
                    <input
                      id="registrationsClosingAt"
                      type="date"
                      name="registrationsClosingAt"
                      value={formData.registrationsClosingAt || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Verantwortliche (Recruiters) Sektion */}
                <div className="recruiters-section">
                  <h3>Verantwortliche</h3>
                  
                  <div className="form-group">
                    <label htmlFor="recruiterSelect">Verantwortliche hinzufügen</label>
                    <div className="recruiter-add-group">
                      <select
                        id="recruiterSelect"
                        value={selectedRecruiterId}
                        onChange={(e) => setSelectedRecruiterId(e.target.value)}
                        disabled={recruiterLoading}
                      >
                        <option value="">-- Account wählen --</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.first_name} {account.last_name} ({account.email})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleAddRecruiter}
                        disabled={recruiterLoading || !selectedRecruiterId}
                      >
                        {recruiterLoading ? "Wird hinzugefügt..." : "Hinzufügen"}
                      </button>
                    </div>
                    {recruiterError && <div className="error-message">{recruiterError}</div>}
                  </div>

                  {/* Liste der Verantwortlichen - im Create-Modus: pending, im Edit-Modus: gespeichert */}
                  {(eventRecruiters.length > 0 || pendingRecruiters.length > 0) && (
                    <div className="recruiters-list">
                      <h4>Zugewiesene Verantwortliche:</h4>
                      <ul>
                        {eventToEdit ? (
                          // Edit-Modus: Zeige gespeicherte Recruiter
                          eventRecruiters.map((recruiter) => (
                            <li key={recruiter.id}>
                              <div className="recruiter-info">
                                <span className="recruiter-name">
                                  {recruiter.first_name} {recruiter.last_name}
                                </span>
                                <span className="recruiter-email">{recruiter.email}</span>
                              </div>
                              <button
                                type="button"
                                className="btn btn-small btn-danger"
                                onClick={() => handleRemoveRecruiter(recruiter.id)}
                                disabled={recruiterLoading}
                              >
                                Entfernen
                              </button>
                            </li>
                          ))
                        ) : (
                          // Create-Modus: Zeige pending Recruiter
                          pendingRecruiters.map((recruiterId) => {
                            const recruiter = accounts.find(a => a.id === recruiterId);
                            return recruiter ? (
                              <li key={recruiter.id}>
                                <div className="recruiter-info">
                                  <span className="recruiter-name">
                                    {recruiter.first_name} {recruiter.last_name}
                                  </span>
                                  <span className="recruiter-email">{recruiter.email}</span>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-small btn-danger"
                                  onClick={() => handleRemoveRecruiter(recruiter.id)}
                                  disabled={recruiterLoading}
                                >
                                  Entfernen
                                </button>
                              </li>
                            ) : null;
                          })
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
              </form>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                Abbrechen
              </button>
              {eventToEdit && onDelete && (
                <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                  Löschen
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Wird gespeichert..." : "Speichern"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default EventModal;