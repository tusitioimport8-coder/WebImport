
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth';

import {
  ApiUser,
  UpdateUserPayload,
  UserService
} from '../../services/user.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Admin implements OnInit {
  private readonly userService = inject(UserService);
  readonly authService = inject(AuthService);

isCurrentUser(user: ApiUser): boolean {
  return this.authService.user()?.id === user.id;
}

  readonly users = signal<ApiUser[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly searchTerm = signal('');

  readonly editingUser = signal<ApiUser | null>(null);

  readonly filteredUsers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) return this.users();

    return this.users().filter(user =>
      user.nombre_completo.toLowerCase().includes(search) ||
      user.correo.toLowerCase().includes(search) ||
      user.rol.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.userService.getAllUsers().subscribe({
      next: response => {
        this.users.set(response.data ?? []);
        this.loading.set(false);
      },
      error: error => {
        console.error('Error al cargar usuarios:', error);
        this.errorMessage.set(
          'No se pudieron cargar los usuarios.'
        );
        this.loading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  editUser(user: ApiUser): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.editingUser.set({ ...user });
  }

  closeEditor(): void {
    this.editingUser.set(null);
  }

  updateEditingField(
    field: 'nombre_completo' | 'correo' | 'telefono',
    value: string
  ): void {
    this.editingUser.update(user =>
      user ? { ...user, [field]: value } : null
    );
  }

  saveUser(): void {
    const user = this.editingUser();

    if (!user || this.saving()) return;

    const payload: UpdateUserPayload = {
      nombre_completo: user.nombre_completo,
      correo: user.correo,
      telefono: user.telefono
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    this.userService.updateUser(user.id, payload).subscribe({
      next: () => {
        this.successMessage.set('Usuario actualizado correctamente.');
        this.editingUser.set(null);
        this.saving.set(false);
        this.loadUsers();
      },
      error: error => {
        console.error('Error al actualizar usuario:', error);
        this.errorMessage.set('No se pudo actualizar el usuario.');
        this.saving.set(false);
      }
    });
  }

 deleteUser(user: ApiUser): void {
  if (this.isCurrentUser(user)) {
    this.errorMessage.set('No puedes eliminar tu propia cuenta.');
    return;
  }

  const confirmed = window.confirm(
    `¿Eliminar al usuario "${user.nombre_completo}"?`
  );

    if (!confirmed) return;

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage.set('Usuario eliminado correctamente.');
        this.loadUsers();
      },
      error: error => {
        console.error('Error al eliminar usuario:', error);
        this.errorMessage.set('No se pudo eliminar el usuario.');
      }
    });
  }
}
