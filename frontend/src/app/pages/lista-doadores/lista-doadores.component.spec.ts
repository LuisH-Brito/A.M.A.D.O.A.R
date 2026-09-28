import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { ListaDoadoresComponent } from './lista-doadores.component';
import { DoadorService } from '../../services/doador.service';

describe('ListaDoadoresComponent', () => {
  let component: ListaDoadoresComponent;
  let fixture: ComponentFixture<ListaDoadoresComponent>;
  let doadorService: jasmine.SpyObj<DoadorService>;

  const criarDoador = (
    nome: string,
    cpf: string,
    tipo = 'A',
    fator = '+',
  ) => ({
    nome_completo: nome,
    cpf,
    tipo_sanguineo_declarado: tipo,
    fator_rh: fator,
  });

  beforeEach(async () => {
    doadorService = jasmine.createSpyObj<DoadorService>('DoadorService', [
      'listarTodos',
    ]);
    doadorService.listarTodos.and.returnValue(
      of([
        criarDoador('Carlos', '30000000000'),
        criarDoador('Ana', '10000000000'),
        criarDoador('Bruno', '20000000000'),
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [ListaDoadoresComponent],
      providers: [
        { provide: DoadorService, useValue: doadorService },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaDoadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve ordenar todos os doadores alfabeticamente antes de paginar', () => {
    expect(component.usuarios.map((usuario) => usuario.nome_completo)).toEqual([
      'Ana',
      'Bruno',
      'Carlos',
    ]);
  });

  it('deve voltar para a primeira pagina ao alterar qualquer filtro', () => {
    component.paginaAtual = 5;
    component.alterarBusca('Ana');
    expect(component.paginaAtual).toBe(1);

    component.paginaAtual = 5;
    component.alterarFiltro('A+');
    expect(component.paginaAtual).toBe(1);
  });

  it('deve preservar o filtro ao mudar de pagina', () => {
    component.usuarios = Array.from({ length: 20 }, (_, indice) =>
      criarDoador(`Doador ${indice + 1}`, `${indice + 1}`.padStart(11, '0')),
    );
    component.alterarFiltro('A+');
    component.mudarPagina(2);

    expect(component.filtroSelecionado).toBe('A+');
    expect(component.paginaAtual).toBe(2);
    expect(component.usuariosPaginados.length).toBe(10);
    expect(doadorService.listarTodos).toHaveBeenCalledTimes(1);
  });

  it('deve recuperar automaticamente uma pagina invalida', () => {
    component.usuarios = Array.from({ length: 3 }, (_, indice) =>
      criarDoador(`Doador ${indice + 1}`, `${indice + 1}`.padStart(11, '0')),
    );
    component.paginaAtual = 5;

    expect(component.usuariosPaginados.length).toBe(3);
    expect(component.paginaAtual).toBe(1);
  });
});
