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
    return !!localStorage.getItem('token');
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
}
