import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://127.0.0.1:8000/api/';

  getDoadores(cpf?: string) {
    const options = cpf ? { params: { cpf } } : undefined;
    return this.http.get(this.baseUrl + 'doadores/', options);
  }

  getProcessos() {
    return this.http.get(this.baseUrl + 'processos/');
  }

  getProcessoById(id: number) {
    return this.http.get<any>(`${this.baseUrl}processos/${id}/`);
  }

  salvarDadosClinicos(payload: any) {
    return this.http.post(`${this.baseUrl}dados-clinicos/`, payload);
  }

  atualizarStatusProcesso(id: number, status: number) {
    return this.http.patch(`${this.baseUrl}processos/${id}/atualizar-status/`, { status });
  }

  iniciarDoacao(cpf: string) {
    return this.http.post(`${this.baseUrl}processos/iniciar/`, { cpf });
  }
}
