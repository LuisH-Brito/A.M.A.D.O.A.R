import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './redefinir-senha.component.html',
  styleUrl: './redefinir-senha.component.scss',
})
export class RedefinirSenhaComponent {
  cpf = '';

  constructor(private router: Router) {}

  continuar() {
    if (!this.cpf.trim()) {
      alert('Informe o CPF.');
      return;
    }

    // Deve encontrar o email do usuário com base no CPF 
    // e enviar para página /redefinir-senha/codigo-senha
  }
}
