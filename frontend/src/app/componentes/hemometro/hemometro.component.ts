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
}
