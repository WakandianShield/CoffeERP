// ESTE COMPONENTE MUESTRA Y ADMINISTRA LOS EMPLEADOS.
import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Empleado, User } from '../../shared/models';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent {
  empleados = signal<Empleado[]>([]);

  usuarios = signal<User[]>([]);

  availableRoles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Gerente' },
    { id: 3, name: 'Cajero' },
    { id: 4, name: 'Barista' },
    { id: 5, name: 'Almacén' }
  ];

  searchTerm = signal('');
  filterDepartamento = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(5);
  showModal = signal(false);
  showDetailModal = signal(false);
  showUserModal = signal(false);
  editingId = signal<number | null>(null);
  editingUserId = signal<number | null>(null);
  selectedEmpleado = signal<Empleado | null>(null);

  formNombre = signal('');
  formRfc = signal('');
  formPuesto = signal('');
  formDepartamento = signal('Operaciones');
  formFechaIngreso = signal('');
  formTelefono = signal('');
  formCorreo = signal('');
  formSalario = signal(0);
  formHorarioLaboral = signal('08:00-16:00');
  formActivo = signal(true);

  userFormEmail = signal('');
  userFormPassword = signal('');
  userFormSelectedRoles = signal<number[]>([]);

  errors = signal<Record<string, string>>({});
  userErrors = signal<Record<string, string>>({});

  departamentos = ['Operaciones', 'Administración', 'Ventas', 'Almacén', 'Producción'];
  horarios = ['08:00-16:00', '09:00-17:00', '10:00-18:00', '06:00-14:00', '14:00-22:00'];

  filteredEmpleados = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const depto = this.filterDepartamento();
    return this.empleados().filter(e => {
      const matchSearch = e.nombreCompleto.toLowerCase().includes(term) ||
        e.puesto.toLowerCase().includes(term) ||
        e.correo.toLowerCase().includes(term) ||
        e.rfc.toLowerCase().includes(term);
      const matchDepto = depto ? e.departamento === depto : true;
      return matchSearch && matchDepto;
    });
  });

  paginatedEmpleados = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredEmpleados().slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.filteredEmpleados().length / this.itemsPerPage()));

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onFilterDepto(value: string): void {
    this.filterDepartamento.set(value);
    this.currentPage.set(1);
  }

  openModal(id?: number): void {
    this.errors.set({});
    if (id) {
      const emp = this.empleados().find(e => e.id === id);
      if (emp) {
        this.editingId.set(id);
        this.formNombre.set(emp.nombreCompleto);
        this.formRfc.set(emp.rfc);
        this.formPuesto.set(emp.puesto);
        this.formDepartamento.set(emp.departamento);
        this.formFechaIngreso.set(emp.fechaIngreso.toISOString().split('T')[0]);
        this.formTelefono.set(emp.telefono);
        this.formCorreo.set(emp.correo);
        this.formSalario.set(emp.salario);
        this.formHorarioLaboral.set(emp.horarioLaboral);
        this.formActivo.set(emp.activo);
      }
    } else {
      this.editingId.set(null);
      this.formNombre.set('');
      this.formRfc.set('');
      this.formPuesto.set('');
      this.formDepartamento.set('Operaciones');
      this.formFechaIngreso.set('');
      this.formTelefono.set('');
      this.formCorreo.set('');
      this.formSalario.set(0);
      this.formHorarioLaboral.set('08:00-16:00');
      this.formActivo.set(true);
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.errors.set({});
  }

  openDetail(id: number): void {
    const emp = this.empleados().find(e => e.id === id);
    if (emp) {
      this.selectedEmpleado.set(emp);
      this.showDetailModal.set(true);
    }
  }

  closeDetail(): void {
    this.showDetailModal.set(false);
    this.selectedEmpleado.set(null);
  }

  openUserModal(empleadoId: number): void {
    const emp = this.empleados().find(e => e.id === empleadoId);
    if (!emp) return;
    this.userErrors.set({});
    const existingUser = this.usuarios().find(u => u.email === emp.correo);
    if (existingUser) {
      this.editingUserId.set(existingUser.id);
      this.userFormEmail.set(existingUser.email);
      this.userFormPassword.set('');
      this.userFormSelectedRoles.set(existingUser.roles.map(r => r.id));
    } else {
      this.editingUserId.set(null);
      this.userFormEmail.set(emp.correo);
      this.userFormPassword.set('');
      this.userFormSelectedRoles.set([]);
    }
    this.selectedEmpleado.set(emp);
    this.showUserModal.set(true);
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.selectedEmpleado.set(null);
    this.editingUserId.set(null);
    this.userErrors.set({});
  }

  toggleRole(roleId: number): void {
    this.userFormSelectedRoles.update(roles => {
      if (roles.includes(roleId)) {
        return roles.filter(r => r !== roleId);
      } else {
        return [...roles, roleId];
      }
    });
  }

  validate(): boolean {
    const errs: Record<string, string> = {};
    const today = new Date().toISOString().split('T')[0];

    if (!this.formNombre().trim()) errs['nombre'] = 'El nombre es requerido';
    if (!this.formRfc().trim()) errs['rfc'] = 'El RFC es requerido';
    else if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(this.formRfc())) errs['rfc'] = 'RFC con formato inválido';
    if (!this.formPuesto().trim()) errs['puesto'] = 'El puesto es requerido';
    if (!this.formFechaIngreso()) errs['fechaIngreso'] = 'La fecha de ingreso es requerida';
    else if (this.formFechaIngreso() > today) errs['fechaIngreso'] = 'No puede ser fecha futura';
    if (!this.formTelefono()) errs['telefono'] = 'El teléfono es requerido';
    else if (!/^\d{10}$/.test(this.formTelefono())) errs['telefono'] = 'Debe ser 10 dígitos exactos';
    if (!this.formCorreo()) errs['correo'] = 'El correo es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formCorreo())) errs['correo'] = 'Formato de correo inválido';
    if (this.formSalario() < 0) errs['salario'] = 'El salario no puede ser negativo';
    if (!this.formHorarioLaboral()) errs['horario'] = 'El horario es requerido';

    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  validateUser(): boolean {
    const errs: Record<string, string> = {};
    if (!this.userFormEmail().trim()) errs['email'] = 'El correo es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.userFormEmail())) errs['email'] = 'Formato de correo inválido';
    if (!this.userFormPassword()) errs['password'] = 'La contraseña es requerida';
    else if (this.userFormPassword().length < 6) errs['password'] = 'Mínimo 6 caracteres';
    if (this.userFormSelectedRoles().length === 0) errs['roles'] = 'Seleccione al menos un rol';
    this.userErrors.set(errs);
    return Object.keys(errs).length === 0;
  }

  save(): void {
    if (!this.validate()) return;

    const id = this.editingId();
    if (id) {
      this.empleados.update(list =>
        list.map(e => e.id === id ? {
          ...e,
          nombreCompleto: this.formNombre(),
          rfc: this.formRfc().toUpperCase(),
          puesto: this.formPuesto(),
          departamento: this.formDepartamento(),
          fechaIngreso: new Date(this.formFechaIngreso()),
          telefono: this.formTelefono(),
          correo: this.formCorreo(),
          salario: this.formSalario(),
          horarioLaboral: this.formHorarioLaboral(),
          activo: this.formActivo()
        } : e)
      );
    } else {
      const maxId = Math.max(...this.empleados().map(e => e.id), 0);
      this.empleados.update(list => [...list, {
        id: maxId + 1,
        nombreCompleto: this.formNombre(),
        rfc: this.formRfc().toUpperCase(),
        puesto: this.formPuesto(),
        departamento: this.formDepartamento(),
        fechaIngreso: new Date(this.formFechaIngreso()),
        telefono: this.formTelefono(),
        correo: this.formCorreo(),
        salario: this.formSalario(),
        horarioLaboral: this.formHorarioLaboral(),
        activo: this.formActivo()
      }]);
    }
    this.closeModal();
  }

  saveUser(): void {
    if (!this.validateUser()) return;
    const userId = this.editingUserId();
    const selectedRoles = this.userFormSelectedRoles().map(id => {
      const role = this.availableRoles.find(r => r.id === id);
      return { id: role!.id, name: role!.name, permissions: [] };
    });
    if (userId) {
      this.usuarios.update(list =>
        list.map(u => u.id === userId ? {
          ...u,
          email: this.userFormEmail(),
          password: this.userFormPassword() ? this.userFormPassword() : u.password,
          roles: selectedRoles
        } : u)
      );
    } else {
      const maxId = Math.max(...this.usuarios().map(u => u.id), 0);
      this.usuarios.update(list => [...list, {
        id: maxId + 1,
        email: this.userFormEmail(),
        password: this.userFormPassword(),
        roles: selectedRoles,
        createdAt: new Date(),
        active: true
      }]);
    }
    this.closeUserModal();
  }

  hasUserAccount(correo: string): boolean {
    return this.usuarios().some(u => u.email === correo);
  }

  toggleActivo(id: number): void {
    this.empleados.update(list =>
      list.map(e => e.id === id ? { ...e, activo: !e.activo } : e)
    );
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(v => v - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(v => v + 1);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
