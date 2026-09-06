export interface User {
  id: number;
  email: string;
  password?: string;
  roles: Role[];
  createdAt: Date;
  active: boolean;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  module: string;
  actions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  user: User;
}

export interface CuentaContable {
  id: number;
  nombre: string;
  tipo: string;
  saldo: number;
  activa: boolean;
}

export interface PolizaContable {
  id: number;
  fecha: Date;
  tipo: string;
  origen: string;
  detalle: DetallePoliza[];
  totalCargos: number;
  totalAbonos: number;
  estatus: string;
}

export interface DetallePoliza {
  cuentaId: number;
  cuentaNombre: string;
  cargo: number;
  abono: number;
}

export interface CuentaCobrarPagar {
  id: number;
  tipo: 'cobrar' | 'pagar';
  clienteProveedor: string;
  monto: number;
  saldoPendiente: number;
  fechaVencimiento: Date;
  estatus: 'pendiente' | 'pagada' | 'vencida';
}

export interface Presupuesto {
  id: number;
  area: string;
  montoAsignado: number;
  montoEjercido: number;
  periodo: string;
}

export interface EstadoFinanciero {
  tipo: string;
  fechaInicio: Date;
  fechaFin: Date;
  datos: any;
}

export interface Impuesto {
  id: number;
  tipo: string;
  tasa: number;
  base: number;
  monto: number;
}

export interface ProductoProveedor {
  nombre: string;
  unidad: string;
  cantidad: number;
  precio: number;
}

export interface Proveedor {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  rfc: string;
  activo: boolean;
  productos: ProductoProveedor[];
}

export interface RequisicionCompra {
  id: number;
  fecha: Date;
  solicitante: string;
  estatus: 'pendiente' | 'aprobada' | 'rechazada';
  detalle: DetalleRequisicion[];
}

export interface DetalleRequisicion {
  producto: string;
  cantidad: number;
  costoEstimado: number;
}

export interface CotizacionCompra {
  id: number;
  proveedorId: number;
  proveedorNombre: string;
  fecha: Date;
  detalle: DetalleCotizacionCompra[];
  total: number;
}

export interface DetalleCotizacionCompra {
  producto: string;
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenCompra {
  id: number;
  proveedorId: number;
  proveedorNombre: string;
  solicitante: string;
  autorizador: string;
  fecha: Date;
  estatus: 'pendiente' | 'parcial' | 'recibida' | 'cancelada';
  detalle: DetalleOrdenCompra[];
}

export interface DetalleOrdenCompra {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  cantidadRecibida: number;
}

export interface RecepcionMercancia {
  id: number;
  ordenCompraId: number;
  fecha: Date;
  detalle: DetalleRecepcion[];
}

export interface DetalleRecepcion {
  producto: string;
  cantidadRecibida: number;
}

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  stockMinimo: number;
  stockMaximo: number;
  puntoReorden: number;
  existencia: number;
}

export interface MovimientoInventario {
  id: number;
  productoId: number;
  productoNombre: string;
  almacen: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: Date;
}

export interface AuditoriaInventario {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidadSistema: number;
  cantidadFisica: number;
  diferencia: number;
  fecha: Date;
}

export interface IngredienteProducto {
  productoInventarioId: number;
  productoInventarioNombre: string;
  cantidadUsada: number;
  unidadUsada: string;
}

export interface ProductoVenta {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  activo: boolean;
  ingredientes: IngredienteProducto[];
}

export interface Venta {
  id: number;
  orderId: number;
  clienteNombre: string;
  productoVentaId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  fecha: Date;
  estatus: 'pagada' | 'entregada' | 'devuelta';
}

export interface NotaCredito {
  id: number;
  orderId: number;
  clienteNombre: string;
  productoNombre: string;
  monto: number;
  motivo: string;
  fecha: Date;
}

export interface Empleado {
  id: number;
  nombreCompleto: string;
  rfc: string;
  puesto: string;
  fechaIngreso: Date;
  telefono: string;
  correo: string;
  activo: boolean;
  departamento: string;
  salario: number;
  horarioLaboral: string;
}

export interface Asistencia {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  fecha: Date;
  horaEntrada: string;
  horaSalida: string;
  minutosRetardo: number;
  minutosSalidaAnticipada: number;
  estatus: 'presente' | 'falta' | 'permiso' | 'retardo';
}

export interface Nomina {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  periodo: string;
  percepciones: number;
  deducciones: number;
  netoPagar: number;
  fechaGeneracion: Date;
}

export interface Vacante {
  id: number;
  puesto: string;
  estatus: 'abierta' | 'cerrada' | 'en_proceso';
  candidatos: Candidato[];
}

export interface Candidato {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  vacanteId: number;
  estatus: 'nuevo' | 'en_revision' | 'entrevista' | 'seleccionado' | 'rechazado';
}

export interface EvaluacionDesempeno {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  fecha: Date;
  calificacion: number;
  observaciones: string;
}

export interface PermisoVacacion {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  tipo: 'vacacion' | 'incapacidad' | 'permiso';
  fechaInicio: Date;
  fechaFin: Date;
  estatus: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface DashboardStats {
  ventasTotales: number;
  comprasTotales: number;
  empleadosActivos: number;
  productosBajoStock: number;
  cuentasPorCobrar: number;
  cuentasPorPagar: number;
}
