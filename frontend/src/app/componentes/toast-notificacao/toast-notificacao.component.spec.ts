import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastNotificacaoComponent } from './toast-notificacao.component';

describe('ToastNotificacaoComponent', () => {
  let component: ToastNotificacaoComponent;
  let fixture: ComponentFixture<ToastNotificacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastNotificacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToastNotificacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('anuncia mensagens de sucesso de forma não interruptiva', () => {
    component.sucesso = true;
    component.visivel = true;
    fixture.detectChanges();

    const toast: HTMLElement = fixture.nativeElement.querySelector(
      '.toast-notificacao',
    );
    const fechar: HTMLButtonElement =
      fixture.nativeElement.querySelector('.toast-fechar');
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.getAttribute('aria-live')).toBe('polite');
    expect(fechar.getAttribute('aria-label')).toBe('Fechar notificação');
  });

  it('anuncia mensagens de erro de forma assertiva', () => {
    component.sucesso = false;
    component.visivel = true;
    fixture.detectChanges();

    const toast: HTMLElement = fixture.nativeElement.querySelector(
      '.toast-notificacao',
    );
    expect(toast.getAttribute('role')).toBe('alert');
    expect(toast.getAttribute('aria-live')).toBe('assertive');
  });
});
