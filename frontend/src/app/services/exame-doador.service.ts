import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ExameDoadorService {
  private apiUrl = 'http://127.0.0.1:8000/api/exames-doador/';

  constructor(private http: HttpClient) {}

  enviarExame(
    doadorId: number,
    nomeArquivo: string,
    arquivo: File,
  ): Observable<any> {
    const formData = new FormData();
    formData.append('doador', doadorId.toString());
    formData.append('nome_arquivo', nomeArquivo);
    formData.append('arquivo', arquivo);
    return this.http.post(this.apiUrl, formData);
  }

  listarMeusExames(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
