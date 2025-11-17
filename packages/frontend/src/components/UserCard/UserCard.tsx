import "~/components/UserCard/UserCard.scss";
import type { UserCardProps } from "../../types/User";
import { FaUserCircle, FaCalendar, FaClock } from 'react-icons/fa';

const UserCard = ({ user }: UserCardProps) => {
    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'berufsbilder':
                return 'role-admin';
            case 'recruiter':
                return 'role-recruiter';
            case 'developer':
                return 'role-developer';
            default:
                return 'role-default';
        }
    };

    return (
        <div className="user-card">
            <div className="user-card-header">
                <div className="user-icon-wrapper">
                    <FaUserCircle />
                </div>
                <h2>{user.firstName} {user.lastName}</h2>
                <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                </span>
            </div>
            
            <div className="user-card-body">
                <div className="user-detail">
                    <strong>Email:</strong>
                    <span>{user.email}</span>
                </div>
                
                <div className="user-detail">
                    <strong>ID:</strong>
                    <span>{user.id}</span>
                </div>

                <div className="user-detail">
                    <strong><FaCalendar /> Registriert am:</strong>
                    <span>{new Date(user.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })}</span>
                </div>

                {user.lastLogin && (
                    <div className="user-detail">
                        <FaClock />
                        <strong>Letzter Login:</strong>
                        <span>{new Date(user.lastLogin).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserCard;
