import { useState, useEffect } from "react";
import "~/components/ReportCreationModal/ReportCreationModal.scss";
import type { Event } from "../../types/Event";
import type { CandidateForReport } from "../../types/Report";
import { recruitersAPI } from "../../api/recruitersAPI";
import { reportsAPI } from "../../api/reportsAPI";
import { FaArrowLeft, FaCheck } from "react-icons/fa";

interface ReportCreationModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CandidateWithReport extends CandidateForReport {
  isSubmitting?: boolean;
  submitted?: boolean;
}

const ReportCreationModal = ({ event, isOpen, onClose, onSuccess }: ReportCreationModalProps) => {
  const [candidates, setCandidates] = useState<CandidateWithReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCandidates();
    }
  }, [isOpen, event.id]);

  const loadCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const registrations = await recruitersAPI.getEventRegistrations(event.id);
      const candidatesList = registrations.registrations.map((r: any) => ({
        candidateId: r.candidateId,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        status: 'Normal' as const,
        isSubmitting: false,
        submitted: false
      }));
      setCandidates(candidatesList);
    } catch (err: any) {
      setError(`Fehler beim Laden der Kandidaten: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (
    candidateId: number,
    status: 'Favorit' | 'Normal' | 'Eliminiert',
    attendance: 'Angemeldet' | 'Anwesend' | 'Abwesend' | 'Spontan',
    comment: string
  ) => {
    // Update candidate to show submitting state
    setCandidates(prev => prev.map(c => 
      c.candidateId === candidateId ? { ...c, isSubmitting: true } : c
    ));

    try {
      await reportsAPI.createReport(event.id, {
        candidateId,
        status,
        attendance,
        comment: comment || undefined
      });

      // Mark as submitted
      setCandidates(prev => prev.map(c => 
        c.candidateId === candidateId ? { ...c, isSubmitting: false, submitted: true } : c
      ));

      // Close expanded form
      setExpandedCandidate(null);

      // Trigger refresh/callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(`Fehler beim Speichern: ${err.message}`);
      // Reset submitting state
      setCandidates(prev => prev.map(c => 
        c.candidateId === candidateId ? { ...c, isSubmitting: false } : c
      ));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-creation-modal-overlay">
      <div className="report-creation-modal">
        <div className="report-modal-header">
          <button className="back-button" onClick={onClose} aria-label="Zurück">
            <FaArrowLeft />
          </button>
          <div className="header-content">
            <h2>Report erstellen</h2>
            <p className="event-title-subtitle">{event.title}</p>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>

        <div className="report-modal-content">
          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <p>Lade registrierte Kandidaten...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="empty-state">
              <p>Keine registrierten Kandidaten für dieses Event</p>
            </div>
          ) : (
            <div className="candidates-list">
              {candidates.map((candidate) => (
                <ReportCandidateForm
                  key={candidate.candidateId}
                  candidate={candidate}
                  isExpanded={expandedCandidate === candidate.candidateId}
                  onExpand={() => setExpandedCandidate(expandedCandidate === candidate.candidateId ? null : candidate.candidateId)}
                  onSubmit={handleSubmitReport}
                  isSubmitting={candidate.isSubmitting || false}
                  isSubmitted={candidate.submitted || false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ReportCandidateFormProps {
  candidate: CandidateWithReport;
  isExpanded: boolean;
  onExpand: () => void;
  onSubmit: (candidateId: number, status: 'Favorit' | 'Normal' | 'Eliminiert', attendance: 'Angemeldet' | 'Anwesend' | 'Abwesend' | 'Spontan', comment: string) => void;
  isSubmitting: boolean;
  isSubmitted: boolean;
}

const ReportCandidateForm = ({ 
  candidate, 
  isExpanded, 
  onExpand, 
  onSubmit,
  isSubmitting,
  isSubmitted
}: ReportCandidateFormProps) => {
  const [status, setStatus] = useState<'Favorit' | 'Normal' | 'Eliminiert'>('Normal');
  const [attendance, setAttendance] = useState<'Angemeldet' | 'Anwesend' | 'Abwesend' | 'Spontan'>('Angemeldet');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(candidate.candidateId, status, attendance, comment);
  };

  return (
    <div className={`candidate-report-item ${isExpanded ? 'expanded' : ''} ${isSubmitted ? 'submitted' : ''}`}>
      <div className="candidate-report-header" onClick={onExpand}>
        <div className="candidate-info">
          <h4 className="candidate-name">
            {candidate.firstName} {candidate.lastName}
          </h4>
          <p className="candidate-email">{candidate.email}</p>
        </div>
        <div className="candidate-actions">
          {isSubmitted && (
            <div className="submitted-badge">
              <FaCheck /> Report erstellt
            </div>
          )}
          <button className="expand-toggle" disabled={isSubmitted}>
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && !isSubmitted && (
        <form className="candidate-report-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor={`status-${candidate.candidateId}`}>Status</label>
            <select
              id={`status-${candidate.candidateId}`}
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Favorit' | 'Normal' | 'Eliminiert')}
              required
              disabled={isSubmitting}
            >
              <option value="Normal">Normal</option>
              <option value="Favorit">Favorit</option>
              <option value="Eliminiert">Eliminiert</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor={`attendance-${candidate.candidateId}`}>Anwesenheit</label>
            <select
              id={`attendance-${candidate.candidateId}`}
              value={attendance}
              onChange={(e) => setAttendance(e.target.value as 'Angemeldet' | 'Anwesend' | 'Abwesend' | 'Spontan')}
              required
              disabled={isSubmitting}
            >
              <option value="Angemeldet">Angemeldet</option>
              <option value="Anwesend">Anwesend</option>
              <option value="Abwesend">Abwesend</option>
              <option value="Spontan">Spontan</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor={`comment-${candidate.candidateId}`}>Kommentar</label>
            <textarea
              id={`comment-${candidate.candidateId}`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Notizen zu diesem Kandidaten..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit-report"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Speichern...' : 'Report speichern'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportCreationModal;
