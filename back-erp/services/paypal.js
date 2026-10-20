const { fail } = require("../lib/validation");
// Sandbox únicamente: evita cobros reales accidentales durante el examen.
async function request(path, method = "GET", body, requestId) {
  const base =
    process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
  if (base !== "https://api-m.sandbox.paypal.com")
    fail("Este proyecto utiliza PayPal Sandbox", 503);
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET)
    fail("Configura PayPal Sandbox en el backend", 503);
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");
  const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15000),
  });
  if (!tokenResponse.ok) fail("PayPal rechazó la autenticación", 502);
  const token = await tokenResponse.json();
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok)
    fail(
      "PayPal no confirmó la operación. Consulta su estado antes de repetir el pago.",
      502,
    );
  return data;
}
// Validar identidad, estado, moneda e importe exacto antes de registrar ingresos.
function verifiedCapture(order, sale) {
  const captures =
    order.purchase_units?.flatMap((u) => u.payments?.captures || []) || [];
  if (
    order.id !== sale.paypal_id ||
    order.status !== "COMPLETED" ||
    captures.length !== 1
  )
    return null;
  const capture = captures[0];
  if (
    capture.status !== "COMPLETED" ||
    !capture.id ||
    capture.amount?.currency_code !== "MXN" ||
    capture.amount?.value !== (sale.total_cents / 100).toFixed(2)
  )
    return null;
  return capture;
}
module.exports = { request, verifiedCapture };
