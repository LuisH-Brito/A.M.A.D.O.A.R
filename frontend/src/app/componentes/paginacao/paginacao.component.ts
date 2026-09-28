import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginacao.component.html',
  styleUrl: './paginacao.component.scss'
})
export class PaginacaoComponent {
  @Input() paginaAtual: number = 1;
  @Input() totalItens: number = 0;
  @Input() itensPorPagina: number = 10;

  @Output() mudancaPagina = new EventEmitter<number>();

  get totalPaginas(): number {
    return Math.ceil(this.totalItens / this.itensPorPagina);
  }

  get paginas(): number[] {
    const quantidadeVisivel = Math.min(5, this.totalPaginas);
    const inicioMaximo = Math.max(1, this.totalPaginas - quantidadeVisivel + 1);
    const inicio = Math.min(
      Math.max(1, this.paginaAtual - Math.floor(quantidadeVisivel / 2)),
      inicioMaximo,
    );

    return Array.from(
      { length: quantidadeVisivel },
      (_, indice) => inicio + indice,
    );
  }

  mudarPagina(numero: number) {
    if (numero >= 1 && numero <= this.totalPaginas && numero !== this.paginaAtual) {
      this.mudancaPagina.emit(numero);
    }
  }
}
