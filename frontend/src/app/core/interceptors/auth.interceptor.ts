/**
 * auth.interceptor.ts (Formato Funcional)
 * * Este Interceptor é responsável por injetar o Token JWT em todas as
 * requisições HTTP enviadas para o backend automaticamente.
 */

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('access');
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap((res) => {
            localStorage.setItem('access', res.access);

            if (res.refresh) {
              localStorage.setItem('refresh', res.refresh);
            }

            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.access}`,
              },
            });

            return next(newReq);
          }),
          catchError((err) => {
            authService.logout();
            return throwError(() => err);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
