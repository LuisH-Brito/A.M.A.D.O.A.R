import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes,
      withInMemoryScrolling({ 
        anchorScrolling: 'enabled', // Habilita o scroll para IDs
        scrollPositionRestoration: 'enabled'
      })),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
