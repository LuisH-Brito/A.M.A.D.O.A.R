import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { AuthService } from './services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard e troca obrigatória', () => {
  let router: jasmine.SpyObj<Router>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['parseUrl']);
    router.parseUrl.and.callFake((url: string) => ({ redirect: url }) as never);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['verificarTrocaObrigatoria']);
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: router },
      { provide: AuthService, useValue: auth },
    ] });
    localStorage.setItem('access', 'token');
    localStorage.setItem('cargo', 'doador');
  });

  afterEach(() => {
    localStorage.removeItem('access');
    localStorage.removeItem('cargo');
  });

  async function verificar(url: string) {
    const route = { data: { cargoPermitido: ['doador'] } } as unknown as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    return firstValueFrom(result as ReturnType<AuthService['verificarTrocaObrigatoria']>);
  }

  it('redireciona URLs digitadas diretamente quando a troca está pendente', async () => {
    auth.verificarTrocaObrigatoria.and.returnValue(of(true));
    expect(await verificar('/pagina-doador')).toEqual({ redirect: '/troca-senha-obrigatoria' } as never);
  });

  it('libera rotas normais depois da troca', async () => {
    auth.verificarTrocaObrigatoria.and.returnValue(of(false));
    expect(await verificar('/pagina-doador')).toBeTrue();
  });

  it('bloqueia o cadastro da recepção para outro perfil independentemente da ordem dos parâmetros', () => {
    const route = {
      routeConfig: { path: 'cadastro' },
      queryParamMap: convertToParamMap({ origem: 'menu', modo: 'recepcionista' }),
      data: {},
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/cadastro?origem=menu&modo=recepcionista' } as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toEqual({ redirect: '/' } as never);
  });
});
