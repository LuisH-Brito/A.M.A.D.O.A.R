import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-form-pre-triagem',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalConfirmacaoComponent,
    ToastNotificacaoComponent,
  ],
  templateUrl: './form-pre-triagem.component.html',
  styleUrl: './form-pre-triagem.component.scss',
})
export class FormPreTriagemComponent implements OnInit {
  processoId!: number;

  doador = { nome: '', sexo: '', cpf: '' };

  form = {
    altura: null as number | null,
    peso: null as number | null,
    hemoglobina: null as number | null,
  };

  @ViewChild('toast') toast!: ToastNotificacaoComponent;
  modalVisivel = false;
  acaoPendente: 'apto' | 'inapto' | null = null;
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
          sexo: processo?.doador?.sexo || '',
          cpf: processo?.doador?.cpf || '',
        };
      },
      error: () => {
        alert('Não foi possível carregar o processo.');
        this.router.navigate(['/processo-doacao-andamento']);
      },
    });
  }

  abrirModal(acao: 'apto' | 'inapto'): void {
    this.acaoPendente = acao;

    if (acao === 'apto') {
      this.modalConfig = {
        titulo: 'Confirmar Aptidão',
        mensagem: `Deseja aprovar ${this.doador.nome || 'o doador'} na pré-triagem e avançar para a próxima etapa?`,
        tipo: 'usar',
        textoConfirmar: 'Sim, Aprovar',
      };
    } else {
      this.modalConfig = {
        titulo: 'Registrar Inaptidão',
        mensagem: `Atenção: Deseja registrar que ${this.doador.nome || 'o doador'} está INAPTO? Esta ação cancelará o processo de doação atual.`,
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
    if (this.acaoPendente === 'apto') {
      this.salvarEAvancarTriagem();
    } else if (this.acaoPendente === 'inapto') {
      this.marcarInapto();
    }
  }

  salvarEAvancarTriagem(): void {
    if (
      this.form.altura == null ||
      this.form.peso == null ||
      this.form.hemoglobina == null
    ) {
      this.toast.exibir('Preencha altura, peso e hemoglobina.', false);
      return;
    }

    const enfermeiroId = localStorage.getItem('usuario_id');
    if (!enfermeiroId) {
      this.toast.exibir(
        'Acesso negado: Não foi possível identificar o enfermeiro logado.',
        false,
      );
      return;
    }

    const payload = {
      processo_id: this.processoId,
      altura: this.form.altura,
      peso: this.form.peso,
      hemoglobina: this.form.hemoglobina,
      status_clinico: 1,
      enfermeiro_id: enfermeiroId,
    };

    this.api.salvarDadosClinicos(payload).subscribe({
      next: () => {
        this.api.atualizarStatusProcesso(this.processoId, 3).subscribe({
          next: () => {
            this.toast.exibir('Pré-triagem concluída! Redirecionando...', true);
            setTimeout(
              () => this.router.navigate(['/processo-doacao-andamento']),
              1500,
            );
          },
          error: () =>
            this.toast.exibir(
              'Dados salvos, mas falhou ao atualizar status para Triagem.',
              false,
            ),
        });
      },
      error: (err) => {
        if (err?.error?.processo_id) {
          this.toast.exibir(err.error.processo_id, false);
          return;
        }
        this.toast.exibir('Erro ao salvar dados clínicos.', false);
      },
    });
  }

  marcarInapto(): void {
    const enfermeiroId = localStorage.getItem('usuario_id');
    if (!enfermeiroId) {
      this.toast.exibir(
        'Acesso negado: Não foi possível identificar o enfermeiro logado.',
        false,
      );
      return;
    }

    const payload = {
      processo_id: this.processoId,
      altura: this.form.altura || 0,
      peso: this.form.peso || 0,
      hemoglobina: this.form.hemoglobina || 0,
      status_clinico: 0,
      enfermeiro_id: enfermeiroId,
    };

    this.api.salvarDadosClinicos(payload).subscribe({
      next: () => {
        this.api.atualizarStatusProcesso(this.processoId, 0).subscribe({
          next: () => {
            this.toast.exibir(
              'Processo encerrado como Inapto. Redirecionando...',
              true,
            );
            setTimeout(
              () => this.router.navigate(['/processo-doacao-andamento']),
              1500,
            );
          },
          error: () =>
            this.toast.exibir(
              'Dados salvos, mas houve erro ao cancelar o processo.',
              false,
            ),
        });
      },
      error: () =>
        this.toast.exibir(
          'Erro ao registrar inaptidão nos dados clínicos.',
          false,
        ),
    });
  }
  voltar() {
    this.router.navigate(['/processo-doacao-andamento']);
  }
}
