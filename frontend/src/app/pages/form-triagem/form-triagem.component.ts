import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { QuestionarioService } from '../../services/questionario.service';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';

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
export class FormTriagemComponent implements OnInit {
  processoId!: number;
  doador = { nome: '', dataNascimento: '', cpf: '' };
  pressaoArterial = '';
  questionarioVinculado = false;

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
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('processoId'));
    if (!id) {
      alert('Processo inválido.');
      this.router.navigate(['/processo-doacao-andamento']);
      return;
    }

    this.processoId = id;

    this.api.getProcessoById(this.processoId).subscribe({
      next: (processo) => {
        this.doador = {
          nome: processo?.doador?.nome_completo || '',
          dataNascimento: processo?.doador?.data_nascimento || '',
          cpf: processo?.doador?.cpf || '',
        };

        // Em vez de olhar pro processo, olha pro histórico do CPF
        if (this.doador.cpf) {
          this.questionarioService
            .getQuestionariosPorCpf(this.doador.cpf)
            .subscribe({
              next: (questionarios) => {
                this.questionarioVinculado =
                  questionarios && questionarios.length > 0;
              },
            });
        }
      },
      error: () => {
        alert('Não foi possível carregar a ficha de triagem.');
        this.router.navigate(['/processo-doacao-andamento']);
      },
    });
  }

  abrirQuestionarios(): void {
    if (!this.processoId) {
      alert('Processo inválido.');
      return;
    }
    this.router.navigate([
      '/questionario-processo/proc',
      this.processoId,
      this.doador.cpf,
    ]);
  }

  private validarPressao(): boolean {
    if (!this.pressaoArterial?.trim()) {
      this.toast.exibir('Informe a pressão arterial.', false);
      return false;
    }
    return true;
  }

  abrirModal(aprovado: boolean): void {
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
    this.modalVisivel = false;
    if (this.acaoPendente !== null) {
      this.enviarDecisao(this.acaoPendente);
    }
  }

  private enviarDecisao(aprovado: boolean): void {
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

    this.api.decidirTriagem(this.processoId, payload as any).subscribe({
      next: () => {
        const novoStatus = aprovado ? 4 : 0; // 4 = Coleta, 0 = Cancelado/Inapto

        this.api
          .atualizarStatusProcesso(this.processoId, novoStatus)
          .subscribe({
            next: () => {
              const msg = aprovado
                ? 'Doador Apto! Processo enviado para Coleta.'
                : 'Doador Inapto. Processo encerrado.';

              this.toast.exibir(msg, true);
              setTimeout(
                () => this.router.navigate(['/processo-doacao-andamento']),
                1500,
              );
            },
            error: () =>
              this.toast.exibir(
                'Os dados foram salvos, mas houve um erro ao mudar a etapa do processo.',
                false,
              ),
          });
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
    this.router.navigate(['/processo-doacao-andamento']);
  }
}
