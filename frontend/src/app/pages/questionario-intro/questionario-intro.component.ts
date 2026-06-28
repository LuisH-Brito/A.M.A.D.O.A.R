import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoadorService } from '../../services/doador.service';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-questionario-intro',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNotificacaoComponent],
  templateUrl: './questionario-intro.component.html',
  styleUrls: ['./questionario-intro.component.scss'],
})
export class QuestionarioIntroComponent implements OnInit {
  aceitoRegras = false;
  doadorLogado: any = null;
  carregando = true;

  @ViewChild('toast') toast!: ToastNotificacaoComponent;

  constructor(
    private router: Router,
    private doadorService: DoadorService,
  ) {}

  ngOnInit(): void {
    this.carregarStatusDoador();
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
    const idade = this.calcularIdade(this.doadorLogado?.data_nascimento);
    if (idade === null) return { invalida: false, mensagem: '' };

    if (idade < 16) {
      return {
        invalida: true,
        mensagem: `Você possui ${idade} anos. A legislação brasileira permite a doação de sangue apenas a partir dos 16 anos.`,
      };
    }
    if (idade > 69) {
      return {
        invalida: true,
        mensagem: `Você possui ${idade} anos. A legislação limita a doação de sangue à idade máxima de 69 anos.`,
      };
    }

    return { invalida: false, mensagem: '' };
  }

  get podeResponderQuestionario(): boolean {
    if (!this.doadorLogado) return false;

    const aptoNoBanco = this.doadorLogado.apto_para_doacao === true;
    const idadeDentroDaLei = !this.analiseEtaria.invalida;

    return aptoNoBanco && idadeDentroDaLei;
  }

  carregarStatusDoador(): void {
    this.doadorService.obterDoador().subscribe({
      next: (res: any) => {
        this.doadorLogado = res;
        this.carregando = false;

        if (!this.podeResponderQuestionario) {
          setTimeout(() => {
            this.toast.exibir(
              'Atenção: Identificamos restrições que impedem sua doação no momento.',
              false,
            );
          }, 500);
        }
      },
      error: (err) => {
        this.carregando = false;
        this.toast.exibir(
          'Erro ao carregar seus dados. Verifique sua conexão ou faça login novamente.',
          false,
        );
        console.error('Erro ao buscar perfil:', err);
      },
    });
  }

  iniciar(): void {
    if (!this.aceitoRegras) return;

    if (!this.podeResponderQuestionario) {
      this.toast.exibir(
        'Ação bloqueada: Você possui impedimentos legais ou clínicos para preencher a triagem.',
        false,
      );
      return;
    }

    this.router.navigate(['/questionario_form']);
  }
}
