import { Component, OnInit, ViewChild } from '@angular/core';
import { DoadorService } from '../../services/doador.service';
import { EstoqueBolsaService } from '../../services/estoque-bolsa.service';
import { PaginacaoComponent } from '../../componentes/paginacao/paginacao.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-carteira-doacao',
  standalone: true,
  imports: [PaginacaoComponent, FormsModule, CommonModule, ToastNotificacaoComponent],
  templateUrl: './carteira-doacao.component.html',
  styleUrl: './carteira-doacao.component.scss',
})
export class CarteiraDoacaoComponent implements OnInit {
  @ViewChild('toast') toastComponente!: ToastNotificacaoComponent;
  doadores: any[] = [];
  doadoresFiltrados: any[] = [];
  doadoresPaginados: any[] = [];

  busca = '';
  tipoSelecionado = 'Todos';

  tiposSanguineos: string[] = [];

  paginaAtual = 1;
  itensPorPagina = 5;

  constructor(
    private doadorService: DoadorService,
    private estoqueService: EstoqueBolsaService,
  ) {}

  ngOnInit() {
    this.estoqueService.listarDoadoresAptosCarteirinha().subscribe((res) => {
      console.log('RESPOSTA API:', res);

      this.doadores = res;

      this.tiposSanguineos = Array.from(
        new Set(res.map((d: any) => d.tipo_sanguineo)),
      ) as string[];

      this.filtrar();
    });
  }

  filtrar() {
    this.doadoresFiltrados = this.doadores.filter((d) => {
      const matchBusca =
        d.nome.toLowerCase().includes(this.busca.toLowerCase()) ||
        d.cpf.includes(this.busca);

      const matchTipo =
        this.tipoSelecionado === 'Todos' ||
        d.tipo_sanguineo === this.tipoSelecionado;

      return matchBusca && matchTipo;
    });

    this.mudarPagina(1);
  }

  mudarPagina(p: number) {
    this.paginaAtual = p;

    const inicio = (p - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;

    this.doadoresPaginados = this.doadoresFiltrados.slice(inicio, fim);
  }

  uploadCarteirinha(event: any, doador: any) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const formData = new FormData();
    formData.append('carteira_doador', arquivo);

    this.doadorService.enviarCarteirinha(doador.doador_id, formData).subscribe({
      next: () => {
        this.doadores = this.doadores.filter(
          (d) => d.doador_id !== doador.doador_id,
        );

        this.filtrar();

        this.toastComponente.exibir('Carteirinha enviada com sucesso!', true);
      },
      error: () => {
        this.toastComponente.exibir('Erro ao enviar a carteirinha.', false);
      },
    });
  }
}
