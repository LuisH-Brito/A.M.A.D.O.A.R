import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let http: jasmine.SpyObj<HttpClient>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: HttpClient, useValue: http },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    })
    .compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(router, 'navigate');
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('envia o doador com troca pendente para a tela obrigatória', () => {
    http.post.and.returnValue(of({
      access: 'access', refresh: 'refresh', tipo: 'doador',
      nome: 'Novo Doador', usuario_id: 42, deve_alterar_senha: true,
    }));
    component.loginData = { cpf: '52998224725', password: 'Senha123' };
    component.fazerLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/troca-senha-obrigatoria']);
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('cargo');
    localStorage.removeItem('nomeUsuario');
    localStorage.removeItem('usuario_id');
  });

  it('previne o submit nativo e exibe alerta para credenciais inválidas', () => {
    http.post.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const evento = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.loginData = { cpf: '52998224725', password: 'SenhaIncorreta' };
    component.fazerLogin(evento);

    expect(evento.preventDefault).toHaveBeenCalled();
    expect(http.post).toHaveBeenCalledWith(
      '/api/token/',
      { cpf: '52998224725', password: 'SenhaIncorreta' },
    );
    expect(component.erroLogin).toBeTrue();
  });
});
