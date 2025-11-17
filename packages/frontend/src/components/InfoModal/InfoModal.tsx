import { useEffect, useState } from 'react';
import type { Event } from '../../types/Event';
import { recruitersAPI } from '../../api/recruitersAPI';
import { candidatesAPI } from '../../api/candidatesAPI';
import { isOwnerOfEvent } from '../../utils/auth';
import './InfoModal.scss';

interface InfoModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Recruiter {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Registration {
  registrationId: number;
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  registeredAt: string;
}

interface RegistrationStats {
  count: number;
  registrations: Registration[];
}

interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

const InfoModal = ({ event, isOpen, onClose }: InfoModalProps) => {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [registrationStats, setRegistrationStats] = useState<RegistrationStats | null>(null);
  const [availableCandidates, setAvailableCandidates] = useState<Candidate[]>([]);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOwner = event ? isOwnerOfEvent(event.createdByAccountId) : false;

  useEffect(() => {
    if (event?.id && isOpen) {
      console.log('InfoModal: Loading details for event ID:', event.id);
      loadEventDetails(event.id);
    }
  }, [event?.id, isOpen]);

  const loadEventDetails = async (eventId: number) => {
    setLoading(true);
    setError(null);
    console.log('InfoModal: Starting to load event details for ID:', eventId);
    try {
      const recruitersData = await recruitersAPI.getEventRecruiters(eventId);
      console.log('InfoModal: Recruiters loaded:', recruitersData);
      
      const registrationsData = await recruitersAPI.getEventRegistrations(eventId);
      console.log('InfoModal: Registrations loaded:', registrationsData);
      
      setRecruiters(recruitersData);
      setRegistrationStats(registrationsData);
      setLoading(false);
    } catch (err: any) {
      console.error('InfoModal: Error loading details:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const loadAvailableCandidates = async () => {
    try {
      // Lade alle Kandidaten ohne Filter
      const allCandidates = await candidatesAPI.getAll();
      console.log('All candidates loaded:', allCandidates);
      console.log('Current registration stats:', registrationStats);
      
      // Filter out already registered candidates
      const registeredIds = registrationStats?.registrations.map(r => r.candidateId) || [];
      console.log('Registered candidate IDs:', registeredIds);
      
      const available = allCandidates.filter(c => !registeredIds.includes(c.id));
      console.log('Available candidates after filtering:', available);
      
      setAvailableCandidates(available);
    } catch (err: any) {
      console.error('Error loading candidates:', err);
      setAvailableCandidates([]);
    }
  };

  const handleAddCandidate = async (candidateId: number) => {
    if (!event?.id) return;
    
    try {
      await recruitersAPI.addCandidateToEvent(event.id, candidateId);
      await loadEventDetails(event.id);
      setShowAddCandidate(false);
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    }
  };

  const handleRemoveCandidate = async (candidateId: number) => {
    if (!event?.id) return;
    
    if (!confirm('Möchten Sie diese Registrierung wirklich entfernen?')) return;
    
    try {
      await recruitersAPI.removeCandidateFromEvent(event.id, candidateId);
      await loadEventDetails(event.id);
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    }
  };

  const handleShowAddCandidate = () => {
    loadAvailableCandidates();
    setShowAddCandidate(true);
  };

  if (!event) return null;

  return (
    <>
      <div className={`info-modal-wrapper ${isOpen ? 'open' : ''}`}>
        <div className="info-modal">
          <div className="info-modal-header">
            <h2>{event.title}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        
        <div className="info-modal-content">
          {loading ? (
            <div>Lade Details...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <div className="section">
                <h3>Event Details</h3>
                <div className="info-grid">
                  <span className="label">Beschreibung:</span>
                  <span className="value">{event.description}</span>
                  
                  <span className="label">Start:</span>
                  <span className="value">{new Date(event.startingAt).toLocaleString()}</span>
                  
                  {event.endingAt && (
                    <>
                      <span className="label">Ende:</span>
                      <span className="value">{new Date(event.endingAt).toLocaleString()}</span>
                    </>
                  )}
                  
                  {event.invitationsSendingAt && (
                    <>
                      <span className="label">Einladungen gesendet:</span>
                      <span className="value">
                        {new Date(event.invitationsSendingAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  
                  {event.registrationsClosingAt && (
                    <>
                      <span className="label">Anmeldeschluss:</span>
                      <span className="value">
                        {new Date(event.registrationsClosingAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  
                  <span className="label">Erstellt am:</span>
                  <span className="value">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="section">
                <h3>Anmeldungen ({registrationStats?.count || 0})</h3>
                
                {isOwner && (
                <div className="registered-candidates">
                  {registrationStats && registrationStats.registrations.length > 0 ? (
                    <div className="candidate-list">
                      {registrationStats.registrations.map(registration => (
                        <div key={registration.registrationId} className="candidate-item">
                          <div className="candidate-info">
                            <span className="candidate-name">
                              {registration.firstName} {registration.lastName}
                            </span>
                            <span className="candidate-email">
                              {registration.email}
                            </span>
                            <span className="candidate-status">
                              Status: {registration.status}
                            </span>
                          </div>
                          <button 
                            className="btn-remove"
                            onClick={() => handleRemoveCandidate(registration.candidateId)}
                            title="Registrierung entfernen"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">Noch keine Anmeldungen</p>
                  )}
                  
                  {!showAddCandidate ? (
                    <button className="btn-add-candidate" onClick={handleShowAddCandidate}>
                      + Kandidat hinzufügen
                    </button>
                  ) : (
                    <div className="add-candidate-section">
                      <h4>Kandidat auswählen:</h4>
                      <div className="candidate-select-list">
                        {availableCandidates.length > 0 ? (
                          availableCandidates.map((candidate, index) => (
                            <div 
                              key={`candidate-${candidate.id}-${index}`} 
                              className="candidate-select-item"
                              onClick={() => handleAddCandidate(candidate.id)}
                            >
                              <span>{candidate.firstName} {candidate.lastName}</span>
                              <span className="email-small">{candidate.email}</span>
                            </div>
                          ))
                        ) : (
                          <p>Alle Kandidaten sind bereits registriert</p>
                        )}
                      </div>
                      <button 
                        className="btn-cancel" 
                        onClick={() => setShowAddCandidate(false)}
                      >
                        Abbrechen
                      </button>
                    </div>
                  )}
                </div>
                )}
              </div>

              <div className="section">
                <h3>Verantwortliche Recruiter</h3>
                <div className="recruiter-list">
                  {recruiters.map(recruiter => (
                    <div key={recruiter.id} className="recruiter-item">
                      <span className="recruiter-name">
                        {recruiter.firstName} {recruiter.lastName}
                      </span>
                      <span className="recruiter-email">
                        {recruiter.email}
                      </span>
                    </div>
                  ))}
                  {recruiters.length === 0 && (
                    <p>Keine Recruiter zugewiesen</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default InfoModal;