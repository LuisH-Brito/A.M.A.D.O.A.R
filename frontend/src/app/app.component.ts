import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './componentes/header/header.component';
import { FooterComponent } from './componentes/footer/footer.component';
import { HomeCarroselComponent } from './componentes/home-carrosel/home-carrosel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    HomeCarroselComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'frontend';
  activeIndexes: number[] = [];
  toggleAccordion(index: number) {
    if (this.activeIndexes.includes(index)) {
      this.activeIndexes = this.activeIndexes.filter((i) => i !== index);
    } else {
      this.activeIndexes.push(index);
    }
  }
  isActive(index: number): boolean {
    return this.activeIndexes.includes(index);
  }
}
