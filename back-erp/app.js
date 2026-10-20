const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { authenticate } = require("./middleware/auth");
function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:4200" }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api", authenticate);
  app.use("/api", require("./routes/operations"));
  app.use("/api/sales", require("./routes/sales"));
  app.use((req, res) =>
    res.status(404).json({ mensaje: "Ruta no encontrada" }),
  );
  // No exponer consultas SQL, contraseñas ni respuestas con información sensible.
  app.use((error, req, res, next) => {
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({
          mensaje: "El registro ya existe (correo o nómina del periodo)",
        });
    const status = error.status || 500;
    if (status === 500)
      console.error("Error interno:", error.code || error.name);
    res
      .status(status)
      .json({
        mensaje: status === 500 ? "Error interno del servidor" : error.message,
      });
  });
  return app;
}
module.exports = { createApp };
