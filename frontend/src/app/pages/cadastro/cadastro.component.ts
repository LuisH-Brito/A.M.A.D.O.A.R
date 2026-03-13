import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DoadorService } from '../../services/doador.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss',
})
export class CadastroComponent implements OnInit {
  modoEdicao = false;
  idDoador!: number;

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
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['modo'] === 'editar') {
        this.modoEdicao = true;
        this.carregarDadosDoador();
      }
    });
  }

  carregarDadosDoador() {
    this.doadorService.obterDoador().subscribe({
      next: (res: any) => {
        const dados = res;

        if (!dados) return;

        this.idDoador = dados.id;

        this.dados.nome_completo = dados.nome_completo;
        this.dados.email = dados.email;
        this.dados.cpf = dados.cpf;
        this.dados.telefone = dados.telefone;
        this.dados.data_nascimento = dados.data_nascimento;
        this.dados.endereco = dados.endereco;

        this.dados.sexo = dados.sexo === 'M' ? 'Masculino' : 'Feminino';

        if (dados.tipo_sanguineo_declarado && dados.fator_rh) {
          this.dados.tipoCompleto =
            dados.tipo_sanguineo_declarado + dados.fator_rh;
        }
      },

      error: (err) => {
        console.error('Erro ao carregar dados', err);
      },
    });
  }

  concluirCadastro() {
    if (this.dados.senha || this.dados.confirmarSenha) {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(this.dados.senha)) {
        alert(
          'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.',
        );
        return;
      }

      if (this.dados.senha !== this.dados.confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
      }
    }

    const doadorParaEnviar: any = {
      email: this.dados.email,
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

    if (this.dados.senha) {
      doadorParaEnviar.password = this.dados.senha;
    }

    if (this.modoEdicao) {
      this.doadorService.atualizarDoador(doadorParaEnviar).subscribe({
        next: () => {
          alert('Dados atualizados com sucesso');
          this.router.navigate(['/pagina-doador']);
        },

        error: (err) => {
          console.error('Erro ao atualizar', err);
        },
      });
    } else {
      this.doadorService.cadastrar(doadorParaEnviar).subscribe({
        next: () => {
          this.router.navigate(['/login'], {
            queryParams: { cadastrado: 'true' },
          });
        },

        error: (err) => {
          console.error('Erro ao cadastrar', err);

          const erroBackend = err.error
            ? JSON.stringify(err.error)
            : 'Erro de conexão';

          alert('Erro ao cadastrar: ' + erroBackend);
        },
      });
    }
  }

  cancelar() {
    this.router.navigate(['/login']);
  }
}
