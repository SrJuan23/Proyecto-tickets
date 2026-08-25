import './style.css';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TicketsView } from './components/TicketsView';
import { ClientsView } from './components/ClientsView';
import { PlatformsView } from './components/PlatformsView';
import { AgentsView } from './components/AgentsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TicketModal } from './components/TicketModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { LoginPage } from './components/LoginPage';
import { Ticket, Client, Platform, Agent } from './types';

class App {
  private currentRoute = 'dashboard';
  private sidebar!: Sidebar;
  private header!: Header;
  private appRoot: HTMLElement;
  private contentContainer!: HTMLElement;
  private mobileBackdrop!: HTMLElement;
  private loginPageContainer!: HTMLElement;

  private clientsCache: Client[] = [];
  private platformsCache: Platform[] = [];
  private agentsCache: Agent[] = [];

  constructor() {
    this.appRoot = document.getElementById('app') as HTMLElement;
    this.loginPageContainer = document.getElementById('login-page') as HTMLElement;
    const savedRoute = localStorage.getItem('current_route');
    if (savedRoute) {
      this.currentRoute = savedRoute;
    }
    this.init();
  }

  private async init(): Promise<void> {
    const user = api.getUser();

    if (!user) {
      this.showLoginPage();
      return;
    }

    if (window.location.pathname === '/login') {
      window.history.replaceState(null, '', '/');
    }

    this.showApp();
    this.renderLayout();
    this.bindGlobalEvents();
    await this.preloadAuxiliaryData();
    this.navigate(this.currentRoute);
  }

  private showLoginPage(): void {
    const loginEl = document.getElementById('login-page');
    const appEl = document.getElementById('app');
    if (loginEl) loginEl.classList.remove('hidden');
    if (appEl) appEl.classList.add('hidden');
    const loginPage = new LoginPage(loginEl || document.body);
    loginPage.render();
  }

  private showApp(): void {
    const loginEl = document.getElementById('login-page');
    if (loginEl) loginEl.classList.add('hidden');
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('hidden');
  }

  private async preloadAuxiliaryData(): Promise<void> {
    try {
      const [cRes, pRes, aRes] = await Promise.all([
        api.getClients(),
        api.getPlatforms(),
        api.getAgents()
      ]);
      if (cRes.data) this.clientsCache = cRes.data;
      if (pRes.data) this.platformsCache = pRes.data;
      if (aRes.data) this.agentsCache = aRes.data;
    } catch (e) {
      console.error('Error preloading data:', e);
    }
  }

  private renderLayout(): void {
    this.appRoot.innerHTML = `
      <div class="flex h-screen overflow-hidden bg-brand-bg">
        <!-- Sidebar container -->
        <aside id="sidebar-root"></aside>

        <!-- Mobile sidebar backdrop -->
        <div id="mobile-sidebar-backdrop" class="fixed inset-0 bg-slate-900/50 z-20 hidden lg:hidden backdrop-blur-xs transition-opacity"></div>

        <!-- Main content area -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          <!-- Header container -->
          <header id="header-root"></header>

          <!-- Router View Container -->
          <main id="main-content-root" class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
            <!-- Rendered view goes here -->
          </main>
        </div>
      </div>
    `;

    const sidebarContainer = document.getElementById('sidebar-root') as HTMLElement;
    const headerContainer = document.getElementById('header-root') as HTMLElement;
    this.contentContainer = document.getElementById('main-content-root') as HTMLElement;
    this.mobileBackdrop = document.getElementById('mobile-sidebar-backdrop') as HTMLElement;

    this.sidebar = new Sidebar(sidebarContainer, (route) => {
      this.closeMobileSidebar();
      this.navigate(route);
    });
    this.sidebar.render();

    this.header = new Header(headerContainer, {
      onOpenNewTicket: () => this.openNewTicketModal(),
      onOpenLogin: () => {},
      onToggleMobileMenu: () => this.toggleMobileSidebar()
    });
    this.header.render();

    this.mobileBackdrop.addEventListener('click', () => this.closeMobileSidebar());
  }

