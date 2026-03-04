import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * authGuard (CanActivateFn)
 * Guarda de rota responsável por proteger páginas sensíveis.
 * Ele verifica se o cargo do usuário logado (armazenado no localStorage)
 * está presente na lista de cargos permitidos para aquela rota específica.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const cargoUsuario = localStorage.getItem('cargo');

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
    router.navigate(['/home']);
    return false;
  }

  return true;
};
