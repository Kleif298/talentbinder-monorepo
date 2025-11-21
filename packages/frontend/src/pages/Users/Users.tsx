import { useState } from "react";
import "./Users.scss";
import Header from "~/components/Header/Header.tsx";
import UserList from "~/components/UserList/UserList.tsx";
import MessageBanner, { type Message } from "~/components/MessageBanner/MessageBanner.tsx";
import ListHeader from "~/components/ListHeader/ListHeader.tsx";

const Users = () => {
  const [message, setMessage] = useState<Message | null>(null);
  const [refreshKey] = useState(0);

  return (
    <div className="users-page">
      <Header />
      {message && <MessageBanner message={message} onClose={() => setMessage(null)} />}

      {/* Place the list header at the page level so it spans the full content width like other pages */}
      <ListHeader
        title="Benutzerverwaltung"
      />

      <div className="users-content">
        <div className="users-list-container">
          <UserList refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default Users;
