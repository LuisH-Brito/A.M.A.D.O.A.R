import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaginacaoComponent } from '../../componentes/paginacao/paginacao.component';

@Component({
  selector: 'app-gestao-pessoal-crud',
  standalone: true,
  imports: [FormsModule, CommonModule, PaginacaoComponent],
  templateUrl: './gestao-pessoal-crud.component.html',
  styleUrl: './gestao-pessoal-crud.component.scss',
})
export class GestaoPessoalCrudComponent {
  busca: string = '';
  filtroSelecionado: string = 'Todos';

  paginaAtual = 1;
  itensPorPagina = 3;

  usuarios = [
    { id: 1, nome: 'Carlos Martins', cargo: 'Médico', ativo: true },
    { id: 2, nome: 'Jean', cargo: 'Recepcionista', ativo: false },
    { id: 3, nome: 'Macilon', cargo: 'Médico', ativo: true },
    { id: 4, nome: 'Ana Paula', cargo: 'Enfermeiro', ativo: false },
    { id: 5, nome: 'Juliana Souza', cargo: 'Enfermeiro', ativo: false },
    { id: 6, nome: 'Roberto Silva', cargo: 'Enfermeiro', ativo: false },
    { id: 7, nome: 'Fernanda Costa', cargo: 'Recepcionista', ativo: true },
  ];

  get usuariosFiltrados() {
    return this.usuarios.filter((usuario) => {
      const matchBusca = usuario.nome
        .toLowerCase()
        .includes(this.busca.toLowerCase());

      const matchFiltro =
        this.filtroSelecionado === 'Todos' ||
        usuario.cargo === this.filtroSelecionado;

      return matchBusca && matchFiltro;
    });
  }

  get totalPaginas() {
    return Math.ceil(this.usuariosFiltrados.length / this.itensPorPagina);
  }

  get paginas() {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get usuariosPaginados() {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    return this.usuariosFiltrados.slice(inicio, fim);
  }

  mudarPagina(novaPagina: number) {
    this.paginaAtual = novaPagina;
  }

  excluir(id: number) {
    this.usuarios = this.usuarios.filter((u) => u.id !== id);

    const maxPaginas = Math.ceil(this.usuariosFiltrados.length / this.itensPorPagina);
    if (this.paginaAtual > maxPaginas && maxPaginas > 0) {
      this.paginaAtual = maxPaginas;
    }
  }
}
