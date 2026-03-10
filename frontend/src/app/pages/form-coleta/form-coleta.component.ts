import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-form-coleta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-coleta.component.html',
  styleUrl: './form-coleta.component.scss',
})
export class FormColetaComponent implements OnInit {
  processoId!: number;
  doador = {
    nome: '',
    sexo: '',
    cpf: '',
  };

  responsaveis: Array<{ id: number; nome_completo: string }> = [];
  responsavelSelecionado: number | null = null;
  puncaoSucesso = 'true';
  enviando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('processoId'));
    if (!id) {
      alert('Processo invalido para coleta.');
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
        alert('Nao foi possivel carregar os dados do doador.');
        this.router.navigate(['/processo-doacao-andamento']);
      },
    });

    this.api.listarEnfermeiros().subscribe({
      next: (lista) => {
        this.responsaveis = Array.isArray(lista) ? lista : [];
      },
      error: () => {
        alert('Nao foi possivel carregar os enfermeiros responsaveis.');
      },
    });
  }

  finalizarColeta(): void {
    if (!this.responsavelSelecionado) {
      alert('Selecione o responsavel pela coleta.');
      return;
    }

    this.enviando = true;
    this.api
      .finalizarColeta(this.processoId, {
        enfermeiro_id: this.responsavelSelecionado,
        puncao_sucesso: this.puncaoSucesso === 'true',
      })
      .subscribe({
        next: (res: any) => {
          this.enviando = false;
          if (res?.bolsa_criada) {
            alert('Coleta finalizada com sucesso. Bolsa enviada para validacao.');
            this.router.navigate(['/aguardando-validacao-bolsa']);
            return;
          }

          alert(
            'Coleta finalizada sem sucesso. Processo encerrado sem geracao de bolsa.',
          );
          this.router.navigate(['/processo-doacao-andamento']);
        },
        error: (err) => {
          this.enviando = false;
          alert(err?.error?.erro || 'Erro ao finalizar coleta.');
        },
      });
  }
}
