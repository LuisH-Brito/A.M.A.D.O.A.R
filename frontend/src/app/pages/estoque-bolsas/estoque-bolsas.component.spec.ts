import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { EstoqueBolsaService } from '../../services/estoque-bolsa.service';
import { EstoqueBolsasComponent } from './estoque-bolsas.component';

describe('EstoqueBolsasComponent', () => {
  let component: EstoqueBolsasComponent;
  let fixture: ComponentFixture<EstoqueBolsasComponent>;
  let estoqueService: jasmine.SpyObj<EstoqueBolsaService>;

  beforeEach(async () => {
    estoqueService = jasmine.createSpyObj<EstoqueBolsaService>(
      'EstoqueBolsaService',
      ['obterDashboard', 'listarBolsas'],
    );
    estoqueService.obterDashboard.and.returnValue(
      of({
        resumoGeral: {
          total: 1,
          validas: 1,
          vencendo: 0,
          vencidas: 0,
          utilizadas: 0,
          descartadas: 0,
        },
        tiposSanguineos: [],
      }),
    );
    estoqueService.listarBolsas.and.returnValue(
      of({
        count: 1,
        results: [
          {
            id: 10,
            tipo_sanguineo_detalhe: { tipo: 'A', fator_rh: '+' },
            estado_temporal: 'valida',
            doador_nome: 'Doador Teste',
            doador_email: 'doador@example.com',
            recepcionista_nome: 'Recepcionista Autora',
            enfermeiro_nome: 'Enfermeiro Teste',
            medico_nome: 'Medico Teste',
            data_vencimento: '2026-10-30',
            validacao_at: '2026-09-26T12:00:00Z',
            arquivo_laudo: '/media/laudo.pdf',
          },
        ],
      }),
    );

    await TestBed.configureTestingModule({
      imports: [EstoqueBolsasComponent],
      providers: [
        { provide: EstoqueBolsaService, useValue: estoqueService },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstoqueBolsasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mapeia e exibe a recepcionista que iniciou o processo', () => {
    const bolsa = component.bolsasPaginadas[0];
    expect(bolsa.recepcionista).toBe('Recepcionista Autora');

    bolsa.expandido = true;
    fixture.detectChanges();

    const conteudo = fixture.nativeElement.textContent;
    expect(conteudo).toContain('Recepcionista');
    expect(conteudo).toContain('Recepcionista Autora');
  });
});
