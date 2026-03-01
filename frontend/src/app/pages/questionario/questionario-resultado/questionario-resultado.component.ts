import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-questionario-resultado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './questionario-resultado.component.html',
  styleUrl: './questionario-resultado.component.scss'
})
export class QuestionarioResultadoComponent {
  @Input() apto: boolean = true;
  @Input() motivos: string[] = [];

  @Output() fechar = new EventEmitter<void>();

  clicouOk() {
    this.fechar.emit(); 
  }
}