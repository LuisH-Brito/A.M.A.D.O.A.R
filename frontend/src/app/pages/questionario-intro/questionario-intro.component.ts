import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-questionario-intro',
  standalone: true, 
  imports: [FormsModule],
  templateUrl: './questionario-intro.component.html',
  styleUrls: ['./questionario-intro.component.scss']
})
export class QuestionarioIntroComponent {
  aceitoRegras = false;

  constructor(private router: Router) {}

  iniciar() {
    if (!this.aceitoRegras) return;
    this.router.navigate(['/questionario_form']);
  }
}
