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

  iniciarAtendimentoProcesso(id: number) {
    return this.http.post(`${this.baseUrl}processos/${id}/atendimento-heartbeat/`, {});
  }

  encerrarAtendimentoProcesso(id: number) {
    return this.http.delete(`${this.baseUrl}processos/${id}/atendimento/`);
  }

  salvarDadosClinicos(payload: any) {
    return this.http.post(`${this.baseUrl}dados-clinicos/`, payload);
  }

  atualizarDadosClinicos(id: number, payload: any) {
    return this.http.patch(`${this.baseUrl}dados-clinicos/${id}/`, payload);
  }

  atualizarStatusProcesso(id: number, status: number) {
    return this.http.patch(`${this.baseUrl}processos/${id}/atualizar-status/`, {
      status,
    });
  }

  iniciarDoacao(cpf: string) {
    return this.http.post(`${this.baseUrl}processos/iniciar/`, { cpf });
  }

  decidirTriagem(
    processoId: number,
    payload: {
      pressao_arterial: string;
      aprovado: boolean;
      medico_id?: string | null;
    },
  ) {
    return this.http.post(
      `${this.baseUrl}processos/${processoId}/decidir-triagem/`,
      payload,
    );
  }
  listarEnfermeirosDisponiveis() {
    return this.http.get<any[]>(`${this.baseUrl}enfermeiros/disponiveis/`);
  }

  finalizarColeta(
    processoId: number,
    payload: { enfermeiro_id: number; puncao_sucesso: boolean },
  ) {
    return this.http.post(
      `${this.baseUrl}processos/${processoId}/finalizar-coleta/`,
      payload,
    );
  }
  searchEmailByCpf(cpf: string) {
    return this.http.get<{ email: string }>(
      `${this.baseUrl}usuarios/search-email-by-cpf/`,
      { params: { cpf } },
    );
  }
  requestCodePasswordReset(cpf: string) {
    return this.http.post<{ mensagem: string }>(
      `${this.baseUrl}usuarios/request-code-password-reset/`,
      { cpf },
    );
  }
  confirmPasswordReset(cpf: string, codigo: string, novaSenha: string) {
    return this.http.post<{ mensagem: string }>(
      `${this.baseUrl}usuarios/confirm-password-reset/`,
      {
        cpf,
        codigo,
        nova_senha: novaSenha,
      },
    );
  }
  validatePasswordResetCode(cpf: string, codigo: string) {
    return this.http.post<{ mensagem: string }>(
      `${this.baseUrl}usuarios/validate-password-reset-code/`,
      { cpf, codigo },
    );
  }
}
