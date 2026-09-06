import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  BedDouble,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import "./styles.css";
import AdminSection from "./admin.jsx";
import { BRAND_NAME, CONTACT_EMAIL, SITE_NAME } from "../../shared/constants.js";
import { API_URL, assetUrl } from "./api.js";

const fallbackProperties = [
  {
    id: 1,
    title: "Casa de diseño con jardín",
    description:
      "Una casa luminosa y contemporánea con ambientes amplios, jardín privado y detalles de diseño.",
    type: "Casa",
    operation: "Venta",
    location: "Nordelta, Tigre",
    price: 385000,
    currency: "USD",
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 265,
    imageUrl:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
    featured: true,
  },
  {
    id: 2,
    title: "Departamento premium en Palermo",
    description:
      "Unidad premium con balcón aterrazado, cocina integrada y amenities de primer nivel.",
    type: "Departamento",
    operation: "Venta",
    location: "Palermo, CABA",
    price: 218000,
    currency: "USD",
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 94,
    imageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
    featured: true,
  },
  {
    id: 3,
    title: "Refugio natural en la sierra",
    description:
      "Casa de fin de semana rodeada de naturaleza, con pileta y vistas abiertas a las sierras.",
    type: "Casa",
    operation: "Venta",
    location: "Tandil, Buenos Aires",
    price: 165000,
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 180,
    imageUrl:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",
    featured: true,
  },
  {
    id: 4,
    title: "Loft urbano con terraza",
    description:
      "Loft de estilo industrial en una ubicación estratégica, ideal para vivir o invertir.",
    type: "Loft",
    operation: "Alquiler",
    location: "Villa Crespo, CABA",
    price: 950,
    currency: "USD",
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 68,
    imageUrl:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
    featured: false,
  },
  {
    id: 5,
    title: "Piso clásico renovado",
    description:
      "Piso señorial reciclado con excelente luz natural, balcones y terminaciones originales.",
    type: "Departamento",
    operation: "Venta",
    location: "Recoleta, CABA",
    price: 310000,
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 152,
    imageUrl:
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85",
    featured: false,
  },
  {
    id: 6,
    title: "Casa minimalista junto al río",
    description:
      "Arquitectura minimalista, grandes ventanales y una conexión única con el paisaje.",
    type: "Casa",
    operation: "Alquiler",
    location: "San Isidro, Buenos Aires",
    price: 2400,
    currency: "USD",
    bedrooms: 3,
    bathrooms: 3,
    areaM2: 220,
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    featured: false,
  },
];

function formatPrice(property) {
  const value = new Intl.NumberFormat("es-AR").format(property.price);
  return `${property.currency === "USD" ? "US$" : "$"} ${value}${property.operation === "Alquiler" ? " / mes" : ""}`;
}

function propertyImages(property) {
  return (property.imageUrls?.length ? property.imageUrls : [property.imageUrl]).map(assetUrl);
}

function propertyPath(property) {
  const slug = property.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `/propiedades/${property.id}/${slug}`;
}

