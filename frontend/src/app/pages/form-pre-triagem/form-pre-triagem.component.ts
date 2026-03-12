import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-form-pre-triagem',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  salvarEAvancarTriagem(): void {
    if (
      this.form.altura == null ||
      this.form.peso == null ||
      this.form.hemoglobina == null
    ) {
      alert('Preencha altura, peso e hemoglobina.');
      return;
    }

    const enfermeiroId = localStorage.getItem('usuario_id');
    if (!enfermeiroId) {
      alert('Acesso negado: Não foi possível identificar o enfermeiro logado.');
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
            alert('Pré-triagem concluída. Processo enviado para Triagem.');
            this.router.navigate(['/processo-doacao-andamento']);
          },
          error: () =>
            alert('Dados salvos, mas falhou ao atualizar status para Triagem.'),
        });
      },
      error: (err) => {
        if (err?.error?.processo_id) {
          alert(err.error.processo_id);
          return;
        }
        alert('Erro ao salvar dados clínicos.');
      },
    });
  }

  marcarInapto(): void {
    const enfermeiroId = localStorage.getItem('usuario_id');
    if (!enfermeiroId) {
      alert('Acesso negado: Não foi possível identificar o enfermeiro logado.');
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
            alert('Processo marcado como cancelado/inapto com sucesso.');
            this.router.navigate(['/processo-doacao-andamento']);
          },
          error: () =>
            alert(
              'Dados de inaptidão salvos, mas houve erro ao cancelar o processo.',
            ),
        });
      },
      error: () => alert('Erro ao registrar inaptidão nos dados clínicos.'),
    });
  }
}
