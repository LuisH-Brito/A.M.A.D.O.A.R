import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { QuestionarioService } from '../../services/questionario.service';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';
import { TriagemRascunhoService } from '../../services/triagem-rascunho.service';
import { EMPTY } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { AtendimentoProcessoService } from '../../services/atendimento-processo.service';

@Component({
  selector: 'app-form-triagem',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalConfirmacaoComponent,
    ToastNotificacaoComponent,
  ],
  templateUrl: './form-triagem.component.html',
  styleUrl: './form-triagem.component.scss',
})
export class FormTriagemComponent implements OnInit, OnDestroy {
  processoId!: number;
  doador = { nome: '', dataNascimento: '', cpf: '' };
  pressaoArterial = '';
  questionarioVinculado = false;
  questionarioPermiteAptidao: boolean | null = null;

  questionarioRevisado = false;
  processando = false;

  @ViewChild('toast') toast!: ToastNotificacaoComponent;
  modalVisivel = false;
  acaoPendente: boolean | null = null; // true = Apto, false = Inapto
  modalConfig = {
    titulo: '',
    mensagem: '',
    tipo: 'padrao' as 'padrao' | 'usar' | 'descartar',
    textoConfirmar: '',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private questionarioService: QuestionarioService,
    private triagemRascunhoService: TriagemRascunhoService,
    private atendimento: AtendimentoProcessoService,
  ) {
    // getCurrentNavigation só está disponível durante a navegação que cria o
    // componente; por isso a confirmação é consumida já no construtor.
    const navigation = this.router.getCurrentNavigation();
    this.questionarioRevisado =
      navigation?.extras.state?.['retornoRevisaoQuestionario'] === true;
  }

