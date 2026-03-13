import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-codigo-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './codigo-senha.component.html',
  styleUrl: './codigo-senha.component.scss',
})
export class CodigoSenhaComponent implements OnInit {
  codigo = '';
  emailDestino = '';
  cpf = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const cpf = (params.get('cpf') || '').trim();
      const email = (params.get('email') || '').trim();

      if (!cpf || !email) {
        alert('Dados inválidos para recuperação de senha.');
        this.router.navigate(['/redefinir-senha']);
        return;
      }

      this.cpf = cpf;
      this.emailDestino = email;
      this.solicitarCodigo();
    });
  }

  private solicitarCodigo(): void {
    this.api.requestCodePasswordReset(this.cpf).subscribe({
      next: () => {},
      error: (err) => {
        const mensagem =
          err?.error?.erro || 'Não foi possível enviar o código de verificação.';
        alert(mensagem);
        this.router.navigate(['/redefinir-senha']);
      },
    });
  }

  reenviarCodigo(): void {
    this.solicitarCodigo();
  }

  voltar(): void {
    this.router.navigate(['/redefinir-senha']);
  }

  continuar(): void {
    if (!this.codigo.trim()) {
      alert('Informe o código recebido por email.');
      return;
    }

    this.router.navigate(['/redefinir-senha/nova-senha'], {
      queryParams: {
        codigo: this.codigo.trim(),
        cpf: this.cpf,
      },
    });
  }
}