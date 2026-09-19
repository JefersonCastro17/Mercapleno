import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { sendOrder } from '../services/productData';

export const useCart = () => {
  const authContext = useAuthContext();
  const user = authContext?.user;
  const userId = user ? (user.id || user.id_usuario || user.sub || 'user') : 'guest';
  const storageKey = `productosCarrito_${userId}`;

  // Carga inicial del carrito asociada al usuario actual
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(storageKey);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error cargando carrito de localStorage:", error);
      return [];
    }
  });

  // Re-sincronizar el carrito cuando cambia de usuario/perfil
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(storageKey);
      setCart(savedCart ? JSON.parse(savedCart) : []);
    } catch (error) {
      console.error("Error re-sincronizando carrito:", error);
      setCart([]);
    }
  }, [storageKey]);

  // Persistir en el almacenamiento del usuario actual cada vez que cambia el carrito
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (error) {
      console.error("Error guardando carrito en localStorage:", error);
    }
  }, [cart, storageKey]);

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
    };

    window.addEventListener('mercapleno:logout', onLogout);
    return () => window.removeEventListener('mercapleno:logout', onLogout);
  }, []);

  // --- FUNCIONES DE MANEJO DEL CARRITO ---
  const addToCart = useCallback((product) => {
    if (!product) return;

    const productId = Number(product.id ?? product.id_productos);
    const rawPrice = product.price ?? product.precio ?? 0;
    const price = Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : 0;
    const name = product.nombre || product.name || "Producto";
    const image = product.imagen || product.image || "";
    const isLowStock = !!product.isLowStock;
    const category = product.category || product.categoria || "";

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => Number(item.id ?? item.id_productos) === productId
      );

      let updatedCart;
      if (existingItemIndex > -1) {
        updatedCart = prevCart.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                cantidad: Number(item.cantidad || 1) + 1,
                price,
                precio: price,
              }
            : item
        );
      } else {
        updatedCart = [
          ...prevCart,
          {
            ...product,
            id: productId,
            id_productos: productId,
            nombre: name,
            name,
            price,
            precio: price,
            image,
            category,
            isLowStock,
            cantidad: 1,
          },
        ];
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedCart));
      } catch (_e) {}

      return updatedCart;
    });
  }, [storageKey]);

  const setItemQuantity = useCallback((productId, newQuantity) => {
    const targetId = Number(productId);

    setCart((prevCart) => {
      const nextQuantity = Number(newQuantity);

      if (!Number.isFinite(nextQuantity)) {
        return prevCart;
      }

      if (nextQuantity <= 0) {
        return prevCart.filter(
          (item) => Number(item.id ?? item.id_productos) !== targetId
        );
      }

      return prevCart.map((item) =>
        Number(item.id ?? item.id_productos) === targetId
          ? { ...item, cantidad: nextQuantity }
          : item
      );
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    const targetId = Number(productId);
    setCart((prevCart) =>
      prevCart.filter((item) => Number(item.id ?? item.id_productos) !== targetId)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (_e) {}
  }, [storageKey]);

  // --- CÁLCULO DE TOTALES ---
  const totals = useMemo(() => {
    const totalItems = cart.reduce(
      (acc, item) => acc + (Number(item.cantidad) || 0),
      0
    );
    const subTotal = cart.reduce((acc, item) => {
      const itemPrice = Number(item.price ?? item.precio ?? 0);
      const itemQty = Number(item.cantidad || 0);
      return acc + itemPrice * itemQty;
    }, 0);

    const tax = 0;
    const finalTotal = subTotal;

    return { totalItems, subTotal, tax, finalTotal };
  }, [cart]);

  // --- FUNCIÓN DE CHECKOUT ---
  const processCheckout = async (id_metodo) => {
    if (!sessionActiveRef.isActive()) {
      throw new Error("Sesion cerrada. Checkout cancelado.");
    }

    if (cart.length > 0) {
      const orderData = {
        items: cart.map((item) => ({
          id: Number(item.id ?? item.id_productos),
          cantidad: Number(item.cantidad || 1),
        })),
        total: totals.finalTotal,
        id_metodo: id_metodo,
      };

      try {
        if (!sessionActiveRef.isActive()) {
          throw new Error("Sesion cerrada antes de enviar la orden.");
        }

        const result = await sendOrder(orderData);

        if (result && (result.id_venta || result.ticketId)) {
          localStorage.setItem("lastPurchasedCart", JSON.stringify(cart));
          return result;
        } else {
          throw new Error(
            result.message || result.error || "Fallo en la transacción de venta."
          );
        }
      } catch (error) {
        throw error;
      }
    }
    return false;
  };

  return {
    cart,
    setCart,
    addToCart,
    setItemQuantity,
    removeFromCart,
    clearCart,
    totalItems: totals.totalItems,
    subTotal: totals.subTotal,
    finalTotal: totals.finalTotal,
    processCheckout,
  };
};