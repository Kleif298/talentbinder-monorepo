import { useLocation, useNavigate } from "react-router-dom";
import "./Header.scss";
import { getAccountEmail, getAdminStatus, clearUserCache } from "~/utils/auth.ts";
import { MdHistory } from "react-icons/md";
import { useState, useEffect } from "react";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const adminStatus = await getAdminStatus();
      const userEmail = await getAccountEmail();
      setIsAdmin(adminStatus);
      setEmail(userEmail || "");
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearUserCache();
      setLoggingOut(false);
      navigate('/login');
    }
  };

  return (
    <header>
      <div className="header-line"></div>
      <div className="header-main">
        <h1 className="header-title">TalentBinder</h1>
        <div className="user-data">
          {isAdmin ? <p className="admin-state">Admin</p> : null}
          <div className="email-holder">{email}</div>
          <button className="logout-button" onClick={handleLogout} disabled={loggingOut}>
            Logout
          </button>
          {isAdmin && (
            <div onClick={() => {navigate("/logging");}} className="history-icon">
              <MdHistory />
            </div>
          )}
        </div>
      </div>
      <nav>
        <a href="/reports" className={isActive("/reports") ? "active" : ""}>
          Reports
        </a>
        <a href="/events" className={isActive("/events") ? "active" : ""}>
          Events
        </a>
        {isAdmin && (
          <>
            <a href="/candidates" className={isActive("/candidates") ? "active" : ""}>
              Candidates
            </a>
            <a href="/users" className={isActive("/users") ? "active" : ""}>
              Users
            </a>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
