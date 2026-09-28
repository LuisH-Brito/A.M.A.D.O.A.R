import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ToastNotificacaoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  @ViewChild('toast') toastComponente!: ToastNotificacaoComponent;
  showPassword = false;
  mensagemSucesso: string | null = null;
  loginData = {
    cpf: '',
    password: '',
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
  ) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['cadastrado'] === 'true') {
        this.mensagemSucesso =
          'Cadastro realizado com sucesso! Faça seu login.';
        this.toastComponente.exibir(this.mensagemSucesso, true);
      } else if (params['senhaAlterada'] === 'true') {
        this.mensagemSucesso = 'Senha alterada com sucesso. Entre novamente com sua nova senha.';
        this.toastComponente.exibir(this.mensagemSucesso, true);
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  aplicarMascaraCpf(event: any): void {
    const input = event.target as HTMLInputElement;
    const valorAtual = input.value;

    if (/[a-zA-Z]/.test(valorAtual)) {
      this.loginData.cpf = valorAtual;
      return;
    }

    // Caso contrário, aplica a máscara normal de CPF baseada apenas em números
    const apenasNumeros = valorAtual.replace(/\D/g, '').slice(0, 11);
    
    let cpfFormatado = '';
    if (apenasNumeros.length <= 3) {
      cpfFormatado = apenasNumeros;
    } else if (apenasNumeros.length <= 6) {
      cpfFormatado = `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3)}`;
    } else if (apenasNumeros.length <= 9) {
      cpfFormatado = `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6)}`;
    } else {
      cpfFormatado = `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6, 9)}-${apenasNumeros.slice(9, 11)}`;
    }

    input.value = cpfFormatado;
    this.loginData.cpf = cpfFormatado;
  }

  fazerLogin(event?: Event) {
    event?.preventDefault();

    const identifier = /[a-zA-Z]/.test(this.loginData.cpf)
      ? this.loginData.cpf
      : this.loginData.cpf.replace(/\D/g, '');

    const url = 'api/token/';
    const loginPayload = {
      cpf: identifier,
      password: this.loginData.password,
    };

    this.http.post<any>(url, loginPayload).subscribe({
      next: (res) => {
        console.log('Dados vindos do Django:', res);
        localStorage.setItem('access', res.access);
        localStorage.setItem('refresh', res.refresh);
        localStorage.setItem('cargo', res.tipo);
        localStorage.setItem('nomeUsuario', res.nome);
        localStorage.setItem('usuario_id', res.usuario_id.toString());
        this.router.navigate([
          res.deve_alterar_senha ? '/troca-senha-obrigatoria' : '/',
        ]);
      },
      error: () => {
        this.toastComponente?.exibir('CPF ou senha incorretos.', false);
      },
    });
  }
}
