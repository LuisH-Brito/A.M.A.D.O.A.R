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

  carregarStatusDoador(): void {
    this.doadorService.obterDoador().subscribe({
      next: (res: any) => {
        this.doadorLogado = res;
        this.carregando = false;

        if (!this.doadorLogado.apto_para_doacao) {
          setTimeout(() => {
            this.toast.exibir(
              'Atenção: Você possui restrições para doação no momento.',
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

    if (this.doadorLogado && !this.doadorLogado.apto_para_doacao) {
      this.toast.exibir(
        'Ação bloqueada: Você não está apto para preencher a triagem agora.',
        false,
      );
      return;
    }

    this.router.navigate(['/questionario_form']);
  }
}
