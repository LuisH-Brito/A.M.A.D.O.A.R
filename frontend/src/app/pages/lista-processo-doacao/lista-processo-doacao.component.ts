import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

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
  isRecepcionista = false;
  cargoUsuario = localStorage.getItem('cargo') || '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.isRecepcionista = this.cargoUsuario === 'recepcionista';

    this.api.getProcessos().subscribe(
      (res: any) => {
        this.processos = Array.isArray(res) ? res : (res?.results ?? []);
        this.updateGroups();
      },
      (err) => {
        console.error('Erro ao buscar processos', err);
      }
    );
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

  abrirPreTriagem(processoId: number): void {
    if (this.isRecepcionista) return;
    this.router.navigate(['/form-pre-triagem', processoId]);
  }

  abrirTriagem(processoId: number): void {
    if (!this.podeTriagem) return;
    this.router.navigate(['/form-triagem', processoId]);
  }

  abrirColeta(processoId: number): void {
    if (!this.podeColeta) return;
    this.router.navigate(['/form-coleta', processoId]);
  }

  get podeTriagem(): boolean {
    return this.cargoUsuario === 'medico';
  }

  get podeColeta(): boolean {
    return this.cargoUsuario === 'enfermeiro';
  }
}
