require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const v = require("../lib/validation");
(async () => {
  // La base debe existir. El script es repetible y no reemplaza contraseñas ni datos.
  const email = v.email(process.env.ADMIN_EMAIL);
  const password = v.password(process.env.ADMIN_PASSWORD);
  for (const sql of fs
    .readFileSync(path.join(__dirname, "../sql/schema.sql"), "utf8")
    .split(";")
    .filter((s) => s.trim()))
    await pool.query(sql);
  const [existing] = await pool.execute("SELECT id FROM users WHERE email=?", [
    email,
  ]);
  if (!existing.length)
    await pool.execute(
      "INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",
      ["Administrador", email, await bcrypt.hash(password, 12), "ADMIN"],
    );
  console.log(
    "Esquema listo. Administrador disponible. No se agregaron operaciones ficticias.",
  );
})()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
