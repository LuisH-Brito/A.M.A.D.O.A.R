import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-doador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doador.component.html',
  styleUrl: './doador.component.scss',
})
export class DoadorComponent {
  doador = {
    nome: '',
    tipoSanguineo: '',
    estado: 'AC',
    cidade: '',
    rua: '',
    numero: '',
    telefone: '',
    email: '',
    dataNascimento: '',
    sexo: '',
    cpf: '',
    ultimaDoacao: '',
    proximaDoacao: '',
  };

  exames = [
    { nome: 'Exame laboratorial', data: '12/01/2025' },
    { nome: 'Exame laboratorial', data: '10/10/2024' },
    { nome: 'Exame laboratorial', data: '05/05/2024' },
    { nome: 'Exame laboratorial', data: '02/01/2024' },
    { nome: 'Exame laboratorial', data: '02/01/2024' },
    { nome: 'Exame laboratorial', data: '02/01/2024' },
  ];
}
