import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-processo-doacao-intro',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './processo-doacao-intro.component.html',
  styleUrl: './processo-doacao-intro.component.scss'
})
export class ProcessoDoacaoIntroComponent {
  constructor(private router: Router) {}

  // atualizar funcao para mandar o doador para a proxima etapa do processo (pre-triagem)
  iniciar() {
    this.router.navigate(['/processo-doacao-andamento']);
  }
}
