const router = require("express").Router();
const { pool } = require("../config/db");
const sales = require("../services/sales");
const paypal = require("../services/paypal");
const { invoiceXml, sendInvoice } = require("../services/invoice");
const { fail } = require("../lib/validation");
router.get("/config", (req, res) =>
  res.json({ clientId: process.env.PAYPAL_CLIENT_ID || "", sandbox: true }),
);
router.get("/", async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT * FROM sales ${req.user.role === "ADMIN" ? "" : "WHERE user_id=?"} ORDER BY created_at DESC LIMIT 200`,
    req.user.role === "ADMIN" ? [] : [req.user.id],
  );
  res.json(rows);
});
router.post("/cash", async (req, res) =>
  res.status(201).json(await sales.create(req.body, req.user, "EFECTIVO")),
);
router.post("/paypal", async (req, res) =>
  res.status(201).json(await sales.create(req.body, req.user, "PAYPAL")),
);
router.post("/:id/capture", async (req, res) =>
  res.json(await sales.capture(req.params.id, req.user)),
);
router.post("/:id/cancel", async (req, res) => {
  const sale = await sales.getSale(req.params.id, req.user);
  // Consultar PayPal antes de liberar una reserva; no se permite cancelar pagos aprobados.
  if (sale.paypal_id && sale.status !== "CANCELADA") {
    const order = await paypal.request(
      `/v2/checkout/orders/${encodeURIComponent(sale.paypal_id)}`,
    );
    if (
      !["CREATED", "SAVED", "PAYER_ACTION_REQUIRED", "VOIDED"].includes(
        order.status,
      )
    )
      fail("Pago aprobado o incierto: usa Verificar pago", 409);
  }
  await sales.cancelLocal(sale.id, req.user);
  res.json({ mensaje: "Reserva cancelada" });
});
router.get("/:id/xml", async (req, res) => {
  const sale = await sales.getSale(req.params.id, req.user);
  if (sale.status !== "PAGADA") fail("La venta no está pagada", 409);
  res
    .type("application/xml")
    .attachment(`factura-${sale.id}.xml`)
    .send(invoiceXml(sale, await sales.itemsFor(sale.id)));
});
router.post("/:id/email", async (req, res) => {
  const sale = await sales.getSale(req.params.id, req.user);
  if (sale.status !== "PAGADA") fail("La venta no está pagada", 409);
  res.json(await sendInvoice(sale, await sales.itemsFor(sale.id)));
});
module.exports = router;
