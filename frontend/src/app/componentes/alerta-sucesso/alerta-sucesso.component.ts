import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-alerta-sucesso',
  standalone: true,
  templateUrl: './alerta-sucesso.component.html',
  styleUrl: './alerta-sucesso.component.css',
})
export class AlertaSucessoComponent implements OnChanges, OnDestroy {
  @Input() visivel = false;
  @Input() nome = '';
  @Input() duracao = 5000;
  @Output() fechar = new EventEmitter<void>();

  private temporizador?: ReturnType<typeof setTimeout>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visivel']?.currentValue === true) {
      this.iniciarTemporizador();
    }
  }

  aoFechar(): void {
    this.limparTemporizador();
    this.fechar.emit();
  }

  ngOnDestroy(): void {
    this.limparTemporizador();
  }

  private iniciarTemporizador(): void {
    this.limparTemporizador();

    if (this.duracao > 0) {
      this.temporizador = setTimeout(() => this.aoFechar(), this.duracao);
    }
  }

  private limparTemporizador(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = undefined;
    }
  }
}
