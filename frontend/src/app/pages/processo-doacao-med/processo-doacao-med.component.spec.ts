import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ProcessoDoacaoMedComponent } from './processo-doacao-med.component';

describe('ProcessoDoacaoMedComponent', () => {
  let component: ProcessoDoacaoMedComponent;
  let fixture: ComponentFixture<ProcessoDoacaoMedComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessoDoacaoMedComponent, HttpClientTestingModule]
    })
    .compileComponents();

    localStorage.setItem('cargo', 'medico');
    fixture = TestBed.createComponent(ProcessoDoacaoMedComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('cargo');
  });

  it('should create', () => {
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:8000/api/estoque/?filtro_aba=Aguardando').flush({ count: 0, results: [] });
    expect(component).toBeTruthy();
  });

  it('não exibe badge quando não há bolsas aguardando', () => {
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:8000/api/estoque/?filtro_aba=Aguardando').flush({ count: 0, results: [] });

    expect(fixture.nativeElement.querySelector('.badge-bolsas-aguardando')).toBeNull();
  });

  it('exibe a mensagem no singular para uma bolsa aguardando', () => {
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:8000/api/estoque/?filtro_aba=Aguardando').flush({ count: 1, results: [{}] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.badge-bolsas-aguardando')?.textContent)
      .toContain('1 bolsa aguardando validação');
  });

  it('atualiza a badge quando a lista aguardando é recarregada', () => {
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:8000/api/estoque/?filtro_aba=Aguardando').flush({ count: 3, results: [{}, {}, {}] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.badge-bolsas-aguardando')?.textContent)
      .toContain('3 bolsas aguardando validação');

    component.ngOnInit();
    httpMock.expectOne('http://localhost:8000/api/estoque/?filtro_aba=Aguardando').flush({ count: 2, results: [{}, {}] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.badge-bolsas-aguardando')?.textContent)
      .toContain('2 bolsas aguardando validação');
  });
});
