import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DoadorService {
  private apiUrl = 'http://127.0.0.1:8000/api/doadores';

  constructor(private http: HttpClient) {}

  criar(doador: any) {
    return this.http.post(this.apiUrl + '/', doador);
  }

  listar() {
    return this.http.get(this.apiUrl + '/');
  }
}
