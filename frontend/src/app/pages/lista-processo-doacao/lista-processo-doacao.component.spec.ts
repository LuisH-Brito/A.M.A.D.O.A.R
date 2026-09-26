import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { ListaProcessoDoacaoComponent } from './lista-processo-doacao.component';

describe('ListaProcessoDoacaoComponent', () => {
  let component: ListaProcessoDoacaoComponent;
  let fixture: ComponentFixture<ListaProcessoDoacaoComponent>;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['getProcessos']);
    api.getProcessos.and.returnValue(
      of([
        { id: 1, status: 2 },
        { id: 2, status: 2 },
        { id: 3, status: 2 },
        { id: 4, status: 4 },
        { id: 5, status: 4 },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [ListaProcessoDoacaoComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaProcessoDoacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exibe badges com as quantidades das filas', () => {
    const abas = fixture.nativeElement.querySelectorAll('[role="tab"]');

    expect(abas[0].textContent).toContain('3');
    expect(abas[1].textContent).toContain('0');
    expect(abas[2].textContent).toContain('2');
  });

  it('atualiza as quantidades quando o status de um processo muda', () => {
    component.processos[0].status = 3;
    component.updateGroups();
    fixture.detectChanges();

    expect(component.preTriagem.length).toBe(2);
    expect(component.triagem.length).toBe(1);
    expect(component.coleta.length).toBe(2);

    const abas = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(abas[0].textContent).toContain('2');
    expect(abas[1].textContent).toContain('1');
  });
});
