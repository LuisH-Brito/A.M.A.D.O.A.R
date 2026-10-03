import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DadosDoadorCardComponent } from './dados-doador-card.component';

describe('DadosDoadorCardComponent', () => {
  let component: DadosDoadorCardComponent;
  let fixture: ComponentFixture<DadosDoadorCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DadosDoadorCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DadosDoadorCardComponent);
    component = fixture.componentInstance;
  });

  it('formata CPF, sexo feminino e nascimento sem depender de serviços HTTP', () => {
    component.nome = 'Maria da Silva';
    component.cpf = '10100000398';
    component.sexo = 'F';
    component.dataNascimento = '1994-07-09';
    fixture.detectChanges();

    const card: HTMLElement = fixture.nativeElement.querySelector('.dados-doador-card');
    expect(card.textContent).toContain('Maria da Silva');
    expect(card.textContent).toContain('101.000.003-98');
    expect(card.textContent).toContain('Feminino');
    expect(card.textContent).toContain('09/07/1994');
  });

  it('apresenta sexo masculino por extenso', () => {
    component.sexo = 'M';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Masculino');
  });

  it('omite os campos opcionais não fornecidos', () => {
    component.nome = 'Maria da Silva';
    fixture.detectChanges();

    const card: HTMLElement = fixture.nativeElement.querySelector('.dados-doador-card');
    expect(card.textContent).toContain('Maria da Silva');
    expect(card.textContent).not.toContain('undefined');
    expect(card.querySelector('dl')).toBeNull();
  });
});
