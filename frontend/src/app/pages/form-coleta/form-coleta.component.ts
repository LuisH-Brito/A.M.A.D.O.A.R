import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-coleta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-coleta.component.html',
  styleUrl: './form-coleta.component.scss',
})
export class FormColetaComponent {
  doador = {
    nome: 'Claudionor Alencar Gozanga ',
    sexo: 'F',
    cpf: '000.000.000-00',
  };

  responsaveis = [
    { id: 1, nome: 'Macilon' },
    { id: 2, nome: 'Nasserala' },
    { id: 3, nome: 'Luiz Matos' },
  ];
  responsavelSelecionado: number | null = null;
}
