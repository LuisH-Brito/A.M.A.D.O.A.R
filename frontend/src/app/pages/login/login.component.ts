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
  styleUrl: './login.component.scss',
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
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['cadastrado'] === 'true') {
        this.mensagemSucesso =
          'Cadastro realizado com sucesso! Faça seu login.';
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  fazerLogin() {
    const url = 'http://localhost:8000/api/token/';
    const loginPayload = {
      cpf: this.loginData.cpf,
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
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.toastComponente.exibir('CPF ou senha incorretos.', false);
      },
    });
  }
}
