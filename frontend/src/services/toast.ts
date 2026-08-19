type ToastType = 'success' | 'error' | 'info' | 'warning';

class ToastService {
  private container: HTMLElement | null = null;

  private getContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  }

  public show(message: string, type: ToastType = 'info', duration = 4000): void {
    const container = this.getContainer();

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-modal border animate-fade-in transition-all duration-300 ${this.getTypeStyles(type)}`;

    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="flex-shrink-0 mt-0.5">${icon}</div>
      <div class="flex-1 text-sm font-medium leading-snug">${message}</div>
      <button class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn?.addEventListener('click', () => {
      this.removeToast(toast);
    });

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }
  }

  private removeToast(toast: HTMLElement): void {
    toast.classList.add('opacity-0', 'translate-x-full');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  private getTypeStyles(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'bg-white text-slate-800 border-emerald-300 ring-1 ring-emerald-400/20';
      case 'error':
        return 'bg-white text-slate-800 border-rose-300 ring-1 ring-rose-400/20';
      case 'warning':
        return 'bg-white text-slate-800 border-amber-300 ring-1 ring-amber-400/20';
      case 'info':
      default:
        return 'bg-white text-slate-800 border-brand-border ring-1 ring-brand-primary/20';
    }
  }

  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return `<div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>`;
      case 'error':
        return `<div class="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>`;
      case 'warning':
        return `<div class="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>`;
      case 'info':
      default:
        return `<div class="w-6 h-6 rounded-full bg-blue-100 text-brand-primary flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>`;
    }
  }

  public success(msg: string) { this.show(msg, 'success'); }
  public error(msg: string) { this.show(msg, 'error'); }
  public info(msg: string) { this.show(msg, 'info'); }
  public warning(msg: string) { this.show(msg, 'warning'); }
}

export const toast = new ToastService();