  private toggleMobileSidebar(): void {
    const sidebar = document.getElementById('sidebar-root');
    sidebar?.classList.toggle('-translate-x-full');
    this.mobileBackdrop.classList.toggle('hidden');
  }

  private closeMobileSidebar(): void {
    const sidebar = document.getElementById('sidebar-root');
    sidebar?.classList.add('-translate-x-full');
    this.mobileBackdrop.classList.add('hidden');
  }

  public navigate(route: string, extraParams?: any): void {
    this.currentRoute = route;
    localStorage.setItem('current_route', route);
    this.sidebar.setRoute(route);
    this.contentContainer.scrollTop = 0;

    switch (route) {
      case 'dashboard':
        const dashboard = new DashboardView(this.contentContainer, {
          onViewTicket: (id) => this.openTicketDetail(id),
          onNavigateTicketsWithFilter: (k, v) => this.navigate('tickets', { filterKey: k, filterVal: v })
        });
        dashboard.render();
        break;

      case 'tickets':
        const ticketsView = new TicketsView(this.contentContainer, {
          onOpenNewTicket: () => this.openNewTicketModal(),
          onOpenEditTicket: (t) => this.openEditTicketModal(t),
          onViewTicketDetail: (id) => this.openTicketDetail(id),
          initialFilter: extraParams ? { key: extraParams.filterKey, val: extraParams.filterVal } : undefined
        });
        ticketsView.render();
        break;

      case 'clients':
        const clientsView = new ClientsView(this.contentContainer, (clientId) => {
          this.navigate('tickets', { filterKey: 'cliente_id', filterVal: String(clientId) });
        });
        clientsView.render();
        break;

      case 'platforms':
        const platformsView = new PlatformsView(this.contentContainer, (platformId) => {
          this.navigate('tickets', { filterKey: 'plataforma_id', filterVal: String(platformId) });
        });
        platformsView.render();
        break;

      case 'agents':
        const agentsView = new AgentsView(this.contentContainer, (agentId) => {
          this.navigate('tickets', { filterKey: 'agente_id', filterVal: String(agentId) });
        });
        agentsView.render();
        break;

      case 'reports':
        const reportsView = new ReportsView(this.contentContainer);
        reportsView.render();
        break;

      case 'settings':
        const settingsView = new SettingsView(this.contentContainer);
        settingsView.render();
        break;

      default:
        this.navigate('dashboard');
        break;
    }
  }

  private async openNewTicketModal(): Promise<void> {
    await this.preloadAuxiliaryData();
    const modal = new TicketModal({
      clients: this.clientsCache,
      platforms: this.platformsCache,
      agents: this.agentsCache,
      onSuccess: () => {
        if (this.currentRoute === 'tickets' || this.currentRoute === 'dashboard') {
          this.navigate(this.currentRoute);
        } else {
          this.navigate('tickets');
        }
      }
    });
    modal.open();
  }

  private async openEditTicketModal(ticket: Ticket): Promise<void> {
    await this.preloadAuxiliaryData();
    const modal = new TicketModal({
      ticket,
      clients: this.clientsCache,
      platforms: this.platformsCache,
      agents: this.agentsCache,
      onSuccess: () => {
        this.navigate(this.currentRoute);
      }
    });
    modal.open();
  }

  private openTicketDetail(ticketId: number): void {
    const detailModal = new TicketDetailModal({
      ticketId,
      onEdit: (t) => this.openEditTicketModal(t),
      onDelete: () => this.navigate(this.currentRoute),
      onStatusChanged: () => this.navigate(this.currentRoute)
    });
    detailModal.open();
  }

  private bindGlobalEvents(): void {
    window.addEventListener('auth-changed', () => {
      const user = api.getUser();
      if (!user) {
        window.location.href = '/login';
      } else {
        this.header.render();
        this.sidebar.render();
      }
    });
  }
}

// Bootstrap Application
new App();

