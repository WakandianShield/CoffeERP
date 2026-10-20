# CoffeERP · Examen de Programación Web II

ERP académico para administrar una cafetería. Esta versión conserva **cinco pantallas de trabajo**: Ventas, Compras y proveedores, Inventario, Recursos humanos y Finanzas y contabilidad. Usa Angular, Express y MySQL; integra PayPal Sandbox y la API de correo de Brevo para adjuntar una factura XML.

## Documentación de entrega

- [SRS simplificado](docs/SRS.md): alcance, requisitos, reglas, casos de uso, modelos y aceptación.
- [Guía de entrega y evidencias](docs/ENTREGA.md).
- [Arquitectura frontend](coffeERP/README.md) y [arquitectura backend](back-erp/README.md).
- [Capturas del funcionamiento](docs/evidencias/).

## Qué se simplificó

La versión anterior incluía más de veinte rutas y varias funciones almacenadas únicamente en el navegador. Esta versión tiene una pantalla por módulo y persistencia en SQL. Se retiraron dashboards, presupuestos, cuentas por cobrar/pagar, pólizas, estados fiscales, devoluciones, notas de crédito, pedidos, reportes separados, vacaciones, asistencia y un editor dinámico de roles. El historial Git conserva la versión anterior.

Las compras se registran **recibidas y pagadas**; las ventas se cobran en efectivo o PayPal; RRHH registra expedientes y salarios mensuales pagados. Finanzas utiliza un libro de ingresos y egresos integrado. El inventario corresponde a **productos terminados**, sin recetas ni conversiones de ingredientes. Esto permite demostrar todos los módulos sin construir un ERP contable empresarial completo.

## Requisitos

- Node.js 22.12+ o 24, npm, MySQL 8+ (también probado con MariaDB 10.11).
- Cuenta y aplicación PayPal Sandbox para comprobar pagos externos.
- Clave API de Brevo y remitente autorizado para enviar facturas por correo.

## 1. Preparar la base y el backend

Crea una base **nueva**, para no alterar la instalación anterior:

```sql
CREATE DATABASE coffe_erp_exam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'coffe'@'localhost' IDENTIFIED BY 'REEMPLAZA_POR_UNA_CLAVE_PROPIA';
GRANT ALL PRIVILEGES ON coffe_erp_exam.* TO 'coffe'@'localhost';
```

```bash
cd back-erp
npm ci
cp .env.example .env
```

En Windows PowerShell utiliza `Copy-Item .env.example .env`. Completa `DB_*`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `JWT_SECRET`. El administrador inicial requiere contraseña de 10-72 caracteres, una mayúscula, un número y un símbolo. Genera el secreto JWT con:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

```bash
npm run init-db
npm start
```

El inicializador crea tablas e inserta el administrador si no existe. **No borra tablas, no migra usuarios antiguos ni reemplaza sus contraseñas.** El backend escucha en `http://127.0.0.1:3200`; no se conecta a Railway por defecto.

## 2. Iniciar Angular

En otra terminal:

```bash
cd coffeERP
npm ci
npm start
```

Abre `http://localhost:4200`. El proxy de Angular envía `/api` al backend. Inicia sesión con las credenciales de administrador configuradas en el `.env` y crea tus datos desde los formularios. No hay contraseñas de acceso incorporadas al repositorio.

## 3. Configurar los servicios externos

En `back-erp/.env`:

```dotenv
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_CLIENT_ID=TU_CLIENT_ID_SANDBOX
PAYPAL_CLIENT_SECRET=TU_SECRET_SANDBOX
BREVO_API_KEY=TU_CLAVE_API_BREVO
MAIL_FROM=tu-remitente-autorizado@example.com
```

Reinicia el backend y recarga Ventas. Utiliza un comprador Sandbox distinto de la cuenta vendedora. El SDK v6 se carga dinámicamente y recibe solamente el Client ID público; las claves secretas permanecen en Express.

