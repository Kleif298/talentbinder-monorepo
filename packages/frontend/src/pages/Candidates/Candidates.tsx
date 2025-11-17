import { useState, useCallback, useEffect } from "react";
import "./Candidates.scss";
import Header from "~/components/Header/Header.tsx";
import Filter from "~/components/Filter/Filter.tsx";
import GridList from "~/components/GridList/GridList.tsx";
import ModalCandidates, { type CandidateForm } from "~/components/Modal/Modal.tsx";
import CandidateInfoModal from "~/components/CandidateInfoModal/CandidateInfoModal.tsx";
import MessageBanner, { type Message } from "~/components/MessageBanner/MessageBanner.tsx";
//import { getAdminStatus } from "../../utils/auth";
import { candidatesAPI } from "../../api/candidatesAPI";
import { lookupAPI } from "../../api/lookupAPI";
import type { Candidate, Apprenticeship } from "../../types/Candidate";

const Candidates = () => {
  const [message, setMessage] = useState<Message | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterParams, setFilterParams] = useState({ search: '', status: '', sortBy: 'created_at_desc' });
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [apprenticeships, setApprenticeships] = useState<Apprenticeship[]>([]);

  // Lade Branchen und Lehrstellen beim Mount
  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const appData = await lookupAPI.getApprenticeships();
        setApprenticeships(appData);
      } catch (err: any) {
        console.error("Fehler beim Laden von Lehrstellen:", err);
      }
    };
    loadLookupData();
  }, []);

  const handleFilterChange = useCallback((params: typeof filterParams) => {
    setFilterParams(params);
  }, []);

  const handleCloseModal = () => {
    setCandidateToEdit(null);
  };

  // Callback-Funktion, die von GridList -> CandidateCard aufgerufen wird
  const handleEdit = (candidate: Candidate) => {
    setMessage(null);
    setCandidateToEdit(candidate);
  };

  const handleView = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  // Funktion für das Speichern/Aktualisieren
  async function handleSaveCandidate(candidate: CandidateForm) {
    try {
      setMessage({ type: "info", text: candidateToEdit ? "Aktualisiere..." : "Speichere..." });
      
      if (candidateToEdit) {
        await candidatesAPI.update(candidateToEdit.id, candidate);
        setMessage({ type: "success", text: "Kandidat erfolgreich aktualisiert!" });
      } else {
        await candidatesAPI.create(candidate);
        setMessage({ type: "success", text: "Kandidat erfolgreich registriert!" });
      }
      
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    } catch (err: any) {
      setMessage({ type: "error", text: `Aktion fehlgeschlagen: ${err.message}` });
      console.error("Fehler beim Speichern:", err.message);
    }
  }

  // Funktion für das Löschen
  async function handleDeleteCandidate(id: number) {
    if (!window.confirm("Sind Sie sicher, dass Sie diesen Kandidaten löschen möchten?")) {
        return;
    }

    try {
      setMessage({ type: "info", text: "Lösche..." });
      await candidatesAPI.delete(id);
      setMessage({ type: "success", text: "Kandidat erfolgreich gelöscht." });
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      setMessage({ type: "error", text: `Löschen fehlgeschlagen: ${err.message}` });
      console.error("Fehler beim Löschen:", err.message);
    }
  }


  return (
    <div className="candidate-dashboard-page">
      <Header />
      <MessageBanner message={message} onClose={() => setMessage(null)} />
      <div className={`candidate-frame ${selectedCandidate ? 'split-view' : ''}`}>
        <div className="candidate-list-section">
          <div className="head-of-list">
            <div className="head-of-list-content">
              <Filter onFilterChange={handleFilterChange} /> 
              <ModalCandidates 
                onSave={handleSaveCandidate}
                candidateToEdit={candidateToEdit}
                onClose={handleCloseModal}
                onDelete={handleDeleteCandidate}
                apprenticeships={apprenticeships}
              />
            </div>
          </div>
          <GridList 
            refreshKey={refreshKey} 
            filterParams={filterParams}
            onEditCandidate={handleEdit}
            onViewCandidate={handleView}
          />
        </div>
        {selectedCandidate && (
          <CandidateInfoModal
            candidate={selectedCandidate}
            isOpen={!!selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Candidates;