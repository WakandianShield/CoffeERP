import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  sidebarOpen = signal(false);
  currentUser = signal<User | null>(null);

  navGroups = signal([
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      items: [],
      expanded: signal(true)
    },
    {
      label: 'Finanzas',
      icon: 'account_balance',
      route: '',
      items: [
        { label: 'Cuentas Contables', route: '/finanzas/cuentas' },
        { label: 'Pólizas', route: '/finanzas/polizas' },
        { label: 'Cuentas por Cobrar/Pagar', route: '/finanzas/cuentas-cobrar-pagar' },
        { label: 'Presupuestos', route: '/finanzas/presupuestos' },
        { label: 'Estados Financieros', route: '/finanzas/estados-financieros' }
      ],
      expanded: signal(false)
    },
    {
      label: 'Compras',
      icon: 'shopping_cart',
      route: '',
      items: [
        { label: 'Proveedores', route: '/compras/proveedores' },
        { label: 'Órdenes de Compra', route: '/compras/ordenes' }
      ],
      expanded: signal(false)
    },
    {
      label: 'Inventario',
      icon: 'inventory_2',
      route: '',
      items: [
        { label: 'Stock', route: '/inventario/stock' },
        { label: 'Movimientos', route: '/inventario/movimientos' }
      ],
      expanded: signal(false)
    },
    {
      label: 'Ventas',
      icon: 'point_of_sale',
      route: '',
      items: [
        { label: 'Productos', route: '/ventas/productos' },
        { label: 'Venta', route: '/ventas/venta' },
        { label: 'Registro de Pagos', route: '/ventas/pagos' },
        { label: 'Pedidos', route: '/ventas/pedidos' },
        { label: 'Notas de Crédito', route: '/ventas/notas-credito' },
        { label: 'Reportes de Ventas', route: '/ventas/reportes' }
      ],
      expanded: signal(false)
    },
    {
      label: 'RRHH',
      icon: 'groups',
      route: '',
      items: [
        { label: 'Empleados', route: '/rrhh/empleados' },
        { label: 'Asistencia', route: '/rrhh/asistencia' },
        { label: 'Nómina', route: '/rrhh/nomina' },
        { label: 'Permisos/Vacaciones', route: '/rrhh/permisos' }
      ],
      expanded: signal(false)
    },
    {
      label: 'Configuración',
      icon: 'settings',
      route: '',
      items: [
        { label: 'Roles', route: '/configuracion/roles' }
      ],
      expanded: signal(false)
    }
  ]);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  toggleGroup(group: { items: unknown[]; expanded: { update: (fn: (v: boolean) => boolean) => void } }): void {
    if (group.items.length > 0) {
      group.expanded.update((v: boolean) => !v);
    }
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
