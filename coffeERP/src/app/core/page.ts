import { inject, signal } from '@angular/core';
import { ApiService } from './api.service';
// Estado común de operaciones: bloquea envíos dobles y presenta mensajes del servidor.
export class Page {
  api = inject(ApiService);
  busy = signal(false);
  message = signal('');
  error = signal(false);
  async run(work: () => Promise<unknown>, success = 'Cambios guardados') {
    if (this.busy()) return;
    this.busy.set(true);
    this.message.set('');
    this.error.set(false);
    try {
      await work();
      this.message.set(success);
    } catch (e: any) {
      this.error.set(true);
      this.message.set(e.error?.mensaje || e.message || 'No se pudo completar la operación');
    } finally {
      this.busy.set(false);
    }
  }
  money(cents: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
      cents / 100,
    );
  }
}
