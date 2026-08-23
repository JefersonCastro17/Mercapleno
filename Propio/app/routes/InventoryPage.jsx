import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import FilterBar from "../components/features/FilterBar";
import { getProducts, getCategories } from "../lib/services/productData";
import { useAuthContext } from "../contexts/AuthContext";
import { formatPrice } from "../lib/services/productData";

import "../styles/base.css";
import "../styles/inventory.css";

const isVisibleInCatalog = (producto) => {
  const status = String(producto?.estado || "").trim().toLowerCase();
  return status !== "deshabilitado" && status !== "no disponible" && status !== "no-disponible";
};

function InventoryPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuthContext();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [currentFilters, setCurrentFilters] = useState({
    nombre: "",
    categoria: "todas",
    precioMin: "",
    precioMax: ""
  });

  const handleUnauthorizedAccess = useCallback(() => {
    console.error("Acceso no autorizado. Redirigiendo a Login.");
    logout();
    navigate("/login");
  }, [navigate, logout]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        const categoriesArray = Array.isArray(response)
          ? response
          : response?.data || response?.categories || [];

        setCategories([{ value: "todas", label: "Todas las categorias" }, ...categoriesArray]);
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          handleUnauthorizedAccess();
          return;
        }

        console.error("Error al cargar categorias:", error);
        setCategories([{ value: "todas", label: "Todas las categorias" }]);
      }
    };

    fetchCategories();
  }, [handleUnauthorizedAccess]);

  const fetchFilteredProducts = useCallback(
    async (filters) => {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await getProducts(
          filters.nombre,
          filters.categoria,
          filters.precioMin,
          filters.precioMax
        );

        const productsArray = Array.isArray(data)
          ? data
          : data?.data || data?.products || [];

        const roleId = user ? Number(user.id_rol) : null;
        const visibleProducts = roleId === 2
          ? productsArray.filter(isVisibleInCatalog)
          : productsArray;

        setProducts(visibleProducts);
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          handleUnauthorizedAccess();
          return;
        }

        console.error("Error al cargar productos filtrados:", error);
        setLoadError(error?.message || "No se pudieron cargar los productos.");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [handleUnauthorizedAccess]
  );

  useEffect(() => {
    fetchFilteredProducts(currentFilters);
  }, [currentFilters, fetchFilteredProducts]);

  const visibleCategories = useMemo(
    () => categories.filter((cat) => cat.value !== "todas"),
    [categories]
  );

  const activeFilters = useMemo(() => {
    const items = [];

    if (currentFilters.nombre) {
      items.push(`Busqueda: ${currentFilters.nombre}`);
    }

    if (currentFilters.categoria && currentFilters.categoria !== "todas") {
      const currentCategory = visibleCategories.find(
        (category) => category.value === currentFilters.categoria
      );
      items.push(`Categoria: ${currentCategory?.label || currentFilters.categoria}`);
    }

    if (currentFilters.precioMin) {
      items.push(`Desde ${formatPrice(Number(currentFilters.precioMin))}`);
    }

    if (currentFilters.precioMax) {
      items.push(`Hasta ${formatPrice(Number(currentFilters.precioMax))}`);
    }

    return items;
  }, [currentFilters, visibleCategories]);

  const highlightedCategories = useMemo(() => visibleCategories.slice(0, 4), [visibleCategories]);

  const handleFilterChange = useCallback((newFilters) => {
    setCurrentFilters(newFilters);
  }, []);

  const handleCategoryShortcut = useCallback((categoryValue) => {
    setCurrentFilters((prev) => ({
      ...prev,
      categoria: categoryValue
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setCurrentFilters({
      nombre: "",
      categoria: "todas",
      precioMin: "",
      precioMax: ""
    });
  }, []);

  return (
    <div className="inventory-page-container">
      <header className="catalog-header">
        <div className="catalog-title">
          <span className="catalog-eyebrow">Catalogo</span>
          <h2>Explora el inventario disponible</h2>
          <p>
            Filtra por categoria, busca por nombre y arma tu pedido desde una vista mas limpia y ordenada.
          </p>
        </div>

        {highlightedCategories.length > 0 && (
          <div className="catalog-chip-row">
            <button
              type="button"
              className={`catalog-chip ${
                currentFilters.categoria === "todas" ? "catalog-chip--active" : ""
              }`}
              onClick={() => handleCategoryShortcut("todas")}
            >
              Todo
            </button>
            {highlightedCategories.map((category) => (
              <button
                key={category.value}
                type="button"
                className={`catalog-chip ${
                  currentFilters.categoria === category.value ? "catalog-chip--active" : ""
                }`}
                onClick={() => handleCategoryShortcut(category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <FilterBar
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        categories={categories}
      />

      {activeFilters.length > 0 && (
        <div className="catalog-active-filters">
          <span>Filtros activos</span>
          <div className="catalog-active-filters__list">
            {activeFilters.map((filterLabel) => (
              <span key={filterLabel} className="catalog-active-filters__pill">
                {filterLabel}
              </span>
            ))}
          </div>
        </div>
      )}

      {loadError && !isLoading && <p className="catalog-empty">{loadError}</p>}

      {isLoading ? (
        <p className="catalog-loading">Cargando productos...</p>
      ) : (
        <section className="catalogo">
          {products.length > 0 ? (
            products.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <div className="catalog-empty-panel">
              <h3>No encontramos productos con esos filtros</h3>
              <p>Prueba otra categoria, amplia el rango de precio o limpia la busqueda.</p>
              <button type="button" className="catalog-secondary-btn" onClick={handleClearFilters}>
                Mostrar todo
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default InventoryPage;
