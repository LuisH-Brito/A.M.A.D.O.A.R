import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BolsaAguardandoValidacaoComponent } from './bolsa-aguardando-validacao.component';

describe('BolsaAguardandoValidacaoComponent', () => {
  let component: BolsaAguardandoValidacaoComponent;
  let fixture: ComponentFixture<BolsaAguardandoValidacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BolsaAguardandoValidacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BolsaAguardandoValidacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
