import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartContext } from "../contexts/CartContext";
import { useAuthContext } from "../contexts/AuthContext";
import CartItem from "../components/ui/CartItem";
import TotalsSummary from "../components/features/TotalsSummary";
import { formatPrice } from "../lib/services/productData";

import "../styles/base.css";
import "../styles/cart.css";

const PAYMENT_METHODS = [
  { id: 1, name: "Efectivo", dbId: "M1" },
  { id: 2, name: "Tarjeta de Credito", dbId: "M2" },
  { id: 3, name: "Tarjeta de Debito", dbId: "M3" },
  { id: 4, name: "Transferencia", dbId: "M4" },
  { id: 5, name: "Nequi", dbId: "M5" },
  { id: 6, name: "Daviplata", dbId: "M6" }
];

function CartPage() {
  const navigate = useNavigate();
  const { cart, totalItems, clearCart, processCheckout } = useCartContext();
  const { isAuthenticated, getUserId } = useAuthContext();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS[0].dbId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const totals = useMemo(() => {
    const subTotalCents = cart.reduce((sum, item) => sum + Math.round(item.price * 100) * item.cantidad, 0);
    const subTotal = subTotalCents / 100;
    const taxRate = 0.19;
    const taxCents = Math.round(subTotalCents * taxRate);
    const tax = taxCents / 100;
    const finalTotalCents = subTotalCents + taxCents;
    const finalTotal = finalTotalCents / 100;
    return { subTotal, tax, finalTotal };
  }, [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError("Tu carrito esta vacio.");
      return;
    }

    const id_usuario = getUserId();
    if (!isAuthenticated || !id_usuario) {
      setCheckoutError("Debes iniciar sesion para completar la compra.");
      return;
    }

    setIsProcessing(true);
    setCheckoutError(null);

    try {
      const result = await processCheckout(selectedPaymentMethod);

      if (result && (result.id_venta || result.ticketId)) {
        localStorage.setItem("lastPurchasedCart", JSON.stringify(cart));
        localStorage.setItem(
          "lastPurchasedTotals",
          JSON.stringify({
            ...totals,
            ticketId: result.ticketId || result.id_venta || "N/A",
            paymentMethod: PAYMENT_METHODS.find((m) => m.dbId === selectedPaymentMethod)?.name || "Desconocido",
            warnings: Array.isArray(result.warnings) ? result.warnings : []
          })
        );

        clearCart();
        navigate("/ticket");
      } else {
        setCheckoutError("Error al procesar la compra.");
      }
    } catch (error) {
      setCheckoutError(error.message || "Error grave al procesar el pago.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="cart-page">
      <div className="cart-page__shell">
        <header className="cart-page__header">
          <div>
            <h1>Tu Carrito</h1>
            <p>Revisa tu pedido y finaliza la compra de forma segura.</p>
          </div>
          <div className="cart-page__badge">
            <span>{totalItems} productos</span>
            <strong>{formatPrice(totals.finalTotal)}</strong>
          </div>
        </header>

        {totalItems === 0 ? (
          <section className="cart-empty">
            <h2>Tu carrito esta vacio</h2>
            <p>Agrega productos desde el catalogo para continuar.</p>
            <button type="button" className="cart-btn cart-btn--primary" onClick={() => navigate("/catalogo")}>
              Explorar productos
            </button>
          </section>
        ) : (
          <div className="cart-page__grid">
            <section className="cart-list-panel">
              <div className="cart-list-head">
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Subtotal</span>
              </div>

              <div className="cart-list-body">
                {cart.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </section>

            <aside className="cart-summary-panel">
              <div className="cart-summary-panel__actions">
                <button
                  type="button"
                  className="cart-btn cart-btn--danger"
                  onClick={() => {
                    if (window.confirm("Vaciar carrito?")) clearCart();
                  }}
                >
                  Vaciar carrito
                </button>
                <button
                  type="button"
                  className="cart-btn cart-btn--muted"
                  onClick={() => navigate("/catalogo")}
                >
                  Seguir comprando
                </button>
              </div>

              <div className="cart-payment-box">
                <label htmlFor="payment-method">Metodo de pago</label>
                <select
                  id="payment-method"
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  disabled={isProcessing}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.dbId} value={method.dbId}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>

              <TotalsSummary totals={totals} totalItems={totalItems} formatPrice={formatPrice} />

              {checkoutError && <p className="cart-checkout-error">{checkoutError}</p>}

              <button
                type="button"
                className="cart-btn cart-btn--pay"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? "Procesando..." : `Pagar ${formatPrice(totals.finalTotal)}`}
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default CartPage;
