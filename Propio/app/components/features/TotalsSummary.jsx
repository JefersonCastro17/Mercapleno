import React from "react";

function TotalsSummary({ totals, formatPrice, totalItems }) {
  return (
    <section className="cart-totals">
      <h2 className="cart-totals__title">Resumen de la compra</h2>
      <div className="cart-totals__rows">
        <div className="cart-totals__row">
          <span>Productos:</span>
          <span>{totalItems}</span>
        </div>
        <div className="cart-totals__row">
          <span>Subtotal:</span>
          <span>{formatPrice(totals.subTotal)}</span>
        </div>
        <div className="cart-totals__row">
          <span>Impuestos (19%):</span>
          <span>{formatPrice(totals.tax)}</span>
        </div>
      </div>
      <div className="cart-totals__total">
        <span>Total final:</span>
        <strong>{formatPrice(totals.finalTotal)}</strong>
      </div>
    </section>
  );
}

export default TotalsSummary;