import { useState, useEffect } from "react";
import UserCard from "~/components/UserCard/UserCard.tsx";
import { usersAPI } from "../../api/usersAPI";
import type { User } from "../../types/User";
import type { UserListProps } from "../../types/User";
import "./UserList.scss";

const UserList = ({ refreshKey = 0 }: UserListProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await usersAPI.getAll();
                setUsers(data);
            } catch (err: any) {
                setError(err.message || "Fehler beim Laden der Benutzer");
                console.error("Error loading users:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [refreshKey]);

    if (loading) {
        return <div className="user-list-status">Lade Benutzer...</div>;
    }

    if (error) {
        return <div className="user-list-status error">Fehler: {error}</div>;
    }

    if (users.length === 0) {
        return <div className="user-list-status">Keine Benutzer gefunden.</div>;
    }

    return (
        <div className="user-list">
            {users.map((user) => (
                <UserCard key={user.id} user={user} />
            ))}
        </div>
    );
};

export default UserList;
