import { useState } from "react";
import "./Users.scss";
import Header from "~/components/Header/Header.tsx";
import UserList from "~/components/UserList/UserList.tsx";
import MessageBanner, { type Message } from "~/components/MessageBanner/MessageBanner.tsx";

const Users = () => {
  const [message, setMessage] = useState<Message | null>(null);
  const [refreshKey] = useState(0);

  return (
    <div className="users-page">
      <Header />
      {message && <MessageBanner message={message} onClose={() => setMessage(null)} />}
      
      <div className="users-content">
        <div className="users-header">
          <h1>Benutzerverwaltung</h1>
          <p className="users-description">Alle registrierten Benutzer und deren Details</p>
        </div>
        
        <div className="users-list-container">
          <UserList refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default Users;
