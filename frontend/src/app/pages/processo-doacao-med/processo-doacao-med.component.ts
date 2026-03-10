import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-processo-doacao-med',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './processo-doacao-med.component.html',
  styleUrl: './processo-doacao-med.component.scss'
})
export class ProcessoDoacaoMedComponent {
  cargoUsuario = localStorage.getItem('cargo') || '';

  get podeValidacao(): boolean {
    return this.cargoUsuario === 'medico';
  }
}
