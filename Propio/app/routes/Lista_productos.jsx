import React, { useEffect, useMemo, useState } from "react";
import "../styles/adminProducts.css";
import { resolveImageUrl, FALLBACK_IMAGE } from "../lib/services/imageUtils";
import { httpRequest } from "../lib/api/httpClient";
import { API_ENDPOINTS } from "../lib/config/api.config";
import { useAuthContext } from "../contexts/AuthContext";

const EMPTY_PRODUCT_FORM = {
  nombre: "",
  precio: "",
  id_categoria: "",
  id_proveedor: "",
  descripcion: "",
  estado: "Disponible",
  imagen: "",
  imageFile: null
};

const EMPTY_CATALOGS = {
  categorias: [],
  proveedores: []
};

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif";

function createProductFormState(producto = {}) {
  return {
    nombre: producto.nombre ?? "",
    precio: producto.precio ?? "",
    id_categoria: producto.id_categoria ?? "",
    id_proveedor: producto.id_proveedor ?? "",
    descripcion: producto.descripcion ?? "",
    estado: producto.estado ?? "Disponible",
    imagen: typeof producto.imagen === "string" ? producto.imagen : "",
    imageFile: null
  };
}

function buildProductFormData(formData) {
  const payload = new FormData();

  payload.append("nombre", String(formData.nombre ?? "").trim());
  payload.append("precio", String(formData.precio ?? "").trim());
  payload.append("id_categoria", String(formData.id_categoria ?? "").trim());
  payload.append("id_proveedor", String(formData.id_proveedor ?? "").trim());
  payload.append("estado", String(formData.estado ?? "Disponible").trim());

  const descripcion = String(formData.descripcion ?? "").trim();

  if (descripcion) {
    payload.append("descripcion", descripcion);
  }

  if (formData.imageFile instanceof File) {
    payload.append("imagen", formData.imageFile);
  } else if (typeof formData.imagen === "string" && formData.imagen.trim()) {
    payload.append("imagen", formData.imagen.trim());
  }

  return payload;
}

function formatPrice(value) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return "$0";
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(numericValue);
}

