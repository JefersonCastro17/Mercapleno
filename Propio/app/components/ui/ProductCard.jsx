import React from "react";
import { useCartContext } from "../../contexts/CartContext";
import { formatPrice } from "../../lib/services/productData";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../lib/services/imageUtils";

function ProductCard({ product }) {
  const { addToCart } = useCartContext();

  const handleAddToCart = () => {
    addToCart(product);
  };

  const imageSrc = resolveImageUrl(product.image);
  const categoryLabel = product.category || "Sin categoria";
  const stockLabel = product.isLowStock ? "Stock bajo" : "Disponible";

  return (
    <article
      className="producto product-card"
      data-name={product.nombre}
      data-category={product.category}
      data-price={product.price}
      data-id={product.id}
    >
      <div className="product-card__header">
        <span className="product-card__category">{categoryLabel}</span>
        <span
          className={`product-card__stock-badge ${
            product.isLowStock ? "product-card__stock-badge--warning" : ""
          }`}
        >
          {stockLabel}
        </span>
      </div>

      <div className="imagen product-card__image">
        <img
          src={imageSrc}
          alt={product.nombre}
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

        {product.isLowStock && (
          <p className="product-card__warning">
            Quedan pocas unidades disponibles. Agrega tu pedido antes de que se agote.
          </p>
        )}
      </div>

      <div className="product-card__footer">
        <div className="product-card__price-block">
          <span className="product-card__price-label">Precio unitario</span>
          <p className="precio product-card__price">{formatPrice(product.price)}</p>
        </div>

        <div className="botones product-card__actions">
          <button className="botoncito_producto" onClick={handleAddToCart}>
            Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
