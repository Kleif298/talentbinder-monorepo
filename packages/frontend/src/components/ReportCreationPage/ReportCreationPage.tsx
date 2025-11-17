import { useState, useEffect } from "react";
import "~/components/ReportCreationPage/ReportCreationPage.scss";
import type { Event } from "../../types/Event";
import type { CandidateForReport } from "../../types/Report";
import { recruitersAPI } from "../../api/recruitersAPI";
import { reportsAPI } from "../../api/reportsAPI";
import { getAccountId } from "../../utils/auth";
import { FaArrowLeft, FaCheck } from "react-icons/fa";

interface ReportCreationPageProps {
  event: Event;
  onBack: () => void;
  onSuccess?: () => void;
}

interface CandidateWithState extends CandidateForReport {
  isAttentive: boolean;
  isSubmitting?: boolean;
  isSubmitted?: boolean;
  existingReports?: ExistingReport[];
}

interface ExistingReport {
  attendanceId: number;
  attendance: string;
  status: string;
  comment?: string;
  createdAt: string;
  createdBy: number;
  creatorFirstName: string;
  creatorLastName: string;
  creatorEmail: string;
  isOwnReport?: boolean;
}

const ReportCreationPage = ({ event, onBack, onSuccess }: ReportCreationPageProps) => {
  const [candidates, setCandidates] = useState<CandidateWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportMessage, setReportMessage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<'Favorit' | 'Normal' | 'Eliminiert'>('Normal');
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Load current user ID and candidates on mount
  useEffect(() => {
    const initializeUser = async () => {
      const userId = await getAccountId();
      setCurrentUserId(userId);
      loadCandidates(userId);  // ⬅️ Pass userId directly
    };
    initializeUser();
  }, [event.id]);

  const loadCandidates = async (userId: number | null) => {  // ⬅️ Accept userId as parameter
    setLoading(true);
    if (!userId) {
      setError("User ID is not available.");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const registrations = await recruitersAPI.getEventRegistrations(event.id);
      const reports = await reportsAPI.getEventReports(event.id);

      const candidatesList = registrations.registrations.map((r: any) => {
        const candidateReports = reports.filter(rep => rep.candidateId === r.candidateId);
        
        return {
          candidateId: r.candidateId,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          status: (r.candidateStatus || 'Normal') as 'Favorit' | 'Normal' | 'Eliminiert',
          isAttentive: false,
          isSubmitting: false,
          isSubmitted: false,
          existingReports: candidateReports.map(rep => ({
            ...rep,
            isOwnReport: rep.createdBy === userId
          }))
        };
      });

      setCandidates(candidatesList);
      console.log('Candidates with reports loaded:', candidatesList);
    } catch (err: any) {
      setError(`Fehler beim Laden der Kandidaten: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCandidateAttendance = (candidateId: number) => {
    setCandidates(prev =>
      prev.map(c =>
        c.candidateId === candidateId ? { ...c, isAttentive: !c.isAttentive } : c
      )
    );
  };

  const selectCandidateForEdit = (candidateId: number) => {
    console.log("Selecting candidate:", candidateId);
    setSelectedCandidate(candidateId);
    
    // Check if user already has a report for this candidate
    const candidate = candidates.find(c => c.candidateId === candidateId);
    if (candidate && candidate.existingReports) {
      const ownReport = candidate.existingReports.find(r => r.isOwnReport);
      console.log("Own report found:", ownReport);
      if (ownReport) {
        // Auto-populate form with existing report
        setEditingReportId(ownReport.attendanceId);
        setReportMessage(ownReport.comment || "");
        setSelectedStatus(ownReport.status as 'Favorit' | 'Normal' | 'Eliminiert');
        // Set attendance checkbox based on existing report
        setCandidates(prev =>
          prev.map(c =>
            c.candidateId === candidateId 
              ? { ...c, isAttentive: ownReport.attendance === 'Anwesend' } 
              : c
          )
        );
        return;
      }
    }
    
    // No existing report, reset form for new entry
    setEditingReportId(null);
    setReportMessage("");
    setSelectedStatus('Normal');
  };

  const handleSubmitReport = async () => {
    console.log("Submitting report for candidate:", selectedCandidate);
    if (!selectedCandidate) return;

    const candidate = candidates.find(c => c.candidateId === selectedCandidate);
    if (!candidate) return;

    // Update candidate to show submitting state
    setCandidates(prev =>
      prev.map(c =>
        c.candidateId === selectedCandidate ? { ...c, isSubmitting: true } : c
      )
    );

    try {
      if (editingReportId) {
        // Update existing report
        await reportsAPI.updateReport(event.id, selectedCandidate, {
          candidateId: selectedCandidate,
          status: selectedStatus,
          attendance: candidate.isAttentive ? 'Anwesend' : 'Abwesend',
          comment: reportMessage || undefined
        });
      } else {
        // Create new report
        await reportsAPI.createReport(event.id, {
          candidateId: selectedCandidate,
          status: selectedStatus,
          attendance: candidate.isAttentive ? 'Anwesend' : 'Abwesend',
          comment: reportMessage || undefined
        });
      }

      // Mark as submitted
      setCandidates(prev =>
        prev.map(c =>
          c.candidateId === selectedCandidate
            ? { ...c, isSubmitting: false, isSubmitted: true }
            : c
        )
      );

      // Reset form
      setReportMessage("");
      setSelectedStatus('Normal');
      setSelectedCandidate(null);
      setEditingReportId(null);

      // Reload to get updated reports
      await loadCandidates(currentUserId!);

      // Trigger refresh/callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(`Fehler beim Speichern: ${err.message}`);
      // Reset submitting state
      setCandidates(prev =>
        prev.map(c =>
          c.candidateId === selectedCandidate ? { ...c, isSubmitting: false } : c
        )
      );
    }
  };

  const selectedCandidateData = candidates.find(c => c.candidateId === selectedCandidate);

  return (
    <div className="report-creation-page">
      <div className="report-page-header">
        <button className="back-button" onClick={onBack} aria-label="Zurück zur Event-Liste">
          <FaArrowLeft />
          <span>Zurück</span>
        </button>
        <div className="report-page-title-section">
          <h2>Report für: {event.title}</h2>
          <p className="event-date">
            {new Date(event.startingAt).toLocaleDateString('de-DE', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="report-page-content">
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
          <div className="report-page-main">
            <div className="candidates-list-section">
              <div className="candidates-list-header">
                <h3>Registrierte Kandidaten ({candidates.length})</h3>
                <p className="submitted-count">
                  {candidates.filter(c => c.existingReports && c.existingReports.length > 0).length} mit Reports
                </p>
              </div>

              <div className="candidates-list">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.candidateId}
                    className={`candidate-item ${selectedCandidate === candidate.candidateId ? 'selected' : ''} ${candidate.existingReports && candidate.existingReports.length > 0 ? 'has-reports' : ''}`}
                    onClick={() => selectCandidateForEdit(candidate.candidateId)}
                  >
                    <div className="candidate-checkbox-section">
                      <input
                        type="checkbox"
                        className="attendance-checkbox"
                        checked={candidate.isAttentive}
                        onChange={() => toggleCandidateAttendance(candidate.candidateId)}
                        aria-label={`${candidate.firstName} ${candidate.lastName} Anwesenheit`}
                      />
                      <div className="checkbox-label">
                        {candidate.isAttentive ? 'Anwesend' : 'Abwesend'}
                      </div>
                    </div>

                    <div className="candidate-info">
                      <p className="candidate-name">
                        {candidate.firstName} {candidate.lastName}
                      </p>
                      <p className="candidate-email">{candidate.email}</p>
                    </div>

                    {candidate.existingReports && candidate.existingReports.length > 0 && (
                      <div className="reports-badge">
                        <FaCheck /> {candidate.existingReports.length} Report{candidate.existingReports.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedCandidateData && (
              <div className="report-form-section">
                <div className="form-header">
                  <h3>Report für {selectedCandidateData.firstName} {selectedCandidateData.lastName}</h3>
                  
                  {/* Show who has created reports for this candidate */}
                  {selectedCandidateData.existingReports && selectedCandidateData.existingReports.length > 0 && (
                    <div className="report-creators-info">
                      <span className="creators-label">Reports von:</span>
                      <div className="creators-list">
                        {selectedCandidateData.existingReports.map((report, idx) => (
                          <span key={report.attendanceId} className="creator-name">
                            {report.creatorFirstName} {report.creatorLastName}
                            {idx < selectedCandidateData.existingReports!.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form to create/edit report */}
                <div className="report-form">
                  <div className="form-group">
                    <label htmlFor="status-select">Status</label>
                    <select
                      id="status-select"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as 'Favorit' | 'Normal' | 'Eliminiert')}
                      disabled={selectedCandidateData.isSubmitting}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Favorit">Favorit ⭐</option>
                      <option value="Eliminiert">Eliminiert ✕</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="report-message">Report-Nachricht</label>
                    <textarea
                      id="report-message"
                      value={reportMessage}
                      onChange={(e) => setReportMessage(e.target.value)}
                      placeholder="Notizen zu diesem Kandidaten..."
                      disabled={selectedCandidateData.isSubmitting}
                      rows={5}
                    />
                  </div>

                  <div className="attendance-display">
                    <label>Anwesenheit</label>
                    <div className="attendance-status">
                      {selectedCandidateData.isAttentive ? (
                        <span className="status-badge present">✓ Anwesend</span>
                      ) : (
                        <span className="status-badge absent">✕ Abwesend</span>
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setEditingReportId(null);
                        setReportMessage("");
                        setSelectedStatus('Normal');
                      }}
                      disabled={selectedCandidateData.isSubmitting}
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      className="btn-submit-report"
                      onClick={handleSubmitReport}
                      disabled={selectedCandidateData.isSubmitting}
                    >
                      {selectedCandidateData.isSubmitting ? 'Speichern...' : editingReportId ? 'Report aktualisieren' : 'Report erstellen'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!selectedCandidateData && (
              <div className="no-selection-message">
                <p>Wählen Sie einen Kandidaten aus der Liste, um einen Report zu erstellen oder zu bearbeiten</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCreationPage;
