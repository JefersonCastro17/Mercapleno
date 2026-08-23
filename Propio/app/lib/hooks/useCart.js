// src/hooks/useCart.js (CORREGIDO para aceptar id_metodo)

import { useState, useEffect, useMemo } from 'react';
import { sendOrder } from '../services/productData'; // ¡Importante: asegúrate de que exista en productData.js!

const STORAGE_KEY = 'productosCarrito';

export const useCart = () => {
  // --- ESTADO Y PERSISTENCIA DEL CARRITO ---
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error cargando carrito de localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    // Guarda el carrito en localStorage cada vez que cambia
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);
  // --------------------------------------------------------------------------

  // No vaciar el carrito al cerrar sesión; solo mantenerlo en localStorage.
  useEffect(() => {
    const handler = () => {
      // Se deja el carrito intacto para conservar la sesión del usuario local.
    };

    window.addEventListener('mercapleno:clearCart', handler);
    return () => window.removeEventListener('mercapleno:clearCart', handler);
  }, []);

  // Bloquea el inicio de nuevos procesos de checkout si se detecta logout
  const sessionActiveRef = (function () {
    let active = true;
    return {
      isActive: () => active,
      setInactive: () => {
        active = false;
      }
    };
  })();

  useEffect(() => {
    const onLogout = () => {
      sessionActiveRef.setInactive();
      // Se conserva el carrito local cuando se cierra la sesión.
    };

    window.addEventListener('mercapleno:logout', onLogout);
    return () => window.removeEventListener('mercapleno:logout', onLogout);
  }, []);


  // --- FUNCIONES DE MANEJO DEL CARRITO ---
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(item => item.id === product.id);

      if (existingItemIndex > -1) {
        return prevCart.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        // Aseguramos que el producto tiene la cantidad inicial de 1
        return [...prevCart, { ...product, cantidad: 1 }]; 
      }
    });
  };

  const setItemQuantity = (productId, newQuantity) => {
    setCart(prevCart => {
      const nextQuantity = Number(newQuantity);

      if (!Number.isFinite(nextQuantity)) {
        return prevCart;
      }

      if (nextQuantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }

      return prevCart.map(item =>
        item.id === productId ? { ...item, cantidad: nextQuantity } : item
      );
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
  
  const clearCart = () => { // Añadir clearCart para que CartPage lo use
    setCart([]);
  };

  // --- CÁLCULO DE TOTALES (Usa 'cart') ---
  const totals = useMemo(() => {
    // Asegúrate de que los campos 'price' y 'cantidad' existan
    const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
    const subTotal = cart.reduce((acc, item) => acc + (item.cantidad * item.price), 0);
    
    // Aquí puedes calcular el IVA (tax) si lo deseas
    const tax = 0; 
    const finalTotal = subTotal;

    return { totalItems, subTotal, tax, finalTotal };
  }, [cart]);

  // --- FUNCIÓN DE CHECKOUT (CORREGIDA: ACEPTA id_metodo) ---
  //CAMBIO CLAVE 1: Ahora acepta el id_metodo como parámetro
  const processCheckout = async (id_metodo) => { 
    if (!sessionActiveRef.isActive()) {
      throw new Error('Sesion cerrada. Checkout cancelado.');
    }

    if (cart.length > 0) {
        
        // 1. Prepara los datos para el backend
        const orderData = {
            items: cart.map(item => ({
                id: item.id,
                cantidad: item.cantidad
            })),
            total: totals.finalTotal,
            // CAMBIO CLAVE 2: Incluye el id_metodo recibido
            id_metodo: id_metodo 
        };
        try {
            if (!sessionActiveRef.isActive()) {
              throw new Error('Sesion cerrada antes de enviar la orden.');
            }
            // 2. Envía la orden al API
            const result = await sendOrder(orderData); 
            
            // Si la orden se registró con éxito en la BD:
            if (result && (result.id_venta || result.ticketId)) {
                
                // Mantiene la lógica de persistencia de compra en el hook (Lógica de la versión original)
                // Nota: CartPage.jsx ahora maneja el almacenamiento de los totales detallados
                localStorage.setItem('lastPurchasedCart', JSON.stringify(cart));
                // **Ya no se vacía el carrito aquí**, lo hará CartPage para asegurar el flujo.
                
                return result; // Devuelve el resultado completo (con id_venta/ticketId)
            } else {
                // Si el API devuelve un error 400, 409, o un JSON de error
                throw new Error(result.message || result.error || "Fallo en la transacción de venta.");
            }
        } catch (error) {
             // Re-lanza el error para que CartPage.jsx lo capture y muestre
             throw error; 
        }

    }
    return false;
  };

  // --- VALORES DEVUELTOS POR EL HOOK ---
  return {
    cart,
    setCart,
    addToCart,
    setItemQuantity,
    removeFromCart,
    clearCart, // Asegura que clearCart esté disponible
    totalItems: totals.totalItems,
    subTotal: totals.subTotal,
    finalTotal: totals.finalTotal,
    processCheckout, // La función modificada
  };
};