const { randomUUID } = require("node:crypto");
const { pool, transaction } = require("../config/db");
const v = require("../lib/validation");
const paypal = require("./paypal");
const { sendInvoice } = require("./invoice");
async function getSale(id, user, db = pool, lock = false) {
  const [rows] = await db.execute(
    `SELECT * FROM sales WHERE id=?${lock ? " FOR UPDATE" : ""}`,
    [id],
  );
  if (!rows.length) v.fail("Venta no encontrada", 404);
  const sale = rows[0];
  if (sale.user_id !== user.id && user.role !== "ADMIN")
    v.fail("Sin acceso a esta venta", 403);
  return sale;
}
async function itemsFor(id, db = pool) {
  const [rows] = await db.execute(
    "SELECT * FROM sale_items WHERE sale_id=? ORDER BY product_id",
    [id],
  );
  return rows;
}
// Confirmar una sola vez: el bloqueo de venta y la referencia UNIQUE evitan duplicar caja e inventario.
async function settle(db, sale, captureId = null) {
  if (sale.status === "PAGADA") return;
  const items = await itemsFor(sale.id, db);
  for (const item of items) {
    await db.execute(
      "UPDATE products SET stock=stock-?,reserved=reserved-? WHERE id=?",
      [item.quantity, item.quantity, item.product_id],
    );
    await db.execute(
      "INSERT INTO stock_movements(product_id,quantity,reason) VALUES(?,?,?)",
      [item.product_id, -item.quantity, `Venta ${sale.id}`],
    );
  }
  await db.execute("UPDATE sales SET status='PAGADA',capture_id=? WHERE id=?", [
    captureId,
    sale.id,
  ]);
  await db.execute(
    "INSERT INTO ledger(kind,concept,amount_cents,reference) VALUES(?,?,?,?)",
    ["INGRESO", `Venta ${sale.id}`, sale.total_cents, `sale:${sale.id}`],
  );
}
async function notify(id, user) {
  const sale = await getSale(id, user);
  const items = await itemsFor(id);
  try {
    await sendInvoice(sale, items);
    return "ENVIADA";
  } catch {
    return "PENDIENTE";
  }
}
async function create(body, user, method) {
  const customer = v.text(body.customer, "Cliente");
  const email = v.email(body.email);
  const cart = v.cart(body.productos);
  if (
    method === "PAYPAL" &&
    (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET)
  )
    v.fail("Configura PayPal Sandbox en el backend", 503);
  const id = randomUUID();
  await transaction(async (db) => {
    let total = 0;
    const items = [];
    // Bloquear productos en orden estable evita ventas simultáneas sobre el mismo stock.
    for (const item of cart) {
      const [rows] = await db.execute(
        "SELECT * FROM products WHERE id=? AND active=1 FOR UPDATE",
        [item.id],
      );
      if (!rows.length || rows[0].stock - rows[0].reserved < item.quantity)
        v.fail("Producto sin existencia suficiente", 409);
      const product = rows[0];
      total += product.price_cents * item.quantity;
      items.push({ ...item, ...product });
    }
    v.integer(total, "Total");
    await db.execute(
      "INSERT INTO sales(id,user_id,customer,email,total_cents,status,method) VALUES(?,?,?,?,?,?,?)",
      [id, user.id, customer, email, total, "CREANDO", method],
    );
    for (const item of items) {
      await db.execute("INSERT INTO sale_items VALUES(?,?,?,?,?)", [
        id,
        item.id,
        item.name,
        item.quantity,
        item.price_cents,
      ]);
      await db.execute("UPDATE products SET reserved=reserved+? WHERE id=?", [
        item.quantity,
        item.id,
      ]);
    }
    if (method === "EFECTIVO")
      await settle(db, { id, total_cents: total, status: "CREANDO" });
  });
  if (method === "EFECTIVO") {
    const email_status = await notify(id, user);
    return { id, mensaje: "Venta pagada en efectivo", email_status };
  }
  try {
    const sale = await getSale(id, user);
    const order = await paypal.request(
      "/v2/checkout/orders",
      "POST",
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: id,
            amount: {
              currency_code: "MXN",
              value: (sale.total_cents / 100).toFixed(2),
            },
          },
        ],
      },
      id,
    );
    if (!order.id) v.fail("PayPal no devolvió una orden", 502);
    await pool.execute(
      "UPDATE sales SET paypal_id=?,status='CREADA' WHERE id=?",
      [order.id, id],
    );
    return { id: order.id, saleId: id };
  } catch (error) {
    // Una creación sin respuesta no puede haber sido aprobada desde esta interfaz.
    await cancelLocal(id, user);
    throw error;
  }
}
async function cancelLocal(id, user) {
  await transaction(async (db) => {
    const sale = await getSale(id, user, db, true);
    if (sale.status === "CANCELADA") return;
    if (["PAGADA", "REVISION"].includes(sale.status))
      v.fail("Verifica el pago antes de cancelar", 409);
    for (const item of await itemsFor(id, db))
      await db.execute("UPDATE products SET reserved=reserved-? WHERE id=?", [
        item.quantity,
        item.product_id,
      ]);
    await db.execute("UPDATE sales SET status='CANCELADA' WHERE id=?", [id]);
  });
}
async function capture(id, user) {
  // La marca REVISION se guarda ANTES de salir a la API. Un corte de red nunca libera stock cobrado.
  const sale = await transaction(async (db) => {
    const sale = await getSale(id, user, db, true);
    if (sale.status === "PAGADA") return sale;
    if (!sale.paypal_id || sale.status === "CANCELADA")
      v.fail("Orden no disponible para captura", 409);
    await db.execute("UPDATE sales SET status='REVISION' WHERE id=?", [id]);
    return sale;
  });
  if (sale.status !== "PAGADA") {
    let result = await paypal.request(
      `/v2/checkout/orders/${encodeURIComponent(sale.paypal_id)}`,
    );
    if (result.status === "APPROVED")
      result = await paypal.request(
        `/v2/checkout/orders/${encodeURIComponent(sale.paypal_id)}/capture`,
        "POST",
        {},
        id,
      );
    const capture = paypal.verifiedCapture(result, sale);
    if (!capture)
      v.fail("Pago pendiente de verificación; no se registró como pagado", 409);
    await transaction(async (db) => {
      const current = await getSale(id, user, db, true);
      await settle(db, current, capture.id);
    });
  }
  return {
    id,
    mensaje: "Pago completado",
    email_status: await notify(id, user),
  };
}
module.exports = { getSale, itemsFor, create, capture, cancelLocal };
