import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

    cpf: '000.000.000-00',
  };
}
