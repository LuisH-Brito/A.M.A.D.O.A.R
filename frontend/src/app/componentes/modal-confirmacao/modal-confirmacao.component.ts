import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-confirmacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-confirmacao.component.html',
  styleUrl: './modal-confirmacao.component.scss',
})
export class ModalConfirmacaoComponent {
  @Input() visivel: boolean = false;
  @Input() titulo: string = 'Confirmação';
  @Input() mensagem: string = 'Tem certeza que deseja continuar?';
  @Input() tipo: 'descartar' | 'usar' | 'notificar' | 'padrao' = 'padrao';
  @Input() textoConfirmar: string = 'Confirmar';
  @Output() confirmado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  aoConfirmar() {
    this.confirmado.emit();
  }

  aoCancelar() {
    this.cancelado.emit();
  }
}
