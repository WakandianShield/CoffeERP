import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./transversal/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      { path: 'finanzas/cuentas', loadComponent: () => import('./finanzas/cuentas/cuentas.component').then(m => m.CuentasComponent) },
      { path: 'finanzas/polizas', loadComponent: () => import('./finanzas/polizas/polizas.component').then(m => m.PolizasComponent) },
      { path: 'finanzas/cuentas-cobrar-pagar', loadComponent: () => import('./finanzas/cuentas-cobrar-pagar/cuentas-cobrar-pagar.component').then(m => m.CuentasCobrarPagarComponent) },
      { path: 'finanzas/presupuestos', loadComponent: () => import('./finanzas/presupuestos/presupuestos.component').then(m => m.PresupuestosComponent) },
      { path: 'finanzas/estados-financieros', loadComponent: () => import('./finanzas/estados-financieros/estados-financieros.component').then(m => m.EstadosFinancierosComponent) },

      { path: 'compras/proveedores', loadComponent: () => import('./compras/proveedores/proveedores.component').then(m => m.ProveedoresComponent) },
      { path: 'compras/ordenes', loadComponent: () => import('./compras/ordenes/ordenes.component').then(m => m.OrdenesComponent) },

      { path: 'inventario/stock', loadComponent: () => import('./inventario/stock/stock.component').then(m => m.StockComponent) },
      { path: 'inventario/movimientos', loadComponent: () => import('./inventario/movimientos/movimientos.component').then(m => m.MovimientosComponent) },

      { path: 'ventas/productos', loadComponent: () => import('./ventas/productos/productos.component').then(m => m.ProductosVentasComponent) },
      { path: 'ventas/venta', loadComponent: () => import('./ventas/venta/venta.component').then(m => m.VentaComponent) },
      { path: 'ventas/pagos', loadComponent: () => import('./ventas/pagos/pagos.component').then(m => m.PagosComponent) },
      { path: 'ventas/pedidos', loadComponent: () => import('./ventas/pedidos/pedidos.component').then(m => m.PedidosComponent) },
      { path: 'ventas/notas-credito', loadComponent: () => import('./ventas/notas-credito/notas-credito.component').then(m => m.NotasCreditoComponent) },

      { path: 'rrhh/empleados', loadComponent: () => import('./rrhh/empleados/empleados.component').then(m => m.EmpleadosComponent) },
      { path: 'rrhh/asistencia', loadComponent: () => import('./rrhh/asistencia/asistencia.component').then(m => m.AsistenciaComponent) },
      { path: 'rrhh/nomina', loadComponent: () => import('./rrhh/nomina/nomina.component').then(m => m.NominaComponent) },
      { path: 'rrhh/permisos', loadComponent: () => import('./rrhh/permisos/permisos.component').then(m => m.PermisosComponent) },

      { path: 'ventas/reportes', loadComponent: () => import('./ventas/reportes/reportes.component').then(m => m.ReportesComponent) },

      { path: 'configuracion/roles', loadComponent: () => import('./transversal/roles/roles.component').then(m => m.RolesComponent) },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: 'login', loadComponent: () => import('./transversal/login/login.component').then(m => m.LoginComponent) },
  { path: '**', redirectTo: 'dashboard' }
];
