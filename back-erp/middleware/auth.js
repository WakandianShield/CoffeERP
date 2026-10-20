const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
// Verificar firma y expiración; releer el rol evita confiar en cambios del cliente.
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return res.status(401).json({ mensaje: "Inicia sesión" });
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const [users] = await pool.execute(
      "SELECT id, name, email, role FROM users WHERE id=? AND active=1",
      [payload.sub],
    );
    if (!users.length)
      return res.status(401).json({ mensaje: "Sesión no disponible" });
    req.user = users[0];
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    )
      return res.status(401).json({ mensaje: "Sesión inválida o vencida" });
    next(error);
  }
}
function admin(req, res, next) {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ mensaje: "Se requiere rol administrador" });
  next();
}
module.exports = { authenticate, admin };
