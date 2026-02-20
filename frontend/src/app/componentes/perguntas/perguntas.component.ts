import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perguntas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perguntas.component.html',
  styleUrl: './perguntas.component.scss'
})
export class PerguntasComponent implements OnChanges {
  @Input() pergunta: string = '';
  @Input() respostaSalva?: 'Sim' | 'Não' | null = null;
  @Output() aoResponder = new EventEmitter<'Sim' | 'Não'>();

  respostaSelecionada: 'Sim' | 'Não' | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pergunta'] || changes['respostaSalva']) {
      this.respostaSelecionada = this.respostaSalva || null;
    }
  }

  responder(resposta: 'Sim' | 'Não') {
    this.respostaSelecionada = resposta;

    setTimeout(() => {
      this.aoResponder.emit(resposta);
    }, 300);
  }
}