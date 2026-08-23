import React, { createContext, useContext } from 'react';
import { useCart } from '../lib/hooks/useCart';

const CartContext = createContext();

export const useCartContext = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const cartHook = useCart();

  return (
    <CartContext.Provider value={cartHook}>
      {children}
    </CartContext.Provider>
  );
};
