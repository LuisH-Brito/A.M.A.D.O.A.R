import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ToastNotificacaoComponent } from '../../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ToastNotificacaoComponent],
  templateUrl: './redefinir-senha.component.html',
  styleUrl: './redefinir-senha.component.scss',
})
export class RedefinirSenhaComponent {
  @ViewChild('toast') toastComponente!: ToastNotificacaoComponent;
  cpf = '';

  constructor(
    private router: Router,
    private api: ApiService,
  ) {}

  private limparCpf(valor: string): string {
    return (valor || '').replace(/\D/g, '');
  }

  // Função para aplicar a máscara visualmente no input
  aplicarMascaraCpf(event: any): void {
    const input = event.target as HTMLInputElement;
    const apenasNumeros = input.value.replace(/\D/g, '').slice(0, 11);
    
    let cpfFormatado = '';
    if (apenasNumeros.length <= 3) {
      cpfFormatado = apenasNumeros;
    } else if (apenasNumeros.length <= 6) {
      cpfFormatado = `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3)}`;
    } else if (apenasNumeros.length <= 9) {
      cpfFormatado = `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6)}`;
    } else {
      cpfFormatado = `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6, 9)}-${apenasNumeros.slice(9, 11)}`;
    }

    input.value = cpfFormatado;
    this.cpf = cpfFormatado;
  }
  continuar(): void {
    const cpfSemMascara = this.limparCpf(this.cpf);

    if (cpfSemMascara.length !== 11) {
      this.toastComponente.exibir('CPF deve conter 11 dígitos.', false);
      return;
    }

    this.api.searchEmailByCpf(cpfSemMascara).subscribe({
      next: () => {
        this.router.navigate(['/redefinir-senha/codigo'], {
          queryParams: { cpf: cpfSemMascara },
        });
      },
      error: (err) => {
        const mensagem = err?.error?.erro || 'Não foi possível localizar o email para este CPF.';
        this.toastComponente.exibir(mensagem, false);
      },
    });
  }
}
