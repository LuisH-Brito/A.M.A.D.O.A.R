import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';
import { AtendimentoProcessoService } from '../../services/atendimento-processo.service';
import { DadosDoadorCardComponent } from '../../componentes/dados-doador-card/dados-doador-card.component';

@Component({
  selector: 'app-form-coleta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastNotificacaoComponent,
    ModalConfirmacaoComponent,
    DadosDoadorCardComponent,
  ],
  templateUrl: './form-coleta.component.html',
  styleUrl: './form-coleta.component.scss',
})
export class FormColetaComponent implements OnInit, OnDestroy {
  processoId!: number;
  doador = {
    nome: '',
    sexo: '',
    cpf: '',
    dataNascimento: '',
  };

  responsaveis: Array<{ id: number; nome_completo: string }> = [];
  responsavelSelecionado: number | null = null;
  puncaoSucesso = 'true';
  enviando = false;

  @ViewChild('toast') toast!: ToastNotificacaoComponent;
  modalVisivel = false;
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
    private atendimento: AtendimentoProcessoService,
  ) {}

  ngOnDestroy(): void { if (this.processoId) this.atendimento.parar(this.processoId); }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('processoId'));
    if (!id) {
      alert('Processo invalido para coleta.');
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

    this.api.getProcessoById(this.processoId).subscribe({
      next: (processo) => {
        this.doador = {
          nome: processo?.doador?.nome_completo || '',
          sexo: processo?.doador?.sexo || '',
          cpf: processo?.doador?.cpf || '',
          dataNascimento: processo?.doador?.data_nascimento || '',
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

  get puncaoFalhou(): boolean {
    return this.puncaoSucesso === 'false';
  }

  abrirModalConfirmacao(): void {
    if (this.enviando) return;
    if (!this.responsavelSelecionado) {
      this.toast.exibir(
        'Selecione o enfermeiro responsável pela coleta.',
        false,
      );
      return;
    }

    if (this.puncaoSucesso === 'true') {
      this.modalConfig = {
        titulo: 'Finalizar Coleta',
        mensagem: `Confirma a finalização da coleta de ${this.doador.nome || 'doador'} com SUCESSO? Uma nova bolsa será gerada e enviada para a fila de validação.`,
        tipo: 'usar',
        textoConfirmar: 'Sim, Finalizar',
      };
    } else {
      this.modalConfig = {
        titulo: 'Registrar Falha na Punção',
        mensagem: `Atenção: Confirma que a punção venosa de ${this.doador.nome || 'doador'} FALHOU? O processo será cancelado e NENHUMA bolsa será gerada para estoque.`,
        tipo: 'descartar',
        textoConfirmar: 'Confirmar Falha',
      };
    }

    this.modalVisivel = true;
  }

  fecharModal(): void {
    this.modalVisivel = false;
  }

  finalizarColeta(): void {
    if (this.enviando) return;
    this.modalVisivel = false;
    this.enviando = true;

    this.api
      .finalizarColeta(this.processoId, {
        enfermeiro_id: this.responsavelSelecionado!,
        puncao_sucesso: this.puncaoSucesso === 'true',
      })
      .subscribe({
        next: (res: any) => {
          if (res?.bolsa_criada) {
            this.toast.exibir(
              'Coleta finalizada. Bolsa enviada para validação laboratorial.',
              true,
            );
          } else {
            this.toast.exibir(
              'Coleta falhou. Processo encerrado sem geração de bolsa.',
              false,
            );
          }
          
          // Define a aba de coleta como ativa ao retornar
          localStorage.setItem('abaAtivaProcessos', 'coleta');

          setTimeout(
            () => this.router.navigate(['/processo-doacao-andamento']),
            2000,
          );
        },
        error: (err) => {
          this.enviando = false;
          this.toast.exibir(
            err?.error?.erro || 'Erro ao finalizar coleta.',
            false,
          );
        },
      });
  }
  voltar() {
    if (this.enviando) return;
    localStorage.setItem('abaAtivaProcessos', 'coleta');
    this.router.navigate(['/processo-doacao-andamento']);
  }
}