El total se calcula con precios guardados en MySQL. Primero se reserva inventario, luego se crea y captura la orden de PayPal. Se comprueban ID, estado `COMPLETED`, moneda MXN e importe exacto. Una captura incierta queda en `REVISION`; **Verificar pago** consulta PayPal y recupera el resultado. No vuelvas a cobrar mientras haya una operación incierta.

Después de confirmar una venta se intenta enviar el XML automáticamente. Si falta la configuración o falla el correo, la venta permanece pagada y puedes descargar el XML o reintentar el envío desde el historial. `ENVIADA` significa aceptada por la API de correo, no entrega confirmada en la bandeja del destinatario.

La factura es **académica, no fiscal**, sin timbrado CFDI, impuestos ni conexión al SAT. El proyecto bloquea el endpoint de PayPal de producción para evitar cobros reales durante las pruebas.

## Roles y seguridad

| Operación                                  | ADMIN       | CAJERO       |
| ------------------------------------------ | ----------- | ------------ |
| Ventas y catálogo de productos para cobrar | Sí          | Sí           |
| Consultar facturas y pagos                 | Todas       | Solo propios |
| Inventario, compras, RRHH y finanzas       | Sí          | No           |
| Crear cuentas de acceso                    | Sí, en RRHH | No           |

Las contraseñas usan bcrypt. El JWT vence en una hora; el middleware verifica firma, expiración y usuario activo. Los guards de Angular orientan la navegación, pero la autorización efectiva ocurre en Express. Se incluyen consultas parametrizadas, validación de datos, límite de intentos de login, Helmet y CORS de origen definido. Nunca se devuelve el hash de contraseña.

**Acción pendiente sobre la instalación anterior:** la revisión encontró una credencial de base de datos publicada y contraseñas tratadas como texto plano. Retirar el valor del código no lo elimina de Git. Rota la contraseña de Railway y cambia las contraseñas antiguas; esta rama no modifica tu infraestructura ni reescribe el historial.

## Verificación

```bash
cd coffeERP
npm run build
cd ../back-erp
npm test
```

Las pruebas unitarias se ejecutan siempre. La suite SQL/HTTP solo se habilita si `DB_NAME` termina en `_test`. Crea una base desechable con ese sufijo, configura `DB_*` en la terminal y ejecuta `npm test`. La suite utiliza Express y SQL reales; **PayPal y Brevo se sustituyen por respuestas controladas**, sin cobros ni correos externos. El flujo de navegador usa datos ficticios y una venta en efectivo persistida.

La integración SQL deja sus registros identificados como Test; usa una base exclusiva. No ejecutes pruebas con credenciales de producción. GitHub Actions crea una base MySQL efímera para repetir las verificaciones.

## Límites deliberados

- No hay contabilidad de doble partida, impuestos, cálculo fiscal de nómina, CFDI, devoluciones ni pagos reales.
- Cada compra de la interfaz contiene un producto; la API admite varios productos distintos.
- Los listados de movimientos se limitan a los últimos 200; los totales de finanzas usan todo el historial.
- No se libera automáticamente una reserva con pago incierto: requiere consultar y conciliar el estado.
- El reintento del correo tras un timeout puede duplicar el mensaje si el proveedor lo aceptó antes de perderse la respuesta. No duplica la venta.
- Esta es una aplicación local académica. Para publicarla hay que añadir HTTPS, proxy inverso `/api`, CSP compatible con PayPal, respaldos y conciliación operativa de pagos.

## Fuentes utilizadas

El PDF entregado por el alumno se usó como antecedente del sistema, no como obligación de conservar todas sus funciones anteriores. Los archivos `local-repo-converted (6).md`, `(7).md` y el ZIP de autenticación aportaron el patrón Angular de servicios/guards y Express con middleware. Se corrigieron ejemplos incompletos, contraseñas sin hash y errores de los apuntes de PayPal.

- [PayPal SDK v6](https://developer.paypal.com/sdk/js/set-up/)
- [PayPal Orders API](https://developer.paypal.com/api/rest/integration/orders-api)
- [Brevo: correo transaccional](https://developers.brevo.com/reference/send-transac-email)
