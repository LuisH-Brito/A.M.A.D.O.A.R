import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { DoadorService } from '../../services/doador.service';
import { CadastroComponent } from './cadastro.component';

describe('CadastroComponent', () => {
  let component: CadastroComponent;
  let fixture: ComponentFixture<CadastroComponent>;
  let doadorService: jasmine.SpyObj<DoadorService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    doadorService = jasmine.createSpyObj<DoadorService>('DoadorService', [
      'obterDoador',
      'atualizarDoador',
    ]);
    doadorService.obterDoador.and.returnValue(
      of({
        id: 1,
        nome_completo: 'Doador Teste',
        email: 'doador@amadoar.test',
        cpf: '12345678909',
        endereco: 'Endereco de teste',
        telefone: '(68) 99999-9999',
        data_nascimento: '1990-01-01',
        sexo: 'F',
        tipo_sanguineo_declarado: 'O',
        fator_rh: '+',
      }),
    );
    doadorService.atualizarDoador.and.returnValue(of({}));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CadastroComponent],
      providers: [
        { provide: DoadorService, useValue: doadorService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ modo: 'editar' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('habilita a data de nascimento e carrega o formato aceito pelo input', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[name="data"]',
    );

    expect(component.modoEdicao).toBeTrue();
    expect(input.readOnly).toBeFalse();
    expect(input.disabled).toBeFalse();
    expect(input.value).toBe('1990-01-01');
  });

  it('envia a nova data de nascimento ao salvar a edicao', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[name="data"]',
    );
    input.value = '1991-02-03';
    input.dispatchEvent(new Event('input'));

    component.concluirCadastro();

    expect(doadorService.atualizarDoador).toHaveBeenCalledWith(
      jasmine.objectContaining({ data_nascimento: '1991-02-03' }),
    );
  });

  it('mantem o bloqueio de data futura antes de abrir a confirmacao', () => {
    spyOn(component.toast, 'exibir');
    component.dados.data_nascimento = '2999-01-01';

    component.abrirModalConfirmacao();

    expect(component.modalVisivel).toBeFalse();
    expect(component.toast.exibir).toHaveBeenCalledWith(
      'A data de nascimento não pode ser futura.',
      false,
    );
  });

  it('volta para o perfil do doador pela seta no modo de edicao', () => {
    component.voltar();

    expect(router.navigate).toHaveBeenCalledWith(['/pagina-perfil']);
  });

  it('volta para o perfil do doador ao cancelar no modo de edicao', () => {
    component.cancelar();

    expect(router.navigate).toHaveBeenCalledWith(['/pagina-perfil']);
  });
});

describe('CadastroComponent no modo recepcionista', () => {
  let component: CadastroComponent;
  let fixture: ComponentFixture<CadastroComponent>;
  let service: jasmine.SpyObj<DoadorService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<DoadorService>('DoadorService', [
      'obterDoador', 'atualizarDoador', 'cadastrar', 'cadastrarPelaRecepcao',
    ]);
    service.cadastrarPelaRecepcao.and.returnValue(of({}));
    await TestBed.configureTestingModule({
      imports: [CadastroComponent],
      providers: [
        { provide: DoadorService, useValue: service },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: { queryParams: of({ modo: 'recepcionista' }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('reutiliza o cadastro sem mostrar senhas', () => {
    expect(component.modoRecepcionista).toBeTrue();
    expect(fixture.nativeElement.querySelector('input[name="senha"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[name="confirmar"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[name="cpf"]')).not.toBeNull();
  });

  it('envia o cadastro sem senha e mostra o feedback de sucesso', () => {
    spyOn(component.toast, 'exibir');
    component.dados.nome_completo = 'Doador Teste';
    component.dados.cpf = '52998224725';
    component.dados.email = 'novo@amadoar.test';

    component.concluirCadastro();

    expect(service.cadastrarPelaRecepcao).toHaveBeenCalledWith(
      jasmine.objectContaining({
        cpf: '52998224725', email: 'novo@amadoar.test',
      }),
    );
    expect(service.cadastrarPelaRecepcao.calls.mostRecent().args[0].password).toBeUndefined();
    expect(service.cadastrar).not.toHaveBeenCalled();
    expect(component.toast.exibir).toHaveBeenCalledWith(
      jasmine.stringMatching(/senha inicial é Senha123/), true,
    );
    expect(component.dados.cpf).toBe('');
  });
});
