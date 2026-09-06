import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotaCredito } from '../../shared/models';

@Component({
  selector: 'app-notas-credito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notas-credito.component.html',
  styleUrl: './notas-credito.component.css'
})
export class NotasCreditoComponent {
  notasCredito = signal<NotaCredito[]>([]);

  searchQuery = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(5);

  filteredNotas = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.notasCredito();
    return this.notasCredito().filter(
      n => n.clienteNombre.toLowerCase().includes(query) || n.motivo.toLowerCase().includes(query)
    );
  });

  totalMonto = computed(() => this.filteredNotas().reduce((sum, n) => sum + n.monto, 0));

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredNotas().length / this.itemsPerPage())));

  paginatedNotas = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredNotas().slice(start, start + this.itemsPerPage());
  });

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  }
}
