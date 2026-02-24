import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-questionario-intro',
  templateUrl: './questionario-intro.component.html',
  styleUrls: ['./questionario-intro.component.scss']
})
export class QuestionarioIntroComponent {
  aceitoRegras = false;

  constructor(private router: Router) {}

  iniciar() {
    if (!this.aceitoRegras) return;
    this.router.navigate(['/questionario']);
  }
}
