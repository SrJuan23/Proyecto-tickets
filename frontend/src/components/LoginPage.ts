import { api } from '../services/api';
import { toast } from '../services/toast';

export class LoginPage {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark via-[#0f1738] to-brand-dark p-4">
        <div class="w-full max-w-md">
          <div class="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <!-- Header -->
            <div class="p-8 bg-gradient-to-br from-brand-dark via-brand-dark to-[#0f1738] text-white text-center relative">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-cyan flex items-center justify-center mx-auto mb-4 shadow-brand overflow-hidden">
                <img src="/img/logo.png" alt="Logo" class="w-10 h-10 object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <svg class="w-7 h-7 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 12 2 2 4-4"></path></svg>
              </div>
              <h1 class="text-2xl font-montserrat font-bold tracking-tight">Huella de soporte</h1>
              <p class="text-xs font-lato text-slate-300 mt-1">Registro de casos</p>
            </div>

            <div class="p-6 space-y-5">
              <!-- Login Form -->
              <form id="login-form" class="space-y-4 text-xs font-lato">
                <div>
                  <label class="block font-montserrat font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    id="login-email" 
                    name="email" 
                    required 
                    placeholder="tu.correo@empresa.com" 
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" 
                  />
                </div>

                <div>
                  <label class="block font-montserrat font-semibold text-slate-700 mb-1">Contraseña</label>
                  <input 
                    type="password" 
                    id="login-password" 
                    name="password" 
                    required 
                    placeholder="••••••••" 
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white focus:outline-none" 
                  />
                </div>

                <button 
                  type="submit" 
                  id="login-submit-btn" 
                  class="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-montserrat font-bold text-xs rounded-xl shadow-brand transition-all flex items-center justify-center gap-2 transform active:scale-98"
                >
                  <span>Iniciar Sesión</span>
                </button>
              </form>
            </div>
          </div>

          <p class="text-center text-[10px] text-slate-500 mt-6 font-lato">
            Huella de soporte v1.0 • Registro de casos
          </p>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const form = this.container.querySelector('#login-form') as HTMLFormElement;
    const submitBtn = this.container.querySelector('#login-submit-btn') as HTMLButtonElement;

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (this.container.querySelector('#login-email') as HTMLInputElement)?.value;
      const pass = (this.container.querySelector('#login-password') as HTMLInputElement)?.value;

      if (!email || !pass) {
        toast.error('Ingresa correo y contraseña.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Iniciando sesión...</span>`;

      try {
        const res = await api.login(email, pass);
        toast.success(`Bienvenido, ${res.data?.user.nombre}`);
        window.location.reload();
      } catch (err: any) {
        toast.error(err.message || 'Error al iniciar sesión.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Iniciar Sesión</span>`;
      }
    });
  }
}
