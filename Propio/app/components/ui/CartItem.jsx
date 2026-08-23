import React from "react";
import { useCartContext } from "../../contexts/CartContext";
import { formatPrice } from "../../lib/services/productData";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../lib/services/imageUtils";

function CartItem({ item }) {
  const { setItemQuantity, removeFromCart } = useCartContext();
  const subtotal = item.price * item.cantidad;
  const imageSrc = resolveImageUrl(item.image);

  return (
    <article className="cart-item-row">
      <div className="cart-item-row__product">
        <img
          src={imageSrc}
          alt={item.nombre}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_IMAGE;
          }}
        />
        <div className="cart-item-row__text">
          <p className="cart-item-row__name">{item.nombre}</p>
          <p className="cart-item-row__unit">{formatPrice(item.price)} c/u</p>
        </div>
      </div>

      <div className="cart-item-row__qty">
        <button
          type="button"
          className="cart-item-row__qty-btn"
          onClick={() => setItemQuantity(item.id, item.cantidad - 1)}
          aria-label="Quitar una unidad"
        >
          -
        </button>
        <span>{item.cantidad}</span>
        <button
          type="button"
          className="cart-item-row__qty-btn"
          onClick={() => setItemQuantity(item.id, item.cantidad + 1)}
          aria-label="Agregar una unidad"
        >
          +
        </button>
      </div>

      <div className="cart-item-row__subtotal">
        <p>{formatPrice(subtotal)}</p>
        <button type="button" className="cart-item-row__remove" onClick={() => removeFromCart(item.id)}>
          Eliminar
        </button>
      </div>
    </article>
  );
}

export default CartItem;