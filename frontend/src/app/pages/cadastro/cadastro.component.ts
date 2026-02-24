import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DoadorService } from '../../services/doador.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss',
})
export class CadastroComponent {
  dados = {
    nome_completo: '',
    email: '',
    cpf: '',
    endereco: '',
    data_nascimento: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    sexo: '',
    tipoCompleto: '',
  };

  constructor(
    private doadorService: DoadorService,
    private router: Router,
  ) {}

  concluirCadastro() {
    if (this.dados.senha !== this.dados.confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    const doadorParaEnviar = {
      username: this.dados.email,
      email: this.dados.email,
      password: this.dados.senha,
      nome_completo: this.dados.nome_completo,
      cpf: this.dados.cpf,
      endereco: this.dados.endereco,
      telefone: this.dados.telefone,
      sexo: this.dados.sexo === 'Masculino' ? 'M' : 'F',
      data_nascimento: this.dados.data_nascimento,

      tipo_sanguineo_declarado:
        this.dados.tipoCompleto !== 'Não sei' && this.dados.tipoCompleto !== ''
          ? this.dados.tipoCompleto.slice(0, -1)
          : null,
      fator_rh:
        this.dados.tipoCompleto !== 'Não sei' && this.dados.tipoCompleto !== ''
          ? this.dados.tipoCompleto.slice(-1)
          : null,
    };

    this.doadorService.cadastrar(doadorParaEnviar).subscribe({
      next: (res) => {
        console.log('Resposta do Servidor:', res);

        this.router.navigate(['/login'], {
          queryParams: { cadastrado: 'true' },
        });
      },
      error: (err) => {
        console.error('Erro detalhado:', err);

        const erroBackend = err.error
          ? JSON.stringify(err.error)
          : 'Erro de conexão';
        alert('Erro ao cadastrar: ' + erroBackend);
      },
    });
  }

  cancelar() {
    this.router.navigate(['/login']);
  }
}
