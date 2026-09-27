import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { QuestionarioService } from '../../services/questionario.service';
import { TriagemRascunhoService } from '../../services/triagem-rascunho.service';
import { AtendimentoProcessoService } from '../../services/atendimento-processo.service';
import { FormTriagemComponent } from './form-triagem.component';

describe('FormTriagemComponent', () => {
  const processoId = 42;
  let component: FormTriagemComponent;
  let fixture: ComponentFixture<FormTriagemComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let router: jasmine.SpyObj<Router>;
  let rascunho: TriagemRascunhoService;
  let questionarioService: jasmine.SpyObj<QuestionarioService>;
  let atendimento: jasmine.SpyObj<AtendimentoProcessoService>;

  beforeEach(async () => {
    localStorage.setItem('usuario_id', '7');
    sessionStorage.removeItem(`q_visto_${processoId}`);

    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getProcessoById',
      'decidirTriagem',
      'atualizarStatusProcesso',
    ]);
    api.getProcessoById.and.returnValue(
      of({
        doador: {
          nome_completo: 'Doador Teste',
          data_nascimento: '1990-01-01',
          cpf: '92000000004',
        },
      }),
    );
    api.decidirTriagem.and.returnValue(of({}));
    api.atualizarStatusProcesso.and.returnValue(of({}));

    questionarioService = jasmine.createSpyObj<QuestionarioService>(
      'QuestionarioService',
      ['getQuestionarioPorProcesso'],
    );
    questionarioService.getQuestionarioPorProcesso.and.returnValue(
      of({ validade: true }),
    );
    router = jasmine.createSpyObj<Router>('Router', [
      'navigate',
      'getCurrentNavigation',
    ]);
    router.getCurrentNavigation.and.returnValue(null);
    atendimento = jasmine.createSpyObj<AtendimentoProcessoService>(
      'AtendimentoProcessoService', ['iniciar', 'parar'],
    );
    atendimento.iniciar.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [FormTriagemComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: QuestionarioService, useValue: questionarioService },
        { provide: Router, useValue: router },
        { provide: AtendimentoProcessoService, useValue: atendimento },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => processoId.toString() },
            },
          },
        },
      ],
    }).compileComponents();

    rascunho = TestBed.inject(TriagemRascunhoService);
    rascunho.limpar(processoId);
    fixture = TestBed.createComponent(FormTriagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    rascunho.limpar(processoId);
    localStorage.removeItem('usuario_id');
    sessionStorage.removeItem(`q_visto_${processoId}`);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('abre a revisão identificando a Triagem como origem', () => {
    component.abrirQuestionarios();

    expect(router.navigate).toHaveBeenCalledWith(
      [
        '/questionario-processo/proc',
        processoId,
        '92000000004',
      ],
      { state: { retornarParaTriagem: true } },
    );
  });

  it('explica que pressão e questionário estão pendentes para habilitar Apto', () => {
    fixture.detectChanges();

    const orientacao: HTMLElement = fixture.nativeElement.querySelector(
      '.orientacao-apto',
    );
    const botaoApto: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.btn-concluir',
    );

    expect(botaoApto.disabled).toBeTrue();
    expect(orientacao.textContent).toContain('pressão arterial');
    expect(orientacao.textContent).toContain('revise o questionário');
  });

  it('explica somente a revisão do questionário quando a pressão está preenchida', () => {
    component.pressaoArterial = '12x8';
    fixture.detectChanges();

    const orientacao: HTMLElement = fixture.nativeElement.querySelector(
      '.orientacao-apto',
    );
    const botaoApto: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.btn-concluir',
    );

    expect(botaoApto.disabled).toBeTrue();
    expect(orientacao.textContent?.trim()).toBe(
      'Revise o questionário para habilitar "Apto".',
    );
  });

  it('explica somente a pressão quando o questionário já foi revisado', () => {
    component.questionarioRevisado = true;
    fixture.detectChanges();

    const orientacao: HTMLElement = fixture.nativeElement.querySelector(
      '.orientacao-apto',
    );
    const botaoApto: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.btn-concluir',
    );

    expect(botaoApto.disabled).toBeTrue();
    expect(orientacao.textContent?.trim()).toBe(
      'Informe uma pressão arterial válida para habilitar "Apto".',
    );
  });

  it('habilita Apto e oculta a orientação quando os requisitos são atendidos', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[name="pressao_arterial"]',
    );
    input.value = '12x8';
    input.dispatchEvent(new Event('input'));
    component.questionarioRevisado = true;
    fixture.detectChanges();

    const botaoApto: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.btn-concluir',
    );

    expect(botaoApto.disabled).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('.orientacao-apto'),
    ).toBeNull();
  });

  it('bloqueia Apto e mantém Inapto disponível para questionário impeditivo', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[name="pressao_arterial"]',
    );
    input.value = '12x8';
    input.dispatchEvent(new Event('input'));
    component.questionarioRevisado = true;
    component.questionarioPermiteAptidao = false;
    fixture.detectChanges();

    const botaoApto: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.btn-concluir',
    );
    const botaoInapto: HTMLButtonElement =
      fixture.nativeElement.querySelector('.btn-cancelar');
    const orientacao: HTMLElement = fixture.nativeElement.querySelector(
      '.orientacao-apto--impeditiva',
    );

    expect(botaoApto.disabled).toBeTrue();
    expect(botaoInapto.disabled).toBeFalse();
    expect(orientacao.textContent).toContain(
      'respostas incompatíveis com a classificação como apto',
    );
  });

  it('preserva a pressão arterial ao revisar e retornar do questionário', fakeAsync(() => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[name="pressao_arterial"]',
    );
    input.value = '120x80';
    input.dispatchEvent(new Event('input'));
    tick();
    fixture.detectChanges();

    component.abrirQuestionarios();
    fixture.destroy();

    let leiturasDeNavegacao = 0;
    router.getCurrentNavigation.and.callFake(() =>
      leiturasDeNavegacao++ === 0
        ? ({
            extras: { state: { retornoRevisaoQuestionario: true } },
          } as any)
        : null,
    );

    fixture = TestBed.createComponent(FormTriagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const inputRestaurado: HTMLInputElement =
      fixture.nativeElement.querySelector('input[name="pressao_arterial"]');
    const botaoApto: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.btn-concluir',
    );
    expect(component.pressaoArterial).toBe('120x80');
    expect(inputRestaurado.value).toBe('120x80');
    expect(component.questionarioRevisado).toBeTrue();
    expect(leiturasDeNavegacao).toBe(1);
    expect(botaoApto.disabled).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('.orientacao-apto'),
    ).toBeNull();
  }));

  it('atualiza o resultado após editar e bloqueia Apto ao retornar com resposta impeditiva', fakeAsync(() => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[name="pressao_arterial"]',
    );
    input.value = '120x80';
    input.dispatchEvent(new Event('input'));
    tick();

    component.abrirQuestionarios();
    questionarioService.getQuestionarioPorProcesso.and.returnValue(
      of({ validade: false }),
    );
    fixture.destroy();

    router.getCurrentNavigation.and.returnValue({
      extras: { state: { retornoRevisaoQuestionario: true } },
    } as any);

    fixture = TestBed.createComponent(FormTriagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const botaoApto: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.btn-concluir',
    );
    const botaoInapto: HTMLButtonElement =
      fixture.nativeElement.querySelector('.btn-cancelar');

    expect(component.pressaoArterial).toBe('120x80');
    expect(component.questionarioRevisado).toBeTrue();
    expect(component.questionarioPermiteAptidao).toBeFalse();
    expect(botaoApto.disabled).toBeTrue();
    expect(botaoInapto.disabled).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('.orientacao-apto--impeditiva'),
    ).not.toBeNull();
  }));

  it('reinicia a revisao sem retorno direto do questionario', () => {
    sessionStorage.setItem(`q_visto_${processoId}`, 'true');
    fixture.destroy();
    router.getCurrentNavigation.and.returnValue(null);

    fixture = TestBed.createComponent(FormTriagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.questionarioRevisado).toBeFalse();
  });

  it('ignora o estado do historico apos recarregar a pagina', () => {
    const estadoAnterior = history.state;
    history.replaceState(
      { retornoRevisaoQuestionario: true },
      '',
    );
    fixture.destroy();
    router.getCurrentNavigation.and.returnValue(null);

    fixture = TestBed.createComponent(FormTriagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.questionarioRevisado).toBeFalse();
    history.replaceState(estadoAnterior, '');
  });

  it('bloqueia os controles e impede envio duplicado enquanto processa', fakeAsync(() => {
    const decisaoPendente = new Subject<Object>();
    api.decidirTriagem.and.returnValue(decisaoPendente.asObservable());
    component.pressaoArterial = '12x8';
    component.questionarioRevisado = true;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.abrirModal(true);
    component.confirmarAcaoModal();
    component.confirmarAcaoModal();
    component.abrirModal(false);
    fixture.detectChanges();

    const botaoInapto: HTMLButtonElement =
      fixture.nativeElement.querySelector('.btn-cancelar');
    const botaoApto: HTMLButtonElement =
      fixture.nativeElement.querySelector('.btn-concluir');
    expect(api.decidirTriagem).toHaveBeenCalledTimes(1);
    expect(component.processando).toBeTrue();
    expect(component.acaoPendente).toBeTrue();
    expect(botaoInapto.disabled).toBeTrue();
    expect(botaoApto.disabled).toBeTrue();
    expect(botaoApto.textContent).toContain('Processando...');
    expect(
      fixture.nativeElement.querySelector('.orientacao-apto'),
    ).toBeNull();

    decisaoPendente.error({ error: { erro: 'Falha controlada.' } });
    tick();
    fixture.detectChanges();

    expect(component.processando).toBeFalse();
    expect(botaoInapto.disabled).toBeFalse();
    expect(botaoApto.disabled).toBeFalse();
    tick(5000);
  }));

  it('mantém o fluxo de sucesso para Apto', fakeAsync(() => {
    component.pressaoArterial = '12x8';
    component.questionarioRevisado = true;
    spyOn(component.toast, 'exibir');

    component.abrirModal(true);
    component.confirmarAcaoModal();
    tick(1500);

    expect(api.decidirTriagem).toHaveBeenCalledTimes(1);
    expect(api.atualizarStatusProcesso).toHaveBeenCalledWith(processoId, 4);
    expect(component.toast.exibir).toHaveBeenCalledWith(
      'Doador Apto! Processo enviado para Coleta.',
      true,
    );
    expect(router.navigate).toHaveBeenCalledWith([
      '/processo-doacao-andamento',
    ]);
  }));

  it('mantém o fluxo de sucesso para Inapto', fakeAsync(() => {
    component.pressaoArterial = '12x8';
    spyOn(component.toast, 'exibir');

    component.abrirModal(false);
    component.confirmarAcaoModal();
    tick(1500);

    expect(api.decidirTriagem).toHaveBeenCalledTimes(1);
    expect(api.atualizarStatusProcesso).toHaveBeenCalledWith(processoId, 0);
    expect(component.toast.exibir).toHaveBeenCalledWith(
      'Doador Inapto. Processo encerrado.',
      true,
    );
    expect(router.navigate).toHaveBeenCalledWith([
      '/processo-doacao-andamento',
    ]);
  }));
});
