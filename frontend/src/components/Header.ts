import { api } from '../services/api';
import { toast } from '../services/toast';

export class Header {
  private container: HTMLElement;
  private onOpenNewTicket: () => void;
  private onOpenLogin: () => void;
  private onToggleMobileMenu: () => void;

  constructor(
    container: HTMLElement,
    options: {
      onOpenNewTicket: () => void;
      onOpenLogin: () => void;
      onToggleMobileMenu: () => void;
    }
  ) {
    this.container = container;
    this.onOpenNewTicket = options.onOpenNewTicket;
    this.onOpenLogin = options.onOpenLogin;
    this.onToggleMobileMenu = options.onToggleMobileMenu;
  }

  public render(): void {
    const user = api.getUser();
    const canCreate = !user || api.hasRole('ADMIN', 'AGENTE');

    this.container.className = 'h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs';

    this.container.innerHTML = `
      <!-- Left: Mobile menu button + user context -->
      <div class="flex items-center gap-3">
        <button id="mobile-menu-btn" class="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>

        ${user ? `
          <div class="hidden md:flex items-center gap-2 text-xs font-lato text-slate-600">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sesión activa:</span>
            <span class="font-montserrat font-bold text-slate-800">${user.nombre}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-montserrat bg-brand-primary-light text-brand-primary">${user.rol}</span>
          </div>
        ` : ''}
      </div>

      <!-- Right: Action CTA & User Profile -->
      <div class="flex items-center gap-3 ml-4">
        ${canCreate ? `
          <button 
            id="header-new-ticket-btn"
            class="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat text-xs font-semibold rounded-xl shadow-brand transition-all transform active:scale-95 duration-150"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
            <span>Nuevo caso</span>
          </button>
        ` : ''}

        <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>

        <!-- User profile dropdown / login trigger -->
        <div class="relative" id="user-menu-wrapper">
          ${user ? `
            <button id="user-profile-btn" class="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent1 text-white font-montserrat font-bold text-xs flex items-center justify-center shadow-xs">
                ${user.nombre.slice(0, 2).toUpperCase()}
              </div>
              <svg class="w-4 h-4 text-slate-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          ` : `
            <button id="header-login-btn" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-montserrat text-xs font-semibold rounded-xl transition-colors">
              Iniciar Sesión
            </button>
          `}

          <!-- Dropdown menu -->
          <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-modal border border-slate-100 py-2 z-50 animate-fade-in">
            ${user ? `
              <button id="open-profile-btn" class="w-full text-left px-4 py-2 text-xs font-lato text-slate-700 hover:bg-slate-50 flex items-center gap-2.5">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>Mi perfil</span>
              </button>
            ` : ''}
            <div class="border-t border-slate-100 pt-1">
              <button id="logout-btn" class="w-full text-left px-4 py-2 text-xs font-lato text-rose-600 hover:bg-rose-50 flex items-center gap-2.5">
                <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const newTicketBtn = this.container.querySelector('#header-new-ticket-btn');
    newTicketBtn?.addEventListener('click', () => this.onOpenNewTicket());

    const mobileMenuBtn = this.container.querySelector('#mobile-menu-btn');
    mobileMenuBtn?.addEventListener('click', () => this.onToggleMobileMenu());

    const loginBtn = this.container.querySelector('#header-login-btn');
    loginBtn?.addEventListener('click', () => this.onOpenLogin());

    const userProfileBtn = this.container.querySelector('#user-profile-btn');
    const userDropdown = this.container.querySelector('#user-dropdown');

    userProfileBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!userDropdown?.contains(e.target as Node) && !userProfileBtn?.contains(e.target as Node)) {
        userDropdown?.classList.add('hidden');
      }
    });

    const openProfileBtn = this.container.querySelector('#open-profile-btn');
    openProfileBtn?.addEventListener('click', () => {
      userDropdown?.classList.add('hidden');
      this.openProfileModal();
    });

    const logoutBtn = this.container.querySelector('#logout-btn');
    logoutBtn?.addEventListener('click', () => {
      api.clearAuth();
      window.location.href = '/login';
    });
  }

  private openProfileModal(): void {
    const user = api.getUser();
    if (!user) return;

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full shadow-modal border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 bg-brand-dark text-white flex items-center justify-between">
          <h3 class="text-sm font-montserrat font-bold">Mi Perfil</h3>
          <button id="close-profile-modal" class="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form id="profile-form" class="p-6 space-y-4 text-xs font-lato">
          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Nombre completo *</label>
            <input type="text" name="nombre" value="${user.nombre || ''}" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
          </div>
          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Correo electrónico *</label>
            <input type="email" name="email" value="${user.email || ''}" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
          </div>
          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Teléfono</label>
            <input type="text" name="telefono" value="${user.telefono || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
          </div>
          <div>
            <label class="block font-montserrat font-semibold text-slate-700 mb-1">Especialidad</label>
            <input type="text" name="especialidad" value="${user.especialidad || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
          </div>
          <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" id="cancel-profile-modal" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-montserrat font-semibold rounded-xl">Cancelar</button>
            <button type="submit" class="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat font-bold rounded-xl shadow-brand">Guardar cambios</button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => modal.remove();
    modal.querySelector('#close-profile-modal')?.addEventListener('click', closeModal);
    modal.querySelector('#cancel-profile-modal')?.addEventListener('click', closeModal);

    const form = modal.querySelector('#profile-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      try {
        const data: any = {};
        formData.forEach((value, key) => { data[key] = value; });
        await api.updateUser(user.id, data);
        toast.success('Perfil actualizado correctamente.');
        closeModal();
        this.render();
      } catch (err: any) {
        toast.error(err.message || 'Error al actualizar el perfil.');
      }
    });

    modalContainer.appendChild(modal);
  }
}
