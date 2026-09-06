import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PASSWORD_MIN_LENGTH } from "../../shared/constants.js";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const terminal = readline.createInterface({ input, output });

try {
  const username = (await terminal.question("Usuario del nuevo admin: ")).trim();
  const password = await terminal.question(`Contraseña (mínimo ${PASSWORD_MIN_LENGTH} caracteres): `, {
    hideEchoBack: true,
  });

  if (!username) throw new Error("El usuario no puede estar vacío");
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
    [username, passwordHash],
  );
  console.log(`Administrador creado: ${username}`);
} catch (error) {
  if (error.code === "23505") {
    console.error("Ese nombre de usuario ya existe");
  } else {
    console.error(`No se pudo crear el administrador: ${error.message}`);
  }
  process.exitCode = 1;
} finally {
  terminal.close();
  await pool.end();
}
