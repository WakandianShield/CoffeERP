# Frontend Angular

Aplicación SPA privada con componentes standalone. Se retiró SSR porque este ERP requiere autenticación y el SDK de PayPal necesita el navegador. No hay datos empresariales persistidos en localStorage: los formularios consultan Express y MySQL.

## Organización

| Archivo o carpeta                | Responsabilidad                                          |
| -------------------------------- | -------------------------------------------------------- |
| `src/main.ts`                    | Arrancar Angular                                         |
| `src/app/app.config.ts`          | Registrar router, HttpClient e interceptor               |
| `src/app/app.routes.ts`          | Login, cinco módulos y guards                            |
| `src/app/shell.ts`               | Navegación común, usuario y cierre de sesión             |
| `src/app/login.ts`               | Formulario de acceso                                     |
| `src/app/core/models.ts`         | Interfaces de los contratos HTTP                         |
| `src/app/core/auth.service.ts`   | Iniciar/restaurar sesión y conservar JWT por pestaña     |
| `src/app/core/security.ts`       | Añadir JWT solo a `/api`, gestionar 401 y proteger rutas |
| `src/app/core/api.service.ts`    | Centralizar GET, POST, PUT y descarga XML                |
| `src/app/core/paypal.service.ts` | Cargar SDK v6 y preparar sesión de pago                  |
| `src/app/core/page.ts`           | Estado de carga, mensajes y formato de moneda            |
| `src/app/pages/`                 | Una pantalla por módulo                                  |
| `proxy.conf.json`                | Redirigir `/api` a `127.0.0.1:3200` durante desarrollo   |

## Recorrido de una acción

1. El usuario completa un formulario con validación Angular.
2. El componente transforma pesos a centavos y llama a `ApiService`.
3. El interceptor adjunta el JWT. El backend vuelve a validar todo.
4. Tras la respuesta, el componente recarga los registros del servidor.
5. Las señales (`signal`) actualizan las tablas, mensajes y botones.

Los imports y clases están comentados donde hay decisiones de seguridad, pagos o arquitectura. Los modelos no se mezclan con el servicio de PayPal. Las plantillas están junto al componente para facilitar la lectura de estas cinco pantallas pequeñas.

## PayPal

`PaypalService.setup()` solicita el Client ID público al backend, carga el script y crea una sesión. El botón queda deshabilitado si faltan credenciales. Un clic llama a `session.start()` y pasa una promesa de creación de orden. `onApprove` solicita la captura al backend. El navegador **no decide** que una venta está pagada.

Un cierre de ventana conserva la reserva hasta que el usuario la cancele o verifique desde el historial. Si desaparece la pestaña después del cobro, el historial persistido permite recuperar el estado al iniciar sesión de nuevo.

## Comandos

```bash
npm ci
npm start
npm run build
```

`dist/coffeERP/browser` contiene la compilación. Un hosting necesita fallback de rutas a `index.html` y proxy `/api` al backend. El código está preparado para ejecución local, sin despliegue incluido.

## Criterios visuales

Navegación única, tonos café y verde, formularios con etiquetas visibles, tablas desplazables y adaptación a 390px. Los botones bloquean envíos mientras hay una operación en curso. Los errores del servidor se presentan junto al formulario.