  ngOnDestroy(): void { if (this.processoId) this.atendimento.parar(this.processoId); }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('processoId'));
    if (!id) {
      this.toast.exibir('Processo inválido.', false);
      this.router.navigate(['/processo-doacao-andamento']);
      return;
    }

    this.processoId = id;
    this.atendimento.iniciar(this.processoId).subscribe({
      error: () => {
        alert('Este processo já está em andamento por outro funcionário.');
        this.router.navigate(['/processo-doacao-andamento']);
      },
    });

    const rascunho = this.triagemRascunhoService.obter(this.processoId);
    if (rascunho) {
      this.pressaoArterial = rascunho.pressaoArterial;
    }

    this.api.getProcessoById(this.processoId).subscribe({
      next: (processo) => {
        this.doador = {
          nome: processo?.doador?.nome_completo || '',
          dataNascimento: processo?.doador?.data_nascimento || '',
          cpf: processo?.doador?.cpf || '',
        };

        this.carregarResultadoQuestionario();
      },
      error: () => {
        this.toast.exibir(
          'Não foi possível carregar a ficha de triagem.',
          false,
        );
        this.router.navigate(['/processo-doacao-andamento']);
      },
    });
  }

  private carregarResultadoQuestionario(): void {
    this.questionarioService
      .getQuestionarioPorProcesso(this.processoId)
      .subscribe({
        next: (questionario) => {
          this.questionarioVinculado = true;
          this.questionarioPermiteAptidao = questionario?.validade === true;
        },
        error: (erro) => {
          this.questionarioVinculado = false;
          this.questionarioPermiteAptidao = null;

          if (erro?.status === 404) {
            this.questionarioRevisado = false;
          }
        },
      });
  }

  abrirQuestionarios(): void {
    if (this.processando) return;

    if (!this.processoId) {
      alert('Processo inválido.');
      return;
    }

    this.triagemRascunhoService.salvar(
      this.processoId,
      this.pressaoArterial,
    );
    this.router.navigate([
      '/questionario-processo/proc',
      this.processoId,
      this.doador.cpf,
    ], {
      state: { retornarParaTriagem: true },
    });
  }

  formatarCPF(cpf: string): string {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  aplicarMascaraPressao(valorDigitado: string): void {
    if (!valorDigitado) {
      this.pressaoArterial = '';
      return;
    }

    const valorNormalizado = valorDigitado
      .toLowerCase()
      .replace(/[^0-9x]/g, '');
    if (valorNormalizado.includes('x')) {
      const [sistolica, ...partesDiastolica] = valorNormalizado.split('x');
      const diastolica = partesDiastolica.join('');
      this.pressaoArterial = `${sistolica.slice(0, 3)}x${diastolica.slice(0, 3)}`;
      return;
    }

    const digitandoParaTras =
      valorDigitado.length < this.pressaoArterial.length;
    const apenasNumeros = valorNormalizado.replace(/\D/g, '');
    if (apenasNumeros.length <= 1) {
      this.pressaoArterial = apenasNumeros;
    } else if (apenasNumeros.length === 2) {
      this.pressaoArterial = digitandoParaTras
        ? apenasNumeros
        : `${apenasNumeros}x`;
    } else if (apenasNumeros.length === 3) {
      this.pressaoArterial = `${apenasNumeros.slice(0, 2)}x${apenasNumeros.slice(2)}`;
    } else {
      this.pressaoArterial = `${apenasNumeros.slice(0, 2)}x${apenasNumeros.slice(2, 4)}`;
    }
  }

  get pressaoIncompleta(): boolean {
    return !this.pressaoArterial || this.pressaoArterial.trim().length < 4;
  }

  get orientacaoApto(): string | null {
    if (this.processando) {
      return null;
    }

    if (this.questionarioImpeditivo) {
      return 'O questionário possui respostas incompatíveis com a classificação como apto.';
    }

    const pressaoPendente = this.pressaoIncompleta;
    const questionarioPendente =
      !this.questionarioRevisado ||
      !this.questionarioVinculado ||
      this.questionarioPermiteAptidao === null;

    if (pressaoPendente && questionarioPendente) {
      return 'Para habilitar "Apto", informe a pressão arterial e revise o questionário.';
    }

    if (questionarioPendente) {
      return 'Revise o questionário para habilitar "Apto".';
    }

    if (pressaoPendente) {
      return 'Informe uma pressão arterial válida para habilitar "Apto".';
    }

    return null;
  }

  get questionarioImpeditivo(): boolean {
    return (
      this.questionarioRevisado &&
      this.questionarioVinculado &&
      this.questionarioPermiteAptidao === false
    );
  }

  private validarPressao(): boolean {
    const pressaoLimpa = this.pressaoArterial?.trim();

    if (!pressaoLimpa) {
      this.toast.exibir('Informe a pressão arterial.', false);
      return false;
    }
    const regexPressao = /^\d{2,3}x\d{1,3}$/i;

    if (!regexPressao.test(pressaoLimpa)) {
      this.toast.exibir(
        'Formato de pressão inválido. Digite apenas os números (Ex: 128 para 12x8).',
        false,
      );
      return false;
    }

    return true;
  }

  abrirModal(aprovado: boolean): void {
    if (this.processando) return;
    if (aprovado && !this.validarPressao()) return;

    this.acaoPendente = aprovado;

    if (aprovado) {
      this.modalConfig = {
        titulo: 'Confirmar Aptidão Clínica',
        mensagem: `Deseja aprovar ${this.doador.nome || 'o doador'} na triagem médica e avançar para a coleta de sangue?`,
        tipo: 'usar',
        textoConfirmar: 'Sim, Aprovar',
      };
    } else {
      this.modalConfig = {
        titulo: 'Registrar Inaptidão Clínica',
        mensagem: `Atenção: Deseja registrar que ${this.doador.nome || 'o doador'} está INAPTO? Esta ação encerrará o processo de doação.`,
        tipo: 'descartar',
        textoConfirmar: 'Sim, Reprovar',
      };
    }

    this.modalVisivel = true;
  }

  fecharModal(): void {
    this.modalVisivel = false;
    this.acaoPendente = null;
  }

  confirmarAcaoModal(): void {
    if (this.processando) return;

    this.modalVisivel = false;
    if (this.acaoPendente !== null) {
      this.enviarDecisao(this.acaoPendente);
    }
  }

  private enviarDecisao(aprovado: boolean): void {
    if (this.processando) return;

    const medicoId = localStorage.getItem('usuario_id');
    if (!medicoId) {
      this.toast.exibir(
        'Erro: Não foi possível identificar o médico logado.',
        false,
      );
      return;
    }

    const payload = {
      pressao_arterial: this.pressaoArterial.trim(),
      aprovado: aprovado,
      medico_id: medicoId,
    };
    const novoStatus = aprovado ? 4 : 0; // 4 = Coleta, 0 = Cancelado/Inapto

    this.processando = true;
    this.api
      .decidirTriagem(this.processoId, payload as any)
      .pipe(
        switchMap(() => {
          return this.api
            .atualizarStatusProcesso(this.processoId, novoStatus)
            .pipe(
              catchError(() => {
                this.toast.exibir(
                  'Os dados foram salvos, mas houve um erro ao mudar a etapa do processo.',
                  false,
                );
                return EMPTY;
              }),
            );
        }),
        finalize(() => {
          this.processando = false;
        }),
      )
      .subscribe({
        next: () => {
          this.triagemRascunhoService.limpar(this.processoId);
          const msg = aprovado
            ? 'Doador Apto! Processo enviado para Coleta.'
            : 'Doador Inapto. Processo encerrado.';
          this.toast.exibir(msg, true);
          
          localStorage.setItem('abaAtivaProcessos', 'triagem');
          
          setTimeout(
            () => this.router.navigate(['/processo-doacao-andamento']),
            1500,
          );
        },
        error: (err) => {
          this.toast.exibir(
            err?.error?.erro || 'Erro ao registrar os dados da triagem.',
            false,
          );
        },
      });
  }

  voltar() {
    if (this.processando) return;
    this.triagemRascunhoService.limpar(this.processoId);
    localStorage.setItem('abaAtivaProcessos', 'triagem');
    this.router.navigate(['/processo-doacao-andamento']);
  }
}
