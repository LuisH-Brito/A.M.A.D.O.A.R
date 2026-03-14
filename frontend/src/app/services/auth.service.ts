import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

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

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
