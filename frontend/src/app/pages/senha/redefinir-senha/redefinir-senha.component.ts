import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './redefinir-senha.component.html',
  styleUrl: './redefinir-senha.component.scss',
})
export class RedefinirSenhaComponent {
  cpf = '';

  constructor(
    private router: Router,
    private api: ApiService,
  ) {}

  private limparCpf(valor: string): string {
    return (valor || '').replace(/\D/g, '');
  }

  continuar(): void {
    const cpfSemMascara = this.limparCpf(this.cpf);

    if (cpfSemMascara.length !== 11) {
      alert('CPF deve conter 11 dígitos.');
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
        alert(mensagem);
      },
    });
  }
}
