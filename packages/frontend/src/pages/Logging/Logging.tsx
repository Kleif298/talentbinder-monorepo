import { useEffect, useState } from "react";
import loggingAPI from "../../api/loggingAPI";
import type { AuditLog, LoggingStats } from "../../api/loggingAPI";
import Header from "~/components/Header/Header.tsx";
import "./Logging.scss";

const Logging = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<LoggingStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loggingAPI.getAll(filters);
      setLogs(data.logs);
      setPagination({
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await loggingAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("de-DE");
  };

  const getActionColor = (action: string) => {
    if (action.startsWith("CREATE")) return "action-create";
    if (action.startsWith("UPDATE")) return "action-update";
    if (action.startsWith("DELETE")) return "action-delete";
    if (action.startsWith("LOGIN")) return "action-login";
    return "action-other";
  };

  return (
    <div className="logging-page">
      <Header />
      <div className="logging-body">
        <h1>Audit Log</h1>

      <div className="stats-section">
        <h2>Statistics</h2>
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.action} className="stat-card">
              <span className="stat-label">{stat.action}</span>
              <span className="stat-value">{stat.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="filters-section">
        <h2>Filter Logs</h2>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="CREATE_USER">CREATE_USER</option>
              <option value="UPDATE_USER">UPDATE_USER</option>
              <option value="DELETE_USER">DELETE_USER</option>
              <option value="CREATE_EVENT">CREATE_EVENT</option>
              <option value="UPDATE_EVENT">UPDATE_EVENT</option>
              <option value="DELETE_EVENT">DELETE_EVENT</option>
              <option value="CREATE_CANDIDATE">CREATE_CANDIDATE</option>
              <option value="UPDATE_CANDIDATE">UPDATE_CANDIDATE</option>
              <option value="DELETE_CANDIDATE">DELETE_CANDIDATE</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="REGISTER_USER">REGISTER_USER</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => handleFilterChange("entityType", e.target.value)}
            >
              <option value="">All Types</option>
              <option value="User">User</option>
              <option value="Event">Event</option>
              <option value="Candidate">Candidate</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
        </div>

        <button onClick={() => setFilters({ action: "", entityType: "", startDate: "", endDate: "", page: 1, limit: 50 })}>
          Reset Filters
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading logs...</div>
      ) : (
        <>
          <div className="logs-section">
            <h2>
              Logs ({pagination.total} total)
            </h2>
            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.auditId}>
                      <td className="date-cell">{formatDate(log.createdAt)}</td>
                      <td>
                        <span className={`action-badge ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        {log.userName || `User #${log.userId}`}
                      </td>
                      <td>
                        {log.entityType && log.entityId
                          ? `${log.entityType} #${log.entityId}`
                          : "-"}
                      </td>
                      <td className="details-cell">
                        {log.details ? (
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pagination">
            <button
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default Logging;