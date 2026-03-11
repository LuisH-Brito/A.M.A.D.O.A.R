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
    private questionarioService: QuestionarioService 
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
          this.questionarioService.getQuestionariosPorCpf(this.doador.cpf).subscribe({
            next: (questionarios) => {
              this.questionarioVinculado = questionarios && questionarios.length > 0;
            }
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
    this.router.navigate(['/questionario-processo/proc', this.processoId, this.doador.cpf]);
  }

  private validarPressao(): boolean {
    if (!this.pressaoArterial?.trim()) {
      alert('Informe a pressão arterial.');
      return false;
    }
    return true;
  }

  reprovar(): void {
    if (!this.validarPressao()) return;

    this.api.decidirTriagem(this.processoId, {
      pressao_arterial: this.pressaoArterial.trim(),
      aprovado: false,
    }).subscribe({
      next: () => {
        alert('Triagem concluída: doador inapto. Processo encerrado.');
        this.router.navigate(['/processo-doacao-andamento']);
      },
      error: (err) => {
        alert(err?.error?.erro || 'Erro ao concluir triagem.');
      },
    });
  }

  aprovar(): void {
    if (!this.validarPressao()) return;

    this.api.decidirTriagem(this.processoId, {
      pressao_arterial: this.pressaoArterial.trim(),
      aprovado: true,
    }).subscribe({
      next: () => {
        alert('Triagem concluída: doador apto.');
        this.router.navigate(['/processo-doacao-andamento']);
      },
      error: (err) => {
        alert(err?.error?.erro || 'Erro ao concluir triagem.');
      },
    });
  }
}