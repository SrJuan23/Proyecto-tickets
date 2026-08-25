import { api } from '../services/api';

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
              <div class="hidden md:flex flex-col text-left">
                <span class="text-xs font-montserrat font-bold text-slate-800 leading-tight">${user.nombre}</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-brand-primary">${user.rol}</span>
                  <span class="w-1 h-1 rounded-full bg-emerald-500"></span>
                </div>
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
            <div class="px-4 py-2.5 border-b border-slate-100">
              <p class="text-xs font-montserrat font-bold text-slate-800">${user?.nombre || ''}</p>
              <p class="text-[11px] font-lato text-slate-500 truncate">${user?.email || ''}</p>
              <div class="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-montserrat bg-brand-primary-light text-brand-primary">
                Rol: ${user?.rol || 'INVITADO'}
              </div>
            </div>
            <div class="py-1">
              <button id="switch-user-btn" class="w-full text-left px-4 py-2 text-xs font-lato text-slate-700 hover:bg-slate-50 flex items-center gap-2.5">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                <span>Cambiar de usuario / Demo</span>
              </button>
            </div>
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

    const switchUserBtn = this.container.querySelector('#switch-user-btn');
    switchUserBtn?.addEventListener('click', () => {
      userDropdown?.classList.add('hidden');
      api.clearAuth();
      window.location.href = '/login';
    });

    const logoutBtn = this.container.querySelector('#logout-btn');
    logoutBtn?.addEventListener('click', () => {
      api.clearAuth();
      window.location.href = '/login';
    });
  }
}
