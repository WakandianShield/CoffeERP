const { pool } = require("../config/db");
const { fail } = require("../lib/validation");
// Escapar atributos evita XML inválido o inyección mediante nombres de clientes.
const escapeXml = (value) =>
  String(value)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(
      /[<>&"']/g,
      (c) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&apos;",
        })[c],
    );
function invoiceXml(sale, items) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Factura version="1.0" tipo="ACADEMICA_NO_FISCAL" folio="${escapeXml(sale.id)}" moneda="MXN" total="${(sale.total_cents / 100).toFixed(2)}" fecha="${new Date(sale.created_at).toISOString()}">
 <Emisor nombre="CoffeERP"/>
 <Receptor nombre="${escapeXml(sale.customer)}" correo="${escapeXml(sale.email)}"/>
 <Conceptos>${items.map((i) => `<Concepto producto="${escapeXml(i.name)}" cantidad="${i.quantity}" precioUnitario="${(i.price_cents / 100).toFixed(2)}" importe="${((i.quantity * i.price_cents) / 100).toFixed(2)}"/>`).join("")}</Conceptos>
 <Pago metodo="${sale.method}" referencia="${escapeXml(sale.capture_id || sale.id)}"/>
</Factura>`;
}
async function sendInvoice(sale, items) {
  if (sale.email_status === "ENVIADA")
    return { mensaje: "Factura ya aceptada por el servicio de correo" };
  if (!process.env.BREVO_API_KEY || !process.env.MAIL_FROM)
    fail("Configura BREVO_API_KEY y MAIL_FROM para enviar la factura", 503);
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "CoffeERP", email: process.env.MAIL_FROM },
        to: [{ email: sale.email, name: sale.customer }],
        subject: `Factura académica ${sale.id}`,
        textContent:
          "Adjuntamos la factura XML de tu compra. Comprobante académico sin validez fiscal.",
        attachment: [
          {
            name: `factura-${sale.id}.xml`,
            content: Buffer.from(invoiceXml(sale, items)).toString("base64"),
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) fail("El servicio de correo rechazó el envío", 502);
    const data = await response.json();
    await pool.execute(
      "UPDATE sales SET email_status='ENVIADA',email_message_id=? WHERE id=?",
      [data.messageId || null, sale.id],
    );
    return { mensaje: "Factura aceptada por el servicio de correo" };
  } catch (error) {
    await pool.execute("UPDATE sales SET email_status='ERROR' WHERE id=?", [
      sale.id,
    ]);
    throw error;
  }
}
module.exports = { invoiceXml, sendInvoice };
