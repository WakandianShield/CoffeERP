import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Empleado, Asistencia } from '../../shared/models';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './asistencia.component.html',
  styleUrl: './asistencia.component.css'
})
export class AsistenciaComponent implements OnInit {
  empleados = signal<Empleado[]>([]);

  asistencias = signal<Asistencia[]>([]);

  selectedEmpleadoId = signal<number | null>(null);
  calendarMonth = signal<number>(new Date().getMonth());
  calendarYear = signal<number>(new Date().getFullYear());

  activeEmpleados = computed(() => this.empleados().filter(e => e.activo));

  selectedEmpleado = computed(() => {
    const id = this.selectedEmpleadoId();
    if (!id) return null;
    return this.empleados().find(e => e.id === id) ?? null;
  });

  calendarDays = computed(() => {
    const empId = this.selectedEmpleadoId();
    const month = this.calendarMonth();
    const year = this.calendarYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const days: { date: Date; dayNum: number; isCurrentMonth: boolean; isToday: boolean; asistencia: Asistencia | null; isFuture: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startDayOfWeek; i++) {
      const d = new Date(year, month, -(startDayOfWeek - i - 1));
      days.push({ date: d, dayNum: d.getDate(), isCurrentMonth: false, isToday: false, asistencia: null, isFuture: d > today });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);
      const isToday = d.getTime() === today.getTime();
      const isFuture = d > today;
      const asistencia = this.getAsistenciaForDate(d);
      days.push({ date: d, dayNum: i, isCurrentMonth: true, isToday, asistencia, isFuture });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, dayNum: i, isCurrentMonth: false, isToday: false, asistencia: null, isFuture: true });
    }

    return days;
  });

  monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  calendarHeader = computed(() => `${this.monthNames[this.calendarMonth()]} ${this.calendarYear()}`);

  todayAsistencia = computed(() => {
    const emp = this.selectedEmpleado();
    if (!emp) return null;
    return this.getAsistenciaForDate(new Date());
  });

  hasCheckedIn = computed(() => {
    const a = this.todayAsistencia();
    return a && a.horaEntrada !== '';
  });

  hasCheckedOut = computed(() => {
    const a = this.todayAsistencia();
    return a && a.horaSalida !== '';
  });

  onEmpleadoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedEmpleadoId.set(value ? Number(value) : null);
  }

  ngOnInit(): void {
    const first = this.activeEmpleados()[0];
    if (first) {
      this.selectedEmpleadoId.set(first.id);
    }
  }

  getAsistenciaForDate(date: Date): Asistencia | null {
    const emp = this.selectedEmpleado();
    if (!emp) return null;
    return this.asistencias().find(a =>
      a.empleadoId === emp.id &&
      a.fecha.getFullYear() === date.getFullYear() &&
      a.fecha.getMonth() === date.getMonth() &&
      a.fecha.getDate() === date.getDate()
    ) ?? null;
  }

  parseSchedule(horarioLaboral: string): { startHour: number; startMin: number; endHour: number; endMin: number } {
    const parts = horarioLaboral.split('-');
    const [startH, startM] = parts[0].split(':').map(Number);
    const [endH, endM] = parts[1].split(':').map(Number);
    return { startHour: startH, startMin: startM, endHour: endH, endMin: endM };
  }

  formatTime(date: Date): string {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  registrarEntrada(): void {
    const emp = this.selectedEmpleado();
    if (!emp) return;

    const now = new Date();
    const schedule = this.parseSchedule(emp.horarioLaboral);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = schedule.startHour * 60 + schedule.startMin;

    let minutosRetardo = 0;
    let estatus: 'presente' | 'retardo' = 'presente';

    if (currentMinutes > startMinutes) {
      minutosRetardo = currentMinutes - startMinutes;
      estatus = 'retardo';
    }

    const existing = this.getAsistenciaForDate(now);
    const timeStr = this.formatTime(now);

    if (existing) {
      this.asistencias.update(list =>
        list.map(a => a.id === existing.id ? { ...a, horaEntrada: timeStr, minutosRetardo, estatus } : a)
      );
    } else {
      const maxId = Math.max(...this.asistencias().map(a => a.id), 0);
      this.asistencias.update(list => [...list, {
        id: maxId + 1,
        empleadoId: emp.id,
        empleadoNombre: emp.nombreCompleto,
        fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        horaEntrada: timeStr,
        horaSalida: '',
        minutosRetardo,
        minutosSalidaAnticipada: 0,
        estatus
      }]);
    }
  }

  registrarSalida(): void {
    const emp = this.selectedEmpleado();
    if (!emp) return;

    const now = new Date();
    const schedule = this.parseSchedule(emp.horarioLaboral);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = schedule.endHour * 60 + schedule.endMin;

    let minutosSalidaAnticipada = 0;
    if (currentMinutes < endMinutes) {
      minutosSalidaAnticipada = endMinutes - currentMinutes;
    }

    const existing = this.getAsistenciaForDate(now);
    if (!existing) return;

    const timeStr = this.formatTime(now);
    this.asistencias.update(list =>
      list.map(a => a.id === existing.id ? { ...a, horaSalida: timeStr, minutosSalidaAnticipada } : a)
    );
  }

  prevMonth(): void {
    if (this.calendarMonth() === 0) {
      this.calendarMonth.set(11);
      this.calendarYear.update(y => y - 1);
    } else {
      this.calendarMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.calendarMonth() === 11) {
      this.calendarMonth.set(0);
      this.calendarYear.update(y => y + 1);
    } else {
      this.calendarMonth.update(m => m + 1);
    }
  }

  getStatusClass(asistencia: Asistencia | null, isFuture: boolean): string {
    if (isFuture || !asistencia) return 'sin-registro';
    return asistencia.estatus;
  }

  getStatusLabel(asistencia: Asistencia | null, isFuture: boolean): string {
    if (isFuture) return '';
    if (!asistencia) return 'Sin registro';
    if (asistencia.estatus === 'retardo') return `Retardo ${this.formatMinutes(asistencia.minutosRetardo)}`;
    if (asistencia.estatus === 'presente') {
      if (asistencia.minutosSalidaAnticipada > 0) return `Presente (salida ${this.formatMinutes(asistencia.minutosSalidaAnticipada)} antes)`;
      return 'Presente';
    }
    if (asistencia.estatus === 'falta') return 'Falta';
    if (asistencia.estatus === 'permiso') return 'Permiso';
    return '';
  }

  formatMinutes(min: number): string {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (m === 0) return `${h} hora${h > 1 ? 's' : ''}`;
    return `${h} hora${h > 1 ? 's' : ''} ${m} min`;
  }
}
