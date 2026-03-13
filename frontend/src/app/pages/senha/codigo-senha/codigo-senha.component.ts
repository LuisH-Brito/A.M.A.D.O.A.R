import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-codigo-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './codigo-senha.component.html',
  styleUrl: './codigo-senha.component.scss',
})
export class CodigoSenhaComponent implements OnInit, OnDestroy {
  codigo = '';
  emailDestino = '';
  cpf = '';

  segundosRestantes = 0;
  private readonly tempoBloqueio = 60;
  private timerId: ReturnType<typeof setInterval> | null = null;

  validandoCodigo = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const cpf = (params.get('cpf') || '').trim();

      if (!cpf) {
        alert('Dados inválidos para recuperação de senha.');
        this.router.navigate(['/redefinir-senha']);
        return;
      }

      this.cpf = cpf;

      this.api.searchEmailByCpf(this.cpf).subscribe({
        next: (res) => {
          this.emailDestino = res.email;
          this.enviarCodigo();
        },
        error: () => {
          alert('Não foi possível localizar o email para este CPF.');
          this.router.navigate(['/redefinir-senha']);
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.pararContador();
  }

  get podeReenviar(): boolean {
    return this.segundosRestantes === 0;
  }

  get tempoRestanteFormatado(): string {
    const minutos = Math.floor(this.segundosRestantes / 60).toString().padStart(2, '0');
    const segundos = (this.segundosRestantes % 60).toString().padStart(2, '0');
    return `${minutos}:${segundos}`;
  }

  private enviarCodigo(): void {
    this.codigo = ''; // descarta código digitado anteriormente no front
    this.api.requestCodePasswordReset(this.cpf).subscribe({
      next: () => {
        this.iniciarContador();
      },
      error: (err) => {
        const mensagem =
          err?.error?.erro || 'Não foi possível enviar o código de verificação.';
        alert(mensagem);
        this.router.navigate(['/redefinir-senha']);
      },
    });
  }

  private iniciarContador(): void {
    this.pararContador();
    this.segundosRestantes = this.tempoBloqueio;

    this.timerId = setInterval(() => {
      if (this.segundosRestantes > 0) {
        this.segundosRestantes--;
      }
      if (this.segundosRestantes === 0) {
        this.pararContador();
      }
    }, 1000);
  }

  private pararContador(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  reenviarCodigo(): void {
    if (!this.podeReenviar) return;
    this.enviarCodigo();
  }

  voltar(): void {
    this.router.navigate(['/redefinir-senha']);
  }

  continuar(): void {
    const codigoInformado = this.codigo.trim();

    if (!codigoInformado) {
      alert('Informe o código recebido por email.');
      return;
    }

    this.validandoCodigo = true;

    this.api.validatePasswordResetCode(this.cpf, codigoInformado).subscribe({
      next: () => {
        this.validandoCodigo = false;
        this.router.navigate(['/redefinir-senha/nova-senha'], {
          queryParams: {
            codigo: codigoInformado,
            cpf: this.cpf,
          },
        });
      },
      error: (err) => {
        this.validandoCodigo = false;
        const mensagem = err?.error?.erro || 'Código inválido ou expirado.';
        alert(mensagem);
      },
    });
  }

  get emailDestinoMascarado(): string {
    return this.mascararEmail(this.emailDestino);
  }

  private mascararEmail(email: string): string {
    const [usuario, dominioCompleto] = email.split('@');
    if (!usuario || !dominioCompleto) return email;

    const [dominio, ...sufixos] = dominioCompleto.split('.');
    const usuarioMascarado = this.mascararParte(usuario, 2, 1);
    const dominioMascarado = this.mascararParte(dominio, 1, 0);

    const sufixo = sufixos.length ? `.${sufixos.join('.')}` : '';
    return `${usuarioMascarado}@${dominioMascarado}${sufixo}`;
  }

  private mascararParte(parte: string, inicioVisivel: number, fimVisivel: number): string {
    if (!parte) return '';
    if (parte.length <= inicioVisivel + fimVisivel) {
      return parte[0] + '*'.repeat(Math.max(parte.length - 1, 1));
    }

    const inicio = parte.slice(0, inicioVisivel);
    const fim = fimVisivel ? parte.slice(-fimVisivel) : '';
    const meio = '*'.repeat(Math.max(parte.length - inicioVisivel - fimVisivel, 2));

    return `${inicio}${meio}${fim}`;
  }
}