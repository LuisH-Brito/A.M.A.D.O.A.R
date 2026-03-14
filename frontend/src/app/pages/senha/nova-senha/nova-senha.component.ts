import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ToastNotificacaoComponent } from '../../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-nova-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ToastNotificacaoComponent],
  templateUrl: './nova-senha.component.html',
  styleUrl: './nova-senha.component.scss',
})
export class NovaSenhaComponent implements OnInit {
  @ViewChild('toast') toastComponente!: ToastNotificacaoComponent;
  cpf = '';
  codigo = '';

  novaSenha = '';
  confirmarNovaSenha = '';
  carregando = false;

  showNovaSenha = false;
  showConfirmarNovaSenha = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.cpf = (params.get('cpf') || '').trim();
      this.codigo = (params.get('codigo') || '').trim();

      if (!this.cpf || !this.codigo) {
        alert('Fluxo de recuperação inválido. Tente novamente.');
        this.router.navigate(['/redefinir-senha']);
      }
    });
  }

  private senhaValida(senha: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(senha);
  }

  redefinirSenha(): void {
    const senha = this.novaSenha.trim();
    const confirmar = this.confirmarNovaSenha.trim();

    if (!senha || !confirmar) {
      this.toastComponente.exibir('Preencha os dois campos de senha.', false);
      return;
    }

    if (!this.senhaValida(senha)) {
      this.toastComponente.exibir(
        'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.',
        false
      );
      return;
    }

    if (senha !== confirmar) {
      this.toastComponente.exibir('As senhas não coincidem.', false);
      return;
    }

    this.carregando = true;

    this.api.confirmPasswordReset(this.cpf, this.codigo, senha).subscribe({
      next: (res) => {
        this.carregando = false;
        this.toastComponente.exibir(res?.mensagem || 'Senha redefinida com sucesso.', true);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.carregando = false;
        const mensagem =
          err?.error?.erro || 'Não foi possível redefinir a senha.';
        this.toastComponente.exibir(mensagem, false);
      },
    });
  }

  toggleNovaSenha(): void {
    this.showNovaSenha = !this.showNovaSenha;
  }

  toggleConfirmarNovaSenha(): void {
    this.showConfirmarNovaSenha = !this.showConfirmarNovaSenha;
  }
}
