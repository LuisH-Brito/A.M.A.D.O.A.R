import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConfirmacaoComponent } from './modal-confirmacao.component';

describe('ModalConfirmacaoComponent', () => {
  let component: ModalConfirmacaoComponent;
  let fixture: ComponentFixture<ModalConfirmacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalConfirmacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalConfirmacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('não emite confirmação enquanto está processando', () => {
    spyOn(component.confirmado, 'emit');
    component.processando = true;
    component.aoConfirmar();
    fixture.detectChanges();

    expect(component.confirmado.emit).not.toHaveBeenCalled();
    expect(component.bloqueado).toBeTrue();
  });

  it('não fica bloqueado quando o usuário apenas cancela', () => {
    spyOn(component.cancelado, 'emit');
    component.aoCancelar();

    expect(component.cancelado.emit).toHaveBeenCalledTimes(1);
    expect(component.bloqueado).toBeFalse();
  });
});
