# Backend Express y MySQL

API REST organizada por responsabilidad, con cinco módulos de negocio y servicios externos separados. Node.js 22.12+ o 24. Ejecuta los comandos desde esta carpeta para que `dotenv` encuentre `.env`.

## Arquitectura

| Archivo                | Función                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `server.js`            | Carga configuración, exige JWT_SECRET y escucha puerto local       |
| `app.js`               | Compone Express, CORS, Helmet, rutas y errores                     |
| `config/db.js`         | Pool SQL y helper de transacciones                                 |
| `sql/schema.sql`       | Tablas, claves foráneas y restricciones únicas                     |
| `scripts/init-db.js`   | Inicialización idempotente de esquema y administrador              |
| `lib/validation.js`    | Validación de texto, correo, contraseña, enteros y carrito         |
| `middleware/auth.js`   | Autenticación JWT y autorización ADMIN                             |
| `routes/auth.js`       | Login, perfil y alta administrativa de usuarios                    |
| `routes/operations.js` | Productos, proveedores, compras, inventario, RRHH y libro contable |
| `routes/sales.js`      | Endpoints de ventas, pagos y facturas                              |
| `services/sales.js`    | Orquestación transaccional del ciclo de venta                      |
| `services/paypal.js`   | OAuth, solicitudes a Orders v2 y verificación de captura           |
| `services/invoice.js`  | XML escapado y envío de adjunto con Brevo                          |
| `test/`                | Pruebas de reglas y de integración SQL/HTTP                        |

Las rutas pequeñas validan los datos y ejecutan sus operaciones. El flujo de ventas, que cruza SQL y APIs externas, se separa en servicios. No hay una capa de clases de modelos vacíos: el esquema SQL define la persistencia y los tipos Angular documentan los contratos.

## Endpoints

Todos requieren JWT salvo `/api/health` y `/api/auth/login`.

| Método y ruta bajo `/api`                    | Permiso             | Resultado                                     |
| -------------------------------------------- | ------------------- | --------------------------------------------- |
| POST `/auth/login`                           | Público, limitado   | JWT y perfil seguro                           |
| GET `/auth/me`                               | Sesión              | Perfil actual                                 |
| POST `/auth/users`                           | ADMIN               | Cuenta con hash bcrypt                        |
| GET `/products`                              | Sesión              | Catálogo y stock                              |
| POST `/products`, PUT `/products/:id`        | ADMIN               | Alta/edición; nunca editar stock directamente |
| GET, POST `/inventory`                       | ADMIN               | Historial / ajuste de stock con motivo        |
| GET, POST `/suppliers`                       | ADMIN               | Proveedores                                   |
| GET, POST `/purchases`                       | ADMIN               | Compra pagada + entrada + egreso              |
| GET, POST `/employees`, PUT `/employees/:id` | ADMIN               | Expedientes y baja lógica                     |
| GET, POST `/payroll`                         | ADMIN               | Salario mensual + egreso                      |
| GET, POST `/finance`                         | ADMIN               | Libro, totales y movimientos manuales         |
| GET `/sales`                                 | Sesión              | Ventas propias; ADMIN ve todas                |
| GET `/sales/config`                          | Sesión              | Client ID público Sandbox                     |
| POST `/sales/cash`                           | Sesión              | Venta confirmada en efectivo                  |
| POST `/sales/paypal`                         | Sesión              | Reserva y orden PayPal                        |
| POST `/sales/:id/capture`                    | Propietario o ADMIN | Captura o conciliación                        |
| POST `/sales/:id/cancel`                     | Propietario o ADMIN | Liberación de reserva no pagada               |
| GET `/sales/:id/xml`                         | Propietario o ADMIN | Archivo XML de venta pagada                   |
| POST `/sales/:id/email`                      | Propietario o ADMIN | Reintento del envío                           |

Ejemplo de cuerpo de venta: `{"customer":"Cliente","email":"cliente@example.test","productos":[{"id":1,"cantidad":2}]}`. No acepta un precio enviado desde el cliente. Ejemplo de compra: `{"supplier_id":1,"productos":[{"id":1,"cantidad":10,"cost_cents":1500}]}`.

## Consistencia

- Se usan centavos enteros para evitar errores de redondeo.
- Las compras y salarios usan una transacción para persistir también sus egresos.
- Una venta bloquea productos en orden de ID, comprueba `stock - reserved` y reserva cantidades.
- Efectivo confirma inmediatamente. PayPal guarda la reserva y orden antes de capturar.
- La confirmación bloquea la venta, descuenta stock, libera reservas y crea un ingreso único.
- La referencia única `sale:UUID` y el estado PAGADA impiden duplicar los efectos SQL al reintentar.
- Los IDs de PayPal y de captura son únicos. `PayPal-Request-Id` es estable para la venta.
- Una falla del correo no revierte un pago ni elimina su factura.

## Estados de pago

`CREANDO → CREADA → REVISION → PAGADA` para PayPal. Efectivo pasa de CREANDO a PAGADA en una transacción. Un intento de captura establece REVISION antes de consultar el proveedor; un error no se interpreta como pago fallido. CREADA/CREANDO pueden cancelarse si no hay aprobación conocida. REVISION requiere conciliación; no se libera automáticamente. Las órdenes se guardan en SQL, no en un Map en memoria.

## Seguridad y operación

Nunca poner secretos en Angular ni versionar `.env`. Un usuario CAJERO no puede acceder a recursos administrativos aunque manipule la interfaz. Los errores internos no devuelven consultas SQL. Las cuentas anteriores requieren una migración específica si se desean conservar; la versión del examen usa una base nueva.

`npm test` ejecuta las reglas puras. Para habilitar integración configura una base desechable cuyo nombre termine en `_test`. La suite crea datos Test, usa SQL real y sustituye las respuestas de PayPal/Brevo. No se realizan cobros ni envíos en las pruebas automáticas.
