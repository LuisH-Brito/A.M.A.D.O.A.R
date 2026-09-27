import { Injectable } from '@angular/core';
import { EMPTY, Observable, Subject, Subscription, of, timer } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AtendimentoProcessoService {
  private processoId: number | null = null;
  private stopHeartbeat$ = new Subject<void>();
  private heartbeat?: Subscription;
  private liberacao?: ReturnType<typeof setTimeout>;

  constructor(private api: ApiService) {}

  iniciar(processoId: number): Observable<unknown> {
    if (this.processoId === processoId && this.heartbeat) {
      return of(undefined);
    }

    this.cancelarLiberacao();
    this.processoId = processoId;
    return this.api.iniciarAtendimentoProcesso(processoId).pipe(
      tap(() => this.iniciarHeartbeat(processoId)),
    );
  }

  parar(processoId: number): void {
    if (this.processoId !== processoId) return;
    this.cancelarLiberacao();
    this.liberacao = setTimeout(() => {
      this.liberacao = undefined;
      if (this.processoId !== processoId) return;
      this.stopHeartbeat$.next();
      this.heartbeat?.unsubscribe();
      this.heartbeat = undefined;
      this.processoId = null;
      this.api.encerrarAtendimentoProcesso(processoId).pipe(catchError(() => EMPTY)).subscribe();
    }, 500);
  }

  private iniciarHeartbeat(processoId: number): void {
    this.stopHeartbeat$.next();
    this.heartbeat?.unsubscribe();
    this.heartbeat = timer(5000, 5000).pipe(
      takeUntil(this.stopHeartbeat$),
      switchMap(() => this.api.iniciarAtendimentoProcesso(processoId).pipe(catchError(() => EMPTY))),
    ).subscribe();
  }

  private cancelarLiberacao(): void {
    if (this.liberacao) clearTimeout(this.liberacao);
    this.liberacao = undefined;
  }
}
