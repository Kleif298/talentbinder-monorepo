import { useState, useEffect } from "react";
import CandidateCard from "../CandidateCard/CandidateCard";
import "./GridList.scss";
import { getAdminStatus } from "../../utils/auth";
import { candidatesAPI } from "../../api/candidatesAPI";
import type { Candidate, GridListProps } from "../../types/Candidate";

const GridList = ({ refreshKey, filterParams, onEditCandidate, onViewCandidate }: GridListProps) => {

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  async function fetchCandidatesData(): Promise<Candidate[]> {
    const { search, status, sortBy } = filterParams;
    return await candidatesAPI.getAll(search || undefined, status || undefined, sortBy || undefined);
  }

  async function fetchAdminStatus(): Promise<boolean> {
    return await getAdminStatus();
  }

  useEffect(() => {
    let isMounted = true; // Cleanup flag
    
    // Call the async function
    fetchAdminStatus()
      .then((status) => {
        if (isMounted) {
          // 2. Update the state with the resolved boolean value
          setIsAdmin(status); 
        }
      })
      .catch(err => {
        console.error("Failed to fetch admin status:", err);
        if (isMounted) {
          // Optionally handle the error
          setError("Failed to verify admin status.");
        }
      })
      .finally(() => {
        if (isMounted) {
            setIsAdminLoading(false);
        }
      });
      
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Lade Kandidaten bei Erst-Render oder wenn sich refreshKey/filterParams ändert
  useEffect (() => {
    const ac = new AbortController();

    async function loadCandidates() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCandidatesData();
        // defensive dedupe in case backend returns duplicate rows
        const unique = data.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
        if (!ac.signal.aborted) setCandidates(unique);
      } catch (err: any) {
        if (!ac.signal.aborted) setError("Fehler beim Laden der Kandidatendaten: " + err.message);
      } finally {
        if (!ac.signal.aborted) setIsLoading(false);
      }
    }

    loadCandidates();

    return () => ac.abort();
  }, [refreshKey, filterParams]);

  if (isLoading) {
    return (
      <div className="candidate-list-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Lade Kandidaten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidate-list-container">
        <div className="error-state">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>Fehler beim Laden</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="candidate-list-container">
        <div className="empty-state">
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3>Keine Kandidaten gefunden</h3>
          <p>Versuchen Sie, Ihre Suchfilter anzupassen.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="candidate-list-container">
      {candidates.map((candidate) => (
        isAdminLoading ? null :
          <CandidateCard 
            key={`candidate-${candidate.id}`} 
            candidate={candidate} 
            isAdmin={isAdmin}
            onEdit={onEditCandidate}
            onView={onViewCandidate}
          />   
      ))}
    </div>
  );
};

export default GridList;