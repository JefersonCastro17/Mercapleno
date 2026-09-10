import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { useCartContext } from '../../contexts/CartContext';
import { useAuthContext } from '../../contexts/AuthContext'; 

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCartContext();
  const { getUserName, logout } = useAuthContext(); 

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = getUserName();

  return (
    <header>
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
            className="boton-nav" 
            onClick={() => navigate('/cart')}
            style={{ 
              backgroundColor: location.pathname === '/cart' ? '#073B74' : '#F59E0B',
              color: location.pathname === '/cart' ? '#ffffff' : '#0f172a'
            }}
          >
            Carrito ({totalItems})
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Header;
