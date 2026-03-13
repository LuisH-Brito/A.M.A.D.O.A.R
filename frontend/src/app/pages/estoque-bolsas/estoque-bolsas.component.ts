import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginacaoComponent } from '../../componentes/paginacao/paginacao.component';
import { EstoqueBolsaService } from '../../services/estoque-bolsa.service';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';

@Component({
  selector: 'app-estoque-bolsas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginacaoComponent,
    ModalConfirmacaoComponent,
  ],
  templateUrl: './estoque-bolsas.component.html',
  styleUrl: './estoque-bolsas.component.scss',
})
export class EstoqueBolsasComponent implements OnInit {
  abaAtiva: string = 'Todos';
  tipoAtivo: string = 'Todos';
  busca: string = '';
  menuFiltroAberto: boolean = false;
  notificacaoAtiva: boolean = false;
  notificacaoMensagem: string = '';
  notificacaoTimeout: any;
  modalVisivel = false;
  modalDados = {
    titulo: '',
    mensagem: '',
    tipo: 'padrao' as any,
    textoBtn: '',
  };
  bolsaSelecionada: any;

  paginaAtual: number = 1;
  itensPorPagina: number = 10;
  totalItensBolsas: number = 0;

  resumoGeral = {
    total: 0,
    validas: 0,
    vencendo: 0,
    vencidas: 0,
    utilizadas: 0,
    descartadas: 0,
  };
  tiposSanguineos: any[] = [];
  bolsasPaginadas: any[] = [];

  abasMenu = [
    'Todos',
    'Bolsa Validas',
    'Bolsa Vencendo',
    'Bolsa Vencidas',
    'Utilizadas',
    'Descartadas',
  ];
  tiposMenu = ['Todos', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+', 'O-', 'O+'];
  private delayBusca: any;

  // Controla o estado de 'carregamento' individual de cada botão de notificação
  enviandoNotificacao: { [key: string]: boolean } = {}; 

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
      this.tipoAtivo,
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
    window.scrollTo({ top: 1, behavior: 'smooth' });
  }

  selecionarAba(aba: string) {
    this.abaAtiva = aba;
    this.menuFiltroAberto = false;
    this.paginaAtual = 1;
    this.carregarBolsas();
  }

  selecionarTipo(tipo: string) {
    this.tipoAtivo = tipo;
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

  acaoConfirmacao!: () => void;

  abrirModalConfirmacao(
    titulo: string,
    mensagem: string,
    tipo: 'descartar' | 'usar',
    textoBtn: string,
    acao: () => void,
  ) {
    this.modalDados = { titulo, mensagem, tipo, textoBtn };
    this.acaoConfirmacao = acao;
    this.modalVisivel = true;
  }

  executarAcaoModal() {
    this.modalVisivel = false;
    if (this.acaoConfirmacao) {
      this.acaoConfirmacao();
    }
  }

  registrarUso(bolsa: any) {
    this.abrirModalConfirmacao(
      'Registrar Uso',
      `Tem certeza que deseja registrar o uso da bolsa ${bolsa.id}? Esta ação dará baixa no estoque e não poderá ser desfeita.`,
      'usar',
      'Sim, Registrar Uso',
      () => {
        this.EstoqueService.registrarUso(bolsa.idOriginal).subscribe({
          next: (res) => {
            this.exibirNotificacao(res.mensagem);
            this.atualizarTudo();
          },
          error: (err) => alert(err.error?.erro || 'Erro ao registrar uso.'),
        });
      },
    );
  }

  descartarBolsa(bolsa: any) {
    this.abrirModalConfirmacao(
      'Descartar Bolsa',
      `ATENÇÃO! Tem certeza que deseja descartar a bolsa ${bolsa.id}? Este item será removido do estoque útil de forma irreversível.`,
      'descartar',
      'Sim, Descartar',
      () => {
        this.EstoqueService.descartar(bolsa.idOriginal).subscribe({
          next: (res) => {
            this.exibirNotificacao(res.mensagem);
            this.atualizarTudo();
          },
          error: (err) => alert(err.error?.erro || 'Erro ao descartar bolsa.'),
        });
      },
    );
  }

  // Função que chama o backend para notificar os doadores de um tipo específico
  notificarDoadores(tipo: string) {
    this.enviandoNotificacao[tipo] = true;
    this.EstoqueService.notificarDoadoresCritico(tipo).subscribe({
      next: (res) => {
        this.exibirNotificacao(res.mensagem);
        this.enviandoNotificacao[tipo] = false;
      },
      error: (err) => {
        alert(err.error?.erro || 'Erro ao enviar notificação.');
        this.enviandoNotificacao[tipo] = false;
      }
    });
  }

  private atualizarTudo() {
    this.carregarBolsas();
    this.carregarDashboard();
  }

  exibirNotificacao(mensagem: string) {
    this.notificacaoMensagem = mensagem;
    this.notificacaoAtiva = true;

    clearTimeout(this.notificacaoTimeout);
    this.notificacaoTimeout = setTimeout(() => {
      this.notificacaoAtiva = false;
    }, 6000);
  }
}
