import { api } from '../services/api';

export class Sidebar {
  private container: HTMLElement;
  private currentRoute: string = 'dashboard';
  private isCollapsed: boolean = false;
  private onNavigate: (route: string) => void;

  constructor(container: HTMLElement, onNavigate: (route: string) => void) {
    this.container = container;
    this.onNavigate = onNavigate;
    this.isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  }

  public setRoute(route: string): void {
    this.currentRoute = route;
    this.render();
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebar_collapsed', String(this.isCollapsed));
    this.render();
    window.dispatchEvent(new CustomEvent('sidebar-toggled', { detail: { collapsed: this.isCollapsed } }));
  }

  public render(): void {
    const user = api.getUser();
    const isAdmin = api.hasRole('ADMIN');
    const isAgent = api.hasRole('AGENTE');
    const isConsulta = api.hasRole('CONSULTA');

    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: this.getDashboardIcon() },
      { id: 'tickets', label: 'Casos', icon: this.getTicketsIcon() },
      { id: 'clients', label: 'Clientes', icon: this.getClientsIcon(), adminOrAgent: true },
      { id: 'platforms', label: 'Plataformas', icon: this.getPlatformsIcon(), adminOrAgent: true },
      { id: 'agents', label: 'Agentes', icon: this.getAgentsIcon(), adminOrAgent: true },
      { id: 'reports', label: 'Reportes', icon: this.getReportsIcon(), adminOrAgentOrConsulta: true },
      { id: 'settings', label: 'Configuración', icon: this.getSettingsIcon(), adminOnly: true }
    ];

    const allowedItems = navItems.filter((item) => {
      if (item.adminOnly) return isAdmin;
      if (item.adminOrAgent) return isAdmin || isAgent;
      if (item.adminOrAgentOrConsulta) return isAdmin || isAgent || isConsulta;
      return true;
    });

    this.container.className = `fixed inset-y-0 left-0 z-30 flex flex-col bg-brand-dark text-slate-200 transition-all duration-300 shadow-xl lg:static lg:translate-x-0 ${
      this.isCollapsed ? 'w-20' : 'w-64'
    }`;

    this.container.innerHTML = `
      <!-- Sidebar Header & Logo -->
      <div class="h-16 flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'justify-between px-5'} border-b border-white/10 bg-brand-dark/95">
        <div class="flex items-center gap-3 overflow-hidden cursor-pointer" id="sidebar-logo">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-cyan flex items-center justify-center text-white shadow-brand flex-shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 12 2 2 4-4"></path>
            </svg>
          </div>
          ${
            !this.isCollapsed
              ? `<div class="flex flex-col min-w-0">
                  <span class="font-montserrat font-bold text-base text-white tracking-tight truncate leading-tight">Huella de soporte</span>
                  <span class="text-[11px] font-lato text-brand-cyan tracking-wider uppercase font-semibold">Registro de casos</span>
                </div>`
              : ''
          }
        </div>
        ${
          !this.isCollapsed
            ? `<button id="sidebar-collapse-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Contraer menú">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
              </button>`
            : ''
        }
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 py-4 px-3 overflow-y-auto space-y-1.5">
        ${allowedItems
          .map((item) => {
            const isActive = this.currentRoute === item.id;
            return `
            <button 
              data-nav="${item.id}"
              class="w-full flex items-center ${this.isCollapsed ? 'justify-center px-0' : 'justify-start px-3.5'} py-3 rounded-xl font-montserrat text-sm font-medium transition-all duration-200 group relative ${
              isActive
                ? 'bg-brand-primary text-white shadow-brand font-semibold'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }"
              title="${this.isCollapsed ? item.label : ''}"
            >
              <div class="flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-cyan'} transition-colors">
                ${item.icon}
              </div>
              ${
                !this.isCollapsed
                  ? `<span class="ml-3.5 truncate tracking-wide">${item.label}</span>`
                  : ''
              }
              ${
                isActive && !this.isCollapsed
                  ? `<div class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-cyan"></div>`
                  : ''
              }
            </button>
          `;
          })
          .join('')}
      </div>

      <!-- Footer & Collapse button (when collapsed) -->
      <div class="p-3 border-t border-white/10 bg-brand-dark/80">
        ${
          this.isCollapsed
            ? `<button id="sidebar-expand-btn" class="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Expandir menú">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
              </button>`
            : `<div class="flex items-center justify-between px-2 py-1.5 text-xs text-slate-400">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="font-lato">v1.0 • En línea</span>
                </div>
                <span class="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-brand-cyan">SLA 99.8%</span>
              </div>`
        }
      </div>
    `;

    // Event listeners
    this.container.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const route = btn.getAttribute('data-nav');
        if (route) this.onNavigate(route);
      });
    });

    const collapseBtn = this.container.querySelector('#sidebar-collapse-btn');
    collapseBtn?.addEventListener('click', () => this.toggleCollapse());

    const expandBtn = this.container.querySelector('#sidebar-expand-btn');
    expandBtn?.addEventListener('click', () => this.toggleCollapse());

    const logo = this.container.querySelector('#sidebar-logo');
    logo?.addEventListener('click', () => this.onNavigate('dashboard'));
  }

  private getDashboardIcon() {
    return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>`;
  }

  private getTicketsIcon() {
    return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>`;
  }

  private getClientsIcon() {
    return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`;
  }

  private getPlatformsIcon() {
    return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>`;
  }

  private getAgentsIcon() {
    return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`;
  }

  private getReportsIcon() {
    return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>`;
  }

  private getSettingsIcon() {
    return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
  }
}
