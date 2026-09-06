-- Crea la base solo si todavía no existe. Este bloque requiere ejecutarse con psql.
SELECT 'CREATE DATABASE gomez_ramos'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gomez_ramos')\gexec

\connect gomez_ramos;

-- Catálogo principal de propiedades visible en el sitio público.
CREATE TABLE IF NOT EXISTS properties (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(140) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(40) NOT NULL,
    operation VARCHAR(30) NOT NULL,
    location VARCHAR(140) NOT NULL,
    price NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    bedrooms INTEGER NOT NULL DEFAULT 0,
    bathrooms INTEGER NOT NULL DEFAULT 1,
    area_m2 INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Consultas enviadas desde el formulario de contacto.
CREATE TABLE IF NOT EXISTS inquiries (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT REFERENCES properties(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(160) NOT NULL,
    phone VARCHAR(40),
    message TEXT NOT NULL,
    attended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios habilitados para entrar al panel administrativo.
-- La contraseña nunca se almacena en texto plano: password_hash contiene un hash bcrypt.
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO properties
    (title, description, type, operation, location, price, currency, bedrooms, bathrooms, area_m2, image_url, featured)
VALUES
    ('Casa de diseño con jardín', 'Una casa luminosa y contemporánea con ambientes amplios, jardín privado y detalles de diseño.', 'Casa', 'Venta', 'Nordelta, Tigre', 385000, 'USD', 4, 3, 265, 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85', TRUE),
    ('Departamento premium en Palermo', 'Unidad premium con balcón aterrazado, cocina integrada y amenities de primer nivel.', 'Departamento', 'Venta', 'Palermo, CABA', 218000, 'USD', 2, 2, 94, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85', TRUE),
    ('Refugio natural en la sierra', 'Casa de fin de semana rodeada de naturaleza, con pileta y vistas abiertas a las sierras.', 'Casa', 'Venta', 'Tandil, Buenos Aires', 165000, 'USD', 3, 2, 180, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85', TRUE),
    ('Loft urbano con terraza', 'Loft de estilo industrial en una ubicación estratégica, ideal para vivir o invertir.', 'Loft', 'Alquiler', 'Villa Crespo, CABA', 950, 'USD', 1, 1, 68, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85', FALSE),
    ('Piso clásico renovado', 'Piso señorial reciclado con excelente luz natural, balcones y terminaciones originales.', 'Departamento', 'Venta', 'Recoleta, CABA', 310000, 'USD', 3, 2, 152, 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85', FALSE),
    ('Casa minimalista junto al río', 'Arquitectura minimalista, grandes ventanales y una conexión única con el paisaje.', 'Casa', 'Alquiler', 'San Isidro, Buenos Aires', 2400, 'USD', 3, 3, 220, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', FALSE);
