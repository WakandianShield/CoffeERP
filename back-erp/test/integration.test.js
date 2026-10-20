require("dotenv").config();
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { createApp } = require("../app");
// Nunca ejecutar integración sobre datos reales: requiere una base dedicada terminada en _test.
const enabled = process.env.DB_NAME?.endsWith("_test");
test(
  "Integración SQL + HTTP: seguridad, compras, ventas, inventario, nómina, PayPal y correo",
  { skip: !enabled },
  async (t) => {
    process.env.JWT_SECRET = "solo-pruebas-locales-0123456789-0123456789";
    for (const sql of fs
      .readFileSync(path.join(__dirname, "../sql/schema.sql"), "utf8")
      .split(";")
      .filter((s) => s.trim()))
      await pool.query(sql);
    const suffix = Date.now();
    const password = "PruebasLocal123!";
    const [admin] = await pool.execute(
      "INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",
      [
        "Admin Test",
        `admin${suffix}@example.test`,
        await bcrypt.hash(password, 4),
        "ADMIN",
      ],
    );
    const server = createApp().listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const realFetch = global.fetch;
    let remoteStatus = "APPROVED";
    let mismatch = false;
    let lostResponse = false;
    let captured = false;
    let captureCalls = 0;
    let emailBody;
    let mailFail = false;
    // Solo se sustituyen respuestas externas; Express y MySQL son reales.
    global.fetch = async (url, options) => {
      if (String(url).startsWith("https://api-m.sandbox.paypal.com")) {
        if (String(url).endsWith("/token"))
          return Response.json({ access_token: "test-token" });
        if (String(url).endsWith("/orders"))
          return Response.json({ id: "ORDER-" + suffix, status: "CREATED" });
        if (String(url).endsWith("/capture")) {
          captureCalls++;
          captured = true;
          if (lostResponse) {
            lostResponse = false;
            throw new Error("Respuesta perdida después del cobro");
          }
        }
        return Response.json({
          id: "ORDER-" + suffix,
          status: captured ? "COMPLETED" : remoteStatus,
          purchase_units: [
            {
              payments: {
                captures: captured
                  ? [
                      {
                        id: "CAPTURE-" + suffix,
                        status: "COMPLETED",
                        amount: {
                          currency_code: "MXN",
                          value: mismatch ? "0.01" : "45.00",
                        },
                      },
                    ]
                  : [],
              },
            },
          ],
        });
      }
      if (String(url) === "https://api.brevo.com/v3/smtp/email") {
        emailBody = JSON.parse(options.body);
        return Response.json(
          mailFail
            ? { message: "Rechazado" }
            : { messageId: "test-message-id" },
          { status: mailFail ? 400 : 201 },
        );
      }
      return realFetch(url, options);
    };
    t.after(async () => {
      global.fetch = realFetch;
      await new Promise((r) => server.close(r));
      await pool.end();
    });
    const api = async (method, url, body, token) => {
      const res = await fetch(base + url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const type = res.headers.get("content-type");
      return {
        status: res.status,
        body: type?.includes("json") ? await res.json() : await res.text(),
      };
    };
    let token, product, supplier, sale, cashier;
    await t.test(
      "401 sin sesión, contraseña incorrecta y JWT vencido",
      async () => {
        assert.equal((await api("GET", "/products")).status, 401);
        assert.equal(
          (
            await api("POST", "/auth/login", {
              email: `admin${suffix}@example.test`,
              password: "incorrecta",
            })
          ).status,
          401,
        );
        const expired = jwt.sign({}, process.env.JWT_SECRET, {
          subject: String(admin.insertId),
          expiresIn: -1,
        });
        assert.equal(
          (await api("GET", "/products", null, expired)).status,
          401,
        );
        const login = await api("POST", "/auth/login", {
          email: `admin${suffix}@example.test`,
          password,
        });
        assert.equal(login.status, 200);
        token = login.body.token;
        assert.equal(login.body.user.password_hash, undefined);
      },
    );
    await t.test(
      "Cajero no puede administrar ni consultar finanzas",
      async () => {
        assert.equal(
          (
            await api(
              "POST",
              "/auth/users",
              {
                name: "Cajero Test",
                email: `cashier${suffix}@example.test`,
                password,
                role: "CAJERO",
              },
              token,
            )
          ).status,
          201,
        );
        cashier = (
          await api("POST", "/auth/login", {
            email: `cashier${suffix}@example.test`,
            password,
          })
        ).body.token;
        assert.equal((await api("GET", "/finance", null, cashier)).status, 403);
        assert.equal(
          (
            await api(
              "POST",
              "/products",
              { name: "Hack", price_cents: 100, minimum: 0 },
              cashier,
            )
          ).status,
          403,
        );
      },
    );
    await t.test(
      "Compra actualiza existencias y registra egreso atómicamente",
      async () => {
        product = (
          await api(
            "POST",
            "/products",
            { name: "Café Test", price_cents: 4500, minimum: 3 },
            token,
          )
        ).body.id;
        supplier = (
          await api(
            "POST",
            "/suppliers",
            {
              name: "Proveedor Test",
              email: "proveedor@example.test",
              phone: "3312345678",
            },
            token,
          )
        ).body.id;
        const result = await api(
          "POST",
          "/purchases",
          {
            supplier_id: supplier,
            productos: [{ id: product, cantidad: 10, cost_cents: 2000 }],
          },
          token,
        );
        assert.equal(result.status, 201);
        const [[p]] = await pool.execute(
          "SELECT stock FROM products WHERE id=?",
          [product],
        );
        assert.equal(p.stock, 10);
        const [[entry]] = await pool.execute(
          "SELECT amount_cents FROM ledger WHERE reference=?",
          ["purchase:" + result.body.id],
        );
        assert.equal(entry.amount_cents, 20000);
        assert.equal(
          (
            await api(
              "POST",
              "/inventory",
              { product_id: product, quantity: -11, reason: "Inválido" },
              token,
            )
          ).status,
          409,
        );
        const [[after]] = await pool.execute(
          "SELECT stock FROM products WHERE id=?",
          [product],
        );
        assert.equal(after.stock, 10);
      },
    );
    await t.test(
      "Venta usa precio de BD, no del cliente; factura disponible pese a correo sin configurar",
      async () => {
        delete process.env.BREVO_API_KEY;
        delete process.env.MAIL_FROM;
        const result = await api(
          "POST",
          "/sales/cash",
          {
            customer: "Cliente Prueba",
            email: "cliente@example.test",
            productos: [{ id: product, cantidad: 2, price_cents: 1 }],
            total: 1,
          },
          token,
        );
        assert.equal(result.status, 201);
        sale = result.body.id;
        const [[s]] = await pool.execute("SELECT * FROM sales WHERE id=?", [
          sale,
        ]);
        assert.equal(s.total_cents, 9000);
        assert.equal(s.status, "PAGADA");
        assert.match(
          (await api("GET", `/sales/${sale}/xml`, null, token)).body,
          /total="90.00"/,
        );
        assert.equal(
          (await api("GET", `/sales/${sale}/xml`, null, cashier)).status,
          403,
        );
      },
    );
    await t.test("Nómina única por empleado y mes, con egreso", async () => {
      const employee = (
        await api(
          "POST",
          "/employees",
          {
            name: "Empleado Test",
            position: "Barista",
            email: "empleado@example.test",
            salary_cents: 1000000,
          },
          token,
        )
      ).body.id;
      assert.equal(
        (
          await api(
            "POST",
            "/payroll",
            { employee_id: employee, period: "2026-10" },
            token,
          )
        ).status,
        201,
      );
      assert.equal(
        (
          await api(
            "POST",
            "/payroll",
            { employee_id: employee, period: "2026-10" },
            token,
          )
        ).status,
        409,
      );
    });
    await t.test(
      "Correo: error visible, reintento y adjunto XML base64",
      async () => {
        process.env.BREVO_API_KEY = "fake-test-key";
        process.env.MAIL_FROM = "facturas@example.test";
        mailFail = true;
        assert.equal(
          (await api("POST", `/sales/${sale}/email`, {}, token)).status,
          502,
        );
        mailFail = false;
        assert.equal(
          (await api("POST", `/sales/${sale}/email`, {}, token)).status,
          200,
        );
        assert.match(emailBody.attachment[0].name, /\.xml$/);
        assert.match(
          Buffer.from(emailBody.attachment[0].content, "base64").toString(),
          /<Factura/,
        );
      },
    );
    await t.test(
      "PayPal: persiste reserva, conserva revisión si se pierde respuesta y recupera sin doble cobro",
      async () => {
        process.env.PAYPAL_CLIENT_ID = "test-id";
        process.env.PAYPAL_CLIENT_SECRET = "test-secret";
        process.env.PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com";
        const order = await api(
          "POST",
          "/sales/paypal",
          {
            customer: "Cliente PayPal",
            email: "cliente@example.test",
            productos: [{ id: product, cantidad: 1 }],
          },
          token,
        );
        assert.equal(order.status, 201);
        const id = order.body.saleId;
        const [[before]] = await pool.execute(
          "SELECT stock,reserved FROM products WHERE id=?",
          [product],
        );
        assert.equal(before.stock, 8);
        assert.equal(before.reserved, 1);
        lostResponse = true;
        assert.equal(
          (await api("POST", `/sales/${id}/capture`, {}, token)).status,
          500,
        );
        const [[pending]] = await pool.execute(
          "SELECT status FROM sales WHERE id=?",
          [id],
        );
        assert.equal(pending.status, "REVISION");
        mismatch = true;
        assert.equal(
          (await api("POST", `/sales/${id}/capture`, {}, token)).status,
          409,
        );
        mismatch = false;
        assert.equal(
          (await api("POST", `/sales/${id}/capture`, {}, token)).status,
          200,
        );
        assert.equal(
          (await api("POST", `/sales/${id}/capture`, {}, token)).status,
          200,
        );
        assert.equal(captureCalls, 1);
        const [[after]] = await pool.execute(
          "SELECT stock,reserved FROM products WHERE id=?",
          [product],
        );
        assert.equal(after.stock, 7);
        assert.equal(after.reserved, 0);
        const [[entries]] = await pool.execute(
          "SELECT COUNT(*) n FROM ledger WHERE reference=?",
          ["sale:" + id],
        );
        assert.equal(entries.n, 1);
      },
    );
  },
);
