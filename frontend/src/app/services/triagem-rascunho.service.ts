import { Injectable } from '@angular/core';

interface RascunhoTriagem {
  pressaoArterial: string;
}

@Injectable({
  providedIn: 'root',
})
export class TriagemRascunhoService {
  private readonly rascunhos = new Map<number, RascunhoTriagem>();

  salvar(processoId: number, pressaoArterial: string): void {
    this.rascunhos.set(processoId, { pressaoArterial });
  }

  obter(processoId: number): RascunhoTriagem | undefined {
    return this.rascunhos.get(processoId);
  }

  limpar(processoId: number): void {
    this.rascunhos.delete(processoId);
  }
}
