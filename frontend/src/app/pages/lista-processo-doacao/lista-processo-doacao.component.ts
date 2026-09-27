import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { EMPTY, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AtendimentoProcessoService } from '../../services/atendimento-processo.service';

type EtapaProcesso = 'pre-triagem' | 'triagem' | 'coleta';

@Component({
  selector: 'app-lista-processo-doacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-processo-doacao.component.html',
  styleUrls: ['./lista-processo-doacao.component.scss']
})
export class ListaProcessoDoacaoComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly intervaloAtualizacaoMs = 5000;
  abaAtiva: EtapaProcesso = 'pre-triagem';
  processos: any[] = [];
  preTriagem: any[] = [];
  triagem: any[] = [];
  coleta: any[] = [];
  isRecepcionista = false;
  cargoUsuario = localStorage.getItem('cargo') || '';
  processoIdProcessando: number | null = null;

  constructor(private api: ApiService, private router: Router, private atendimento: AtendimentoProcessoService) {}

  ngOnInit(): void {
    this.isRecepcionista = this.cargoUsuario === 'recepcionista';

    // Recupera a última aba salva em cache, se existir
    const abaSalva = localStorage.getItem('abaAtivaProcessos') as EtapaProcesso;
    if (abaSalva && ['pre-triagem', 'triagem', 'coleta'].includes(abaSalva)) {
      this.abaAtiva = abaSalva;
    }

    this.atualizarProcessos();

    timer(this.intervaloAtualizacaoMs, this.intervaloAtualizacaoMs)
      .pipe(
        switchMap(() => this.buscarProcessos()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => this.aplicarProcessos(res));
  }

  private buscarProcessos() {
    return this.api.getProcessos().pipe(
      catchError((err) => {
        console.error('Erro ao buscar processos', err);
        return EMPTY;
      }),
    );
  }

  private atualizarProcessos(): void {
    this.buscarProcessos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.aplicarProcessos(res));
  }

  private aplicarProcessos(res: any): void {
    this.processos = Array.isArray(res) ? res : (res?.results ?? []);
    this.updateGroups();
  }

  updateGroups(): void {
    this.preTriagem = this.processos.filter(p => p.status === 2);
    this.triagem = this.processos.filter(p => p.status === 3);
    this.coleta = this.processos.filter(p => p.status === 4);
  }

  selecionarAba(aba: EtapaProcesso): void {
    if (this.abaAtiva === aba) return;
    this.abaAtiva = aba;
    // Salva a aba escolhida no cache do navegador
    localStorage.setItem('abaAtivaProcessos', aba);
  }

  abrirPreTriagem(processoId: number): void {
    if (this.isRecepcionista || this.processoIdProcessando !== null) return;
    this.processoIdProcessando = processoId;
    this.atendimento.iniciar(processoId).subscribe({ next: () => {
      localStorage.setItem('abaAtivaProcessos', 'pre-triagem');
      this.router.navigate(['/form-pre-triagem', processoId]);
    }, error: () => this.processoIdProcessando = null });
  }

  abrirTriagem(processoId: number): void {
    if (!this.podeTriagem || this.processoIdProcessando !== null) return;
    this.processoIdProcessando = processoId;
    this.atendimento.iniciar(processoId).subscribe({ next: () => {
      localStorage.setItem('abaAtivaProcessos', 'triagem');
      this.router.navigate(['/form-triagem', processoId]);
    }, error: () => this.processoIdProcessando = null });
  }

  abrirColeta(processoId: number): void {
    if (!this.podeColeta || this.processoIdProcessando !== null) return;
    this.processoIdProcessando = processoId;
    this.atendimento.iniciar(processoId).subscribe({ next: () => {
      localStorage.setItem('abaAtivaProcessos', 'coleta');
      this.router.navigate(['/form-coleta', processoId]);
    }, error: () => this.processoIdProcessando = null });
  }

  get podeTriagem(): boolean {
    return this.cargoUsuario === 'medico' || this.cargoUsuario === 'administrador';
  }

  get podeColeta(): boolean {
    return this.cargoUsuario === 'enfermeiro' || this.cargoUsuario === 'administrador';
  }

  voltar(): void {
    switch (this.cargoUsuario) {
      case 'recepcionista':
        this.router.navigate(['/processo-doacao-REC']);
        break;
      case 'medico':
        this.router.navigate(['/processo-doacao-MED']);
        break;
      case 'enfermeiro':
        this.router.navigate(['/processo-doacao-MED']);
        break;
      case 'administrador': {
        const origemAdmin = localStorage.getItem('origem_admin');
        if (origemAdmin) {
          localStorage.removeItem('origem_admin');
          this.router.navigate([origemAdmin]);
        } else {
          this.router.navigate(['/processo-doacao-MED']);
        }
        break;
      }
      default:
        this.router.navigate(['/']);
    }
  }
}