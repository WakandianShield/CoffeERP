const { test } = require("node:test");
const assert = require("node:assert/strict");
const v = require("../lib/validation");
const { verifiedCapture } = require("../services/paypal");
const { invoiceXml } = require("../services/invoice");
test("Carrito: rechaza vacíos, cantidades fraccionarias y productos repetidos", () => {
  for (const cart of [
    [],
    [{ id: 1, cantidad: 1.5 }],
    [
      { id: 1, cantidad: 1 },
      { id: 1, cantidad: 2 },
    ],
    [{ id: 1, cantidad: -1 }],
  ])
    assert.throws(() => v.cart(cart));
  assert.deepEqual(
    v.cart([
      { id: 2, cantidad: 1 },
      { id: 1, cantidad: 2 },
    ]),
    [
      { id: 1, quantity: 2 },
      { id: 2, quantity: 1 },
    ],
  );
});
test("Importes, correo y contraseña se validan en servidor", () => {
  assert.throws(() => v.integer(1.5, "Precio"));
  assert.throws(() => v.integer(0, "Precio"));
  assert.throws(() => v.email("no-es-correo"));
  assert.throws(() => v.password("123456"));
});
test("PayPal: rechaza moneda, importe, identidad o estado incorrectos", () => {
  const sale = { paypal_id: "ORDER", total_cents: 4500 };
  const valid = {
    id: "ORDER",
    status: "COMPLETED",
    purchase_units: [
      {
        payments: {
          captures: [
            {
              id: "CAPTURE",
              status: "COMPLETED",
              amount: { currency_code: "MXN", value: "45.00" },
            },
          ],
        },
      },
    ],
  };
  assert.equal(verifiedCapture(valid, sale).id, "CAPTURE");
  for (const change of [
    (x) => (x.id = "OTHER"),
    (x) => (x.status = "APPROVED"),
    (x) => (x.purchase_units[0].payments.captures[0].amount.value = "0.01"),
    (x) =>
      (x.purchase_units[0].payments.captures[0].amount.currency_code = "USD"),
    (x) => (x.purchase_units[0].payments.captures[0].status = "PENDING"),
  ]) {
    const altered = structuredClone(valid);
    change(altered);
    assert.equal(verifiedCapture(altered, sale), null);
  }
});
test("Factura XML escapa texto y conserva precios históricos", () => {
  const xml = invoiceXml(
    {
      id: "test",
      customer: 'Ana & "Luis" <x>',
      email: "demo@example.test",
      total_cents: 4500,
      method: "EFECTIVO",
      created_at: "2026-10-19T12:00:00Z",
    },
    [{ name: "Café & pan", quantity: 1, price_cents: 4500 }],
  );
  assert.match(xml, /Ana &amp; &quot;Luis&quot; &lt;x&gt;/);
  assert.match(xml, /ACADEMICA_NO_FISCAL/);
  assert.match(xml, /total="45.00"/);
  assert.doesNotMatch(xml, /<x>/);
});