function detailIdFromPath() {
  const match = window.location.pathname.match(/^\/propiedades\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function App() {
  const sectionFromPath = () =>
    window.location.pathname.startsWith("/admin") ? "admin" : "catalogo";
  const [activeSection, setActiveSection] = useState(sectionFromPath);
  const [detailId, setDetailId] = useState(detailIdFromPath);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [operation, setOperation] = useState("Todas");
  const [type, setType] = useState("Todos");
  const [properties, setProperties] = useState(fallbackProperties);
  const availablePriceRange = useMemo(() => {
    const prices = properties.map((property) => Number(property.price)).filter(Number.isFinite);
    return prices.length
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : { min: 0, max: 0 };
  }, [properties]);
  const [priceFrom, setPriceFrom] = useState(0);
  const [priceTo, setPriceTo] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [contactSent, setContactSent] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Carga el catálogo real y conserva los datos locales si la API no está disponible.
  useEffect(() => {
    fetch(`${API_URL}/properties`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setProperties)
      .catch(() => setProperties(fallbackProperties));
  }, []);

  useEffect(() => {
    setPriceFrom(availablePriceRange.min);
    setPriceTo(availablePriceRange.max);
  }, [availablePriceRange.min, availablePriceRange.max]);

  // Aplica búsqueda libre y filtros antes de renderizar las tarjetas.
  const filteredProperties = useMemo(
    () =>
      properties.filter((property) => {
        const term = search.toLowerCase();
        const matchesSearch =
          !term ||
          `${property.title} ${property.location} ${property.type}`
            .toLowerCase()
            .includes(term);

        return (
          matchesSearch &&
          (operation === "Todas" || property.operation === operation) &&
          (type === "Todos" || property.type === type) &&
          Number(property.price) >= priceFrom &&
          Number(property.price) <= priceTo
        );
      }),
    [properties, search, operation, type, priceFrom, priceTo],
  );

  const navigate = (section) => {
    setActiveSection(section);
    setDetailId(null);
    setSidebarOpen(false);
    window.history.pushState(
      {},
      "",
      section === "admin" ? "/admin/" : "/",
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateProperty = (property) => {
    setDetailId(property.id);
    window.history.pushState({}, "", propertyPath(property));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveSection(sectionFromPath());
      setDetailId(detailIdFromPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (!detailId && activeSection === "admin") {
    return (
      <AdminSection
        onExit={() => navigate("catalogo")}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">GR</span>
          <span>{BRAND_NAME}</span>
        </div>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
        <div className="sidebar-label">Explorar</div>
        <nav className="sidebar-nav">
          <button
            className={activeSection === "catalogo" ? "active" : ""}
            onClick={() => navigate("catalogo")}
          >
            <Building2 size={18} /> Catálogo <ChevronRight size={15} />
          </button>
          <button onClick={() => navigate("quienes")}>
            <Sparkles size={18} /> Quiénes somos <ChevronRight size={15} />
          </button>
          <button onClick={() => navigate("contacto")}>
            <MessageCircle size={18} /> Contacto <ChevronRight size={15} />
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-label">¿Buscás algo especial?</div>
          <p>Contanos qué estás buscando y te ayudamos a encontrarlo.</p>
          <button onClick={() => navigate("contacto")}>
            Hablar con un asesor <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-legal-links">
            <button onClick={() => setLegalOpen(true)}>Términos y condiciones</button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="content-area">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <div className="topbar-title">
            {BRAND_NAME} <span>Propiedades</span>
          </div>
          <nav className="topnav">
            <button
              className={activeSection === "catalogo" ? "active" : ""}
              onClick={() => navigate("catalogo")}
            >
              Catálogo
            </button>
            <button
              className={activeSection === "quienes" ? "active" : ""}
              onClick={() => navigate("quienes")}
            >
              Quiénes Somos
            </button>
            <button
              className={activeSection === "contacto" ? "active" : ""}
              onClick={() => navigate("contacto")}
            >
              Contacto
            </button>
          </nav>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((enabled) => !enabled)}
            aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
            title={darkMode ? "Modo claro" : "Modo oscuro"}
          >
            <span key={String(darkMode)} className="theme-icon">
              {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            </span>
          </button>
          <button
            className="topbar-contact"
            onClick={() => navigate("contacto")}
          >
            Hablemos <ArrowUpRight size={16} />
          </button>
        </header>

        <main id="main-content">
          {detailId ? (
            <PropertyDetailPage
              propertyId={detailId}
              properties={properties}
              onBack={() => navigate("catalogo")}
            />
          ) : activeSection === "catalogo" ? (
            <CatalogSection
              search={search}
              setSearch={setSearch}
              filterOpen={filterOpen}
              setFilterOpen={setFilterOpen}
              operation={operation}
              setOperation={setOperation}
              type={type}
              setType={setType}
              priceFrom={priceFrom}
              setPriceFrom={setPriceFrom}
              priceTo={priceTo}
              setPriceTo={setPriceTo}
              availablePriceRange={availablePriceRange}
              filteredProperties={filteredProperties}
              setSelectedProperty={navigateProperty}
            />
          ) : null}
          {!detailId && activeSection === "quienes" && (
            <AboutSection onContact={() => navigate("contacto")} />
          )}
          {!detailId && activeSection === "contacto" && (
            <ContactSection
              sent={contactSent}
              onSent={() => setContactSent(true)}
            />
          )}
        </main>

        <footer>
          <div className="footer-brand">
            <span className="brand-mark">GR</span>
            <div>
            <strong>{BRAND_NAME}</strong>
              <small>Propiedades</small>
            </div>
          </div>
          <span>Buenos Aires · Argentina</span>
          <span>© 2024 {SITE_NAME}</span>
        </footer>
      </div>

      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onContact={() => {
            setSelectedProperty(null);
            navigate("contacto");
          }}
        />
      )}
      {legalOpen && <LegalModal onClose={() => setLegalOpen(false)} />}
    </div>
  );
}

function CatalogSection({
  search,
  setSearch,
  filterOpen,
  setFilterOpen,
  operation,
  setOperation,
  type,
  setType,
  priceFrom,
  setPriceFrom,
  priceTo,
  setPriceTo,
  availablePriceRange,
  filteredProperties,
  setSelectedProperty,
}) {
  const [visibleCount, setVisibleCount] = useState(6);
  const [sortOrder, setSortOrder] = useState("relevance");
  const loadMoreRef = useRef(null);

  const orderedProperties = useMemo(() => {
    const result = [...filteredProperties];
    if (sortOrder === "price-asc") return result.sort((a, b) => a.price - b.price);
    if (sortOrder === "price-desc") return result.sort((a, b) => b.price - a.price);
    if (sortOrder === "title-asc") {
      return result.sort((a, b) => a.title.localeCompare(b.title, "es"));
    }
    return result;
  }, [filteredProperties, sortOrder]);

  useEffect(() => {
    setVisibleCount(6);
  }, [search, operation, type, sortOrder, filteredProperties.length]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) =>
            Math.min(count + 6, filteredProperties.length),
          );
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [filteredProperties.length]);

  const visibleProperties = orderedProperties.slice(0, visibleCount);

  // Reúne la portada, las herramientas de búsqueda y el listado público.
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> Estudio inmobiliario boutique
          </div>
          <h1>
            Espacios para una <em>vida extraordinaria.</em>
          </h1>
          <p>
            Encontramos propiedades con identidad, en los lugares que hacen la
            diferencia.
          </p>
        </div>
        <div className="hero-visual">
          <div className="hero-image" />
          <div className="hero-note">
            <span>01</span>
            <div>
              <strong>
                Arquitectura
                <br />
                que inspira
              </strong>
              <small>Descubrí nuestra selección</small>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-section" id="catalogo">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span /> Nuestra selección
            </div>
            <h2>Nuestra selección de propiedades</h2>
          </div>
          <p>
            Una selección curada de espacios únicos para vivir, invertir y
            disfrutar.
          </p>
        </div>
        <div className="search-toolbar">
          <div className="search-box">
            <Search size={19} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por ubicación, tipo o palabra clave"
            />
            <kbd>⌘ K</kbd>
          </div>
          <button
            className={`filter-button ${filterOpen ? "selected" : ""}`}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <SlidersHorizontal size={17} /> Filtros <ChevronDown size={16} />
          </button>
        </div>
        {filterOpen && (
          <div className="filters-panel">
            <div>
              <label>Operación</label>
              <select
                value={operation}
                onChange={(event) => setOperation(event.target.value)}
              >
                <option>Todas</option>
                <option>Venta</option>
                <option>Alquiler</option>
              </select>
            </div>
            <div>
              <label>Tipo de propiedad</label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option>Todos</option>
                <option>Casa</option>
                <option>Departamento</option>
                <option>Loft</option>
              </select>
            </div>
            <div className="price-filter">
              <label>
                Precio: {priceFrom.toLocaleString("es-AR")} – {priceTo.toLocaleString("es-AR")}
              </label>
              <div className="price-range">
                <input
                  type="range"
                  min={availablePriceRange.min}
                  max={availablePriceRange.max}
                  value={priceFrom}
                  onChange={(event) =>
                    setPriceFrom(Math.min(Number(event.target.value), priceTo))
                  }
                  disabled={availablePriceRange.min === availablePriceRange.max}
                />
                <input
                  type="range"
                  min={availablePriceRange.min}
                  max={availablePriceRange.max}
                  value={priceTo}
                  onChange={(event) =>
                    setPriceTo(Math.max(Number(event.target.value), priceFrom))
                  }
                  disabled={availablePriceRange.min === availablePriceRange.max}
                />
              </div>
            </div>
            <button
              onClick={() => {
                setOperation("Todas");
                setType("Todos");
                setSearch("");
                setPriceFrom(availablePriceRange.min);
                setPriceTo(availablePriceRange.max);
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
        <div className="catalog-meta">
          <span>{orderedProperties.length} propiedades encontradas</span>
          <label className="sort-control">
            Ordenar por
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="title-asc">Orden alfabético</option>
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
        <div className="property-grid">
          {visibleProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onOpen={() => setSelectedProperty(property)}
            />
          ))}
        </div>
        {visibleCount < filteredProperties.length && (
          <div className="catalog-load-more" ref={loadMoreRef}>
            Cargando más propiedades…
          </div>
        )}
        {filteredProperties.length === 0 && (
          <div className="empty-state">
            No encontramos propiedades con esos criterios. Probá con otra
            búsqueda.
          </div>
        )}
      </section>
    </>
  );
}

function PropertyCard({ property, onOpen }) {
  const image = propertyImages(property)[0];
  return (
    <article
      className="property-card"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex="0"
      aria-label={`Ver ${property.title}`}
    >
      <div className="property-image-wrap">
        <img src={image} alt={property.title} />
        <span className="property-tag">{property.operation}</span>
        <button className="card-arrow" aria-label="Ver propiedad">
          <ArrowUpRight size={18} />
        </button>
      </div>
      <div className="property-info">
        <div className="property-type">
          {property.type} · {property.location}
        </div>
        <h3>{property.title}</h3>
        <div className="property-details">
          <span>
            <BedDouble size={16} /> {property.bedrooms} dorm.
          </span>
          <span>
            <Home size={16} /> {property.bathrooms} baños
          </span>
          <span>{property.areaM2} m²</span>
        </div>
        <strong className="property-price">{formatPrice(property)}</strong>
      </div>
    </article>
  );
}

function PropertyDetailPage({ propertyId, properties, onBack }) {
  const [property, setProperty] = useState(
    () => properties.find((item) => item.id === propertyId) || null,
  );
  const [loading, setLoading] = useState(!property);
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [slide, setSlide] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/properties/${propertyId}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setProperty)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) return <section className="inner-page">Cargando propiedad…</section>;
  if (!property)
    return (
      <section className="inner-page">
        <h1>Propiedad no encontrada.</h1>
        <button className="primary-button" onClick={onBack}>Volver al catálogo</button>
      </section>
    );

  const images = propertyImages(property);
  const startSlide = (nextIndex) => {
    if (slide || nextIndex === selectedImageIndex) return;
    setSlide({
      from: selectedImageIndex,
      to: nextIndex,
      direction: nextIndex > selectedImageIndex ? "next" : "previous",
    });
    window.setTimeout(() => {
      setSelectedImageIndex(nextIndex);
      setSlide(null);
    }, 350);
  };

  const changeImage = (offset) => {
    startSlide((selectedImageIndex + offset + images.length) % images.length);
  };

  return (
    <section className="inner-page property-detail-page">
      <button className="back-link" onClick={onBack}>← Volver al catálogo</button>
      <div className="property-detail-grid">
        <div className="detail-gallery">
          <div className="detail-cover">
            <div className="detail-slideshow-frame">
              {slide ? (
                <div className={`detail-slideshow-track detail-slideshow-track--${slide.direction}`}>
                  <img className="detail-slide" src={images[slide.from]} alt={property.title} />
                  <img className="detail-slide" src={images[slide.to]} alt={property.title} />
                </div>
              ) : (
                <img className="detail-slide" src={images[selectedImageIndex]} alt={property.title} />
              )}
            </div>
            {images.length > 1 && (
              <>
                <button
                  className="gallery-arrow gallery-arrow-left"
                  onClick={() => changeImage(-1)}
                  aria-label="Foto anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="gallery-arrow gallery-arrow-right"
                  onClick={() => changeImage(1)}
                  aria-label="Foto siguiente"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <span>{(slide ? slide.to : selectedImageIndex) + 1} / {images.length}</span>
          </div>
          {images.length > 1 && (
            <div className="detail-thumbnails">
              {images.map((image, index) => (
                <button
                  key={image}
                  className={selectedImageIndex === index ? "active" : ""}
                  onClick={() => startSlide(index)}
                >
                  <img src={image} alt={`Foto ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="property-detail-copy">
          <div className="property-type">{property.type} · {property.location}</div>
          <h1>{property.title}</h1>
          <strong className="property-price">{formatPrice(property)}</strong>
          <p>{property.description}</p>
          <div className="modal-stats">
            <span><BedDouble size={18} /> {property.bedrooms} dormitorios</span>
            <span><Home size={18} /> {property.bathrooms} baños</span>
            <span><Building2 size={18} /> {property.areaM2} m²</span>
          </div>
          <button className="primary-button" onClick={() => setContactOpen(true)}>
            Consultar por esta propiedad <ArrowUpRight size={17} />
          </button>
        </div>
      </div>
      {contactOpen && (
        <ContactModal
          property={property}
          onClose={() => setContactOpen(false)}
        />
      )}
    </section>
  );
}

function PropertyModal({ property, onClose, onContact }) {
  // Presenta el detalle y deriva la consulta hacia la sección de contacto.
  const images = propertyImages(property);
  const [selectedImage, setSelectedImage] = useState(images[0]);

  const changeImage = (offset) => {
    const current = images.indexOf(selectedImage);
    setSelectedImage(images[(current + offset + images.length) % images.length]);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="property-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Galería de ${property.title}`}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="modal-gallery">
          <img src={selectedImage} alt={property.title} />
          {images.length > 1 && (
            <>
              <button className="gallery-arrow gallery-arrow-left" onClick={() => changeImage(-1)} aria-label="Foto anterior">
                <ChevronLeft size={20} />
              </button>
              <button className="gallery-arrow gallery-arrow-right" onClick={() => changeImage(1)} aria-label="Foto siguiente">
                <ChevronRight size={20} />
              </button>
            </>
          )}
          {images.length > 1 && (
            <div className="modal-thumbnails">
              {images.map((image) => (
                <button
                  key={image}
                  className={selectedImage === image ? "active" : ""}
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="modal-content">
          <div className="property-type">
            {property.type} · {property.location}
          </div>
          <h2>{property.title}</h2>
          <strong className="property-price">{formatPrice(property)}</strong>
          <p>{property.description}</p>
          <div className="modal-stats">
            <span>
              <BedDouble size={18} /> {property.bedrooms} dormitorios
            </span>
            <span>
              <Home size={18} /> {property.bathrooms} baños
            </span>
            <span>
              <Building2 size={18} /> {property.areaM2} m²
            </span>
          </div>
          <button className="primary-button" onClick={onContact}>
            Consultar por esta propiedad <ArrowUpRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactModal({ property, onClose }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          message: data.get("message"),
        }),
      });
      if (!response.ok) throw new Error();
      setSent(true);
    } catch {
      setError("No pudimos enviar tu consulta. Intentá nuevamente.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="contact-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Formulario de contacto">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        {sent ? (
          <div className="contact-modal-success">
            <h2>¡Consulta enviada!</h2>
            <p>Nos vamos a contactar con vos a la brevedad.</p>
            <button className="primary-button" onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={submit}>
            <div className="eyebrow"><span /> Consultá por esta propiedad</div>
            <h2>{property.title}</h2>
            <label>Nombre<input name="name" required /></label>
            <label>Email<input name="email" type="email" required /></label>
            <label>Teléfono<input name="phone" /></label>
            <label>Mensaje<textarea name="message" rows="4" required defaultValue="Quisiera recibir más información sobre esta propiedad." /></label>
            <p className="privacy-note">
              Al enviar aceptás que usemos estos datos únicamente para responder
              tu consulta. Podés solicitar acceso, rectificación o eliminación.
            </p>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button" type="submit">Enviar consulta <ArrowUpRight size={17} /></button>
          </form>
        )}
      </div>
    </div>
  );
}

function LegalModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="legal-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Términos y condiciones">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        <div className="eyebrow"><span /> Información legal</div>
        <h2>Privacidad y condiciones</h2>
        <h3>Responsable</h3>
        <p>Gomez Ramos Propiedades es responsable del tratamiento de los datos enviados mediante este sitio. Contacto: {CONTACT_EMAIL}.</p>
        <h3>Datos y finalidad</h3>
        <p>Solo solicitamos nombre, email, teléfono opcional y mensaje para responder consultas inmobiliarias. El dato de la propiedad y la fecha se guardan para organizar la atención. No vendemos ni usamos estos datos para seguimiento publicitario.</p>
        <h3>Cookies y almacenamiento</h3>
        <p>Este sitio no utiliza cookies de analítica, publicidad ni seguimiento. El acceso administrativo usa almacenamiento temporal de sesión mientras la pestaña permanece abierta.</p>
        <h3>Derechos y conservación</h3>
        <p>Podés solicitar acceso, rectificación o eliminación escribiendo a {CONTACT_EMAIL}. Las consultas se conservarán solo durante el tiempo necesario para atenderlas y cumplir obligaciones legales.</p>
        <h3>Condiciones de uso</h3>
        <p>El contenido del catálogo es informativo y puede actualizarse sin previo aviso. Las imágenes y descripciones se publican para facilitar la consulta y no reemplazan la verificación de la información de cada operación.</p>
        <h3>Terceros</h3>
        <p>Algunas fuentes e imágenes pueden cargarse desde Google Fonts y Unsplash, cuyos propios servicios pueden recibir datos técnicos de la conexión.</p>
      </div>
    </div>
  );
}

function AboutSection({ onContact }) {
  return (
    <section className="inner-page about-page">
      <div className="eyebrow">
        <span /> Nuestra mirada
      </div>
      <h1>
        Propiedades con <em>algo más.</em>
      </h1>
      <p className="lead">
        Somos un estudio inmobiliario boutique que entiende que una propiedad es
        mucho más que metros cuadrados: es el escenario de tu próxima historia.
      </p>
      <div className="about-grid">
        <div className="about-image">
          <img
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1000&q=85"
            alt="Martillero público de Gomez Ramos Propiedades"
          />
        </div>
        <div className="about-copy">
          <span className="number">01</span>
          <h2>Curaduría, confianza y cercanía.</h2>
          <p>
            Seleccionamos espacios que tienen una identidad propia y acompañamos
            cada decisión con conocimiento, transparencia y una mirada humana.
          </p>
          <button className="primary-button" onClick={onContact}>
            Conocé nuestro servicio <ArrowUpRight size={17} />
          </button>
          <div className="about-person">
            <h3>Martillero público, emprendedor y cercano.</h3>
            <p>
              Soy un joven martillero público que eligió construir una inmobiliaria
              con una mirada actual, humana y profundamente comprometida con cada
              cliente. Combino formación profesional, conocimiento del mercado y
              herramientas digitales para acompañarte con claridad.
            </p>
          </div>
        </div>
      </div>
      <div className="values">
        <div>
          <Sparkles size={21} />
          <h3>Selección con criterio</h3>
          <p>
            Buscamos propiedades que se destacan por su diseño, ubicación y
            potencial.
          </p>
        </div>
        <div>
          <Check size={21} />
          <h3>Acompañamiento real</h3>
          <p>
            Estamos presentes en cada etapa, desde la primera visita hasta la
            firma.
          </p>
        </div>
        <div>
          <MapPin size={21} />
          <h3>Conocimiento local</h3>
          <p>Conocemos cada barrio y lo que hace especial a cada rincón.</p>
        </div>
      </div>
    </section>
  );
}

function ContactSection({ sent, onSent }) {
  // Envía la consulta al backend y muestra una confirmación al usuario.
  const submitContact = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      message: form.get("message"),
    };
    try {
      await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      /* El formulario sigue funcionando si el backend aún no está iniciado. */
    }
    onSent();
  };

  return (
    <section className="inner-page contact-page">
      <div className="contact-intro">
        <div className="eyebrow">
          <span /> Estamos para ayudarte
        </div>
        <h1>
          Hablemos de tu <em>próximo lugar.</em>
        </h1>
        <p>
          Contanos qué estás buscando y uno de nuestros asesores se va a poner
          en contacto con vos.
        </p>
        <div className="contact-details">
          <span>
            <Mail size={18} /> {CONTACT_EMAIL}
          </span>
          <span>
            <Phone size={18} /> +54 11 4567 8900
          </span>
          <span>
            <MapPin size={18} /> Buenos Aires, Argentina
          </span>
        </div>
      </div>
      {sent ? (
        <div className="sent-message">
          <div>
            <Check size={30} />
          </div>
          <h2>Mensaje enviado</h2>
          <p>Gracias por escribirnos. Te contactaremos muy pronto.</p>
        </div>
      ) : (
        <form className="contact-form" onSubmit={submitContact}>
          <label>
            Nombre completo
            <input name="name" required placeholder="Tu nombre" />
          </label>
          <label>
            Email
            <input
              name="email"
              required
              type="email"
              placeholder="nombre@email.com"
            />
          </label>
          <label>
            ¿En qué podemos ayudarte?
            <textarea
              name="message"
              required
              rows="5"
              placeholder="Contanos un poco más..."
            />
          </label>
          <p className="privacy-note">
            Usaremos tus datos únicamente para responder esta consulta. Podés
            solicitar acceso, rectificación o eliminación escribiendo a {CONTACT_EMAIL}.
          </p>
          <button className="primary-button" type="submit">
            Enviar mensaje <ArrowUpRight size={17} />
          </button>
        </form>
      )}
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
