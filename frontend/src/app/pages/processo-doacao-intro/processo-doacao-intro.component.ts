import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-processo-doacao-intro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalConfirmacaoComponent,
    ToastNotificacaoComponent,
  ],
  templateUrl: './processo-doacao-intro.component.html',
  styleUrl: './processo-doacao-intro.component.scss',
})
export class ProcessoDoacaoIntroComponent {
  cpfBusca = '';
  doadorEncontrado: any | null = null;
  mensagem = '';
  modalVisivel = false;
  @ViewChild('toast') toast!: ToastNotificacaoComponent;

  constructor(
    private router: Router,
    private api: ApiService,
  ) {}

  onCpfChange(): void {
    const cpfNumerico = this.somenteNumeros(this.cpfBusca);

    // Enquanto CPF não estiver completo, não mostra card nem mensagem de erro
    if (cpfNumerico.length < 11) {
      this.doadorEncontrado = null;
      this.mensagem = '';
      return;
    }

    this.buscarDoadorPorCpf(cpfNumerico);
  }

  private buscarDoadorPorCpf(cpf: string): void {
    this.api.getDoadores(cpf).subscribe({
      next: (res: any) => {
        const lista = Array.isArray(res) ? res : (res?.results ?? []);
        this.doadorEncontrado = lista[0] ?? null;
        this.mensagem = this.doadorEncontrado ? '' : 'Doador não encontrado.';
      },
      error: () => {
        this.doadorEncontrado = null;
        this.mensagem = 'Erro ao buscar doador.';
      },
    });
  }

  private somenteNumeros(valor: string): string {
    return (valor || '').replace(/\D/g, '');
  }

  iniciar(): void {
    if (!this.doadorEncontrado) return;

    if (!this.doadorEncontrado.apto_para_doacao) {
      this.toast.exibir('Ação bloqueada: O doador não está apto.', false);
      return;
    }

    this.modalVisivel = true;
  }

  cancelarInicio(): void {
    this.modalVisivel = false;
  }

  confirmarInicio(): void {
    this.modalVisivel = false;
    const cpf = this.doadorEncontrado.cpf || this.cpfBusca;

    this.api.iniciarDoacao(cpf).subscribe({
      next: () => {
        this.toast.exibir('Doação iniciada com sucesso!', true);
        this.cpfBusca = '';
        this.doadorEncontrado = null;
      },
      error: (err) => {
        const msgErro = err?.error?.erro || 'Erro ao iniciar doação.';
        this.toast.exibir(msgErro, false);
      },
    });
  }
}
