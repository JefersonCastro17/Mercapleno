import React from "react";
import { useCartContext } from "../../contexts/CartContext";
import { formatPrice } from "../../lib/services/productData";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../lib/services/imageUtils";

function CartItem({ item }) {
  const { setItemQuantity, removeFromCart } = useCartContext();
  const subtotal = item.price * item.cantidad;
  const imageSrc = resolveImageUrl(item.image);
  const maxStock = Number(item.stock ?? 999);
  const isMaxReached = item.stock !== undefined && item.cantidad >= maxStock;

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
          {item.stock !== undefined && (
            <span style={{ fontSize: "11px", color: isMaxReached ? "#e11d48" : "#64748b", fontWeight: "600" }}>
              {isMaxReached ? `⚠️ Máximo stock (${maxStock} un.)` : `Disponibles: ${maxStock} un.`}
            </span>
          )}
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
        <span style={{ minWidth: "24px", textAlign: "center", fontWeight: "bold" }}>{item.cantidad}</span>
        <button
          type="button"
          className="cart-item-row__qty-btn"
          onClick={() => setItemQuantity(item.id, item.cantidad + 1)}
          disabled={isMaxReached}
          style={{
            cursor: isMaxReached ? "not-allowed" : "pointer",
            opacity: isMaxReached ? 0.4 : 1,
          }}
          title={isMaxReached ? "Stock máximo alcanzado" : "Agregar una unidad"}
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