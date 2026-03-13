import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-codigo-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './codigo-senha.component.html',
  styleUrl: './codigo-senha.component.scss',
})
export class CodigoSenhaComponent implements OnInit {
  codigo = '';
  emailDestino = 'sabrina.carpenter@gmail.com';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const email = params.get('email');
      if (email) {
        this.emailDestino = email;
      }
    });
  }

  reenviarCodigo(): void {
    // Próximo passo: chamar endpoint de reenviar código
    // Ex.: this.http.post('/api/password-reset/request/', { cpf: ... })
    alert('Código reenviado para ' + this.emailDestino);
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
        codigo: this.codigo,
        email: this.emailDestino,
      },
    });
  }
}