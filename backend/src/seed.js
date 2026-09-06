import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
import { PASSWORD_MIN_LENGTH } from "../../shared/constants.js";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
if (!username || !password) {
  throw new Error("ADMIN_USERNAME y ADMIN_PASSWORD son obligatorios");
}
if (password.length < PASSWORD_MIN_LENGTH) {
  throw new Error(`ADMIN_PASSWORD debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
}
try {
  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [username, passwordHash],
  );

  console.log(`Usuario administrador listo: ${username}`);
} catch (error) {
  const connectionRefused =
    error.code === "ECONNREFUSED" ||
    !error.message ||
    error.errors?.some((nestedError) => nestedError.code === "ECONNREFUSED");

  if (connectionRefused) {
    console.error(
      "No se pudo conectar a PostgreSQL. Iniciá el servicio, ejecutá database/init.sql y volvé a correr npm run seed.",
    );
  } else if (error.code === "42P01") {
    console.error(
      "La tabla users no existe. Ejecutá database/init.sql sobre la base gomez_ramos y volvé a correr npm run seed.",
    );
  } else {
    console.error("No se pudo crear el usuario administrador:", error.message);
  }

  process.exitCode = 1;
} finally {
  await pool.end();
}
