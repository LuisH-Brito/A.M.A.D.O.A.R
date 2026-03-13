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
  touchStartX = 0;
  touchEndX = 0;
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }
  handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;

    if (swipeDistance > 50) {
      this.prev(); // arrastou para direita
    }

    if (swipeDistance < -50) {
      this.next(); // arrastou para esquerda
    }
  }

  slides = [
    {
      title: 'O que é o HEMOACRE?',
      text: 'O Centro de Hematologia e Hemoterapia do Acre é a instituição responsável por garantir o abastecimento de sangue para hospitais em todo o Acre. Por meio da solidariedade dos doadores, o hemocentro salva vidas todos os dias, conectando quem pode doar com quem precisa de transfusões para continuar lutando pela vida.',
      imgSrc: 'images/logo-hemoacre512-white-background.png',
      bgColor: '#E8F5E9',
      textColor: '#323232',
      layout: 'no-full-no-mask',
    },
    {
      title: 'Impacto de uma doação',
      text: 'Uma única bolsa de sangue pode ajudar até quatro pessoas diferentes. Por isso, cada doação é um gesto de solidariedade que faz uma grande diferença na vida de quem precisa.',
      imgSrc: 'images/mascote_hemoacre.jpg',
      bgColor: '#9F0000',
      textColor: '#FFFFFF',
      layout: 'full-no-mask',
    },
    {
      title: 'O que é o A.M.A.D.O.A.R.?',
      text: 'A.M.A.D.O.A.R. é a plataforma que conecta doadores ao hemocentro de forma rápida e inteligente. Receba alertas quando seu tipo sanguíneo for necessário, acompanhe suas doações e faça parte de uma rede que salva vidas.',
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
