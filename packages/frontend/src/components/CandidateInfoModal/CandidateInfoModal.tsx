import "./CandidateInfoModal.scss";
import type { Candidate } from "~/types/Candidate";

interface CandidateInfoModalProps {
    candidate: Candidate;
    isOpen: boolean;
    onClose: () => void;
}

const CandidateInfoModal = ({ candidate, isOpen, onClose }: CandidateInfoModalProps) => {
    if (!isOpen || !candidate) {
        return null;
    }

    return (
        <div className={`info-modal-wrapper ${isOpen ? 'open' : ''}`}>
            <div className="info-modal">
                <div className="info-modal-header">
                    <h2>Kandidatendetails</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="info-modal-content">
                    <div className="section">
                        <h3>{candidate.firstName} {candidate.lastName}</h3>
                        <div className="info-grid">
                            <span className="label">Email:</span>
                            <span className="value">{candidate.email}</span>
                            
                            <span className="label">Status:</span>
                            <span className="value">{candidate.status}</span>
                            
                            {candidate.apprenticeships && candidate.apprenticeships.length > 0 && (
                                <>
                                    <span className="label">Lehrstelle:</span>
                                    <span className="value">
                                        {candidate.apprenticeships.map(a => a.name).join(', ')}
                                    </span>
                                </>
                            )}
                            
                            {candidate.createdAt && (
                                <>
                                    <span className="label">Erstellt am:</span>
                                    <span className="value">
                                        {new Date(candidate.createdAt).toLocaleDateString()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateInfoModal;
