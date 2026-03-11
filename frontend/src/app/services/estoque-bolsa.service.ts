import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EstoqueBolsaService {
  private baseUrl = 'http://localhost:8000/api';
  private endpoint = `${this.baseUrl}/estoque`;
  constructor(private http: HttpClient) {}
  obterDashboard(): Observable<any> {
    return this.http.get(`${this.endpoint}/dashboard/`);
  }

  listarBolsas(
    pagina: number,
    filtroAba: string,
    tipoAtivo: string,
    busca: string,
  ): Observable<any> {
    let params = new HttpParams().set('page', pagina.toString());

    if (filtroAba && filtroAba !== 'Todos') {
      params = params.set('filtro_aba', filtroAba);
    }

    if (tipoAtivo && tipoAtivo !== 'Todos') {
      params = params.set('filtro_tipo', tipoAtivo);
    }

    if (busca) {
      params = params.set('search', busca);
    }
    return this.http.get(`${this.endpoint}/`, { params });
  }

  listarBolsasAguardando(): Observable<any> {
    const params = new HttpParams().set('filtro_aba', 'Aguardando');
    return this.http.get(`${this.endpoint}/`, { params });
  }

  registrarUso(id: number): Observable<any> {
    return this.http.patch(`${this.endpoint}/${id}/registrar_uso/`, {});
  }

  descartar(id: number, formData: FormData = new FormData()): Observable<any> {
    return this.http.post(`${this.endpoint}/${id}/descartar/`, formData);
  }

  validarBolsa(id: number, formData: FormData): Observable<any> {
    return this.http.patch(`${this.endpoint}/${id}/validar/`, formData);
  }

  obterTiposSanguineos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/tipos-sanguineos/`);
  }

  obterBolsa(id: number): Observable<any> {
    return this.http.get(`${this.endpoint}/${id}/`);
  }
}
