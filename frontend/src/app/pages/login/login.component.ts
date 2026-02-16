import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  entrar() {
    alert('Login realizado!');
  }
  cadastrar() {
    alert('Redirecionar para cadastro!');
  }
}
