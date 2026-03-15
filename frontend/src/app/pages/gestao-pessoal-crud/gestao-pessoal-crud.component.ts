import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaginacaoComponent } from '../../componentes/paginacao/paginacao.component';
import { FuncionariosService } from '../../services/funcionarios.service';
import { Router } from '@angular/router';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';

@Component({
  selector: 'app-gestao-pessoal-crud',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    PaginacaoComponent,
    ModalConfirmacaoComponent,
  ],
  templateUrl: './gestao-pessoal-crud.component.html',
  styleUrl: './gestao-pessoal-crud.component.scss',
})
export class GestaoPessoalCrudComponent {
  busca: string = '';
  filtroSelecionado: string = 'Todos';
  paginaAtual = 1;
  itensPorPagina = 3;
  usuarios: any[] = [];
  modalVisivel = false;

  modalConfig = {
    titulo: '',
    mensagem: '',
    tipo: 'descartar' as 'padrao' | 'usar' | 'descartar',
    textoConfirmar: '',
  };

  usuarioParaExcluir: { id: number; cargo: string } | null = null;

  constructor(
    private funcionarioService: FuncionariosService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  navegarComDados(usuario: any, apenasVisualizar: boolean = false) {
    this.router.navigate(['/cadastro-funcionario'], {
      state: {
        funcionario: usuario,
        visualizar: apenasVisualizar,
      },
    });
  }

  carregarDados() {
    this.funcionarioService.listarTodos().subscribe({
      next: (dados) => {
        this.usuarios = dados;
      },
      error: (err) => console.error('Erro ao buscar dados:', err),
    });
  }

  excluir(id: number, cargo: string) {
    this.usuarioParaExcluir = { id, cargo };

    this.modalConfig = {
      titulo: 'Desativar Funcionário',
      mensagem: `Tem certeza que deseja desativar este ${cargo}? O funcionário não poderá mais acessar o sistema.`,
      tipo: 'descartar',
      textoConfirmar: 'Desativar',
    };

    this.modalVisivel = true;
  }

  confirmarExclusao() {
    if (!this.usuarioParaExcluir) return;

    const { id, cargo } = this.usuarioParaExcluir;

    this.funcionarioService.excluirFuncionario(id, cargo).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter((u) => u.id !== id);
        this.verificarPaginacaoAposExclusao();
        this.fecharModal();
      },
      error: () => {
        alert('Erro ao desativar funcionário.');
        this.fecharModal();
      },
    });
  }

  fecharModal() {
    this.modalVisivel = false;
    this.usuarioParaExcluir = null;
  }

  irParaEditar(usuario: any) {
    this.router.navigate(['/cadastro-funcionario'], {
      state: { funcionario: usuario },
    });
  }

  get usuariosFiltrados() {
    return this.usuarios.filter((usuario) => {
      const matchBusca =
        (usuario.nome || '').toLowerCase().includes(this.busca.toLowerCase()) ||
        (usuario.cpf || '').includes(this.busca);

      const matchFiltro =
        this.filtroSelecionado === 'Todos' ||
        usuario.cargo === this.filtroSelecionado;

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

  private verificarPaginacaoAposExclusao() {
    const maxPaginas = Math.ceil(
      this.usuariosFiltrados.length / this.itensPorPagina,
    );
    if (this.paginaAtual > maxPaginas && maxPaginas > 0) {
      this.paginaAtual = maxPaginas;
    }
  }
  voltar() {
    this.router.navigate(['/gestao-pessoal']);
  }
}
