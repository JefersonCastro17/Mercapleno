import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { useCartContext } from '../../contexts/CartContext';
import { useAuthContext } from '../../contexts/AuthContext'; 

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCartContext();
  const { getUserName, logout } = useAuthContext(); 
  const [toastItem, setToastItem] = useState(null);
  const [isBouncing, setIsBouncing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = getUserName();

  useEffect(() => {
    const handleItemAdded = (e) => {
      if (e.detail?.name) {
        setToastItem(e.detail);
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 600);
      }
    };

    window.addEventListener('mercapleno:item-added', handleItemAdded);
    return () => window.removeEventListener('mercapleno:item-added', handleItemAdded);
  }, []);

  useEffect(() => {
    if (!toastItem) return;
    const timer = setTimeout(() => {
      setToastItem(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastItem]);

  return (
    <header style={{ position: 'relative' }}>
      <nav className="barra-navegacion">
        <div className="texto-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="logo-icon">M</span>
          <span>Mercapleno</span>
        </div>
        
        <div className="contenedor-usuario">
          <span style={{ fontWeight: '600' }}>
            Usuario: {userName}
          </span>
          <button 
            className="boton-nav boton-nav--danger" 
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        </div>
        
        <div className="contenedor-botones">
          <button 
            className="boton-nav" 
            onClick={() => navigate('/catalogo')} 
            style={{ 
              backgroundColor: location.pathname === '/catalogo' ? '#073B74' : '#F59E0B',
              color: location.pathname === '/catalogo' ? '#ffffff' : '#0f172a'
            }}
          >
            Catálogo
          </button>

          <button 
            className={`boton-nav ${isBouncing ? 'boton-nav--bounce' : ''}`}
            onClick={() => navigate('/cart')}
            style={{ 
              backgroundColor: location.pathname === '/cart' ? '#073B74' : '#F59E0B',
              color: location.pathname === '/cart' ? '#ffffff' : '#0f172a',
              transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.25s ease-in-out',
              fontWeight: 'bold'
            }}
          >
            🛒 Carrito ({totalItems})
          </button>
        </div>
      </nav>

      {toastItem && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#0B4A8B',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: 'bold',
          animation: 'fadeIn 0.25s ease-in-out'
        }}>
          <span>🛒 ¡Agregaste "{toastItem.name}"!</span>
          <button
            onClick={() => navigate('/cart')}
            style={{
              background: '#F59E0B',
              color: '#0f172a',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Ver Carrito →
          </button>
          <button
            onClick={() => setToastItem(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
