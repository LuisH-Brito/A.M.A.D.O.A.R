import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isMenuOpen = false;

  constructor(private router: Router) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  isLogado(): boolean {
    return !!localStorage.getItem('access');
  }

  temAcesso(cargos: string[]): boolean {
    const cargo = localStorage.getItem('cargo');
    return cargo ? cargos.includes(cargo) : false;
  }

  deslogar() {
    localStorage.clear();
    this.isMenuOpen = false;
    this.router.navigate(['/login']);
  }

  getNomeUsuario(): string {
    return localStorage.getItem('nomeUsuario') || 'Visitante';
  }

  getCargoFormatado(): string {
    const cargo = localStorage.getItem('cargo');
    if (!cargo) return '';
    return cargo.charAt(0).toUpperCase() + cargo.slice(1).toLowerCase();
  }

  irParaSecao(fragmento: string) {
    this.isMenuOpen = false;

    if (this.router.url.split('#')[0] === '/') {
      this.fazerScrollSuave(fragmento);
    } else {
      // Se estiver na página de Login, viaja para a Home primeiro
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.fazerScrollSuave(fragmento), 300);
      });
    }
  }

  private fazerScrollSuave(fragmento: string) {
    const element = document.getElementById(fragmento);
    if (element) {
      const alturaHeader = 100;
      const posicaoElemento =
        element.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({
        top: posicaoElemento - alturaHeader,
        behavior: 'smooth',
      });
    }
  }
}
