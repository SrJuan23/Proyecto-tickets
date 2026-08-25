import { api } from '../services/api';
import { toast } from '../services/toast';
import { User } from '../types';

export class SettingsView {
  private container: HTMLElement;
  private users: User[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async render(): Promise<void> {
    const isAdmin = api.hasRole('ADMIN');

    this.container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12">
        <!-- Header -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
          <h1 class="text-2xl font-montserrat font-bold text-brand-dark tracking-tight">Configuración del Sistema</h1>
          <p class="text-xs font-lato text-slate-500 mt-1">Administración de usuarios y roles del sistema</p>
        </div>

        <!-- Section: User Management (Admin Only) -->
        ${isAdmin ? `
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-xl bg-brand-primary-light text-brand-primary font-montserrat font-bold flex items-center justify-center text-xs">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              </span>
              <h3 class="text-sm font-montserrat font-bold text-slate-800">Administración de Usuarios y Roles</h3>
            </div>

            <button id="new-user-btn" class="px-3.5 py-1.5 bg-brand-dark hover:bg-brand-dark-hover text-white text-xs font-montserrat font-semibold rounded-xl transition-colors">
              Nuevo Usuario
            </button>
          </div>

          <div class="overflow-x-auto" id="users-table-container">
            <div class="p-6 text-center text-slate-400 text-xs">Cargando usuarios...</div>
          </div>
        </div>
        ` : ''}

        <!-- Section: Roles Guide -->
        <div class="bg-gradient-to-r from-brand-dark to-[#131c44] text-white p-6 rounded-3xl shadow-xl space-y-4">
          <h3 class="font-montserrat font-bold text-sm tracking-tight text-brand-cyan">Matriz de Roles y Permisos</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-lato text-slate-300">
            <div class="bg-white/10 p-4 rounded-2xl border border-white/10">
              <span class="font-montserrat font-bold text-white block text-sm mb-1">Administrador (ADMIN)</span>
              <p class="leading-relaxed text-[11px]">Acceso total. Puede crear, editar y eliminar tickets, administrar clientes, plataformas, agentes, usuarios y ajustar configuraciones del sistema.</p>
            </div>
            <div class="bg-white/10 p-4 rounded-2xl border border-white/10">
              <span class="font-montserrat font-bold text-white block text-sm mb-1">Agente (AGENTE)</span>
              <p class="leading-relaxed text-[11px]">Operación diaria. Puede crear y editar tickets, cambiar estados, consultar clientes y exportar reportes de casos.</p>
            </div>
            <div class="bg-white/10 p-4 rounded-2xl border border-white/10">
              <span class="font-montserrat font-bold text-white block text-sm mb-1">Consulta (CONSULTA)</span>
              <p class="leading-relaxed text-[11px]">Solo lectura. Puede buscar, filtrar, consultar estadísticas del dashboard y descargar reportes sin modificar información.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.fetchData();
    this.bindEvents();
  }

  private async fetchData(): Promise<void> {
    try {
      if (api.hasRole('ADMIN')) {
        const uRes = await api.getUsers();
        if (uRes.data) {
          this.users = uRes.data;
          this.renderUsersTable();
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  private renderUsersTable(): void {
    const container = this.container.querySelector('#users-table-container');
    if (!container) return;

    container.innerHTML = `
      <table class="w-full text-left border-collapse text-xs font-lato">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200/80 text-[11px] font-montserrat font-bold text-slate-500 uppercase tracking-wider">
            <th class="py-3 px-4">Usuario</th>
            <th class="py-3 px-4">Correo</th>
            <th class="py-3 px-4">Rol</th>
            <th class="py-3 px-4">Estado</th>
            <th class="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${this.users
            .map(
              (u) => `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-3 px-4 font-montserrat font-bold text-slate-800">${u.nombre}</td>
              <td class="py-3 px-4 text-slate-600">${u.email}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-montserrat font-bold ${
                  u.rol === 'ADMIN' ? 'bg-indigo-100 text-brand-primary' : u.rol === 'AGENTE' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-700'
                }">
                  ${u.rol}
                </span>
              </td>
              <td class="py-3 px-4">
                <span class="text-[11px] font-semibold ${u.estado === 'ACTIVO' ? 'text-emerald-600' : 'text-slate-400'}">${u.estado}</span>
              </td>
              <td class="py-3 px-4 text-right">
                <button data-toggle-user="${u.id}" class="text-xs text-amber-600 hover:text-amber-800 font-semibold p-1 mr-2">
                  ${u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                </button>
                <button data-delete-user="${u.id}" class="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1">
                  Eliminar
                </button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('[data-toggle-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-toggle-user'));
        if (confirm('¿Cambiar estado de este usuario?')) {
          try {
            const res = await api.toggleUserStatus(id);
            toast.success(res.message || 'Estado del usuario actualizado.');
            this.fetchData();
          } catch (e: any) {
            toast.error(e.message || 'Error al cambiar estado del usuario.');
          }
        }
      });
    });

    container.querySelectorAll('[data-delete-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-delete-user'));
        if (confirm(`¿Eliminar usuario ID ${id}?`)) {
          try {
            await api.deleteUser(id);
            toast.success('Usuario eliminado.');
            this.fetchData();
          } catch (e: any) {
            toast.error(e.message || 'Error al eliminar usuario.');
          }
        }
      });
    });
  }

  private bindEvents(): void {
    this.container.querySelector('#new-user-btn')?.addEventListener('click', () => {
      this.openUserModal();
    });
  }

  private openUserModal(): void {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full shadow-modal border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 bg-brand-dark text-white flex items-center justify-between">
          <h3 class="text-sm font-montserrat font-bold">Crear Usuario del Sistema</h3>
          <button id="close-u-modal" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>

        <form id="user-form" class="p-6 space-y-4 text-xs font-lato">
          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre Completo *</label>
            <input type="text" name="nombre" required placeholder="Ej. Didier Santamaría" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
            <input type="email" name="email" required placeholder="usuario@supportdesk.com" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Contraseña Inicial *</label>
            <input type="password" name="password" required placeholder="••••••••" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
          </div>

          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Rol de Acceso *</label>
            <select name="rol" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold">
              <option value="AGENTE">AGENTE (Gestión de tickets)</option>
              <option value="ADMIN">ADMIN (Acceso total)</option>
              <option value="CONSULTA">CONSULTA (Solo lectura y reportes)</option>
            </select>
          </div>

          <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" id="cancel-u-modal" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-montserrat font-semibold rounded-xl">Cancelar</button>
            <button type="submit" class="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat font-bold rounded-xl shadow-brand">Crear Usuario</button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => modal.remove();
    modal.querySelector('#close-u-modal')?.addEventListener('click', closeModal);
    modal.querySelector('#cancel-u-modal')?.addEventListener('click', closeModal);

    const form = modal.querySelector('#user-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      try {
        await api.createUser({
          nombre: formData.get('nombre'),
          email: formData.get('email'),
          password: formData.get('password'),
          rol: formData.get('rol')
        });
        toast.success('Usuario creado correctamente.');
        closeModal();
        this.fetchData();
      } catch (err: any) {
        toast.error(err.message || 'Error al crear usuario.');
      }
    });

    modalContainer.appendChild(modal);
  }
}
