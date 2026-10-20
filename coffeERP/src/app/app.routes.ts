import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/security';
import { Shell } from './shell';
// Cinco pantallas de trabajo, sin dashboards ni menús secundarios duplicados.
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login').then((m) => m.Login) },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'ventas', loadComponent: () => import('./pages/sales').then((m) => m.Sales) },
      {
        path: 'inventario',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/inventory').then((m) => m.Inventory),
      },
      {
        path: 'compras',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/purchases').then((m) => m.Purchases),
      },
      {
        path: 'rrhh',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/employees').then((m) => m.Employees),
      },
      {
        path: 'finanzas',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/finance').then((m) => m.Finance),
      },
      { path: '', redirectTo: 'ventas', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'ventas' },
];
