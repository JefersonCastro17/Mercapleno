import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CartToastNotification() {
  const navigate = useNavigate();
  const [toastItem, setToastItem] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleItemAdded = (e) => {
      if (e.detail?.name) {
        setToastItem(e.detail);
        setIsVisible(true);
      }
    };

    window.addEventListener('mercapleno:item-added', handleItemAdded);
    return () => window.removeEventListener('mercapleno:item-added', handleItemAdded);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [isVisible, toastItem]);

  if (!isVisible || !toastItem) return null;

  return (
    <aside
      aria-label="Notificación de carrito"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        background: 'linear-gradient(135deg, #0B4A8B 0%, #073463 100%)',
        color: '#ffffff',
        padding: '14px 22px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        fontSize: '14px',
        fontWeight: '600',
        animation: 'slideUpToast 0.3s ease-out forwards',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Agregaste <strong>"{toastItem.name}"</strong> al carrito</span>
      </span>

      <button
        onClick={() => {
          setIsVisible(false);
          navigate('/cart');
        }}
        style={{
          background: '#F59E0B',
          color: '#0f172a',
          border: 'none',
          padding: '6px 14px',
          borderRadius: '6px',
          fontWeight: '700',
          cursor: 'pointer',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 2px 6px rgba(245,158,11,0.4)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#d97706';
          e.currentTarget.style.transform = 'scale(1.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#F59E0B';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Ver Carrito →
      </button>

      <button
        onClick={() => setIsVisible(false)}
        aria-label="Cerrar notificación"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#cbd5e1',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '2px 4px',
          marginLeft: '2px',
          lineHeight: 1,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
      >
        ✕
      </button>
    </aside>
  );
}

