import React, { useState } from "react";
import { useCartContext } from "../../contexts/CartContext";
import { formatPrice } from "../../lib/services/productData";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../lib/services/imageUtils";

function ProductCard({ product }) {
  const { addToCart } = useCartContext();
  const [justAdded, setJustAdded] = useState(false);

  const priceValue = Number(product.precio ?? product.price ?? 0);
  const productId = Number(product.id ?? product.id_productos);
  const imageSrc = resolveImageUrl(product.image || product.imagen);
  const categoryLabel = product.category || product.categoria || "Sin categoria";
  const stockLabel = product.isLowStock ? "Stock bajo" : "Disponible";

  const handleAddToCart = () => {
    addToCart({
      ...product,
      id: productId,
      id_productos: productId,
      price: priceValue,
      precio: priceValue,
      image: product.image || product.imagen,
      nombre: product.nombre || product.name,
    });
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1200);
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

        {product.isLowStock && (
          <p className="product-card__warning">
            Quedan pocas unidades disponibles. Agrega tu pedido antes de que se agote.
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
            style={justAdded ? { backgroundColor: "#10b981", color: "#ffffff", borderColor: "#10b981" } : {}}
          >
            {justAdded ? "✓ ¡Agregado!" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
