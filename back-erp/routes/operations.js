const router = require("express").Router();
const { pool, transaction } = require("../config/db");
const { admin } = require("../middleware/auth");
const v = require("../lib/validation");
// Catálogo: la existencia solo se altera mediante movimientos, compras o ventas.
router.get("/products", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM products ORDER BY name");
  res.json(rows);
});
router.post("/products", admin, async (req, res) => {
  const b = req.body;
  const values = [
    v.text(b.name, "Nombre"),
    v.integer(b.price_cents, "Precio"),
    v.integer(b.minimum, "Mínimo", 0),
  ];
  const [result] = await pool.execute(
    "INSERT INTO products(name,price_cents,minimum) VALUES(?,?,?)",
    values,
  );
  res.status(201).json({ id: result.insertId });
});
router.put("/products/:id", admin, async (req, res) => {
  const b = req.body;
  if (typeof b.active !== "boolean") v.fail("Estado inválido");
  const [result] = await pool.execute(
    "UPDATE products SET name=?,price_cents=?,minimum=?,active=? WHERE id=?",
    [
      v.text(b.name, "Nombre"),
      v.integer(b.price_cents, "Precio"),
      v.integer(b.minimum, "Mínimo", 0),
      b.active,
      req.params.id,
    ],
  );
  if (!result.affectedRows) v.fail("Producto no encontrado", 404);
  res.json({ mensaje: "Producto actualizado" });
});
router.get("/inventory", admin, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT m.*,p.name FROM stock_movements m JOIN products p ON p.id=m.product_id ORDER BY m.id DESC LIMIT 200",
  );
  res.json(rows);
});
// El bloqueo de fila comprueba que la salida respete las unidades reservadas.
router.post("/inventory", admin, async (req, res) => {
  const b = req.body;
  const id = v.integer(b.product_id, "Producto");
  const quantity = v.integer(b.quantity, "Cantidad", -100000, 100000);
  if (!quantity) v.fail("La cantidad no puede ser cero");
  const reason = v.text(b.reason, "Motivo", 150);
  await transaction(async (db) => {
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE id=? FOR UPDATE",
      [id],
    );
    if (!rows.length) v.fail("Producto no encontrado", 404);
    if (rows[0].stock + quantity < rows[0].reserved)
      v.fail("No se puede retirar stock reservado o inexistente", 409);
    await db.execute("UPDATE products SET stock=stock+? WHERE id=?", [
      quantity,
      id,
    ]);
    await db.execute(
      "INSERT INTO stock_movements(product_id,quantity,reason) VALUES(?,?,?)",
      [id, quantity, reason],
    );
  });
  res.status(201).json({ mensaje: "Movimiento registrado" });
});
router.get("/suppliers", admin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM suppliers ORDER BY name");
  res.json(rows);
});
router.post("/suppliers", admin, async (req, res) => {
  const b = req.body;
  const phone = v.text(b.phone, "Teléfono", 20);
  if (!/^[+0-9 ()-]{7,20}$/.test(phone)) v.fail("Teléfono inválido");
  const [result] = await pool.execute(
    "INSERT INTO suppliers(name,email,phone) VALUES(?,?,?)",
    [v.text(b.name, "Nombre"), v.email(b.email), phone],
  );
  res.status(201).json({ id: result.insertId });
});
router.get("/purchases", admin, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT c.*,s.name supplier FROM purchases c JOIN suppliers s ON s.id=c.supplier_id ORDER BY c.id DESC LIMIT 200",
  );
  res.json(rows);
});
// Una recepción pagada conecta Compras, Inventario y Finanzas en una transacción.
router.post("/purchases", admin, async (req, res) => {
  const supplier = v.integer(req.body.supplier_id, "Proveedor");
  const items = v
    .cart(req.body.productos)
    .map((item) => ({
      ...item,
      cost: v.integer(
        req.body.productos.find((p) => p.id === item.id).cost_cents,
        "Costo",
      ),
    }));
  const total = v.integer(
    items.reduce((sum, i) => sum + i.quantity * i.cost, 0),
    "Total",
  );
  const id = await transaction(async (db) => {
    const [suppliers] = await db.execute(
      "SELECT id FROM suppliers WHERE id=?",
      [supplier],
    );
    if (!suppliers.length) v.fail("Proveedor inexistente");
    const [result] = await db.execute(
      "INSERT INTO purchases(supplier_id,total_cents) VALUES(?,?)",
      [supplier, total],
    );
    for (const item of items) {
      const [products] = await db.execute(
        "SELECT id FROM products WHERE id=? AND active=1 FOR UPDATE",
        [item.id],
      );
      if (!products.length) v.fail("Producto inexistente o inactivo");
      await db.execute("INSERT INTO purchase_items VALUES(?,?,?,?)", [
        result.insertId,
        item.id,
        item.quantity,
        item.cost,
      ]);
      await db.execute("UPDATE products SET stock=stock+? WHERE id=?", [
        item.quantity,
        item.id,
      ]);
      await db.execute(
        "INSERT INTO stock_movements(product_id,quantity,reason) VALUES(?,?,?)",
        [item.id, item.quantity, `Compra #${result.insertId}`],
      );
    }
    await db.execute(
      "INSERT INTO ledger(kind,concept,amount_cents,reference) VALUES(?,?,?,?)",
      [
        "EGRESO",
        `Compra #${result.insertId}`,
        total,
        `purchase:${result.insertId}`,
      ],
    );
    return result.insertId;
  });
  res
    .status(201)
    .json({ id, mensaje: "Compra recibida y pagada; inventario actualizado" });
});
router.get("/employees", admin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM employees ORDER BY name");
  res.json(rows);
});
router.post("/employees", admin, async (req, res) => {
  const b = req.body;
  const [result] = await pool.execute(
    "INSERT INTO employees(name,position,email,salary_cents) VALUES(?,?,?,?)",
    [
      v.text(b.name, "Nombre"),
      v.text(b.position, "Puesto"),
      v.email(b.email),
      v.integer(b.salary_cents, "Salario"),
    ],
  );
  res.status(201).json({ id: result.insertId });
});
router.put("/employees/:id", admin, async (req, res) => {
  const b = req.body;
  if (typeof b.active !== "boolean") v.fail("Estado inválido");
  const [result] = await pool.execute(
    "UPDATE employees SET name=?,position=?,email=?,salary_cents=?,active=? WHERE id=?",
    [
      v.text(b.name, "Nombre"),
      v.text(b.position, "Puesto"),
      v.email(b.email),
      v.integer(b.salary_cents, "Salario"),
      b.active,
      req.params.id,
    ],
  );
  if (!result.affectedRows) v.fail("Empleado no encontrado", 404);
  res.json({ mensaje: "Empleado actualizado" });
});
router.get("/payroll", admin, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT n.*,e.name FROM payroll n JOIN employees e ON e.id=n.employee_id ORDER BY n.id DESC LIMIT 200",
  );
  res.json(rows);
});
// La clave única empleado/periodo impide registrar dos pagos del mismo salario.
router.post("/payroll", admin, async (req, res) => {
  const id = v.integer(req.body.employee_id, "Empleado");
  const period = req.body.period;
  if (typeof period !== "string" || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(period))
    v.fail("Periodo inválido: AAAA-MM");
  await transaction(async (db) => {
    const [rows] = await db.execute(
      "SELECT * FROM employees WHERE id=? AND active=1 FOR UPDATE",
      [id],
    );
    if (!rows.length) v.fail("Empleado inexistente o inactivo");
    const [result] = await db.execute(
      "INSERT INTO payroll(employee_id,period,amount_cents) VALUES(?,?,?)",
      [id, period, rows[0].salary_cents],
    );
    await db.execute(
      "INSERT INTO ledger(kind,concept,amount_cents,reference) VALUES(?,?,?,?)",
      [
        "EGRESO",
        `Nómina ${period}: ${rows[0].name}`,
        rows[0].salary_cents,
        `payroll:${result.insertId}`,
      ],
    );
  });
  res.status(201).json({ mensaje: "Pago de nómina registrado" });
});
// Los listados se limitan; los totales se calculan sobre el historial completo.
router.get("/finance", admin, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM ledger ORDER BY id DESC LIMIT 200",
  );
  const [totals] = await pool.query(
    "SELECT COALESCE(SUM(IF(kind='INGRESO',amount_cents,0)),0) income,COALESCE(SUM(IF(kind='EGRESO',amount_cents,0)),0) expense FROM ledger",
  );
  res.json({ entries: rows, ...totals[0] });
});
router.post("/finance", admin, async (req, res) => {
  const b = req.body;
  if (!["INGRESO", "EGRESO"].includes(b.kind)) v.fail("Tipo inválido");
  await pool.execute(
    "INSERT INTO ledger(kind,concept,amount_cents) VALUES(?,?,?)",
    [
      b.kind,
      v.text(b.concept, "Concepto", 150),
      v.integer(b.amount_cents, "Importe"),
    ],
  );
  res.status(201).json({ mensaje: "Movimiento contable registrado" });
});
module.exports = router;