function ProductModal({
  title,
  submitLabel,
  initialData,
  categorias,
  proveedores,
  loadingCatalogs,
  onCerrar,
  onGuardar
}) {
  const [formData, setFormData] = useState(() =>
    createProductFormState(initialData)
  );

  const [previewSrc, setPreviewSrc] = useState(() =>
    initialData?.imagen ? resolveImageUrl(initialData.imagen) : ""
  );

  useEffect(() => {
    setFormData(createProductFormState(initialData));
    setPreviewSrc(
      initialData?.imagen ? resolveImageUrl(initialData.imagen) : ""
    );
  }, [initialData]);

  useEffect(() => {
    return () => {
      if (previewSrc.startsWith("blob:")) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const updatePreview = (nextPreview) => {
    setPreviewSrc((currentPreview) => {
      if (currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }

      return nextPreview;
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === "imagen") {
      const trimmed = value.trim();
      if (trimmed) {
        updatePreview(resolveImageUrl(trimmed));
      } else if (!formData.imageFile) {
        updatePreview("");
      }
    }
  };

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setFormData((prev) => ({
      ...prev,
      imageFile: selectedFile
    }));

    if (selectedFile) {
      updatePreview(URL.createObjectURL(selectedFile));
      return;
    }

    updatePreview(
      formData.imagen ? resolveImageUrl(formData.imagen) : ""
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onGuardar(buildProductFormData(formData));
  };

  return (
    <div className="products-modal-backdrop">
      <div className="products-modal">
        <div className="products-modal__header">
          <div>
            <span className="products-modal__eyebrow">Producto</span>
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="products-btn products-btn--ghost"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>

        <form className="products-modal__form" onSubmit={handleSubmit}>
          {initialData?.id_productos ? (
            <div className="products-modal__field">
              <label>ID</label>
              <input
                type="text"
                name="id_productos"
                value={initialData.id_productos}
                disabled
              />
            </div>
          ) : null}

          <div className="products-modal__grid">
            <div className="products-modal__field">
              <label>Nombre</label>

              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="products-modal__field">
              <label>Precio</label>

              <input
                type="number"
                name="precio"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="products-modal__field">
              <label>Categoria</label>

              <select
                name="id_categoria"
                value={formData.id_categoria}
                onChange={handleChange}
                disabled={
                  loadingCatalogs || categorias.length === 0
                }
                required
              >
                {loadingCatalogs ? (
                  <option value="">
                    Cargando categorias...
                  </option>
                ) : (
                  <>
                    <option value="">
                      Seleccione una categoria
                    </option>

                    {categorias.map((categoria) => (
                      <option
                        key={categoria.id}
                        value={categoria.id}
                      >
                        {categoria.nombre}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="products-modal__field">
              <label>Proveedor</label>

              <select
                name="id_proveedor"
                value={formData.id_proveedor}
                onChange={handleChange}
                disabled={
                  loadingCatalogs || proveedores.length === 0
                }
                required
              >
                {loadingCatalogs ? (
                  <option value="">
                    Cargando proveedores...
                  </option>
                ) : (
                  <>
                    <option value="">
                      Seleccione un proveedor
                    </option>

                    {proveedores.map((proveedor) => (
                      <option
                        key={proveedor.id}
                        value={proveedor.id}
                      >
                        {proveedor.nombre}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="products-modal__field">
              <label>Estado</label>

              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
              >
                <option value="Disponible">Disponible</option>
                <option value="Agotado">Agotado</option>
                <option value="Deshabilitado">
                  Deshabilitado
                </option>
              </select>

              <small className="help-text">
                Disponible / Agotado / Deshabilitado
              </small>
            </div>

            <div className="products-modal__field products-modal__field--full">
              <label>Descripcion</label>

              <textarea
                name="descripcion"
                rows="4"
                value={formData.descripcion}
                onChange={handleChange}
              />
            </div>

            <div className="products-modal__field products-modal__field--full">
              <label>URL de imagen en internet (Recomendado)</label>

              <input
                type="url"
                name="imagen"
                placeholder="https://images.unsplash.com/... o https://... (enlace web)"
                value={formData.imagen}
                onChange={handleChange}
              />

              <p className="products-modal__help">
                Pega el enlace directo de la imagen desde internet (Unsplash, Google, distribuidor). Las URLs web no se borran al reiniciar el servidor.
              </p>
            </div>

            <div className="products-modal__field products-modal__field--full">
              <label>O sube un archivo desde tu equipo</label>

              <input
                type="file"
                name="imageFile"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={handleImageChange}
              />

              <p className="products-modal__help">
                Formatos: JPG, PNG, WEBP o GIF (máximo 5 MB).
              </p>

              {formData.imageFile ? (
                <p className="products-modal__help" style={{ color: "var(--color-principal, #0B4A8B)", fontWeight: 700 }}>
                  ✓ Archivo seleccionado: {formData.imageFile.name}
                </p>
              ) : null}
            </div>
          </div>

          {previewSrc ? (
            <div className="products-modal__preview">
              <img
                src={previewSrc}
                alt={
                  formData.nombre ||
                  "Vista previa del producto"
                }
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
            </div>
          ) : null}

          <div className="products-modal__actions">
            <button
              type="button"
              className="products-btn products-btn--ghost"
              onClick={onCerrar}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="products-btn products-btn--primary"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductRow({
  producto,
  onEdit,
  onToggleEstado,
  onDelete
}) {
  const estaDeshabilitado =
    String(producto.estado || "").trim().toLowerCase() ===
    "deshabilitado";

  return (
    <tr>
      <td>
        <div className="products-table__item">
          <div className="products-table__thumb">
            <img
              src={resolveImageUrl(producto.imagen)}
              alt={producto.nombre}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>

          <div className="products-table__main">
            <p className="products-table__id">
              ID {producto.id_productos}
            </p>

            <strong>{producto.nombre}</strong>

            <span>
              {producto.descripcion ||
                "Sin descripcion registrada."}
            </span>
          </div>
        </div>
      </td>

      <td>{formatPrice(producto.precio)}</td>

      <td>
        {producto.categoria_nombre || producto.id_categoria}
      </td>

      <td>
        {producto.proveedor_nombre || producto.id_proveedor}
      </td>

      <td>
        <span
          className={`products-status ${
            String(producto.estado).toLowerCase() ===
            "agotado"
              ? "is-empty"
              : estaDeshabilitado
              ? "is-disabled"
              : "is-ready"
          }`}
        >
          {producto.estado}
        </span>
      </td>

      <td>
        <div className="products-table__actions">
          <button
            type="button"
            className="products-btn products-btn--secondary"
            onClick={() =>
              onEdit(producto.id_productos)
            }
          >
            Editar
          </button>

          <button
            type="button"
            className={
              estaDeshabilitado
                ? "products-btn products-btn--primary"
                : "products-btn products-btn--danger"
            }
            onClick={() => onToggleEstado(producto)}
          >
            {estaDeshabilitado
              ? "Habilitar"
              : "Deshabilitar"}
          </button>

          <button
            type="button"
            className="products-btn products-btn--danger"
            onClick={() => onDelete(producto.id_productos)}
            >
              Eliminar
            </button>
        </div>
      </td>
    </tr>
  );
}

function ProductCard({
  producto,
  onEdit,
  onToggleEstado,
  onDelete
}) {
  const estaDeshabilitado =
    String(producto.estado || "").trim().toLowerCase() ===
    "deshabilitado";

  return (
    <article className="products-card">
      <div className="products-card__header">
        <div className="products-card__thumb">
          <img
            src={resolveImageUrl(producto.imagen)}
            alt={producto.nombre}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </div>

        <div className="products-card__heading">
          <p>ID {producto.id_productos}</p>

          <h3>{producto.nombre}</h3>

          <span
            className={`products-status ${
              String(producto.estado).toLowerCase() ===
              "agotado"
                ? "is-empty"
                : estaDeshabilitado
                ? "is-disabled"
                : "is-ready"
            }`}
          >
            {producto.estado}
          </span>
        </div>
      </div>

      <p className="products-card__price">
        {formatPrice(producto.precio)}
      </p>

      <p className="products-card__description">
        {producto.descripcion ||
          "Sin descripcion registrada."}
      </p>

      <div className="products-card__meta">
        <span>
          Categoria:{" "}
          {producto.categoria_nombre ||
            producto.id_categoria}
        </span>

        <span>
          Proveedor:{" "}
          {producto.proveedor_nombre ||
            producto.id_proveedor}
        </span>
      </div>

      <div className="products-card__actions">
        <button
          type="button"
          className="products-btn products-btn--secondary"
          onClick={() =>
            onEdit(producto.id_productos)
          }
        >
          Editar
        </button>

        <button
          type="button"
          className={
            estaDeshabilitado
              ? "products-btn products-btn--primary"
              : "products-btn products-btn--danger"
          }
          onClick={() => onToggleEstado(producto)}
        >
          {estaDeshabilitado
            ? "Habilitar"
            : "Deshabilitar"}
        </button>

        <button
          type="button"
          className="products-btn products-btn--danger"
          onClick={() => onDelete(producto.id_productos)}
          >
            Eliminar
          </button>
      </div>
    </article>
  );
}

export default function Lista_productos() {
  const { token, logout } = useAuthContext();

  const [productos, setProductos] = useState([]);
  const [catalogos, setCatalogos] =
    useState(EMPTY_CATALOGS);

  const [loadingCatalogs, setLoadingCatalogs] =
    useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [productoEditando, setProductoEditando] =
    useState(null);

  const [modalAgregarVisible, setModalAgregarVisible] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("todos");

  const handleAuthError = (err) => {
    if (
      err?.status === 401 ||
      err?.status === 403
    ) {
      logout();
      setError(
        "Sesion expirada. Inicia sesion nuevamente."
      );
      return true;
    }

    return false;
  };

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await httpRequest(
        API_ENDPOINTS.products.crud,
        {
          auth: true,
          token
        }
      );

      setProductos(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      if (handleAuthError(err)) return;

      setError(
        err.message ||
          "Error de conexion con el servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogos = async () => {
    setLoadingCatalogs(true);

    try {
      const data = await httpRequest(
        API_ENDPOINTS.products.catalogs,
        {
          auth: true,
          token
        }
      );

      setCatalogos({
        categorias: Array.isArray(data?.categorias)
          ? data.categorias
          : [],

        proveedores: Array.isArray(data?.proveedores)
          ? data.proveedores
          : []
      });
    } catch (err) {
      if (handleAuthError(err)) return;

      setError(
        err.message ||
          "No se pudieron cargar categorias y proveedores."
      );

      setCatalogos(EMPTY_CATALOGS);
    } finally {
      setLoadingCatalogs(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setLoadingCatalogs(false);
      return;
    }

    fetchProductos();
    fetchCatalogos();
  }, [token]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return productos.filter((producto) => {
      const matchesSearch =
        !normalizedSearch ||
        String(producto.id_productos)
          .includes(normalizedSearch) ||
        String(producto.nombre || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(producto.descripcion || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(producto.categoria_nombre || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(producto.proveedor_nombre || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(producto.id_categoria || "")
          .includes(normalizedSearch) ||
        String(producto.id_proveedor || "")
          .includes(normalizedSearch);

      const productStatus = String(
        producto.estado || ""
      )
        .trim()
        .toLowerCase();

      const matchesStatus =
        (statusFilter === "todos" &&
          productStatus !== "deshabilitado") ||

        (statusFilter === "disponible" &&
          productStatus !== "agotado" &&
          productStatus !== "deshabilitado") ||

        (statusFilter === "agotado" &&
          productStatus === "agotado") ||

        (statusFilter === "deshabilitado" &&
          productStatus === "deshabilitado");

      return matchesSearch && matchesStatus;
    });
  }, [productos, searchTerm, statusFilter]);

  /*
   * DESHABILITAR / HABILITAR PRODUCTO
   *
   * No elimina el producto.
   * Solamente cambia su estado.
   */
  const handleToggleEstado = async (producto) => {
    const estadoActual = String(
      producto.estado || ""
    )
      .trim()
      .toLowerCase();

    const estaDeshabilitado =
      estadoActual === "deshabilitado";

    const nuevoEstado = estaDeshabilitado
      ? "Disponible"
      : "Deshabilitado";

    const mensaje = estaDeshabilitado
      ? `¿Deseas habilitar el producto "${producto.nombre}"?`
      : `¿Deseas deshabilitar el producto "${producto.nombre}"?`;

    if (!window.confirm(mensaje)) {
      return;
    }

    const idNumerico = parseInt(
      String(producto.id_productos).replace(
        /[^\d]/g,
        ""
      ),
      10
    );

    if (Number.isNaN(idNumerico)) {
      alert("Error: ID de producto no válido.");
      return;
    }

    try {
      /*
       * Enviamos los datos completos porque el UpdateProductDto
       * puede requerir los campos principales del producto.
       */
      const payload = new FormData();

      payload.append(
        "nombre",
        String(producto.nombre ?? "").trim()
      );

      payload.append(
        "precio",
        String(producto.precio ?? "").trim()
      );

      payload.append(
        "id_categoria",
        String(producto.id_categoria ?? "").trim()
      );

      payload.append(
        "id_proveedor",
        String(producto.id_proveedor ?? "").trim()
      );

      payload.append(
        "estado",
        nuevoEstado
      );

      const descripcion = String(
        producto.descripcion ?? ""
      ).trim();

      if (descripcion) {
        payload.append(
          "descripcion",
          descripcion
        );
      }

      await httpRequest(
        `${API_ENDPOINTS.products.crud}/${idNumerico}`,
        {
          method: "PUT",
          data: payload,
          auth: true,
          token
        }
      );

      await fetchProductos();

      alert(
        nuevoEstado === "Deshabilitado"
          ? "Producto deshabilitado correctamente."
          : "Producto habilitado correctamente."
      );
    } catch (err) {
      if (handleAuthError(err)) return;

      alert(
        err.message ||
          "No se pudo cambiar el estado del producto."
      );
    }
  };

  const handleEdit = (id) => {
    const idNumerico = parseInt(
      String(id).replace(/[^\d]/g, ""),
      10
    );

    const productoAEditar =
      productos.find(
        (producto) =>
          producto.id_productos === idNumerico
      );

    setProductoEditando(
      productoAEditar || null
    );
  };

  const handleCloseModal = () => {
    setProductoEditando(null);
    setModalAgregarVisible(false);
  };

  const handleUpdateSubmit = async (payload) => {
    if (!productoEditando) {
      return;
    }

    const idNumerico = parseInt(
      String(
        productoEditando.id_productos
      ).replace(/[^\d]/g, ""),
      10
    );

    if (Number.isNaN(idNumerico)) {
      alert(
        "Error: ID de producto no válido para la actualización."
      );
      return;
    }

    try {
      await httpRequest(
        `${API_ENDPOINTS.products.crud}/${idNumerico}`,
        {
          method: "PUT",
          data: payload,
          auth: true,
          token
        }
      );

      handleCloseModal();

      await fetchProductos();

      alert(
        `Producto ${productoEditando.id_productos} actualizado.`
      );
    } catch (err) {
      if (handleAuthError(err)) return;

      alert(
        err.message ||
          "Error de conexion."
      );
    }
  };

  const handleAddSubmit = async (payload) => {
    try {
      await httpRequest(
        API_ENDPOINTS.products.crud,
        {
          method: "POST",
          data: payload,
          auth: true,
          token
        }
      );

      handleCloseModal();

      await fetchProductos();

      alert(
        "Producto agregado correctamente."
      );
    } catch (err) {
      if (handleAuthError(err)) return;

      alert(
        err.message ||
          "Error de conexion."
      );
    }
  };

  const handleDelete = async (id) => {
    const idNumerico = parseInt(
      String(id).replace(/[^\d]/g, ""),
      10
    );

    if (Number.isNaN(idNumerico)) {
      alert("Error: ID de producto no válido para eliminar.");
      return;
    }

    const producto = productos.find(
      (item) => item.id_productos === idNumerico
    );

    if (!producto) {
      alert("No se encontró el producto a eliminar.");
      return;
    }

    const confirmado = window.confirm(
      `¿Deseas eliminar permanentemente el producto "${producto.nombre}"?`
    );

    if (!confirmado) {
      return;
    }

    try {
      await httpRequest(
        `${API_ENDPOINTS.products.crud}/${idNumerico}`,
        {
          method: "DELETE",
          auth: true,
          token
        }
      );

      await fetchProductos();
      alert("Producto eliminado correctamente.");
    } catch (err) {
      if (handleAuthError(err)) return;

      const errorMessage = err.message ? err.message.toLowerCase() : "";
      const isConstraintError = errorMessage.includes("foreign") || 
                                errorMessage.includes("constraint") || 
                                errorMessage.includes("reference") || 
                                errorMessage.includes("ventas");

      if (isConstraintError) {
        alert("No se puede eliminar el producto porque tiene ventas asociadas. Por favor, deshabilítalo en su lugar para mantener el historial.");
      } else {
        alert(
          err.message ||
            "No se pudo eliminar el producto. Verifica que no tenga ventas asociadas."
        );
      }
    }
  };

  return (
    <main className="products-shell">
      <div className="products-wrap">

        <section className="products-header-card">
          <div>
            <span className="products-overline">
              Inventario
            </span>

            <h1>
              Lista de productos
            </h1>

            <p>
              Administra tus productos y cambia
              su estado sin eliminarlos.
            </p>
          </div>

          <div className="products-header-actions">
            <button
              type="button"
              className="products-btn products-btn--ghost"
              onClick={() =>
                window.history.back()
              }
            >
              Volver
            </button>

            <button
              type="button"
              className="products-btn products-btn--primary"
              onClick={() =>
                setModalAgregarVisible(true)
              }
            >
              Agregar producto
            </button>
          </div>
        </section>

        <section className="products-toolbar">
          <div className="products-toolbar__field products-toolbar__field--grow">
            <label htmlFor="product-search">
              Buscar
            </label>

            <input
              id="product-search"
              type="text"
              placeholder="Nombre, ID, categoria o proveedor"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <div className="products-toolbar__field">
            <label htmlFor="product-status">
              Estado
            </label>

            <select
              id="product-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="todos">
                Productos activos
              </option>

              <option value="disponible">
                Disponibles
              </option>

              <option value="agotado">
                Agotados
              </option>

              <option value="deshabilitado">
                Productos deshabilitados
              </option>
            </select>
          </div>

          <div className="products-toolbar__summary">
            <span>
              {filteredProducts.length}
            </span>

            <small>
              resultado(s)
            </small>
          </div>
        </section>

        <section className="products-section">
          {loading ? (
            <p className="products-state">
              Cargando productos...
            </p>
          ) : null}

          {error ? (
            <p className="products-state products-state--error">
              {error}
            </p>
          ) : null}

          {!loadingCatalogs &&
          (catalogos.categorias.length === 0 ||
            catalogos.proveedores.length === 0) ? (
            <p className="products-state products-state--error">
              Faltan categorias o proveedores en
              la base de datos. El formulario de
              productos puede quedar incompleto
              hasta cargar esos catalogos.
            </p>
          ) : null}

          {!loading &&
          !error &&
          filteredProducts.length === 0 ? (
            <div className="products-empty">
              <h2>
                No encontramos productos con ese filtro
              </h2>

              <p>
                Prueba limpiando la busqueda o
                cambiando el estado seleccionado.
              </p>
            </div>
          ) : null}

          {!loading &&
          !error &&
          filteredProducts.length > 0 ? (
            <>
              <div className="products-warning">
                <strong>Importante:</strong> al
                deshabilitar un producto no se
                elimina de la base de datos. El
                producto pasa a la sección de
                deshabilitados y puede volver a
                habilitarse posteriormente.
              </div>

              <div className="products-table-wrap">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Categoria</th>
                      <th>Proveedor</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map(
                      (producto) => (
                        <ProductRow
  key={producto.id_productos}
  producto={producto}
  onEdit={handleEdit}
  onToggleEstado={handleToggleEstado}
  onDelete={handleDelete}
/>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="products-cards">
                {filteredProducts.map(
                  (producto) => (
                    <ProductCard
                      key={producto.id_productos}
                      producto={producto}
                      onEdit={handleEdit}
                      onToggleEstado={handleToggleEstado}
                      onDelete={handleDelete}
                    />
                  )
                )}
              </div>
            </>
          ) : null}
        </section>
      </div>

      {productoEditando ? (
        <ProductModal
          title={`Editar ${productoEditando.nombre}`}
          submitLabel="Guardar cambios"
          initialData={productoEditando}
          categorias={catalogos.categorias}
          proveedores={catalogos.proveedores}
          loadingCatalogs={
            loadingCatalogs
          }
          onCerrar={handleCloseModal}
          onGuardar={handleUpdateSubmit}
        />
      ) : null}

      {modalAgregarVisible ? (
        <ProductModal
          title="Agregar producto"
          submitLabel="Agregar"
          initialData={EMPTY_PRODUCT_FORM}
          categorias={catalogos.categorias}
          proveedores={catalogos.proveedores}
          loadingCatalogs={
            loadingCatalogs
          }
          onCerrar={handleCloseModal}
          onGuardar={handleAddSubmit}
        />
      ) : null}
    </main>
  );
}
