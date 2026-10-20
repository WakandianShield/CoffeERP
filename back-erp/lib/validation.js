// Validaciones compartidas: el servidor nunca confía en precios o roles del navegador.
function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
function text(value, label, max = 100) {
  if (
    typeof value !== "string" ||
    value.trim().length < 2 ||
    value.trim().length > max
  )
    fail(`${label}: longitud inválida`);
  return value.trim();
}
function email(value) {
  const result = text(value, "Correo", 190).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail("Correo inválido");
  return result;
}
function integer(value, label, min = 1, max = 100000000) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    fail(`${label}: entero fuera de rango`);
  return value;
}
function password(value) {
  if (
    typeof value !== "string" ||
    value.length < 10 ||
    value.length > 72 ||
    !/[A-Z]/.test(value) ||
    !/[0-9]/.test(value) ||
    !/[^A-Za-z0-9]/.test(value)
  )
    fail("Contraseña: 10-72 caracteres, mayúscula, número y símbolo");
  return value;
}
function cart(items) {
  if (!Array.isArray(items) || !items.length || items.length > 50)
    fail("Carrito vacío o demasiado grande");
  const ids = new Set();
  return items
    .map((item) => {
      const id = integer(item.id, "Producto");
      const quantity = integer(item.cantidad, "Cantidad", 1, 100);
      if (ids.has(id)) fail("Producto repetido en el carrito");
      ids.add(id);
      return { id, quantity };
    })
    .sort((a, b) => a.id - b.id);
}
module.exports = { fail, text, email, integer, password, cart };
