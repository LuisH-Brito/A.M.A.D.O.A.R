import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

type EtapaProcesso = 'pre-triagem' | 'triagem' | 'coleta';

@Component({
  selector: 'app-lista-processo-doacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-processo-doacao.component.html',
  styleUrls: ['./lista-processo-doacao.component.scss']
})
export class ListaProcessoDoacaoComponent implements OnInit {
  abaAtiva: EtapaProcesso = 'pre-triagem';
  processos: any[] = [];
  preTriagem: any[] = [];
  triagem: any[] = [];
  coleta: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getProcessos().subscribe((res: any) => {
      this.processos = res || [];
      this.updateGroups();
    }, (err) => {
      console.error('Erro ao buscar processos', err);
    });
  }

  updateGroups(): void {
    this.preTriagem = this.processos.filter(p => p.status === 2);
    this.triagem = this.processos.filter(p => p.status === 3);
    this.coleta = this.processos.filter(p => p.status === 4);
  }

  selecionarAba(aba: EtapaProcesso): void {
    if (this.abaAtiva === aba) return;
    this.abaAtiva = aba;
  }
}
