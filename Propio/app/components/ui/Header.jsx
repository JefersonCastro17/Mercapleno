import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { useCartContext } from '../../contexts/CartContext';
import { useAuthContext } from '../../contexts/AuthContext'; 

function Header() {
  const navigate = useNavigate();
  const location = useLocation(); // Para saber en qué página estamos
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
        <div className="texto-logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
          Mercapleno
        </div>
        
        <div className="contenedor-usuario">
          <span style={{ marginRight: '20px', fontWeight: 'bold' }}>
            Usuario: {userName}
          </span>
          <button 
            className="boton-nav" 
            onClick={handleLogout}
            style={{ backgroundColor: '#D9534F', color: 'white' }} 
          >
            Cerrar Sesión
          </button>
        </div>
        
        <div className="contenedor-botones">
          {/* 🟢 BOTÓN CATÁLOGO: Navega a /catalogo */}
          <button 
            className="boton-nav" 
            onClick={() => navigate('/catalogo')} 
            style={{ 
              backgroundColor: location.pathname === '/catalogo' ? '#073B74' : '#F9B300',
              color: location.pathname === '/catalogo' ? 'white' : 'black'
            }}
          >
            Catálogo
          </button>

          {/* 🟢 BOTÓN CARRITO: Navega a /cart */}
          <button 
            className="boton-nav" 
            onClick={() => navigate('/cart')}
            style={{ 
              backgroundColor: location.pathname === '/cart' ? '#073B74' : '#F9B300',
              color: location.pathname === '/cart' ? 'white' : 'black'
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
