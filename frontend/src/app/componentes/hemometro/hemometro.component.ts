import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hemometro',
  standalone: true,
  imports: [],
  templateUrl: './hemometro.component.html',
  styleUrl: './hemometro.component.scss'
})
export class HemometroComponent {
  @Input() tipo: string = 'A+'; 
  @Input() porcentagem: number = 0;
  get statusEstoque(): { texto: string, cor: string } {
    if (this.porcentagem <= 16.6) {
      return { texto: 'Crítico', cor: '#ff4d4d' }; // 1 barra
    } else if (this.porcentagem <= 50) {
      return { texto: 'Baixo', cor: '#ffaa00' }; // 2 a 3 barras
    } else if (this.porcentagem <= 83.3) {
      return { texto: 'Estável', cor: '#85d222' }; // 4 a 5 barras
    } else {
      return { texto: 'Bom', cor: '#00cc66' }; // 6 barras
    }
  }
}
