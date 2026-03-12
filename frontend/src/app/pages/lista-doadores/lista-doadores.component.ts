import { Component } from '@angular/core';
import { DoadorService } from '../../services/doador.service';
import { Router } from '@angular/router';
import { PaginacaoComponent } from '../../componentes/paginacao/paginacao.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-doadores',
  standalone: true,
  imports: [PaginacaoComponent, CommonModule, FormsModule],
  templateUrl: './lista-doadores.component.html',
  styleUrl: './lista-doadores.component.scss',
})
export class ListaDoadoresComponent {
  busca: string = '';
  filtroSelecionado: string = 'Todos';
  paginaAtual = 1;
  itensPorPagina = 10;
  usuarios: any[] = [];
  doadorAberto: number | null = null;

  constructor(
    private doadorService: DoadorService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  toggleExpand(usuario: any) {
    usuario.expandido = !usuario.expandido;
  }

  navegarComDados(usuario: any, apenasVisualizar: boolean = false) {
    this.router.navigate(['/cadastro'], {
      state: {
        doador: usuario,
        visualizar: apenasVisualizar,
      },
    });
  }

  carregarDados() {
    this.doadorService.listarTodos().subscribe({
      next: (dados) => {
        this.usuarios = dados;
        console.log('Dados dos doadores:', this.usuarios);
      },
      error: (err) => console.error('Erro ao buscar dados:', err),
    });
  }

  get usuariosFiltrados() {
    const busca = this.busca.trim().toLowerCase();

    return this.usuarios.filter((usuario) => {
      const matchBusca =
        (usuario.nome_completo || '').toLowerCase().includes(busca) ||
        (usuario.cpf || '').includes(busca);

      const tipoCompleto = `${usuario.tipo_sanguineo_declarado}${usuario.fator_rh}`;

      const matchFiltro =
        this.filtroSelecionado === 'Todos' ||
        tipoCompleto === this.filtroSelecionado;

      return matchBusca && matchFiltro;
    });
  }

  get totalPaginas() {
    return Math.ceil(this.usuariosFiltrados.length / this.itensPorPagina);
  }

  get usuariosPaginados() {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    return this.usuariosFiltrados.slice(inicio, fim);
  }

  mudarPagina(novaPagina: number) {
    this.paginaAtual = novaPagina;
  }
}
