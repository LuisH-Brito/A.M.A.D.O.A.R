import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-processo-doacao-intro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalConfirmacaoComponent,
    ToastNotificacaoComponent,
  ],
  templateUrl: './processo-doacao-intro.component.html',
  styleUrl: './processo-doacao-intro.component.scss',
})
export class ProcessoDoacaoIntroComponent {
  cpfBusca = '';
  doadorEncontrado: any | null = null;
  mensagem = '';
  modalVisivel = false;
  @ViewChild('toast') toast!: ToastNotificacaoComponent;

  constructor(
    private router: Router,
    private api: ApiService,
  ) {}

  aplicarMascaraCpf(valorDigitado: string): void {
    if (!valorDigitado) {
      this.cpfBusca = '';
      this.onCpfChange();
      return;
    }
    const digitandoParaTras = valorDigitado.length < this.cpfBusca.length;
    const numeros = this.somenteNumeros(valorDigitado);
    const n = numeros.slice(0, 11);

    if (digitandoParaTras) {
      if (n.length <= 3) {
        this.cpfBusca = n;
      } else if (n.length <= 6) {
        this.cpfBusca = `${n.slice(0, 3)}.${n.slice(3)}`;
      } else if (n.length <= 9) {
        this.cpfBusca = `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
      } else {
        this.cpfBusca = `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
      }
    } else {
      if (n.length <= 3) {
        this.cpfBusca = n.length === 3 ? `${n}.` : n;
      } else if (n.length <= 6) {
        this.cpfBusca =
          n.length === 6
            ? `${n.slice(0, 3)}.${n.slice(3)}.`
            : `${n.slice(0, 3)}.${n.slice(3)}`;
      } else if (n.length <= 9) {
        this.cpfBusca =
          n.length === 9
            ? `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}-`
            : `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
      } else {
        this.cpfBusca = `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
      }
    }

    this.onCpfChange();
  }

  onCpfChange(): void {
    const cpfNumerico = this.somenteNumeros(this.cpfBusca);
    if (cpfNumerico.length < 11) {
      this.doadorEncontrado = null;
      this.mensagem = '';
      return;
    }
    this.buscarDoadorPorCpf(cpfNumerico);
  }

  private buscarDoadorPorCpf(cpf: string): void {
    this.api.getDoadores(cpf).subscribe({
      next: (res: any) => {
        const lista = Array.isArray(res) ? res : (res?.results ?? []);
        this.doadorEncontrado = lista[0] ?? null;
        this.mensagem = this.doadorEncontrado ? '' : 'Doador não encontrado.';
      },
      error: () => {
        this.doadorEncontrado = null;
        this.mensagem = 'Erro ao buscar doador.';
      },
    });
  }

  private somenteNumeros(valor: string): string {
    return (valor || '').replace(/\D/g, '');
  }

  private calcularIdade(dataNascimento: string): number | null {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  get analiseEtaria(): { invalida: boolean; mensagem: string } {
    const idade = this.calcularIdade(this.doadorEncontrado?.data_nascimento);
    if (idade === null) return { invalida: false, mensagem: '' };

    if (idade < 16) {
      return {
        invalida: true,
        mensagem: `Doador com ${idade} anos. A legislação permite doações estritamente a partir dos 16 anos.`,
      };
    }
    if (idade > 69) {
      return {
        invalida: true,
        mensagem: `Doador com ${idade} anos. A legislação limite a doação de sangue para a idade máxima de 69 anos.`,
      };
    }

    return { invalida: false, mensagem: '' };
  }
  get doadorTotalmenteApto(): boolean {
    if (!this.doadorEncontrado) return false;

    const aptoNoBanco = this.doadorEncontrado.apto_para_doacao === true;
    const idadeDentroDaLei = !this.analiseEtaria.invalida;

    return aptoNoBanco && idadeDentroDaLei;
  }

  iniciar(): void {
    if (!this.doadorEncontrado) return;

    if (!this.doadorTotalmenteApto) {
      this.toast.exibir(
        'Ação bloqueada: O doador possui impedimentos legais ou clínicos.',
        false,
      );
      return;
    }

    this.modalVisivel = true;
  }

  cancelarInicio(): void {
    this.modalVisivel = false;
  }

  confirmarInicio(): void {
    this.modalVisivel = false;
    const cpf = this.doadorEncontrado.cpf || this.cpfBusca;

    this.api.iniciarDoacao(cpf).subscribe({
      next: () => {
        this.toast.exibir('Doação iniciada com sucesso!', true);
        this.cpfBusca = '';
        this.doadorEncontrado = null;
      },
      error: (err) => {
        const msgErro = err?.error?.erro || 'Erro ao iniciar doação.';
        this.toast.exibir(msgErro, false);
      },
    });
  }

  voltar() {
    this.router.navigate(['/processo-doacao-REC']);
  }
}
