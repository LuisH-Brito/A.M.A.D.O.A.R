import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastNotificacaoComponent } from '../../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-troca-senha-obrigatoria',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNotificacaoComponent],
  templateUrl: './troca-senha-obrigatoria.component.html',
  styleUrl: '../nova-senha/nova-senha.component.scss',
})
export class TrocaSenhaObrigatoriaComponent {
  @ViewChild('toast') toast!: ToastNotificacaoComponent;
  senhaAtual = '';
  novaSenha = '';
  confirmarNovaSenha = '';
  carregando = false;
  showSenhaAtual = false;
  showNovaSenha = false;
  showConfirmarNovaSenha = false;

  constructor(public auth: AuthService, private router: Router) {}

  toggleSenhaAtual(): void {
    this.showSenhaAtual = !this.showSenhaAtual;
  }

  toggleNovaSenha(): void {
    this.showNovaSenha = !this.showNovaSenha;
  }

  toggleConfirmarNovaSenha(): void {
    this.showConfirmarNovaSenha = !this.showConfirmarNovaSenha;
  }

  trocarSenha(): void {
    if (!this.senhaAtual || !this.novaSenha || !this.confirmarNovaSenha) {
      this.toast.exibir('Preencha todos os campos de senha.', false);
      return;
    }
    if (this.novaSenha !== this.confirmarNovaSenha) {
      this.toast.exibir('As senhas novas não coincidem.', false);
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(this.novaSenha)) {
      this.toast.exibir('Use 8 caracteres, com maiúscula, minúscula e número.', false);
      return;
    }
    this.carregando = true;
    this.auth.trocarSenhaObrigatoria(
      this.senhaAtual, this.novaSenha, this.confirmarNovaSenha,
    ).subscribe({
      next: () => {
        this.carregando = false;
        for (const key of ['access', 'refresh', 'cargo', 'nomeUsuario', 'usuario_id']) {
          localStorage.removeItem(key);
        }
        this.router.navigate(['/login'], { queryParams: { senhaAlterada: 'true' } });
      },
      error: err => {
        this.carregando = false;
        const detail = err?.error?.nova_senha?.[0]
          || err?.error?.senha_atual?.[0]
          || err?.error?.erro
          || 'Não foi possível alterar a senha.';
        this.toast.exibir(detail, false);
      },
    });
  }
}
