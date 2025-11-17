// Filter.tsx

import "./Filter.scss";
import { useState, useEffect } from "react";

interface FilterProps {
  onFilterChange: (params: { search: string; status: string; sortBy: string }) => void;
}

const SortOptions = [
  { value: 'created_at_desc', label: 'Neueste zuerst' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'status', label: 'Status' }
];

const Filter = ({ onFilterChange }: FilterProps) => {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("created_at_desc");

  // Melde Änderungen an den Parent 
  useEffect(() => {
    onFilterChange({
      search,
      status: selectedStatuses.length > 0 ? selectedStatuses.join(',') : '',
      sortBy
    });
  }, [search, selectedStatuses, sortBy, onFilterChange]);

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
  };

  const isStatusSelected = (status: string) => selectedStatuses.includes(status);

  return (
    <form className="filter" onSubmit={handleSubmit}>
      <input 
        className="searchbar" 
        type="text" 
        placeholder="Nach Name oder Email suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      
      <div className="filter-dropdown">
        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Status:</label>
        
        {/* Favorit Toggle */}
        <button
          type="button"
          onClick={() => handleStatusToggle('Favorit')}
          style={{
            backgroundColor: isStatusSelected('Favorit') ? '#fbbf24' : 'white',
            color: isStatusSelected('Favorit') ? 'white' : '#374151'
          }}
          title="Favorit"
        >
          ⭐ Favorit
        </button>

        {/* Normal Toggle */}
        <button
          type="button"
          onClick={() => handleStatusToggle('Normal')}
          style={{
            backgroundColor: isStatusSelected('Normal') ? '#3b82f6' : 'white',
            color: isStatusSelected('Normal') ? 'white' : '#374151'
          }}
          title="Normal"
        >
          ◯ Normal
        </button>

        {/* Eliminiert Toggle */}
        <button
          type="button"
          onClick={() => handleStatusToggle('Eliminiert')}
          style={{
            backgroundColor: isStatusSelected('Eliminiert') ? '#ef4444' : 'white',
            color: isStatusSelected('Eliminiert') ? 'white' : '#374151'
          }}
          title="Eliminiert"
        >
          ✕ Eliminiert
        </button>
      </div>

      {/* Sortierung */}
      <div className="filter-dropdown">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      
    </form>
  );
};

export default Filter;