import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { QuestionarioService } from '../../services/questionario.service';
import { QuestionarioProcessoComponent } from './questionario-processo.component';

describe('QuestionarioProcessoComponent', () => {
  let component: QuestionarioProcessoComponent;
  let fixture: ComponentFixture<QuestionarioProcessoComponent>;
  let questionarioService: jasmine.SpyObj<QuestionarioService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    questionarioService = jasmine.createSpyObj<QuestionarioService>(
      'QuestionarioService',
      [
        'getPerguntas',
        'getQuestionariosPorCpf',
        'getQuestionarioPorProcesso',
        'salvarQuestionario',
      ],
    );
    questionarioService.getPerguntas.and.returnValue(
      of([
        {
          id: 1,
          texto: 'Pergunta de teste',
          resposta_esperada: 'Sim',
          motivo_inaptidao: 'Motivo',
        },
      ]),
    );
    questionarioService.getQuestionariosPorCpf.and.returnValue(
      of([{ respostas: [] }]),
    );
    questionarioService.getQuestionarioPorProcesso.and.returnValue(
      of({ validade: true, respostas: [] }),
    );

    router = jasmine.createSpyObj<Router>('Router', [
      'navigate',
      'getCurrentNavigation',
    ]);
    router.getCurrentNavigation.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [QuestionarioProcessoComponent],
      providers: [
        { provide: QuestionarioService, useValue: questionarioService },
        { provide: Router, useValue: router },
        { provide: Location, useValue: jasmine.createSpyObj('Location', ['back']) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (chave: string) =>
                  chave === 'processoId' ? '42' : '92000000004',
              },
              queryParamMap: { get: () => null },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionarioProcessoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sinaliza revisao apenas ao retornar da Triagem que a solicitou', () => {
    let leiturasDeNavegacao = 0;
    router.getCurrentNavigation.and.callFake(() =>
      leiturasDeNavegacao++ === 0
        ? ({ extras: { state: { retornarParaTriagem: true } } } as any)
        : null,
    );
    fixture.destroy();
    fixture = TestBed.createComponent(QuestionarioProcessoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.voltar();

    expect(router.navigate).toHaveBeenCalledWith(['/form-triagem', 42], {
      state: { retornoRevisaoQuestionario: true },
    });
    expect(leiturasDeNavegacao).toBe(1);
  });

  it('prioriza o questionário vinculado ao processo em vez do histórico por CPF', () => {
    expect(
      questionarioService.getQuestionarioPorProcesso,
    ).toHaveBeenCalledWith(42);
    expect(questionarioService.getQuestionariosPorCpf).not.toHaveBeenCalled();
  });

  it('abre a edição quando o processo ainda não possui questionário', () => {
    questionarioService.getQuestionarioPorProcesso.and.returnValue(
      throwError(() => ({ status: 404 })),
    );
    component.modoEdicao = false;

    component.carregarQuestionarioPorProcesso();

    expect(component.modoEdicao).toBeTrue();
    expect(component.carregando).toBeFalse();
  });

  it('entra no modo de edição e leva a janela ao topo ao clicar em Editar', () => {
    const scrollTo = spyOn(window, 'scrollTo');
    component.modoEdicao = false;

    component.alternarEdicao();

    expect(component.modoEdicao).toBeTrue();
    expect(scrollTo).toHaveBeenCalled();
    const argumentos = scrollTo.calls.mostRecent().args as unknown as [
      ScrollToOptions,
    ];
    expect(argumentos[0]).toEqual({ top: 0, behavior: 'smooth' });
  });
});
