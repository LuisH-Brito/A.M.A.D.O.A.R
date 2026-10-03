import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { AtendimentoProcessoService } from '../../services/atendimento-processo.service';
import { FormColetaComponent } from './form-coleta.component';

describe('FormColetaComponent', () => {
  let component: FormColetaComponent;
  let fixture: ComponentFixture<FormColetaComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let router: jasmine.SpyObj<Router>;

  function botaoFinalizar(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.btn-coleta');
  }

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getProcessoById', 'listarEnfermeiros', 'finalizarColeta',
    ]);
    api.getProcessoById.and.returnValue(of({
      doador: { nome_completo: 'Doador Teste', sexo: 'F', cpf: '90000000003', data_nascimento: '1994-07-09' },
    }));
    api.listarEnfermeiros.and.returnValue(of([
      { id: 9, nome_completo: 'Enfermeira Teste' },
    ]));
    api.finalizarColeta.and.returnValue(of({ bolsa_criada: true }));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const atendimento = jasmine.createSpyObj<AtendimentoProcessoService>(
      'AtendimentoProcessoService', ['iniciar', 'parar'],
    );
    atendimento.iniciar.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [FormColetaComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AtendimentoProcessoService, useValue: atendimento },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: { get: () => '42' } },
        } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormColetaComponent);
    component = fixture.componentInstance;
    component.responsavelSelecionado = 9;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exibe a identificação do doador no cartão compartilhado', () => {
    const card: HTMLElement = fixture.nativeElement.querySelector(
      'app-dados-doador-card',
    );

    expect(card.textContent).toContain('Doador Teste');
    expect(card.textContent).toContain('900.000.000-03');
    expect(card.textContent).toContain('Feminino');
    expect(card.textContent).toContain('09/07/1994');
  });

  it('mantém a tela disponível quando o modal é cancelado', () => {
    component.abrirModalConfirmacao();
    component.fecharModal();
    fixture.detectChanges();

    expect(component.enviando).toBeFalse();
    expect(botaoFinalizar().disabled).toBeFalse();
  });

  it('exibe o aviso sem executar ação ao selecionar Não e o remove ao voltar para Sim', () => {
    component.puncaoSucesso = 'false';
    fixture.detectChanges();

    const aviso: HTMLElement = fixture.nativeElement.querySelector('.aviso-puncao');
    expect(aviso.textContent).toContain('processo será cancelado');
    expect(aviso.textContent).toContain('nenhuma bolsa será gerada');
    expect(component.modalVisivel).toBeFalse();
    expect(api.finalizarColeta).not.toHaveBeenCalled();

    component.puncaoSucesso = 'true';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.aviso-puncao')).toBeNull();
  });

  it('mantém o modal como etapa obrigatória e exige responsável selecionado', () => {
    component.responsavelSelecionado = null;
    component.abrirModalConfirmacao();

    expect(component.modalVisivel).toBeFalse();
    expect(api.finalizarColeta).not.toHaveBeenCalled();

    component.responsavelSelecionado = 9;
    component.abrirModalConfirmacao();
    expect(component.modalVisivel).toBeTrue();
    expect(api.finalizarColeta).not.toHaveBeenCalled();
  });

  it('envia apenas uma vez e bloqueia a coleta enquanto a requisição está pendente', () => {
    const requisicaoPendente = new Subject<object>();
    api.finalizarColeta.and.returnValue(requisicaoPendente.asObservable());

    component.abrirModalConfirmacao();
    component.finalizarColeta();
    component.finalizarColeta();
    component.abrirModalConfirmacao();
    fixture.detectChanges();

    expect(api.finalizarColeta).toHaveBeenCalledTimes(1);
    expect(component.enviando).toBeTrue();
    expect(botaoFinalizar().disabled).toBeTrue();

    requisicaoPendente.error({ error: { erro: 'Falha controlada.' } });
    fixture.detectChanges();

    expect(component.enviando).toBeFalse();
    expect(botaoFinalizar().disabled).toBeFalse();
  });

  it('mantém o bloqueio após sucesso para as decisões de sucesso e falha', () => {
    for (const puncaoSucesso of ['true', 'false']) {
      component.puncaoSucesso = puncaoSucesso;
      component.enviando = false;
      component.abrirModalConfirmacao();
      component.finalizarColeta();

      expect(component.enviando).toBeTrue();
    }

    expect(api.finalizarColeta.calls.count()).toBe(2);
  });
});
