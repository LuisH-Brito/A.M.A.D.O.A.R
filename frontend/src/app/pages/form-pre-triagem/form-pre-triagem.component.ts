import { Component } from '@angular/core';

@Component({
  selector: 'app-form-pre-triagem',
  standalone: true,
  imports: [],
  templateUrl: './form-pre-triagem.component.html',
  styleUrl: './form-pre-triagem.component.scss',
})
export class FormPreTriagemComponent {
  doador = {
    nome: 'Claudionor Alencar Gozanga ',
    sexo: 'F',
    cpf: '000.000.000-00',
  };
}
