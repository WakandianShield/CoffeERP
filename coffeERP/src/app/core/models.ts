// Contratos HTTP compartidos por formularios y servicios; dinero siempre en centavos.
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'CAJERO';
}
export interface Product {
  id: number;
  name: string;
  price_cents: number;
  stock: number;
  reserved: number;
  minimum: number;
  active: boolean;
}
export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
}
export interface Employee {
  id: number;
  name: string;
  position: string;
  email: string;
  salary_cents: number;
  active: boolean;
}
export interface Sale {
  id: string;
  customer: string;
  email: string;
  total_cents: number;
  method: string;
  status: string;
  email_status: string;
  created_at: string;
}
export interface Entry {
  id: number;
  kind: string;
  concept: string;
  amount_cents: number;
  created_at: string;
}
export interface CartItem {
  id: number;
  cantidad: number;
}
export interface Purchase {
  id: number;
  supplier: string;
  total_cents: number;
  created_at: string;
}
export interface Movement {
  id: number;
  name: string;
  quantity: number;
  reason: string;
  created_at: string;
}
export interface Payroll {
  id: number;
  name: string;
  period: string;
  amount_cents: number;
}
