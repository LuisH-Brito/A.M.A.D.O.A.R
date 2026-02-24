import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  showPassword = false;
  mensagemSucesso: string | null = null;

  constructor(private route: ActivatedRoute) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['cadastrado'] === 'true') {
        this.mensagemSucesso =
          'Cadastro realizado com sucesso! Faça seu login.';
      }
    });
  }
}
