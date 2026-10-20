# Entrega del examen · CoffeERP

Alumno: Santiago Gallardo Ruvalcaba · Matrícula 23300748 · Grupo 7A1.  
Docente: Paola Fernanda Ponce Villalvazo · Programación Web II.

## Archivos para entregar

1. `SRS-CoffeERP.pdf`: especificación del alcance simplificado; el original editable está en `SRS.md`.
2. Enlace al repositorio CoffeERP, indicando la rama `examen/simplificacion-segura`.
3. `Evidencias-CoffeERP.pdf`: capturas de la aplicación ejecutada con datos ficticios.
4. README principal y guías de frontend/backend dentro del repositorio.

## Estado de validación

- Compilación Angular de producción completada.
- 12 pruebas automáticas pasaron con Express y MariaDB reales.
- PayPal y Brevo se sustituyeron por respuestas controladas en esas pruebas: no hubo cobros ni correos externos.
- XML de muestra generado desde una venta local pagada en efectivo: `evidencias/factura-demo.xml`.
- La comprobación visual se describe en `evidencias/navegador.txt` y en el PDF de evidencias.

## Recorrido sugerido para presentar

1. Iniciar sesión como administrador y explicar JWT, hash de contraseñas y middleware.
2. Registrar un producto en Inventario y un proveedor en Compras.
3. Registrar la recepción/pago de una compra; comprobar existencias y egreso.
4. Hacer una venta en efectivo; comprobar descuento de stock e ingreso.
5. Descargar su factura XML; mostrar folio, cliente, productos, cantidades y total.
6. Registrar un empleado y un salario pagado; comprobar el egreso y rechazo de un segundo pago del mismo mes.
7. Entrar como cajero y mostrar que solo puede operar Ventas y sus propios pagos.
8. Si están configuradas las credenciales, demostrar PayPal Sandbox y recepción de factura por correo.

## Evidencias externas aún pendientes

Para completar la demostración de los servicios externos:

- Configurar Client ID y Secret Sandbox en el `.env` del backend.
- Usar una cuenta compradora Sandbox distinta del vendedor y ejecutar una venta.
- Capturar la venta PAGADA y la operación Sandbox COMPLETED, ocultando datos personales.
- Configurar clave API de Brevo y un remitente autorizado.
- Usar un correo propio como destinatario y guardar captura del mensaje recibido con su XML adjunto.
- Verificar que folio y total del adjunto coinciden con la venta.

No incluir claves, tokens, contraseñas ni datos de tarjetas en capturas. Las pruebas controladas demuestran el manejo de las respuestas de APIs, pero no sustituyen estas dos comprobaciones externas.

## Preparación local

Sigue el README principal. Crea una base nueva, completa `.env`, ejecuta `npm ci` en ambas carpetas, `npm run init-db` en el backend y arranca ambos servidores. No se distribuyen credenciales de demostración en el código ni un `.env` con secretos.

La contraseña de MySQL que estaba publicada en la versión anterior debe rotarse en Railway. No se modificó esa instalación ni se reescribió el historial Git.
