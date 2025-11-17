import "./CandidateCard.scss";
import { useState, useEffect } from "react";
import { FaEnvelope, FaBriefcase, FaStar } from 'react-icons/fa';
import type { CandidateCardProps } from "../../types/Candidate";

const CandidateCard = ({ candidate, isAdmin, onEdit, onView }: CandidateCardProps) => {
  const isFavorite = candidate.status === 'Favorit';
  const isEliminated = candidate.status === 'Eliminiert';
  const [apprenticeshipName, setApprenticeshipName] = useState<string[]>(["Laden..."]);

  // Lade Lehrstelle Name beim Mount / wenn sich apprenticeships ändern
  useEffect(() => {
    if (candidate.apprenticeships && candidate.apprenticeships.length > 0) {
      setApprenticeshipName(candidate.apprenticeships.map(app => app.name));
    } else {
      setApprenticeshipName(["Nicht zugeordnet"]);
    }
  }, [candidate.apprenticeships]);
  
  return (
    <div className={`candidate-card ${isEliminated ? 'eliminated' : ''}`} onClick={() => onView(candidate)}>
      <div className="candidate-card-content">
        <div className="candidate-card-header">
          <div className="candidate-title-section">
            <h2 className="candidate-name">
              {candidate.firstName} {candidate.lastName}
            </h2>
            <div className="candidate-badges">
              {isFavorite && (
                <span className="candidate-badge favorite">
                  <FaStar className="badge-icon" />
                  Favorit
                </span>
              )}
              {isEliminated && (
                <span className="candidate-badge eliminated">
                  Eliminiert
                </span>
              )}
            </div>
          </div>
          {isAdmin && (
            <button 
              className="edit-button-icon" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(candidate);
              }}
              aria-label="Bearbeiten"
            >
              ✏️
            </button>
          )}
        </div>
        
        <div className="candidate-meta">
          <div className="meta-item">
            <FaEnvelope className="meta-icon" />
            <div className="meta-content">
              <span className="meta-label">E-Mail</span>
              <span className="meta-value">{candidate.email}</span>
            </div>
          </div>

          <div className="meta-item">
            <FaBriefcase className="meta-icon" />
            <div className="meta-content">
              <span className="meta-label">Interessiert an</span>
              <span className="meta-value">{apprenticeshipName.join(", ")}</span>
            </div>
          </div>
        </div>

        {candidate.createdAt && (
          <div className="candidate-footer">
            <span className="candidate-date">
              Registriert: {new Date(candidate.createdAt).toLocaleDateString('de-DE')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;