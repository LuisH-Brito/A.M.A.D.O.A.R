import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginacaoComponent } from '../../componentes/paginacao/paginacao.component';
import { EstoqueBolsaService } from '../../services/estoque-bolsa.service';

@Component({
  selector: 'app-estoque-bolsas',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginacaoComponent],
  templateUrl: './estoque-bolsas.component.html',
  styleUrl: './estoque-bolsas.component.scss',
})
export class EstoqueBolsasComponent implements OnInit {
  abaAtiva: string = 'Todos';
  busca: string = '';
  menuFiltroAberto: boolean = false;

  paginaAtual: number = 1;
  itensPorPagina: number = 10;
  totalItensBolsas: number = 0;

  resumoGeral = { validas: 0, vencendo: 0, vencidas: 0 };
  tiposSanguineos: any[] = [];
  bolsasPaginadas: any[] = [];

  abasMenu = [
    'Todos',
    'Bolsa Validas',
    'Bolsa Vencendo',
    'Bolsa Vencidas',
    'Utilizadas',
    'Descartadas',
    'A-',
    'A+',
    'B-',
    'B+',
    'AB-',
    'AB+',
    'O-',
    'O+',
  ];

  private delayBusca: any;

  constructor(
    private router: Router,
    private EstoqueService: EstoqueBolsaService,
  ) {}

  ngOnInit() {
    this.carregarDashboard();
    this.carregarBolsas();
  }

  carregarDashboard() {
    this.EstoqueService.obterDashboard().subscribe({
      next: (dados) => {
        this.resumoGeral = dados.resumoGeral;
        this.tiposSanguineos = dados.tiposSanguineos;
      },
      error: (err) => console.error('Erro ao carregar KPIs:', err),
    });
  }
  carregarBolsas() {
    this.EstoqueService.listarBolsas(
      this.paginaAtual,
      this.abaAtiva,
      this.busca,
    ).subscribe({
      next: (resposta) => {
        this.totalItensBolsas = resposta.count;
        this.bolsasPaginadas = resposta.results.map((b: any) => {
          let dataVencFormatada = 'N/A';
          if (b.data_vencimento) {
            const [ano, mes, dia] = b.data_vencimento.split('-');
            dataVencFormatada = `${dia}/${mes}/${ano}`;
          }
          let dataValFormatada = 'Não validada';
          if (b.validacao_at) {
            const dataObj = new Date(b.validacao_at);
            dataValFormatada = dataObj
              .toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
              .replace(',', ' às');
          }
          return {
            idOriginal: b.id,
            id: `BOL-${b.id}`,
            tipo: `${b.tipo_sanguineo_detalhe.tipo}${b.tipo_sanguineo_detalhe.fator_rh}`,
            status: b.estado_temporal,
            doadorNome: b.doador_nome,
            doadorEmail: b.doador_email || 'Não informado',
            textoVencimento: `Vencimento: ${dataVencFormatada}`,
            enfermeiro: b.enfermeiro_nome || 'N/A',
            medico: b.medico_nome || 'Aguardando',
            dataValidacao: dataValFormatada,
            expandido: false,
            urlLaudo: b.arquivo_laudo,
          };
        });
      },
      error: (err) => console.error('Erro ao carregar estoque:', err),
    });
  }

  aoDigitarBusca() {
    clearTimeout(this.delayBusca);
    this.delayBusca = setTimeout(() => {
      this.paginaAtual = 1;
      this.carregarBolsas();
    }, 500);
  }

  mudarPagina(novaPagina: number) {
    this.paginaAtual = novaPagina;
    this.carregarBolsas();
  }

  selecionarAba(aba: string) {
    this.abaAtiva = aba;
    this.menuFiltroAberto = false;
    this.paginaAtual = 1;
    this.carregarBolsas();
  }

  voltar() {
    this.router.navigate(['/']);
  }

  toggleMenuFiltro() {
    this.menuFiltroAberto = !this.menuFiltroAberto;
  }

  toggleExpand(bolsa: any) {
    bolsa.expandido = !bolsa.expandido;
  }

  registrarUso(bolsa: any) {
    if (
      confirm(`Tem certeza que deseja REGISTRAR O USO da bolsa ${bolsa.id}?`)
    ) {
      this.EstoqueService.registrarUso(bolsa.idOriginal).subscribe({
        next: (res) => {
          alert(res.mensagem);
          this.atualizarTudo();
        },
        error: (err) => alert(err.error?.erro || 'Erro ao registrar uso.'),
      });
    }
  }
  descartarBolsa(bolsa: any) {
    if (
      confirm(`ATENÇÃO! Tem certeza que deseja DESCARTAR a bolsa ${bolsa.id}?`)
    ) {
      this.EstoqueService.descartar(bolsa.idOriginal).subscribe({
        next: (res) => {
          alert(res.mensagem);
          this.atualizarTudo();
        },
        error: (err) => alert(err.error?.erro || 'Erro ao descartar bolsa.'),
      });
    }
  }

  private atualizarTudo() {
    this.carregarBolsas();
    this.carregarDashboard();
  }
}
