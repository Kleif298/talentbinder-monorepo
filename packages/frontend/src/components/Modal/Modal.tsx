import "./Modal.scss"
import { useState, useEffect } from "react"
import type { CandidateForm, Candidate } from "../../types/Candidate"

export type { CandidateForm };

const CANDIDATE_STATUSES = ['Normal', 'Favorit', 'Eliminiert'];

// props akzeptieren den zu bearbeitenden Kandidaten
export function ModalCandidates({ candidateToEdit, onSave, onClose, onDelete, apprenticeships = [] }: { candidateToEdit?: Candidate | null, onSave: (candidate: CandidateForm) => void, onClose: () => void, onDelete?: (id: number) => void, apprenticeships?: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Local state for the form (using camelCase)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  // Selected apprenticeships (IDs) and helper for the add-select
  const [selectedApprenticeships, setSelectedApprenticeships] = useState<number[]>([]);
  const [selectedApprenticeshipToAdd, setSelectedApprenticeshipToAdd] = useState<number | "">("");
  const [status, setStatus] = useState<CandidateForm['status']>("Normal")

  // Setze den State, wenn ein Kandidat zum Bearbeiten übergeben wird
  useEffect(() => {
    if (candidateToEdit) {
      setFirstName(candidateToEdit.firstName || "");
      setLastName(candidateToEdit.lastName || "");
      setEmail(candidateToEdit.email || "");
      // Initialize selected apprenticeships from candidate when editing
      const initApps = (candidateToEdit.apprenticeships || []).map((a: any) => a.id);
      setSelectedApprenticeships(initApps);
      setStatus(candidateToEdit.status || "Normal");
      setIsOpen(true); 
    }
  }, [candidateToEdit]);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setSelectedApprenticeships([]);
    setStatus("Normal");
    setError("");
  }

  const handleAddApprenticeship = () => {
    if (!selectedApprenticeshipToAdd) {
      setError("Bitte wählen Sie einen Lehrberuf aus");
      return;
    }
    const id = Number(selectedApprenticeshipToAdd);
    if (selectedApprenticeships.includes(id)) {
      setError("Dieser Lehrberuf ist bereits zugewiesen");
      return;
    }
    setSelectedApprenticeships([...selectedApprenticeships, id]);
    setSelectedApprenticeshipToAdd("");
    setError("");
  };

  const handleRemoveApprenticeship = (id: number) => {
    setSelectedApprenticeships(selectedApprenticeships.filter(i => i !== id));
  };

  const handleSave = async () => {
    setError("");
    
    if (!firstName || !lastName) {
      setError("Vor- und Nachname sind erforderlich");
      return;
    }

    if (selectedApprenticeships.length === 0) {
      setError("Bitte wählen Sie mindestens einen Lehrberuf aus");
      return;
    }

    setLoading(true);

    try {
      const candidate: CandidateForm = {
        firstName,
        lastName,
        email: email || undefined, // Optional email
        // Send both a primary apprenticeshipId for backward compatibility
        // and apprenticeshipIds array for full persistence
        apprenticeshipId: selectedApprenticeships[0] || undefined,
        apprenticeshipIds: selectedApprenticeships.length > 0 ? selectedApprenticeships : undefined,
        status,
      }
      await onSave(candidate)
      handleClose();
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
    onClose();
  }

  const handleDelete = () => {
    if (candidateToEdit && onDelete && window.confirm("Sind Sie sicher, dass Sie diesen Kandidaten löschen möchten?")) {
      onDelete(candidateToEdit.id);
      handleClose();
    }
  }

  const handleOpen = () => {
    resetForm();
    setIsOpen(true);
  }

  return (
    <>
      {!candidateToEdit && (
        <button className="modal-trigger" onClick={handleOpen}>
          Kandidat erstellen
        </button>
      )}


      {isOpen && (
        <>
          <div className="modal-overlay" onClick={handleClose} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>{candidateToEdit ? "Kandidat bearbeiten" : "Kandidat erstellen"}</h2> 
              <button className="modal-close" onClick={handleClose}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="name">
                  <div className="form-group">
                    <label htmlFor="firstName">Vorname *</label>
                    <input id="firstName" type="text" placeholder="Max" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Nachname *</label>
                    <input id="lastName" type="text" placeholder="Mustermann" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email-Adresse (optional)</label>
                  <input id="email" type="email" placeholder="max@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                
                {/* Status-Dropdown aktualisiert */}
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select id="status" value={status} onChange={(e) => setStatus(e.target.value as CandidateForm['status'])}>
                    {CANDIDATE_STATUSES.map(s => (
                      <option key={s} value={s}>{s === 'Favorit' ? '⭐ Favorit' : s === 'Normal' ? '◯ Normal' : '✕ Unpopulär'}</option>
                    ))}
                  </select>
                </div>

                {/* Lehrberuf-Sektion */}
                <div className="form-group">
                  <label htmlFor="jobBranche">Lehrberuf *</label>
                  {apprenticeships && apprenticeships.length > 0 ? (
                    <>
                      <div className="apprenticeship-add-group">
                        <select
                          id="jobBranche"
                          value={selectedApprenticeshipToAdd}
                          onChange={(e) => setSelectedApprenticeshipToAdd(e.target.value ? Number(e.target.value) : "")}
                        >
                          <option value="">-- Wählen Sie einen Lehrberuf --</option>
                          {apprenticeships.map((app: any) => (
                            <option key={app.id} value={app.id}>
                              {app.name || `Beruf ${app.id}`}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="btn btn-secondary" onClick={handleAddApprenticeship} disabled={!selectedApprenticeshipToAdd}>
                          Hinzufügen
                        </button>
                      </div>

                      {/* Liste der ausgewählten Lehrstellen */}
                      {selectedApprenticeships.length > 0 && (
                        <ul className="apprenticeship-list">
                          {selectedApprenticeships.map(id => {
                            const app = apprenticeships.find((a: any) => a.id === id);
                            return app ? (
                              <li key={id} className="apprenticeship-item">
                                <span>{app.name || `Beruf ${app.id}`}</span>
                                <button type="button" className="btn btn-small btn-danger" onClick={() => handleRemoveApprenticeship(id)}>Entfernen</button>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <div className="alert alert-warning">
                      <p>Lehrstellen werden geladen...</p>
                    </div>
                  )}
                </div>

                {error && <div className="error-message">{error}</div>}
              </form>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose}>Abbrechen</button>
              {candidateToEdit && onDelete && (
                <button className="btn btn-danger" onClick={handleDelete}>Löschen</button>
              )}
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? "Speichert..." : (candidateToEdit ? "Aktualisieren" : "Erstellen")}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default ModalCandidates;