import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './services/auth.service';

/**
 * authGuard (CanActivateFn)
 * Guarda de rota responsável por proteger páginas sensíveis.
 * Ele verifica se o cargo do usuário logado (armazenado no localStorage)
 * está presente na lista de cargos permitidos para aquela rota específica.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const cargoUsuario = localStorage.getItem('cargo');
  const access = localStorage.getItem('access');
  const auth = inject(AuthService);
  const troca = state.url.split('?')[0] === '/troca-senha-obrigatoria';
  const cadastroRecepcao = route.routeConfig?.path === 'cadastro'
    && route.queryParamMap.get('modo') === 'recepcionista';
  const cadastroEdicao = route.routeConfig?.path === 'cadastro'
    && route.queryParamMap.get('modo') === 'editar';

  if (!access) {
    return troca || cadastroRecepcao || cadastroEdicao || route.data?.['cargoPermitido']
      ? router.parseUrl('/login')
      : true;
  }

  if (cadastroRecepcao && cargoUsuario !== 'recepcionista') {
    return router.parseUrl('/');
  }
  if (cadastroEdicao && cargoUsuario !== 'doador') {
    return router.parseUrl('/');
  }

  const cargosPermitidos = route.data?.['cargoPermitido'] as Array<string>;

  console.log('Tentando acessar:', state.url);
  console.log('Seu cargo:', cargoUsuario);
  console.log('Permitidos:', cargosPermitidos);

  /**
   * LÓGICA DE VALIDAÇÃO:
   * Se a rota possuir uma lista de cargos permitidos definida E o cargo
   * do usuário logado NÃO estiver presente nessa lista, o acesso é barrado.
   */
  if (cargosPermitidos && !cargosPermitidos.includes(cargoUsuario!)) {
    alert('Acesso negado: Seu cargo não tem permissão para esta tela.');
    return router.parseUrl('/');
  }

  return auth.verificarTrocaObrigatoria().pipe(
    map(pendente => {
      if (pendente && !troca) return router.parseUrl('/troca-senha-obrigatoria');
      if (!pendente && troca) return router.parseUrl('/');
      return true;
    }),
    catchError(() => of(router.parseUrl('/login'))),
  );
};
