/**
 * auth.interceptor.ts (Formato Funcional)
 * * Este Interceptor é responsável por injetar o Token JWT em todas as
 * requisições HTTP enviadas para o backend automaticamente.
 */

import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    /**
     * O objeto 'req' (requisição) é imutável no Angular.
     * Para modificá-lo, devemos cloná-lo (.clone) e inserir as novas informações.
     */
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }
  /**
   * 4. Caso não haja token, a requisição segue o fluxo original sem modificações.
   */
  return next(req);
};
