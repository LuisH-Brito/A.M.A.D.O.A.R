import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { EstoqueBolsaService } from '../../services/estoque-bolsa.service';

@Component({
  selector: 'app-processo-doacao-med',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './processo-doacao-med.component.html',
  styleUrl: './processo-doacao-med.component.scss'
})
export class ProcessoDoacaoMedComponent implements OnInit {
  cargoUsuario = localStorage.getItem('cargo') || '';
  quantidadeBolsasAguardando = 0;

  constructor(private estoqueBolsaService: EstoqueBolsaService) {}

  ngOnInit(): void {
    if (!this.podeValidacao) return;

    this.estoqueBolsaService.listarBolsasAguardando().subscribe({
      next: (resposta: { count?: number; results?: unknown[] } | unknown[]) => {
        this.quantidadeBolsasAguardando = Array.isArray(resposta)
          ? resposta.length
          : resposta.count ?? resposta.results?.length ?? 0;
      },
      error: () => {
        this.quantidadeBolsasAguardando = 0;
      },
    });
  }

  get podeValidacao(): boolean {
    return this.cargoUsuario === 'medico';
  }

  get textoBolsasAguardando(): string {
    const unidade = this.quantidadeBolsasAguardando === 1 ? 'bolsa' : 'bolsas';
    return `${this.quantidadeBolsasAguardando} ${unidade} aguardando validação`;
  }
}
