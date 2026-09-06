import { useEffect, useState } from "react";
import { Check, Moon, Pencil, Plus, Sun, Trash2, X } from "lucide-react";
import { MAX_PROPERTY_IMAGES } from "../../shared/constants.js";
import { API_URL, assetUrl } from "./api.js";
const emptyProperty = {
  title: "",
  description: "",
  type: "Casa",
  operation: "Venta",
  location: "",
  price: "",
  currency: "USD",
  bedrooms: 0,
  bathrooms: 1,
  areaM2: "",
  imageUrls: [],
  imageFiles: [],
};

const fieldLabels = {
  title: "Título",
  description: "Descripción",
  location: "Ubicación",
  price: "Precio",
  areaM2: "Superficie (m²)",
};

// El panel administra el token y mantiene el catálogo sincronizado con la API.
export default function AdminSection({ onExit, darkMode, setDarkMode }) {
  const [token, setToken] = useState(null);
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [form, setForm] = useState(emptyProperty);
  const [editingId, setEditingId] = useState(null);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("properties");
  const [inquiryToDelete, setInquiryToDelete] = useState(null);

  const loadProperties = async () => {
    const response = await fetch(`${API_URL}/admin/properties`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("No se pudo cargar el catálogo");
    setProperties(await response.json());
  };

  const loadInquiries = async () => {
    const response = await fetch(`${API_URL}/admin/inquiries`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("No se pudieron cargar las consultas");
    return response.json();
  };

  useEffect(() => {
    if (token) {
      Promise.all([loadProperties(), loadInquiries()])
        .then(([, loadedInquiries]) => setInquiries(loadedInquiries))
        .catch(() => {
        setToken(null);
        });
    }
  }, [token]);

  const login = async (event) => {
    event.preventDefault();
    setError("");
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.message);
    setToken(data.token);
  };

  const saveProperty = async (event) => {
    event.preventDefault();
    if (!form.imageUrls.some(Boolean) && !form.imageFiles.length) {
      return setError("Seleccioná al menos una foto");
    }
    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId
      ? `${API_URL}/admin/properties/${editingId}`
      : `${API_URL}/admin/properties`;
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "imageFiles" || key === "featured") return;
      payload.append(
        key,
        key === "imageUrls" ? JSON.stringify(value.filter(Boolean)) : String(value),
      );
    });
    form.imageFiles.forEach((file) => payload.append("images", file));
    const response = await fetch(endpoint, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    });
    if (!response.ok) return setError("No se pudo guardar la propiedad");
    setForm(emptyProperty);
    setEditingId(null);
    setError("");
    await loadProperties();
  };

  const removeProperty = async (id) => {
    if (!window.confirm("¿Eliminar esta propiedad?")) return;
    await fetch(`${API_URL}/admin/properties/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadProperties();
  };

  const toggleInquiry = async (inquiry) => {
    await fetch(`${API_URL}/admin/inquiries/${inquiry.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ attended: !inquiry.attended }),
    });
    const loadedInquiries = await loadInquiries();
    setInquiries(loadedInquiries);
  };

  const removeInquiry = async (id) => {
    await fetch(`${API_URL}/admin/inquiries/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setInquiries(await loadInquiries());
    setInquiryToDelete(null);
  };

  if (!token)
    return (
      <section className="admin-login-screen">
        <button
          className="theme-toggle admin-theme-toggle"
          onClick={() => setDarkMode((enabled) => !enabled)}
          aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
        >
          <span key={String(darkMode)} className="theme-icon">
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </span>
        </button>
        <h1>
          Acceso <em>administrador.</em>
        </h1>
        <form className="contact-form admin-login" onSubmit={login}>
          <label>
            Usuario
            <input
              required
              value={credentials.username}
              onChange={(event) =>
                setCredentials({ ...credentials, username: event.target.value })
              }
            />
          </label>
          <label>
            Contraseña
            <input
              required
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials({ ...credentials, password: event.target.value })
              }
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button">Ingresar</button>
        </form>
      </section>
    );

  const updateForm = (event) =>
    setForm({
      ...form,
      [event.target.name]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    });

  return (
    <section className="inner-page admin-page">
      <div className="admin-header">
        <div>
          <div className="eyebrow">
            <span /> Gestión privada
          </div>
          <h1>Panel de <em>administración.</em></h1>
        </div>
        <div className="admin-header-actions">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((enabled) => !enabled)}
            aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
          >
            <span key={String(darkMode)} className="theme-icon">
              {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            </span>
          </button>
          <button onClick={onExit}>Volver al sitio</button>
          <button onClick={() => {
            setToken(null);
          }}>Cerrar sesión</button>
        </div>
      </div>
      <nav className="admin-tabs">
        <button className={activeTab === "properties" ? "active" : ""} onClick={() => setActiveTab("properties")}>
          Propiedades <span>{properties.length}</span>
        </button>
        <button className={activeTab === "inquiries" ? "active" : ""} onClick={() => setActiveTab("inquiries")}>
          Consultas <span>{inquiries.length}</span>
        </button>
      </nav>
      {activeTab === "properties" ? (
      <div className="admin-layout">
        <form className="contact-form admin-form" onSubmit={saveProperty}>
          <div className="admin-form-title">
            <h2>{editingId ? "Editar propiedad" : "Nueva propiedad"}</h2>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setForm(emptyProperty);
                  setEditingId(null);
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
          {[
            "title",
            "description",
            "location",
            "price",
            "areaM2",
          ].map((field) => (
            <label key={field}>
              {fieldLabels[field]}
              <input
                name={field}
                required
                value={form[field]}
                onChange={updateForm}
              />
            </label>
          ))}
          <div className="image-fields">
            <div className="image-fields-heading">
              <span>Fotos (hasta 10)</span>
              {form.imageUrls.length + form.imageFiles.length < MAX_PROPERTY_IMAGES && (
                <button
                  type="button"
                  onClick={() => document.getElementById("property-images").click()}
                >
                  <Plus size={15} /> Elegir fotos
                </button>
              )}
            </div>
            <input
              id="property-images"
              className="image-file-picker"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const selected = Array.from(event.target.files || []).slice(
                  0,
                  MAX_PROPERTY_IMAGES - form.imageUrls.length - form.imageFiles.length,
                );
                setForm({ ...form, imageFiles: [...form.imageFiles, ...selected] });
                event.target.value = "";
              }}
            />
            {(form.imageUrls.length > 0 || form.imageFiles.length > 0) && (
              <div className="image-selection-list">
                {form.imageUrls.map((image, index) => (
                  <div className="selected-file-row" key={`existing-${image}-${index}`}>
                    <img src={assetUrl(image)} alt="" />
                    <span title={image}>Foto existente {index + 1}</span>
                    <button
                      type="button"
                      aria-label={`Quitar foto ${index + 1}`}
                      onClick={() =>
                        setForm({
                          ...form,
                          imageUrls: form.imageUrls.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {form.imageFiles.map((file, index) => (
                  <div className="selected-file-row" key={`${file.name}-${file.lastModified}`}>
                    <span className="file-icon">IMG</span>
                    <span title={file.name}>{file.name}</span>
                    <button
                      type="button"
                      aria-label={`Quitar ${file.name}`}
                      onClick={() =>
                        setForm({
                          ...form,
                          imageFiles: form.imageFiles.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="admin-form-row">
            <label>
              Tipo
              <select name="type" value={form.type} onChange={updateForm}>
                <option>Casa</option>
                <option>Departamento</option>
                <option>Loft</option>
              </select>
            </label>
            <label>
              Operación
              <select
                name="operation"
                value={form.operation}
                onChange={updateForm}
              >
                <option>Venta</option>
                <option>Alquiler</option>
              </select>
            </label>
          </div>
          <div className="admin-form-row">
            <label>
              Dormitorios
              <input
                name="bedrooms"
                type="number"
                min="0"
                value={form.bedrooms}
                onChange={updateForm}
              />
            </label>
            <label>
              Baños
              <input
                name="bathrooms"
                type="number"
                min="0"
                value={form.bathrooms}
                onChange={updateForm}
              />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit">
            {editingId ? "Guardar cambios" : "Añadir propiedad"}{" "}
            <Plus size={17} />
          </button>
        </form>
        <div className="admin-list">
          <div className="admin-list-heading">
            <h2>Listado</h2>
            <span>{properties.length} propiedades</span>
          </div>
          {properties.map((property) => (
            <article className="admin-list-item" key={property.id}>
              <div>
                <strong>{property.title}</strong>
                <small>
                  {property.type} · {property.location} · {property.operation}
                </small>
              </div>
              <div className="admin-actions">
                <button
                  onClick={() => {
                    setForm({
                      ...property,
                      imageUrls: property.imageUrls?.length
                        ? property.imageUrls
                        : [property.imageUrl || ""],
                      imageFiles: [],
                    });
                    setEditingId(property.id);
                  }}
                  aria-label="Editar"
                >
                  <Pencil size={17} />
                </button>
                <button
                  onClick={() => removeProperty(property.id)}
                  aria-label="Eliminar"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      ) : (
        <div className="inquiries-panel">
          <div className="admin-list-heading">
            <h2>Consultas recibidas</h2>
            <span>{inquiries.length} consultas</span>
          </div>
          {inquiries.length === 0 ? (
            <p className="admin-empty">Todavía no hay consultas recibidas.</p>
          ) : (
            <div className="inquiries-list">
              {inquiries.map((inquiry) => (
                <article className={`inquiry-card ${inquiry.attended ? "inquiry-card--attended" : ""}`} key={inquiry.id}>
                  <div className="inquiry-card-header">
                    <div>
                      <h3>{inquiry.name}</h3>
                      <small>{new Date(inquiry.created_at).toLocaleString("es-AR")}</small>
                    </div>
                    <div className="inquiry-contact">
                      <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                      <div className="inquiry-actions">
                        <button onClick={() => toggleInquiry(inquiry)}>
                          <Check size={15} /> {inquiry.attended ? "Marcar pendiente" : "Marcar atendida"}
                        </button>
                        <button className="inquiry-delete" onClick={() => setInquiryToDelete(inquiry)} aria-label="Eliminar consulta">
                          <Trash2 size={15} /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                  {inquiry.phone && <p><strong>Teléfono:</strong> {inquiry.phone}</p>}
                  {inquiry.property_title && <p><strong>Propiedad:</strong> {inquiry.property_title}</p>}
                  <p className="inquiry-message">{inquiry.message}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
      {inquiryToDelete && (
        <div className="admin-confirm-backdrop">
          <div className="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
            <h2 id="confirm-delete-title">¿Eliminar consulta?</h2>
            <p>Se eliminará la consulta de {inquiryToDelete.name} de forma permanente.</p>
            <div className="admin-confirm-actions">
              <button onClick={() => setInquiryToDelete(null)}>Cancelar</button>
              <button className="inquiry-delete" onClick={() => removeInquiry(inquiryToDelete.id)}>Eliminar consulta</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
