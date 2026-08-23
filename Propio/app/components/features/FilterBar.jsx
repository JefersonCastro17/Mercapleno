import React, { useEffect, useState } from "react";

function FilterBar({ onFilterChange, categories, filters }) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange(localFilters);
    }, localFilters.nombre ? 250 : 0);

    return () => clearTimeout(timeoutId);
  }, [localFilters, onFilterChange]);

  const handleInputChange = (event) => {
    const { id, value } = event.target;
    setLocalFilters((prev) => ({ ...prev, [id]: value }));
  };

  const handleClear = () => {
    const defaultFilters = {
      nombre: "",
      categoria: "todas",
      precioMin: "",
      precioMax: ""
    };

    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <section className="filtros">
      <div className="filter-field filter-field--search">
        <label htmlFor="nombre">Busqueda</label>
        <input
          id="nombre"
          type="text"
          placeholder="Nombre del producto"
          value={localFilters.nombre}
          onChange={handleInputChange}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="categoria">Categoria</label>
        <select id="categoria" value={localFilters.categoria} onChange={handleInputChange}>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="precioMin">Precio minimo</label>
        <input
          id="precioMin"
          type="number"
          placeholder="Ej: 5000"
          value={localFilters.precioMin}
          onChange={handleInputChange}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="precioMax">Precio maximo</label>
        <input
          id="precioMax"
          type="number"
          placeholder="Ej: 30000"
          value={localFilters.precioMax}
          onChange={handleInputChange}
        />
      </div>

      <div className="filter-actions">
        <button id="limpiar" type="button" className="boton-nav" onClick={handleClear}>
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}

export default FilterBar;
