import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DoadorService {
  private apiUrl = 'http://127.0.0.1:8000/api/doadores/';

  constructor(private http: HttpClient) {}

  obterDoador(): Observable<any> {
    return this.http.get(`${this.apiUrl}me/`);
  }

  cadastrar(dadosDoador: any): Observable<any> {
    return this.http.post(this.apiUrl, dadosDoador);
  }

  atualizarDoador(dados: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}me/`, dados);
  }

  listarTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
