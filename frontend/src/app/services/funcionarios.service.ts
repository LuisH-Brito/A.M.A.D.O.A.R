import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FuncionariosService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  cadastrar(dados: any): Observable<any> {
    let url = '';

    if (dados.cargo === 'Médico') {
      url = `${this.baseUrl}/medicos/`;
    } else if (dados.cargo === 'Enfermeiro') {
      url = `${this.baseUrl}/enfermeiros/`;
    } else if (dados.cargo === 'Recepcionista') {
      url = `${this.baseUrl}/recepcionistas/`;
    }

    const payload: any = {
      username: dados.cpf,
      cpf: dados.cpf,
      nome_completo: dados.nomeCompleto,
      email: dados.email,
      data_nascimento: dados.dataNascimento,
      endereco: dados.endereco,
      password: dados.senha,
    };

    if (dados.cargo === 'Médico') {
      payload.crm = dados.registro;
    }

    if (dados.cargo === 'Enfermeiro') {
      payload.coren = dados.registro;
    }

    return this.http.post(url, payload);
  }
}
