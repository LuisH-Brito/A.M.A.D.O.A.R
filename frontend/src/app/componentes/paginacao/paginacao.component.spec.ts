import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginacaoComponent } from './paginacao.component';

describe('PaginacaoComponent', () => {
  let component: PaginacaoComponent;
  let fixture: ComponentFixture<PaginacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaginacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const configurarPaginacao = (totalPaginas: number, paginaAtual: number) => {
    component.itensPorPagina = 10;
    component.totalItens = totalPaginas * component.itensPorPagina;
    component.paginaAtual = paginaAtual;
  };

  it('deve mostrar todas as paginas quando o total for menor que cinco', () => {
    configurarPaginacao(3, 1);
    expect(component.paginas).toEqual([1, 2, 3]);
  });

  it('deve mostrar as paginas de 1 a 5 no inicio', () => {
    configurarPaginacao(15, 1);
    expect(component.paginas).toEqual([1, 2, 3, 4, 5]);
  });

  it('deve centralizar a pagina 4 entre 2 e 6', () => {
    configurarPaginacao(15, 4);
    expect(component.paginas).toEqual([2, 3, 4, 5, 6]);
  });

  it('deve centralizar a pagina 8 entre 6 e 10', () => {
    configurarPaginacao(15, 8);
    expect(component.paginas).toEqual([6, 7, 8, 9, 10]);
  });

  it('deve mostrar as cinco ultimas paginas no final', () => {
    configurarPaginacao(15, 15);
    expect(component.paginas).toEqual([11, 12, 13, 14, 15]);
  });

  it('nunca deve mostrar mais de cinco numeros', () => {
    for (let paginaAtual = 1; paginaAtual <= 15; paginaAtual++) {
      configurarPaginacao(15, paginaAtual);
      expect(component.paginas.length).toBeLessThanOrEqual(5);
    }
  });
});
