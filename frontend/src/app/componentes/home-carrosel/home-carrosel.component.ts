import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-carrosel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-carrosel.component.html',
  styleUrl: './home-carrosel.component.scss',
})
export class HomeCarroselComponent {
  currentSlide = 0;

  slides = [
    {
      title: 'O que é o HEMOACRE?',
      text: 'O Ambiente de Apoio ao Doador Acreano é Lorem ipsum dolor sit amet...',
      imgSrc: 'images/logo-hemoacre512-white-background.png',
      bgColor: '#E8F5E9',
      textColor: '#333333',
      layout: 'no-full-no-mask',
    },
    {
      title: 'Relação com a HEMOACRE',
      text: 'Texto sobre a relação com o Hemoacre e a importância da doação de sangue para salvar vidas.',
      imgSrc: 'images/mascote_hemoacre.jpg',
      bgColor: '#9F0000',
      textColor: '#FFFFFF',
      layout: 'full-no-mask',
    },
    {
      title: 'O que é o A.M.A.D.O.A.R.?',
      text: 'Texto explicativo sobre o projeto Amadoar...',
      imgSrc: 'images/amadoar-logo2.jpg',
      bgColor: '#008F39',
      textColor: '#FFFFFF',
      layout: 'full-no-mask',
    },
  ];

  prev() {
    const previous = this.currentSlide - 1;
    this.currentSlide = previous < 0 ? this.slides.length - 1 : previous;
  }

  next() {
    const next = this.currentSlide + 1;
    this.currentSlide = next === this.slides.length ? 0 : next;
  }

  goTo(index: number) {
    this.currentSlide = index;
  }
}
