import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiService } from './api.service';
import { AtendimentoProcessoService } from './atendimento-processo.service';

describe('AtendimentoProcessoService', () => {
  let service: AtendimentoProcessoService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'iniciarAtendimentoProcesso',
      'encerrarAtendimentoProcesso',
    ]);
    api.iniciarAtendimentoProcesso.and.returnValue(of({ em_andamento: true }));
    api.encerrarAtendimentoProcesso.and.returnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        AtendimentoProcessoService,
        { provide: ApiService, useValue: api },
      ],
    });
    service = TestBed.inject(AtendimentoProcessoService);
  });

  it('mantém a reserva na transição entre questionário e triagem', fakeAsync(() => {
    service.iniciar(42).subscribe();
    service.parar(42);
    tick(250);
    service.iniciar(42).subscribe();
    tick(500);

    expect(api.encerrarAtendimentoProcesso).not.toHaveBeenCalled();
    expect(api.iniciarAtendimentoProcesso).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('libera a reserva ao sair definitivamente da tela', fakeAsync(() => {
    service.iniciar(42).subscribe();
    service.parar(42);
    tick(500);

    expect(api.encerrarAtendimentoProcesso).toHaveBeenCalledWith(42);
    discardPeriodicTasks();
  }));
});
