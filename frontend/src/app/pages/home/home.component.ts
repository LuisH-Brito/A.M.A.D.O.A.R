import { Component } from '@angular/core';
import { HomeCarroselComponent } from '../../componentes/home-carrosel/home-carrosel.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HomeCarroselComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
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
