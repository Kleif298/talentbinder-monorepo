import { useState } from "react";
import MessageBanner from "~/components/MessageBanner/MessageBanner";
import type { Message } from "~/components/MessageBanner/MessageBanner";
import { setCachedUser } from "~/utils/auth.ts";
import { useNavigate, useLocation } from 'react-router-dom';
import "./Register.scss";

const NODE_ENV = import.meta.env.MODE;
const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = API_URL ? `${API_URL}/api` : '/api';

//const NODE_ENV = 

const Registration: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialEmail = (location.state as any)?.initialEmail ?? '';
    const [email, setEmail] = useState(initialEmail);
    const [ldapPassword, setLdapPassword] = useState("");
    const [localPassword, setLocalPassword] = useState("");
    const [confirmLocalPassword, setConfirmLocalPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    const devLogin = () => {
        setEmail('leif@sunrise.net');
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        console.log('🔵 Frontend: Registration attempt:', { email });

        if (!email.endsWith('@sunrise.net')) {
            setMessage({ 
                type: "error", 
                text: 'Bitte verwenden Sie eine @sunrise.net E-Mail-Adresse', 
                duration: 0 
            });
            setLoading(false);
            return;
        }

        if (!ldapPassword) {
            setMessage({ 
                type: "error", 
                text: 'Bitte geben Sie Ihr LDAP-Passwort ein', 
                duration: 0 
            });
            setLoading(false);
            return;
        }

        if (localPassword !== confirmLocalPassword) {
            setMessage({ 
                type: "error", 
                text: 'Lokale Passwörter stimmen nicht überein', 
                duration: 0 
            });
            setLoading(false);
            return;
        }

        if (localPassword.length < 8) {
            setMessage({ 
                type: "error", 
                text: 'Lokales Passwort muss mindestens 8 Zeichen lang sein', 
                duration: 0 
            });
            setLoading(false);
            return;
        }

        const endpoint = `${API_BASE}/auth/register`;
        console.log('🔵 Frontend: Sending registration request to:', endpoint);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    email,
                    ldapPassword,
                    localPassword
                }),
            });

            console.log('🔵 Frontend: Response status:', response.status);
            
            const data = await response.json();
            console.log('🔵 Frontend: Response data:', data);

            if (response.ok && data.success) {
                console.log('✅ Frontend: Registration successful!');
                setMessage({ 
                    type: "success", 
                    text: 'Registrierung erfolgreich! Du wirst in Kürze weitergeleitet...', 
                    duration: 3000 
                });
                
                setCachedUser(data.user);
                
                setTimeout(() => {
                    const targetPath = data.user.isAdmin ? '/candidates' : '/events';
                    console.log('🔵 Frontend: Redirecting to:', targetPath);
                    window.location.href = targetPath;
                }, 1500);
            } else {
                console.log('❌ Frontend: Registration failed:', data.message);
                setMessage({ 
                    type: "error", 
                    text: data.message || 'Registrierung fehlgeschlagen', 
                    duration: 0 
                });
            }
        } catch (err) {
            console.error('❌ Frontend: Registration error:', err);
            setMessage({ 
                type: "error", 
                text: 'Verbindung zum Server fehlgeschlagen', 
                duration: 0 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {message && <MessageBanner message={message} />}
            <div className="login-container">
                <h2>Registrierung</h2>
                <p className="login-status">
                    Erstelle einen lokalen Account. Authentifizierung erfolgt mit LDAP-Zugangsdaten.
                </p>

                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="email"
                        value={email}
                        placeholder="E-Mail (@sunrise.net)"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        value={ldapPassword}
                        placeholder="LDAP-Passwort (zur Authentifizierung)"
                        onChange={(e) => setLdapPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <hr />
                    <input
                        type="password"
                        value={localPassword}
                        placeholder="Lokales Passwort (min. 8 Zeichen)"
                        onChange={(e) => setLocalPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={8}
                    />
                    <input
                        type="password"
                        value={confirmLocalPassword}
                        placeholder="Lokales Passwort bestätigen"
                        onChange={(e) => setConfirmLocalPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? 'Registriere...' : 'Registrieren'}
                    </button>
                </form>

                {/*dev login*/}
                {NODE_ENV=='development' && <button
                    onClick={() => devLogin()}
                    className="submit-button"

                >

                    Dev Login
                </button>}

                <div className="login-info">
                    <p>
                        <span 
                            className="registration-link"
                            onClick={() => navigate('/login')}
                        >
                            ← Zurück zum Login
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Registration;
