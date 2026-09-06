import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role, Permission } from '../../shared/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent {
  roles = signal<Role[]>([]);

  modules = ['finanzas', 'compras', 'inventario', 'ventas', 'rrhh'];
  actions = ['crear', 'ver', 'editar', 'eliminar'];

  showModal = signal(false);
  editingRole = signal<Role | null>(null);
  roleName = signal('');
  permissionGrid = signal<Record<string, Record<string, boolean>>>({});

  moduleCounts = computed(() => {
    const counts: Record<number, number> = {};
    for (const role of this.roles()) {
      counts[role.id] = role.permissions.length;
    }
    return counts;
  });

  nextId = computed(() => {
    const roles = this.roles();
    return roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1;
  });

  openCreateModal() {
    this.editingRole.set(null);
    this.roleName.set('');
    const grid: Record<string, Record<string, boolean>> = {};
    for (const mod of this.modules) {
      grid[mod] = {};
      for (const action of this.actions) {
        grid[mod][action] = false;
      }
    }
    this.permissionGrid.set(grid);
    this.showModal.set(true);
  }

  openEditModal(role: Role) {
    this.editingRole.set(role);
    this.roleName.set(role.name);
    const grid: Record<string, Record<string, boolean>> = {};
    for (const mod of this.modules) {
      grid[mod] = {};
      for (const action of this.actions) {
        grid[mod][action] = role.permissions
          .find(p => p.module === mod)
          ?.actions.includes(action) ?? false;
      }
    }
    this.permissionGrid.set(grid);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  updateRoleName(event: Event) {
    this.roleName.set((event.target as HTMLInputElement).value);
  }

  togglePermission(mod: string, action: string) {
    const grid = { ...this.permissionGrid() };
    grid[mod] = { ...grid[mod] };
    grid[mod][action] = !grid[mod][action];
    this.permissionGrid.set(grid);
  }

  buildPermissions(): Permission[] {
    const grid = this.permissionGrid();
    const permissions: Permission[] = [];
    for (const mod of this.modules) {
      const actionsList = this.actions.filter(a => grid[mod][a]);
      if (actionsList.length > 0) {
        permissions.push({ module: mod, actions: actionsList });
      }
    }
    return permissions;
  }

  saveRole() {
    const name = this.roleName().trim();
    if (!name) return;

    const permissions = this.buildPermissions();
    const editing = this.editingRole();

    if (editing) {
      this.roles.update(roles =>
        roles.map(r =>
          r.id === editing.id ? { ...r, name, permissions } : r
        )
      );
    } else {
      const newRole: Role = {
        id: this.nextId(),
        name,
        permissions
      };
      this.roles.update(roles => [...roles, newRole]);
    }
    this.closeModal();
  }

  deleteRole(id: number) {
    this.roles.update(roles => roles.filter(r => r.id !== id));
  }
}
