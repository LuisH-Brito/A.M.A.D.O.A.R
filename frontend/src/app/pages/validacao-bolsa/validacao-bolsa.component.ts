import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EstoqueBolsaService } from '../../services/estoque-bolsa.service';
import { ExameDoadorService } from '../../services/exame-doador.service';
import { DoadorService } from '../../services/doador.service';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-validacao-bolsa',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ModalConfirmacaoComponent,
    ToastNotificacaoComponent,
  ],
  templateUrl: './validacao-bolsa.component.html',
  styleUrl: './validacao-bolsa.component.scss',
})
export class ValidacaoBolsaComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('fileInputExameDoador') fileInputExameDoador!: ElementRef;
  @ViewChild('toast') toastComponente!: ToastNotificacaoComponent;

  modalVisivel = false;
  modalDados = {
    titulo: '',
    mensagem: '',
    tipo: 'padrao' as any,
    textoBtn: '',
  };
  acaoConfirmacao!: () => void;

  bolsaId!: number;
  bolsaDados: any = null;
  tiposSanguineos: any[] = [];

  tipoSanguineoSelecionado: number | null = null;
  arquivoLaudo: File | null = null;
  arquivoExameDoador: File | null = null;
  carregando: boolean = false;

  sangueRegistradoDoador: string | null = null;
  doadorFatorRh: string | null = null;
  doadorTipoSanguineo: string | null = null;

  get formularioInvalido(): boolean {
    return (
      !this.tipoSanguineoSelecionado ||
      !this.arquivoLaudo ||
      !this.arquivoExameDoador
    );
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private estoqueService: EstoqueBolsaService,
    private exameDoadorService: ExameDoadorService,
    private doadorService: DoadorService,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.bolsaId = +idParam;
      this.carregarDadosBolsa();
      this.carregarTiposSanguineos();
    } else {
      this.voltar();
    }
  }

  carregarDadosBolsa() {
    this.estoqueService.obterBolsa(this.bolsaId).subscribe({
      next: (res) => {
        this.bolsaDados = res;
        this.carregarSanguePrevioDoador();
      },
      error: () => {
        this.toastComponente.exibir('Erro ao carregar os dados da bolsa.', false);
        this.voltar();
      },
    });
  }

  carregarTiposSanguineos() {
    this.estoqueService.obterTiposSanguineos().subscribe({
      next: (res) => {
        this.tiposSanguineos = Array.isArray(res) ? res : res.results;
        this.tentarPreSelecionarSangue();
      },
      error: () => console.error('Erro ao buscar tipos sanguíneos.'),
    });
  }

  carregarSanguePrevioDoador() {
    const doadorId =
      this.bolsaDados?.doador_id ||
      this.bolsaDados?.doador?.id ||
      this.bolsaDados?.doador;

    if (doadorId) {
      this.doadorService.obterDoadorPorId(doadorId).subscribe({
        next: (doador: any) => {
          if (doador.tipo_sanguineo_declarado && doador.fator_rh) {
            this.doadorTipoSanguineo = doador.tipo_sanguineo_declarado;
            this.doadorFatorRh = doador.fator_rh;
            this.sangueRegistradoDoador = `${this.doadorTipoSanguineo}${this.doadorFatorRh}`;

            this.tentarPreSelecionarSangue();
          }
        },
        error: (err) =>
          console.log('Doador não possui sangue registrado ou erro ao buscar.'),
      });
    }
  }

  tentarPreSelecionarSangue() {
    if (
      this.tiposSanguineos.length > 0 &&
      this.sangueRegistradoDoador &&
      !this.tipoSanguineoSelecionado
    ) {
      const tipoEncontrado = this.tiposSanguineos.find(
        (t) =>
          t.tipo === this.doadorTipoSanguineo &&
          t.fator_rh === this.doadorFatorRh,
      );

      if (tipoEncontrado) {
        this.tipoSanguineoSelecionado = tipoEncontrado.id;
      }
    }
  }

  acionarInputArquivo() {
    this.fileInput.nativeElement.click();
  }

  aoSelecionarArquivo(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.arquivoLaudo = file;
    } else {
      this.toastComponente.exibir(
        'Por favor, selecione apenas arquivos PDF.',
        false,
      );
      this.arquivoLaudo = null;
    }
  }
  acionarInputExameDoador() {
    if (this.fileInputExameDoador) {
      this.fileInputExameDoador.nativeElement.click();
    }
  }

  aoSelecionarExameDoador(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.arquivoExameDoador = file;
    } else {
      this.toastComponente.exibir(
        'Por favor, selecione apenas arquivos PDF para o exame do doador.',
        false,
      );
      this.arquivoExameDoador = null;
    }
  }

  private salvarExameDoador(callbackConclusao: () => void) {
    const doadorId =
      this.bolsaDados?.doador_id ||
      this.bolsaDados?.doador?.id ||
      this.bolsaDados?.doador;

    if (this.arquivoExameDoador && doadorId) {
      const nomeExame = `Exame Lab - Bolsa #${this.bolsaId}`;

      this.exameDoadorService
        .enviarExame(doadorId, nomeExame, this.arquivoExameDoador)
        .subscribe({
          next: () => {
            console.log('Exame do doador salvo em segundo plano.');
            callbackConclusao();
          },
          error: (err) => {
            console.error('Erro ao salvar exame do doador', err);
            callbackConclusao();
          },
        });
    } else {
      callbackConclusao();
    }
  }

  private atualizarSangueDoador(callbackConclusao: () => void) {
    const doadorId =
      this.bolsaDados?.doador_id ||
      this.bolsaDados?.doador?.id ||
      this.bolsaDados?.doador;

    const tipoSelecionadoObj = this.tiposSanguineos.find(
      (t) => t.id === Number(this.tipoSanguineoSelecionado),
    );

    if (doadorId && tipoSelecionadoObj) {
      const dadosSangue = {
        tipo_sanguineo: tipoSelecionadoObj.tipo,
        fator_rh: tipoSelecionadoObj.fator_rh,
      };

      this.doadorService
        .atualizarTipoSanguineo(doadorId, dadosSangue)
        .subscribe({
          next: (res) => {
            console.log(res.mensagem);
            callbackConclusao();
          },
          error: (err) => {
            console.error('Erro ao atualizar sangue do doador', err);
            callbackConclusao();
          },
        });
    } else {
      callbackConclusao();
    }
  }

  liberarParaEstoque() {
    this.abrirModalConfirmacao(
      'Liberar para Estoque',
      `Confirma a validação da bolsa #${this.bolsaId} com o tipo sanguíneo ${this.tiposSanguineos.find((t) => t.id === Number(this.tipoSanguineoSelecionado))?.tipo}${this.tiposSanguineos.find((t) => t.id === Number(this.tipoSanguineoSelecionado))?.fator_rh}? Esta ação alimentará o estoque principal.`,
      'usar',
      'Sim, Liberar',
      () => {
        this.carregando = true;
        const formData = new FormData();
        formData.append(
          'tipo_sanguineo',
          this.tipoSanguineoSelecionado!.toString(),
        );
        formData.append('arquivo_laudo', this.arquivoLaudo!);

        const medicoId = localStorage.getItem('usuario_id');
        if (medicoId) formData.append('medico_validacao', medicoId);

        this.estoqueService.validarBolsa(this.bolsaId, formData).subscribe({
          next: (res) => {
            this.salvarExameDoador(() => {
              this.atualizarSangueDoador(() => {
                this.toastComponente.exibir(
                  'Bolsa validada e enviada para o estoque com sucesso!',
                );
                setTimeout(() => {
                  this.router.navigate(['/aguardando-validacao-bolsa']);
                }, 2000);
              });
            });
          },
          error: (err) => {
            this.toastComponente.exibir(
              err.error?.erro || 'Erro ao validar a bolsa.',
              false,
            );
            this.carregando = false;
          },
        });
      },
    );
  }

  marcarComoInapto() {
    this.abrirModalConfirmacao(
      'Descartar Bolsa',
      `ATENÇÃO: Tem certeza que deseja marcar esta bolsa como Inapta? O laudo será salvo como evidência e ela não irá para o estoque útil.`,
      'descartar',
      'Sim, Marcar Inapto',
      () => {
        this.carregando = true;
        const formData = new FormData();
        formData.append(
          'tipo_sanguineo',
          this.tipoSanguineoSelecionado!.toString(),
        );
        formData.append('arquivo_laudo', this.arquivoLaudo!);

        const medicoId = localStorage.getItem('usuario_id');
        if (medicoId) {
          formData.append('medico_validacao', medicoId);
        } else {
          this.toastComponente.exibir(
            'Acesso negado: Médico não identificado.',
            false,
          );
          this.carregando = false;
          return;
        }

        this.estoqueService.descartar(this.bolsaId, formData).subscribe({
          next: () => {
            this.salvarExameDoador(() => {
              this.toastComponente.exibir(
                'Bolsa descartada e evidências salvas com sucesso.',
              );
              setTimeout(() => {
                this.router.navigate(['/aguardando-validacao-bolsa']);
              }, 2000);
            });
          },
          error: (err) => {
            this.toastComponente.exibir(
              err.error?.erro || 'Erro ao descartar a bolsa.',
              false,
            );
            this.carregando = false;
          },
        });
      },
    );
  }

  abrirModalConfirmacao(
    titulo: string,
    mensagem: string,
    tipo: 'descartar' | 'usar' | 'padrao',
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

  voltar() {
    this.router.navigate(['/aguardando-validacao-bolsa']);
  }
}
