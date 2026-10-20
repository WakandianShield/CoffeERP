const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");
const { pool } = require("../config/db");
const { authenticate, admin } = require("../middleware/auth");
const v = require("../lib/validation");
router.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { mensaje: "Demasiados intentos. Espera 15 minutos." },
  }),
  async (req, res) => {
    const email = v.email(req.body.email);
    if (typeof req.body.password !== "string" || req.body.password.length > 72)
      v.fail("Credenciales incorrectas", 401);
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email=? AND active=1",
      [email],
    );
    if (
      !rows.length ||
      !(await bcrypt.compare(req.body.password, rows[0].password_hash))
    )
      v.fail("Credenciales incorrectas", 401);
    const { id, name, role } = rows[0];
    const token = jwt.sign({}, process.env.JWT_SECRET, {
      subject: String(id),
      expiresIn: "1h",
      algorithm: "HS256",
    });
    res.json({ token, user: { id, name, email, role } });
  },
);
router.get("/me", authenticate, (req, res) => res.json(req.user));
// El alta de cuentas es administrativa: no existe registro público de administradores.
router.post("/users", authenticate, admin, async (req, res) => {
  const name = v.text(req.body.name, "Nombre");
  const email = v.email(req.body.email);
  const hash = await bcrypt.hash(v.password(req.body.password), 12);
  if (!["ADMIN", "CAJERO"].includes(req.body.role)) v.fail("Rol inválido");
  const [result] = await pool.execute(
    "INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",
    [name, email, hash, req.body.role],
  );
  res
    .status(201)
    .json({ id: result.insertId, name, email, role: req.body.role });
});
module.exports = router;
