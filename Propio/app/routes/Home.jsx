import { Link } from "react-router-dom";
import logo from "../logo.svg";
import styles from "../styles/HomeLanding.module.css";

const categories = [
  { code: "FV", title: "Frutas y verduras" },
  { code: "DE", title: "Despensa" },
  { code: "CA", title: "Carnes" },
  { code: "HO", title: "Aseo del hogar" }
];

const promotions = [
  {
    title: "Semana fresca",
    description: "Descuentos en frutas, verduras y productos seleccionados para tu mercado.",
    image: "/images/home/promo-fresh.svg"
  },
  {
    title: "Combos de despensa",
    description: "Basicos para la casa en una seleccion practica para comprar rapido.",
    image: "/images/home/promo-pantry.svg"
  }
];

const topSellers = [
  {
    title: "Canasta fresca",
    price: "$18.900",
    image: "/images/home/seller-fruits.svg"
  },
  {
    title: "Arroz premium",
    price: "$7.500",
    image: "/images/home/seller-rice.svg"
  },
  {
    title: "Kit aseo hogar",
    price: "$22.900",
    image: "/images/home/seller-clean.svg"
  },
  {
    title: "Combo lacteos",
    price: "$16.400",
    image: "/images/home/seller-milk.svg"
  }
];

function cx(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.noticeBar}>
          Mercado fresco, productos esenciales y promociones para tu hogar.
        </div>

        <header className={styles.topbar}>
          <Link to="/" className={styles.brand}>
            <img src={logo} alt="Mercapleno" className={styles.brandLogo} />
            <div>
              <strong>Mercapleno</strong>
              <span>Supermercado online</span>
            </div>
          </Link>

          <nav className={styles.topbarActions}>
            <Link to="/login" className={cx(styles.button, styles.buttonPortal)}>
              Iniciar sesion
            </Link>
            <Link to="/registro" className={cx(styles.button, styles.buttonPortal)}>
              Crear cuenta
            </Link>
          </nav>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Supermercado simple</span>
            <h1>Mercado, despensa y ofertas en un solo lugar.</h1>
            <p className={styles.description}>
              Una portada minimalista para encontrar rapido lo que necesitas para el hogar.
            </p>

            <div className={styles.actions}>
              <a href="#promociones" className={cx(styles.button, styles.buttonPrimary)}>
                Ver promociones
              </a>
              <Link to="/registro" className={cx(styles.button, styles.buttonSecondary)}>
                Crear cuenta
              </Link>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <img
              src="/images/home/hero-market.svg"
              alt="Ilustracion de mercado Mercapleno"
              className={styles.heroImage}
            />
            <span className={styles.panelLabel}>Promocion destacada</span>
            <strong>Hasta 30% en seleccion de frutas, verduras y productos del hogar.</strong>
            <p>Compra lo esencial con una experiencia clara, ligera y enfocada en supermercado.</p>
          </aside>
        </section>

        <section id="categorias" className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.sectionEyebrow}>Categorias</span>
              <h2>Compra rapido por categoria.</h2>
            </div>

            <a href="#promociones" className={styles.sectionLink}>
              Ver ofertas
            </a>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <article key={category.title} className={styles.categoryCard}>
                <div className={styles.categoryIcon}>{category.code}</div>
                <h3>{category.title}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.sectionEyebrow}>Promociones</span>
              <h2>Ofertas para comprar mejor.</h2>
            </div>
          </div>

          <div className={styles.promoGrid}>
            {promotions.map((promo) => (
              <article key={promo.title} className={styles.promoCard}>
                <img src={promo.image} alt={promo.title} className={styles.promoImage} />
                <div className={styles.promoCopy}>
                  <h3>{promo.title}</h3>
                  <p>{promo.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.sectionEyebrow}>Mas vendidos</span>
              <h2>Favoritos de la semana.</h2>
            </div>
          </div>

          <div className={styles.sellerGrid}>
            {topSellers.map((product) => (
              <article key={product.title} className={styles.sellerCard}>
                <img src={product.image} alt={product.title} className={styles.sellerImage} />
                <div className={styles.sellerCopy}>
                  <h3>{product.title}</h3>
                  <strong>{product.price}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="promociones" className={styles.cta}>
          <div>
            <span className={styles.ctaEyebrow}>Promociones</span>
            <h2>Ahorra en tu mercado de hoy.</h2>
          </div>

          <div className={styles.ctaActions}>
            <Link to="/registro" className={cx(styles.button, styles.buttonOutline)}>
              Empezar compra
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
