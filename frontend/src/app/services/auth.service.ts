import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  refreshToken() {
    const refresh = localStorage.getItem('refresh');

    return this.http.post<any>(`${this.api}/token/refresh/`, {
      refresh: refresh,
    });
  }

  verificarTrocaObrigatoria() {
    return this.http.get<{ deve_alterar_senha: boolean }>(
      `${this.api}/usuarios/me/`,
    ).pipe(map(usuario => usuario.deve_alterar_senha));
  }

  trocarSenhaObrigatoria(senhaAtual: string, novaSenha: string, confirmarNovaSenha: string) {
    return this.http.post<{ mensagem: string }>(
      `${this.api}/usuarios/trocar-senha-obrigatoria/`,
      {
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
        confirmar_nova_senha: confirmarNovaSenha,
      },
    );
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
