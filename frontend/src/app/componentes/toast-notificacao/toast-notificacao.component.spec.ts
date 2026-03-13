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
});
