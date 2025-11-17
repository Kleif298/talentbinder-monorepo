import { useState, useEffect } from "react";
import MessageBanner from "~/components/MessageBanner/MessageBanner";
import type { Message } from "~/components/MessageBanner/MessageBanner";
import { setCachedUser } from "~/utils/auth.ts";
import { API_BASE_URL } from "~/config/api";
//import { useNavigate } from 'react-router-dom';
import "./Login.scss";

const API_BASE = API_BASE_URL;

console.log('🔧 API Configuration:', { 
    VITE_API_URL: import.meta.env.VITE_API_URL,
    API_BASE,
    MODE: import.meta.env.MODE 
});

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);
    const [loginMode, setLoginMode] = useState<'ldap' | 'local'>('ldap');
    const [ldapAvailable, setLdapAvailable] = useState<boolean | null>(null); // null = checking
    const [checkingLdap, setCheckingLdap] = useState(true);
    //const navigate = useNavigate();

    // Check LDAP status on component mount
    useEffect(() => {
        checkLdapStatus();
    }, []);

    /**
     * Check if LDAP server is reachable
     * Shows warning if unavailable
     */
    async function checkLdapStatus() {
        console.log('🔍 Frontend: Checking LDAP server status...');
        setCheckingLdap(true);
        
        try {
            const response = await fetch(`${API_BASE}/auth/ldap-status`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            console.log('✅ Frontend: LDAP status received:', data.ldapAvailable);
            
            setLdapAvailable(data.ldapAvailable);
            
            if (!data.ldapAvailable) {
                setMessage({
                    type: 'warning',
                    text: 'LDAP-Server nicht erreichbar. Bitte verbinden Sie sich mit dem DAL-Netzwerk und laden Sie die Seite neu.',
                    duration: 0
                });
                console.log('⚠️ Frontend: LDAP server unreachable');
            } else {
                console.log('✅ Frontend: LDAP server reachable');
            }
        } catch (err) {
            console.error('❌ Frontend: Error checking LDAP status:', err);
            setLdapAvailable(false);
            setMessage({
                type: 'error',
                text: 'Verbindung zum Server fehlgeschlagen. Bitte versuchen Sie es später erneut.',
                duration: 0
            });
        } finally {
            setCheckingLdap(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        console.log('🔵 Frontend: Login attempt:', { email });

        // Validate email domain
        if (!email.endsWith('@sunrise.net')) {
            setMessage({ 
                type: "error", 
                text: 'Bitte verwenden Sie eine @sunrise.net E-Mail-Adresse', 
                duration: 0 
            });
            setLoading(false);
            return;
        }

        const endpoint = `${API_BASE}/auth/login`;
        console.log('🔵 Frontend: Sending request to:', endpoint);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    email,
                    password,
                    preferredMethod: loginMode // Use selected login mode
                }),
            });

            console.log('🔵 Frontend: Response status:', response.status);
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Frontend: Server returned non-JSON response:', text.substring(0, 200));
                throw new Error('Server returned non-JSON response');
            }
            
            const data = await response.json();
            console.log('🔵 Frontend: Response data:', { 
                success: data.success, 
                hasUser: !!data.user, 
                hasToken: !!data.token 
            });

            if (response.ok && data.success) {
                console.log('✅ Frontend: Login successful!');
                console.log('🔵 Frontend: User data:', data.user);
                
                // Cache user data (cookie is automatically set by backend)
                setCachedUser(data.user);
                
                const targetPath = data.user.isAdmin ? '/candidates' : '/events';
                console.log('🔵 Frontend: Redirecting to:', targetPath);
                window.location.href = targetPath;
            } else {
                console.log('❌ Frontend: Login failed:', data.message);
                setMessage({ 
                    type: "error", 
                    text: data.message || 'Login fehlgeschlagen', 
                    duration: 0 
                });
            }
        } catch (err) {
            console.error('❌ Frontend: Login error:', err);
            setMessage({ 
                type: "error", 
                text: 'Verbindung zum Server fehlgeschlagen', 
                duration: 0 
            });
        } finally {
            setLoading(false);
        }
    };

    // navigation-based registration (navigates to /register and passes current email via location.state)

    return (

        <div className="login-page">
            {message && <MessageBanner message={message} />}
            <div className="login-container">
                <h2>Login</h2>

                {/* Login Status */}
                {loginMode === 'ldap' ? 
                    checkingLdap ? (
                        <p className="login-status">
                            🔄 Prüfe LDAP-Server Erreichbarkeit...
                        </p>) 
                        : ldapAvailable ? (
                            <p className="login-status">
                                Melde dich mit deiner Sunrise E-Mail und Passwort an.
                            </p>
                            ) : (
                            <p className="login-warning">
                                ❌ LDAP-Server nicht erreichbar. Melde dich lokal an oder verbinde dich mit dem DAL-Netzwerk.
                            </p>
                        )
                    : 
                    <p className="login-status">
                        Melden Sie sich mit Ihrer E-Mail und lokalem Passwort an.
                    </p>
                }

                {/* Mode Switcher */}
                <div className="login-mode-switcher">
                    <button
                        type="button"
                        className={`mode-button ${loginMode === 'ldap' ? 'active' : ''}`}
                        onClick={() => setLoginMode('ldap')}
                        disabled={loading}
                    >
                        LDAP {ldapAvailable === false && '❌'}
                    </button>
                    <button
                        type="button"
                        className={`mode-button ${loginMode === 'local' ? 'active' : ''}`}
                        onClick={() => setLoginMode('local')}
                        disabled={loading}
                    >
                        Lokal
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="email"
                        id="email"
                        value={email}
                        placeholder="E-Mail (@sunrise.net)"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={checkingLdap || loading || (loginMode === 'ldap' && ldapAvailable === false)}
                    />
                    <input
                        type="password"
                        id="password"
                        value={password}
                        placeholder={loginMode === 'ldap' ? 'LDAP-Passwort' : 'Lokales Passwort'}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={checkingLdap || loading || (loginMode === 'ldap' && ldapAvailable === false)}
                    />
                    <button 
                        type="submit" 
                        disabled={checkingLdap || loading || (loginMode === 'ldap' && ldapAvailable === false)} 
                        className="submit-button"
                    >
                        {checkingLdap 
                            ? 'Initialisiere...' 
                            : (loginMode === 'ldap' && ldapAvailable === false)
                            ? 'LDAP-Server nicht erreichbar'
                            : loading 
                            ? 'Einloggen...' 
                            : 'Einloggen'}
                    </button>
                </form>
                            
                {/* Info message about account creation */}
                {/*!checkingLdap && ldapAvailable && (
                    <div className="login-info">
                        <p>
                            💡 <strong>Noch kein Account?</strong>{" "}
                            <span 
                                className="registration-link"
                                onClick={() => navigate('/register', { state: { initialEmail: email } })}
                            >
                                Registriere dich hier.
                            </span>
                        </p>
                    </div>
                )*/}
            </div>
        </div>
    );
}

export default Login;
