import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import jwt from "jsonwebtoken";
import multer from "multer";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_PORT,
  DEV_FRONTEND_URL,
  SITE_NAME,
  INQUIRY_ENCRYPTION_PREFIX,
  JWT_EXPIRES_IN,
  MAX_IMAGE_SIZE_BYTES,
  MAX_PROPERTY_IMAGES,
} from "../../shared/constants.js";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || DEFAULT_PORT);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET es obligatorio");
const inquiryEncryptionSecret = process.env.INQUIRY_ENCRYPTION_KEY;
if (process.env.NODE_ENV === "production" && !inquiryEncryptionSecret) {
  throw new Error("INQUIRY_ENCRYPTION_KEY es obligatoria en producción");
}
const inquiryEncryptionKey = createHash("sha256")
  .update(inquiryEncryptionSecret || "development-key-change-me")
  .digest();
if (!inquiryEncryptionSecret) {
  console.warn("INQUIRY_ENCRYPTION_KEY no está definida; configurala antes de producción.");
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(projectRoot, "resources", "properties"),
    filename: (request, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `property-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
    },
  }),
  limits: { files: MAX_PROPERTY_IMAGES, fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (request, file, callback) =>
    callback(null, file.mimetype.startsWith("image/")),
});

app.disable("x-powered-by");
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
if (process.env.NODE_ENV !== "production" || process.env.FRONTEND_URL) {
  app.use(cors({ origin: process.env.FRONTEND_URL || DEV_FRONTEND_URL }));
}
app.use(express.json({ limit: "1mb" }));
app.use("/resources", express.static(path.join(projectRoot, "resources")));

app.get("/", (request, response) => {
  response.json({
    message: `API de ${SITE_NAME} funcionando`,
    frontend: "http://localhost:5173/",
    admin: "http://localhost:5173/admin/",
  });
});

// Convierte el formato de PostgreSQL al formato que consume el frontend.
function serializeProperty(row) {
  return {
    ...row,
    areaM2: row.area_m2,
    imageUrl: row.image_url,
    imageUrls: row.image_urls?.length ? row.image_urls : [row.image_url],
    createdAt: row.created_at,
  };
}

// Valida la sesión enviada en el encabezado Authorization: Bearer <token>.
function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return response.status(401).json({ message: "Autenticación requerida" });
  }

  try {
    request.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    response.status(401).json({ message: "Sesión inválida o vencida" });
  }
}

function encryptValue(value) {
  if (value === null || value === undefined || value === "") return value || null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", inquiryEncryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${encrypted.toString("base64url")}`;
}

function decryptValue(value) {
  if (!value || !value.startsWith(INQUIRY_ENCRYPTION_PREFIX)) return value;
  try {
    const [, iv, tag, encrypted] = value.split(":");
    const decipher = createDecipheriv("aes-256-gcm", inquiryEncryptionKey, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "[dato no disponible]";
  }
}

function serializeInquiry(row) {
  return {
    ...row,
    name: decryptValue(row.name),
    email: decryptValue(row.email),
    phone: decryptValue(row.phone),
    message: decryptValue(row.message),
  };
}

// Devuelve propiedades públicas, con búsqueda y filtros opcionales.
app.get("/api/properties", async (request, response, next) => {
  try {
    const { search = "", type = "", operation = "" } = request.query;
    const result = await pool.query(
      `SELECT * FROM properties
       WHERE ($1 = '' OR title ILIKE '%' || $1 || '%' OR location ILIKE '%' || $1 || '%' OR type ILIKE '%' || $1 || '%')
         AND ($2 = '' OR type = $2)
         AND ($3 = '' OR operation = $3)
       ORDER BY featured DESC, created_at DESC`,
      [search, type, operation],
    );

    response.json(result.rows.map(serializeProperty));
  } catch (error) {
    next(error);
  }
});

app.get("/api/properties/:id", async (request, response, next) => {
  try {
    const result = await pool.query("SELECT * FROM properties WHERE id = $1", [
      request.params.id,
    ]);
    if (!result.rowCount) return response.sendStatus(404);
    response.json(serializeProperty(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

// Recibe consultas del sitio público y las conserva en la base de datos.
app.post("/api/contact", async (request, response, next) => {
  try {
    const { propertyId, name, email, phone, message } = request.body;
    if (!name || !email || !message) {
      return response
        .status(400)
        .json({ message: "Nombre, email y mensaje son obligatorios" });
    }

    await pool.query(
      `INSERT INTO inquiries (property_id, name, email, phone, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        propertyId || null,
        encryptValue(name),
        encryptValue(email),
        encryptValue(phone),
        encryptValue(message),
      ],
    );
    response.status(201).json({ message: "Consulta recibida" });
  } catch (error) {
    next(error);
  }
});

// Genera un JWT luego de comparar la contraseña con su hash persistido.
app.post("/api/auth/login", async (request, response, next) => {
  try {
    const { username, password } = request.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
      return response
        .status(401)
        .json({ message: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      jwtSecret,
      { expiresIn: JWT_EXPIRES_IN },
    );
    response.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, (request, response) => {
  response.json({ user: request.user });
});

// La lista administrativa permite gestionar el catálogo completo.
app.get(
  "/api/admin/properties",
  requireAuth,
  async (request, response, next) => {
    try {
      const result = await pool.query(
        "SELECT * FROM properties ORDER BY created_at DESC",
      );
      response.json(result.rows.map(serializeProperty));
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  "/api/admin/inquiries",
  requireAuth,
  async (request, response, next) => {
    try {
      const result = await pool.query(
        `SELECT inquiries.*, properties.title AS property_title
         FROM inquiries
         LEFT JOIN properties ON properties.id = inquiries.property_id
         ORDER BY inquiries.created_at DESC`,
      );
      response.json(result.rows.map(serializeInquiry));
    } catch (error) {
      next(error);
    }
  },
);

app.patch(
  "/api/admin/inquiries/:id",
  requireAuth,
  async (request, response, next) => {
    try {
      const result = await pool.query(
        "UPDATE inquiries SET attended = $1 WHERE id = $2 RETURNING id, attended",
        [
          request.body.attended === true || request.body.attended === "true",
          request.params.id,
        ],
      );
      if (!result.rowCount) return response.sendStatus(404);
      response.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  },
);

app.delete(
  "/api/admin/inquiries/:id",
  requireAuth,
  async (request, response, next) => {
    try {
      const result = await pool.query("DELETE FROM inquiries WHERE id = $1", [
        request.params.id,
      ]);
      if (!result.rowCount) return response.sendStatus(404);
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
);

const propertyFields = [
  "title",
  "description",
  "type",
  "operation",
  "location",
  "price",
  "currency",
  "bedrooms",
  "bathrooms",
  "areaM2",
  "imageUrls",
  "featured",
];

function propertyValues(body) {
  return propertyFields.map((field) => {
    if (field === "imageUrls") {
      if (Array.isArray(body.imageUrls)) return body.imageUrls;
      try {
        return JSON.parse(body.imageUrls || "[]");
      } catch {
        return [];
      }
    }
    if (field === "featured") return body.featured === true || body.featured === "true";
    return body[field];
  });
}

function addUploadedImages(request, values) {
  const uploadedImages = (request.files || []).map(
    (file) => `/resources/properties/${file.filename}`,
  );
  return [...(values[10] || []), ...uploadedImages].slice(0, MAX_PROPERTY_IMAGES);
}

async function removeUploadedFiles(request) {
  await Promise.allSettled(
    (request.files || []).map((file) => unlink(file.path)),
  );
}

app.post(
  "/api/admin/properties",
  requireAuth,
  upload.array("images", 10),
  async (request, response, next) => {
    try {
      const values = propertyValues(request.body);
      values[10] = addUploadedImages(request, values);
      const result = await pool.query(
        `INSERT INTO properties (title, description, type, operation, location, price, currency, bedrooms, bathrooms, area_m2, image_url, image_urls, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, (($11::text[])[1]), $11, $12)
       RETURNING *`,
        values,
      );
      response.status(201).json(serializeProperty(result.rows[0]));
    } catch (error) {
      next(error);
    }
  },
);

app.put(
  "/api/admin/properties/:id",
  requireAuth,
  upload.array("images", 10),
  async (request, response, next) => {
    try {
      const values = propertyValues(request.body);
      values[10] = addUploadedImages(request, values);
      const result = await pool.query(
        `UPDATE properties SET title=$1, description=$2, type=$3, operation=$4, location=$5,
       price=$6, currency=$7, bedrooms=$8, bathrooms=$9, area_m2=$10, image_url=(($11::text[])[1]), image_urls=$11, featured=$12
       WHERE id=$13 RETURNING *`,
        [...values, request.params.id],
      );
      if (!result.rowCount) {
        await removeUploadedFiles(request);
        return response.sendStatus(404);
      }
      response.json(serializeProperty(result.rows[0]));
    } catch (error) {
      next(error);
    }
  },
);

app.delete(
  "/api/admin/properties/:id",
  requireAuth,
  async (request, response, next) => {
    try {
      const result = await pool.query("DELETE FROM properties WHERE id = $1", [
        request.params.id,
      ]);
      if (!result.rowCount) return response.sendStatus(404);
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
);

// En producción Express sirve el build generado por `npm run build`, manteniendo
// la misma aplicación para la web, la API y los recursos subidos.
const frontendDist = path.join(projectRoot, "frontend", "dist");
if (process.env.NODE_ENV === "production" && existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((request, response, next) => {
    if (request.method === "GET" && !request.path.startsWith("/api") && !request.path.startsWith("/resources/")) {
      return response.sendFile(path.join(frontendDist, "index.html"));
    }
    next();
  });
}

app.use(async (error, request, response, next) => {
  await removeUploadedFiles(request);
  console.error(error);
  response.status(500).json({ message: "Error interno del servidor" });
});

async function startServer() {
  try {
    await pool.query(
      "ALTER TABLE properties ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}'",
    );
    await pool.query(
      "ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS attended BOOLEAN NOT NULL DEFAULT FALSE",
    );
    const existingInquiries = await pool.query(
      "SELECT id, name, email, phone, message FROM inquiries",
    );
    for (const inquiry of existingInquiries.rows) {
      if (inquiry.name?.startsWith("v1:")) continue;
      await pool.query(
        "UPDATE inquiries SET name=$1, email=$2, phone=$3, message=$4 WHERE id=$5",
        [
          encryptValue(inquiry.name),
          encryptValue(inquiry.email),
          encryptValue(inquiry.phone),
          encryptValue(inquiry.message),
          inquiry.id,
        ],
      );
    }
  } catch (error) {
    console.warn(`No se pudo verificar la seguridad de la base: ${error.message}`);
  }

  app.listen(port, () =>
    console.log(`API ejecutándose en http://localhost:${port}`),
  );
}

startServer();
