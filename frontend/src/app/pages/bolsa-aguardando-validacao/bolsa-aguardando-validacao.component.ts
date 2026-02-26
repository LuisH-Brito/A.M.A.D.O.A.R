import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bolsa-aguardando-validacao',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './bolsa-aguardando-validacao.component.html',
  styleUrl: './bolsa-aguardando-validacao.component.scss',
})
export class BolsaAguardandoValidacaoComponent {
  bolsas = [
    { id: 1, dataColeta: '09/12/2020', validada: false, prioritaria: true },
    { id: 2, dataColeta: '09/12/2020', validada: true },
    { id: 3, dataColeta: '09/12/2020', validada: true },
    { id: 4, dataColeta: '09/12/2020', validada: true },
    { id: 4, dataColeta: '09/12/2020', validada: true },
    { id: 4, dataColeta: '09/12/2020', validada: true },
    { id: 4, dataColeta: '09/12/2020', validada: true },
    { id: 4, dataColeta: '09/12/2020', validada: true },
  ];
}
