import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-notificacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notificacao.component.html',
  styleUrl: './toast-notificacao.component.scss',
})
export class ToastNotificacaoComponent {
  mensagem: string = '';
  visivel: boolean = false;
  sucesso: boolean = true;
  private timeout: any;

  exibir(mensagem: string, sucesso: boolean = true) {
    this.mensagem = mensagem;
    this.sucesso = sucesso;
    this.visivel = true;

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.visivel = false;
    }, 5000);
  }

  fechar() {
    this.visivel = false;
  }
}
