import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Permiso {
  id: number;
  empleado: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  estatus: string;
}

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './permisos.component.html',
  styleUrl: './permisos.component.css'
})
export class PermisosComponent {
  permisos = signal<Permiso[]>([]);

  empleados = signal<string[]>([]);

  showModal = signal(false);
  activeTab = signal<'solicitudes' | 'calendario'>('solicitudes');
  editingId = signal<number | null>(null);

  formEmpleado = signal('');
  formTipo = signal('vacacion');
  formFechaInicio = signal('');
  formFechaFin = signal('');

  errors = signal<Record<string, string>>({});

  permisosPendientes = computed(() => this.permisos().filter(p => p.estatus === 'pendiente').length);
  permisosAprobados = computed(() => this.permisos().filter(p => p.estatus === 'aprobado').length);
  permisosRechazados = computed(() => this.permisos().filter(p => p.estatus === 'rechazado').length);

  diasCalculados = computed(() => {
    const inicio = this.formFechaInicio();
    const fin = this.formFechaFin();
    if (!inicio || !fin) return 0;
    const start = new Date(inicio);
    const end = new Date(fin);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  });

  setTab(tab: 'solicitudes' | 'calendario'): void {
    this.activeTab.set(tab);
  }

  openModal(id?: number): void {
    this.errors.set({});
    if (id) {
      const perm = this.permisos().find(p => p.id === id);
      if (perm) {
        this.editingId.set(id);
        this.formEmpleado.set(perm.empleado);
        this.formTipo.set(perm.tipo);
        this.formFechaInicio.set(perm.fechaInicio);
        this.formFechaFin.set(perm.fechaFin);
      }
    } else {
      this.editingId.set(null);
      this.formEmpleado.set(this.empleados()[0]);
      this.formTipo.set('vacacion');
      this.formFechaInicio.set('');
      this.formFechaFin.set('');
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.errors.set({});
  }

  validate(): boolean {
    const errs: Record<string, string> = {};
    if (!this.formFechaInicio()) errs['fechaInicio'] = 'La fecha de inicio es requerida';
    if (!this.formFechaFin()) errs['fechaFin'] = 'La fecha de fin es requerida';
    if (this.formFechaInicio() && this.formFechaFin()) {
      if (this.formFechaFin() < this.formFechaInicio()) {
        errs['fechaFin'] = 'La fecha de fin debe ser igual o posterior a la de inicio';
      }
    }
    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  save(): void {
    if (!this.validate()) return;

    const dias = this.diasCalculados();
    const id = this.editingId();
    if (id) {
      this.permisos.update(list =>
        list.map(p => p.id === id ? {
          ...p,
          empleado: this.formEmpleado(),
          tipo: this.formTipo(),
          fechaInicio: this.formFechaInicio(),
          fechaFin: this.formFechaFin(),
          dias
        } : p)
      );
    } else {
      const maxId = Math.max(...this.permisos().map(p => p.id), 0);
      this.permisos.update(list => [...list, {
        id: maxId + 1,
        empleado: this.formEmpleado(),
        tipo: this.formTipo(),
        fechaInicio: this.formFechaInicio(),
        fechaFin: this.formFechaFin(),
        dias,
        estatus: 'pendiente'
      }]);
    }
    this.closeModal();
  }

  aprobar(id: number): void {
    this.permisos.update(list =>
      list.map(p => p.id === id ? { ...p, estatus: 'aprobado' } : p)
    );
  }

  rechazar(id: number): void {
    this.permisos.update(list =>
      list.map(p => p.id === id ? { ...p, estatus: 'rechazado' } : p)
    );
  }

  getCalendarDays(): number[] {
    const days: number[] = [];
    for (let i = 1; i <= 30; i++) days.push(i);
    return days;
  }

  getPermisoDays(tipo: string): string {
    if (tipo === 'vacacion') return 'calendar-tile vacation';
    if (tipo === 'incapacidad') return 'calendar-tile illness';
    return 'calendar-tile permiso';
  }

  isPermisoDay(day: number): boolean {
    return this.permisos().some(p => {
      const start = new Date(p.fechaInicio).getDate();
      const end = new Date(p.fechaFin).getDate();
      return day >= start && day <= end && p.estatus !== 'rechazado';
    });
  }

  getPermisoForDay(day: number): Permiso | undefined {
    return this.permisos().find(p => {
      const start = new Date(p.fechaInicio).getDate();
      const end = new Date(p.fechaFin).getDate();
      return day >= start && day <= end && p.estatus !== 'rechazado';
    });
  }
}
