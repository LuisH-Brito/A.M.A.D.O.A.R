import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-form-triagem',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-triagem.component.html',
  styleUrl: './form-triagem.component.scss',
})
export class FormTriagemComponent {
  doador = {
    nome: 'Claudionor Alencar Gozado',
    dataNascimento: '',
    cpf: 'teste',
  };

  constructor(private router: Router) {} 

  abrirQuestionarios() {
    if (this.doador.cpf) {
      const cpfLimpo = this.doador.cpf.trim().replace(/[.-]/g, ''); 
      this.router.navigate(['/questionario-processo', cpfLimpo]);
    } else {
      alert('Por favor, informe o CPF do doador.');
    }
  }
}