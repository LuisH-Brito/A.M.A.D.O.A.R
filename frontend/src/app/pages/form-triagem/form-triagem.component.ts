import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { QuestionarioService } from '../../services/questionario.service';

@Component({
  selector: 'app-form-triagem',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-triagem.component.html',
  styleUrl: './form-triagem.component.scss',
})
export class FormTriagemComponent implements OnInit {
  processoId!: number;
  doador = { nome: '', dataNascimento: '', cpf: '' };
  pressaoArterial = '';
  questionarioVinculado = false;

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
      alert('Informe a pressão arterial.');
      return false;
    }
    return true;
  }

  enviarDecisao(aprovado: boolean): void {
    if (!this.validarPressao()) return;

    const medicoId = localStorage.getItem('usuario_id');
    if (!medicoId) {
      alert('Erro: Não foi possível identificar o médico logado.');
      return;
    }

    const payload = {
      pressao_arterial: this.pressaoArterial.trim(),
      aprovado: aprovado,
      medico_id: medicoId,
    };

    this.api.decidirTriagem(this.processoId, payload as any).subscribe({
      next: () => {
        const novoStatus = aprovado ? 4 : 0;

        this.api
          .atualizarStatusProcesso(this.processoId, novoStatus)
          .subscribe({
            next: () => {
              const msg = aprovado
                ? 'doador apto. Processo enviado para Coleta'
                : 'doador inapto. Processo encerrado';
              alert(`Triagem concluída: ${msg}.`);
              this.router.navigate(['/processo-doacao-andamento']);
            },
            error: () =>
              alert(
                'Os dados foram salvos, mas houve um erro ao mudar a etapa do processo.',
              ),
          });
      },
      error: (err) => {
        alert(err?.error?.erro || 'Erro ao registrar os dados da triagem.');
      },
    });
  }
}
