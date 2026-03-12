import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FuncionariosService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Método que busca funcionários de 3 endpoints diferentes e os une em uma única lista.
   * Utiliza o operador forkJoin para esperar que todas as requisições terminem
   * antes de processar os dados.
   */
  listarTodos(): Observable<any[]> {
    const medicos = this.http.get<any[]>(`${this.baseUrl}/medicos/`);
    const enfermeiros = this.http.get<any[]>(`${this.baseUrl}/enfermeiros/`);
    const recepcionistas = this.http.get<any[]>(
      `${this.baseUrl}/recepcionistas/`,
    );

    return forkJoin([medicos, enfermeiros, recepcionistas]).pipe(
      map(([m, e, r]) => {
        const mapear = (lista: any[], cargoNome: string) =>
          lista.map((u) => ({
            ...u,
            nome: u.nome_completo,
            cargo: cargoNome,
          }));

        return [
          ...mapear(m, 'Médico'),
          ...mapear(e, 'Enfermeiro'),
          ...mapear(r, 'Recepcionista'),
        ];
      }),
    );
  }

  /**
   * Atualiza os dados de um funcionário existente.
   * Identifica o endpoint correto baseado no cargo e prepara o payload
   * no formato snake_case esperado pelo Django.
   */
  editar(id: number, dados: any): Observable<any> {
    let endpoint = '';

    if (dados.cargo === 'Médico') endpoint = 'medicos';
    else if (dados.cargo === 'Enfermeiro') endpoint = 'enfermeiros';
    else if (dados.cargo === 'Recepcionista') endpoint = 'recepcionistas';

    const url = `${this.baseUrl}/${endpoint}/${id}/`;

    const payload: any = {
      cpf: dados.cpf,
      nome_completo: dados.nomeCompleto || dados.nome,
      email: dados.email,
      data_nascimento: dados.dataNascimento,
      endereco: dados.endereco,
    };

    if (dados.senha && dados.senha.trim() !== '') {
      payload.password = dados.senha;
    }

    if (dados.cargo === 'Médico') payload.crm = dados.registro;
    if (dados.cargo === 'Enfermeiro') payload.coren = dados.registro;

    return this.http.put(url, payload);
  }

  obterPerfilPessoal(cargo: string): Observable<any> {
    let endpoint = '';
    if (cargo === 'medico') endpoint = 'medicos';
    else if (cargo === 'enfermeiro') endpoint = 'enfermeiros';
    else if (cargo === 'recepcionista') endpoint = 'recepcionistas';
    else if (cargo === 'administrador') endpoint = 'administradores';

    // Chama a rota /me/ de cada cargo
    return this.http.get(`${this.baseUrl}/${endpoint}/me/`);
  }

  /* Atualiza os dados do  funcionário logado*/
  atualizarPerfilPessoal(cargo: string, dados: any): Observable<any> {
    let endpoint = '';
    if (cargo === 'medico') endpoint = 'medicos';
    else if (cargo === 'enfermeiro') endpoint = 'enfermeiros';
    else if (cargo === 'recepcionista') endpoint = 'recepcionistas';
    else if (cargo === 'administrador') endpoint = 'administradores';

    return this.http.patch(`${this.baseUrl}/${endpoint}/me/`, dados);
  }


  /**
   * Remove um funcionário do sistema.
   * Requer o ID e o Cargo para saber qual tabela do banco de dados acessar.
   */
  excluirFuncionario(id: number, cargo: string): Observable<any> {
    let endpoint = '';
    if (cargo === 'Médico') endpoint = 'medicos';
    else if (cargo === 'Enfermeiro') endpoint = 'enfermeiros';
    else if (cargo === 'Recepcionista') endpoint = 'recepcionistas';

    return this.http.delete(`${this.baseUrl}/${endpoint}/${id}/`);
  }

  /**
   * Cria um novo registro de funcionário.
   * Define o CPF como username por padrão para autenticação no Django.
   */
  cadastrar(dados: any): Observable<any> {
    let endpoint = '';
    if (dados.cargo === 'Médico') endpoint = 'medicos';
    else if (dados.cargo === 'Enfermeiro') endpoint = 'enfermeiros';
    else if (dados.cargo === 'Recepcionista') endpoint = 'recepcionistas';

    const url = `${this.baseUrl}/${endpoint}/`;

    const payload: any = {
      username: dados.cpf,
      nome_completo: dados.nomeCompleto,
      email: dados.email,
      data_nascimento: dados.dataNascimento,
      endereco: dados.endereco,
      password: dados.senha,
    };

    if (dados.cargo === 'Médico') payload.crm = dados.registro;
    if (dados.cargo === 'Enfermeiro') payload.coren = dados.registro;

    return this.http.post(url, payload);
  }
}
