import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EstoqueBolsaService } from '../../services/estoque-bolsa.service';

@Component({
  selector: 'app-bolsa-aguardando-validacao',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './bolsa-aguardando-validacao.component.html',
  styleUrl: './bolsa-aguardando-validacao.component.scss',
})
export class BolsaAguardandoValidacaoComponent implements OnInit {
  bolsas: Array<{ id: number; dataColeta: string; doadorNome: string }> = [];
  ehMedico = localStorage.getItem('cargo') === 'medico';

  constructor(
    private router: Router,
    private estoqueService: EstoqueBolsaService,
  ) {}

  ngOnInit(): void {
    this.estoqueService.listarBolsasAguardando().subscribe({
      next: (res: any) => {
        const lista = Array.isArray(res) ? res : (res?.results ?? []);
        this.bolsas = lista.map((b: any) => ({
          id: b.id,
          dataColeta: this.formatarData(b?.processo_data_inicio),
          doadorNome: b?.doador_nome || '-',
        }));
      },
      error: () => {
        alert('Nao foi possivel carregar as bolsas aguardando validacao.');
      },
    });
  }

  private formatarData(valor: string | null | undefined): string {
    if (!valor) return '-';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '-';
    return data.toLocaleDateString('pt-BR');
  }

  validarBolsa(id: number) {
    this.router.navigate(['/validar-bolsa', id]);
  }
}
