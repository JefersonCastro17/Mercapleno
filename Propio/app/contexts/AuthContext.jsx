// src/context/AuthContext.jsx (VERSION FINAL Y SIN ADVERTENCIA ESLINT)

// NOTA: Se eliminó 'useEffect' de la importación ya que no se usa en esta versión robusta.
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    // BUENA PRÁCTICA: Verificar si se usa fuera del Provider
    if (!context) {
        throw new Error("useAuthContext debe usarse dentro de un AuthProvider");
    }
    return context;
};

// Función de limpieza para asegurar un estado inicial válido
// Se mantiene fuera del componente para que React solo la ejecute una vez.
const getInitialAuthState = () => {
    const storedEncryptedUser = localStorage.getItem('user');
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
        localStorage.removeItem('token');
        return { user: storedUser, token: null };
    }

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return { user: null, token: null };
};


export const AuthProvider = ({ children }) => {
    
    // 1. Inicialización ÚNICA y segura usando la función
    const [authState, setAuthState] = useState(getInitialAuthState);

    // 2. Estado Derivado para claridad
    const user = authState.user;
    const token = authState.token ?? (user ? 'cookie' : null);
    const isAuthenticated = !!user && !!token;

    const normalizeUser = (userData) => {
        if (!userData || typeof userData !== 'object') return userData;
        return {
            ...userData,
            id_rol: userData.id_rol !== undefined ? Number(userData.id_rol) : userData.id_rol,
        };
    };

    // Función de LOGIN: Guarda los datos de la sesión y el usuario en localStorage
    const login = (userData) => {
        const normalizedUser = normalizeUser(userData);

        // Guardar en el estado React
        setAuthState({ user: normalizedUser, token: null });

        localStorage.setItem('user', JSON.stringify(normalizedUser));
    };

    // Función de LOGOUT: Limpia los datos de la sesión y en localStorage
    const logout = () => {
        // Limpiar el estado React
        setAuthState({ user: null, token: null });

        // Limpiar localStorage - solo sesión, SIN limpiar el carrito
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // El carrito se preserva después del logout (requisito funcional)
        // NO limpiamos: productosCarrito, lastPurchasedCart, cart

        // Notificar a cualquier listener sobre logout (pero no de clearCart)
        try {
            window.dispatchEvent(new CustomEvent('mercapleno:logout'));
        } catch (e) {
            // Silencioso si no hay window (SSR) o falla el dispatch
        }
    };

    // Funciones de utilidad (mejoradas para acceder a IDs correctos)
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
        isAuthenticated, // Propiedad derivada
        login,
        logout,
        getUserId,
        getUserEmail,
        getUserName,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};