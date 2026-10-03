import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-alerta-erro',
  standalone: true,
  templateUrl: './alerta-erro.component.html',
  styleUrl: './alerta-erro.component.css',
})
export class AlertaErroComponent implements OnChanges, OnDestroy {
  @Input() visivel = false;
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
