import React, { useState } from "react";
import { useCartContext } from "../../contexts/CartContext";
import { formatPrice } from "../../lib/services/productData";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../lib/services/imageUtils";

function ProductCard({ product }) {
  const { cart, addToCart } = useCartContext();
  const [justAdded, setJustAdded] = useState(false);

  const priceValue = Number(product.precio ?? product.price ?? 0);
  const productId = Number(product.id ?? product.id_productos);
  const imageSrc = resolveImageUrl(product.image || product.imagen);
  const categoryLabel = product.category || product.categoria || "Sin categoría";
  const stock = Number(product.stock ?? 0);

  const inCartItem = cart.find(
    (item) => Number(item.id ?? item.id_productos) === productId
  );
  const inCartCount = inCartItem ? Number(inCartItem.cantidad || 0) : 0;
  const isOutOfStock = stock <= 0;
  const isMaxReached = inCartCount >= stock;

  const handleAddToCart = () => {
    if (isOutOfStock || isMaxReached) return;

    addToCart({
      ...product,
      id: productId,
      id_productos: productId,
      stock,
      price: priceValue,
      precio: priceValue,
      image: product.image || product.imagen,
      nombre: product.nombre || product.name,
    });

    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1200);

    try {
      window.dispatchEvent(
        new CustomEvent("mercapleno:item-added", {
          detail: {
            name: product.nombre || product.name || "Producto",
            count: inCartCount + 1,
          },
        })
      );
    } catch (_e) {}
  };

  const renderStockBadge = () => {
    if (isOutOfStock) {
      return (
        <span className="product-card__stock-badge product-card__stock-badge--out">
          Agotado
        </span>
      );
    }
    if (stock <= 5) {
      return (
        <span className="product-card__stock-badge product-card__stock-badge--warning">
          Últimas {stock} un.
        </span>
      );
    }
    return (
      <span className="product-card__stock-badge">
        Stock: {stock} un.
      </span>
    );
  };

  return (
    <article
      className="producto product-card"
      data-name={product.nombre}
      data-category={categoryLabel}
      data-price={priceValue}
      data-id={productId}
    >
      <div className="product-card__header">
        <span className="product-card__category">{categoryLabel}</span>
        {renderStockBadge()}
      </div>

      <div className="imagen product-card__image">
        <img
          src={imageSrc}
          alt={product.nombre || "Producto"}
          onError={(event) => {
            event.target.onerror = null;
            event.target.src = FALLBACK_IMAGE;
          }}
        />
      </div>

      <div className="product-card__body">
        <h3 className="nombre product-card__title">{product.nombre}</h3>
        <p className="product-card__description">
          {product.descripcion || "Producto listo para agregar al carrito."}
        </p>

        {inCartCount > 0 && (
          <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#0B4A8B", fontWeight: "600" }}>
            En carrito: {inCartCount} un.
          </p>
        )}
      </div>

      <div className="product-card__footer">
        <div className="product-card__price-block">
          <span className="product-card__price-label">Precio unitario</span>
          <p className="precio product-card__price">{formatPrice(priceValue)}</p>
        </div>

        <div className="botones product-card__actions">
          <button
            className={`botoncito_producto ${justAdded ? "botoncito_producto--agregado" : ""}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock || isMaxReached}
            style={{
              backgroundColor: isOutOfStock
                ? "#9ca3af"
                : isMaxReached
                ? "#cbd5e1"
                : justAdded
                ? "#10b981"
                : undefined,
              color: isOutOfStock || isMaxReached ? "#475569" : undefined,
              cursor: isOutOfStock || isMaxReached ? "not-allowed" : "pointer",
              transition: "all 0.2s ease-in-out",
            }}
          >
            {isOutOfStock
              ? "Agotado"
              : isMaxReached
              ? "Máximo alcanzado"
              : justAdded
              ? "Agregado"
              : inCartCount > 0
              ? "Agregar otro"
              : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
