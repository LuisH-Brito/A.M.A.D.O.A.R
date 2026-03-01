import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class QuestionarioService {
  private http = inject(HttpClient);
  
  private apiUrl = 'http://127.0.0.1:8000/api/'; 

  getPerguntas() {
    return this.http.get<any[]>(this.apiUrl + 'perguntas/');
  }

  salvarQuestionario(dados: any) {
    return this.http.post(this.apiUrl + 'questionarios/', dados);
  }

  getQuestionariosPorCpf(cpf: string) {
    return this.http.get<any[]>(`${this.apiUrl}listar-questionarios/?cpf=${cpf}`);
  }
}