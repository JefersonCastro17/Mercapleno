import React, { createContext, useState, useContext, useEffect } from 'react';
import { buildApiUrl } from '../lib/api/httpClient';
import { API_ENDPOINTS } from '../lib/config/api.config';

const AuthContext = createContext(null);

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext debe usarse dentro de un AuthProvider");
    }
    return context;
};

const getInitialAuthState = () => {
    const storedEncryptedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    let storedUser = null;

    if (storedEncryptedUser) {
        try {
            storedUser = JSON.parse(storedEncryptedUser);
        } catch (_error) {
            try {
                storedUser = JSON.parse(atob(storedEncryptedUser));
            } catch (_innerError) {
                storedUser = null;
            }
        }
    }

    if (storedUser) {
        return { user: storedUser, token: storedToken || null };
    }

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return { user: null, token: null };
};

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(getInitialAuthState);
    const [sessionNotification, setSessionNotification] = useState(null);

    const user = authState.user;
    const token = authState.token || (typeof window !== "undefined" ? localStorage.getItem('token') : null);
    const isAuthenticated = !!user;

    const normalizeUser = (userData) => {
        if (!userData || typeof userData !== 'object') return userData;
        return {
            ...userData,
            id_rol: userData.id_rol !== undefined ? Number(userData.id_rol) : userData.id_rol,
        };
    };

    const login = (userData, userToken = null) => {
        const normalizedUser = normalizeUser(userData);
        const resolvedToken = userToken || (typeof userData === 'object' && userData?.token ? userData.token : null) || (typeof window !== "undefined" ? localStorage.getItem('token') : null);

        setAuthState({ user: normalizedUser, token: resolvedToken });

        localStorage.setItem('user', JSON.stringify(normalizedUser));
        if (resolvedToken) {
            localStorage.setItem('token', resolvedToken);
        }
    };

    const logout = () => {
        setAuthState({ user: null, token: null });

        localStorage.removeItem('user');
        localStorage.removeItem('token');

        try {
            window.dispatchEvent(new CustomEvent('mercapleno:logout'));
        } catch (e) {
            // Silencioso si no hay window
        }
    };

    // Escucha en tiempo real (SSE) para cambios de rol o eliminación de cuenta
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const userId = user.id_usuario || user.id;
        if (!userId) return;

        const endpoint = API_ENDPOINTS?.auth?.sessionEvents || '/api/auth/session-events';
        const sseUrl = `${buildApiUrl(endpoint)}?token=${encodeURIComponent(token || '')}`;
        let eventSource = null;

        try {
            eventSource = new EventSource(sseUrl, { withCredentials: true });

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (!data) return;

                    if (data.type === 'ROLE_CHANGED') {
                        const newRoleId = Number(data.newRole);
                        const roleNames = { 1: 'Administrador', 2: 'Empleado', 3: 'Cliente' };
                        const newRoleName = data.roleName || roleNames[newRoleId] || `Rol ${newRoleId}`;

                        setAuthState((prev) => {
                            if (!prev.user) return prev;
                            const updated = { ...prev.user, id_rol: newRoleId };
                            localStorage.setItem('user', JSON.stringify(updated));
                            return { ...prev, user: updated };
                        });

                        setSessionNotification({
                            message: `Tus permisos han sido actualizados a: ${newRoleName}.`,
                            type: 'warning'
                        });

                        try {
                            window.dispatchEvent(new CustomEvent('mercapleno:role-updated', { detail: { newRoleId } }));
                        } catch (_err) {}
                    } else if (data.type === 'USER_DELETED') {
                        logout();
                        setSessionNotification({
                            message: 'Tu cuenta ha sido eliminada o desactivada por la administración.',
                            type: 'error'
                        });
                    }
                } catch (parseErr) {
                    console.error('Error procesando evento de sesión:', parseErr);
                }
            };

            eventSource.onerror = () => {
                // EventSource auto-reintenta la conexión
            };
        } catch (sseErr) {
            console.error('Error al inicializar canal SSE de sesión:', sseErr);
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [isAuthenticated, user?.id, user?.id_usuario, token]);

    // Auto-ocultar notificación después de 7 segundos
    useEffect(() => {
        if (!sessionNotification) return;
        const timer = setTimeout(() => {
            setSessionNotification(null);
        }, 7000);
        return () => clearTimeout(timer);
    }, [sessionNotification]);

    const getUserId = () => user ? user.id_usuario || user.id || null : null; 
    const getUserEmail = () => user ? user.email : 'Anónimo';
    const getUserName = () => {
        if (!user) return 'Anónimo';
        const name = user.nombre || '';
        const lastName = user.apellido || '';
        return name.trim() + (lastName.trim() ? ' ' + lastName.trim() : '');
    };

    const value = {
        user,
        token,
        isAuthenticated,
        login,
        logout,
        getUserId,
        getUserEmail,
        getUserName,
    };

    return (
        <AuthContext.Provider value={value}>
            {sessionNotification && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 99999,
                    background: sessionNotification.type === 'error' ? '#d32f2f' : '#f57c00',
                    color: '#ffffff',
                    padding: '14px 22px',
                    borderRadius: '8px',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    animation: 'fadeIn 0.3s ease-in-out'
                }}>
                    <span>⚠️ {sessionNotification.message}</span>
                    <button
                        onClick={() => setSessionNotification(null)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
            {children}
        </AuthContext.Provider>
    );
};