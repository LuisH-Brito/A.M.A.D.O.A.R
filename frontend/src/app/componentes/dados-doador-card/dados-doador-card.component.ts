import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-dados-doador-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dados-doador-card.component.html',
  styleUrl: './dados-doador-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DadosDoadorCardComponent {
  @Input() nome = '';
  @Input() cpf?: string | null;
  @Input() sexo?: string | null;
  @Input() dataNascimento?: string | null;

  get cpfFormatado(): string | null {
    const numeros = (this.cpf ?? '').replace(/\D/g, '');
    if (!numeros) return null;

    return numeros.length === 11
      ? numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      : this.cpf!.trim();
  }

  get sexoFormatado(): string | null {
    const sexo = this.sexo?.trim();
    if (!sexo) return null;

    const sexoNormalizado = sexo.toUpperCase();
    if (sexoNormalizado === 'F') return 'Feminino';
    if (sexoNormalizado === 'M') return 'Masculino';

    return sexo;
  }

  get dataNascimentoFormatada(): string | null {
    const data = this.dataNascimento?.trim();
    if (!data) return null;

    const correspondencia = data.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return correspondencia
      ? `${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}`
      : data;
  }
}
