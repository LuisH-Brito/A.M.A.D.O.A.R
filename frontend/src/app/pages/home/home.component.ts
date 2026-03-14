import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeCarroselComponent } from '../../componentes/home-carrosel/home-carrosel.component';
import { HemometroComponent } from '../../componentes/hemometro/hemometro.component';
import { EstoqueBolsaService } from '../../services/estoque-bolsa.service';
import {  Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HomeCarroselComponent,
    HemometroComponent,
    ToastNotificacaoComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  @ViewChild('toast') toastComponente!: ToastNotificacaoComponent;
  activeIndexes: number[] = [];

  niveisSanguineos: { [key: string]: number } = {
    'A+': 0,
    'A-': 0,
    'B+': 0,
    'B-': 0,
    'AB+': 0,
    'AB-': 0,
    'O+': 0,
    'O-': 0,
  };

  // Atualizar aqui a quantidade considerada como 100% de estoque
  capacidadeIdeal = 10;

  constructor(
    private estoqueBolsaService: EstoqueBolsaService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.carregarEstoque();
  }

  carregarEstoque() {
    this.estoqueBolsaService.obterDashboard().subscribe({
      next: (dados) => {
        if (dados && dados.tiposSanguineos) {
          dados.tiposSanguineos.forEach((item: any) => {
            // Regra de 3 básica para achar a porcentagem
            let pct = (item.contagem / this.capacidadeIdeal) * 100;

            // Garante que a barra não passe de 100%
            this.niveisSanguineos[item.tipo] =
              pct > 100 ? 100 : Math.round(pct);
          });
        }
      },
      error: (err) => {
        console.error('Erro ao buscar o estoque para os hemômetros:', err);
      },
    });
  }

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

  irParaTriagem() {
    const token = localStorage.getItem('access');

    if (token) {
      this.router.navigate(['/questionario']);
    } else {
      this.toastComponente.exibir('Para realizar a triagem online, é necessário iniciar sessão.', false);
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1800);    }
  }
}
