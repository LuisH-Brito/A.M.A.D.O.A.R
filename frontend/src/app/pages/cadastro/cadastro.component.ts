import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DoadorService } from '../../services/doador.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ModalConfirmacaoComponent,
    ToastNotificacaoComponent,
  ],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss',
})
export class CadastroComponent implements OnInit {
  modoEdicao = false;
  idDoador!: number;
  tituloPagina = 'Cadastro do Doador';
  mostrarSenha = false;
  mostrarConfirmarSenha = false;

  @ViewChild('toast') toast!: ToastNotificacaoComponent;
  modalVisivel = false;
  modalConfig = {
    titulo: '',
    mensagem: '',
    tipo: 'padrao' as 'padrao' | 'usar' | 'descartar',
    textoConfirmar: '',
  };

  tiposSanguineos = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
    'Não sei',
  ];

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

  voltar() {
    if (this.modoEdicao) {
      this.router.navigate(['/pagina-doador']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['modo'] === 'editar') {
        this.modoEdicao = true;
        this.carregarDadosDoador();
        this.tituloPagina = 'Editar Perfil do Doador';
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

  abrirModalConfirmacao() {
    if (this.dados.senha || this.dados.confirmarSenha) {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(this.dados.senha)) {
        this.toast.exibir(
          'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.',
          false,
        );
        return;
      }

      if (this.dados.senha !== this.dados.confirmarSenha) {
        this.toast.exibir('As senhas não coincidem!', false);
        return;
      }
    }

    this.modalConfig = {
      titulo: this.modoEdicao ? 'Salvar Alterações' : 'Confirmar Cadastro',
      mensagem: this.modoEdicao
        ? 'Tem certeza que deseja salvar as alterações no seu perfil?'
        : 'Confirma os dados informados para concluir o seu cadastro de doador?',
      tipo: 'usar',
      textoConfirmar: this.modoEdicao ? 'Sim, Salvar' : 'Sim, Cadastrar',
    };

    this.modalVisivel = true;
  }

  fecharModal() {
    this.modalVisivel = false;
  }

  concluirCadastro() {
    this.modalVisivel = false;

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
          this.toast.exibir('Dados atualizados com sucesso!', true);
          setTimeout(() => this.router.navigate(['/pagina-doador']), 1500);
        },
        error: (err) => {
          this.toast.exibir('Erro ao atualizar os dados.', false);
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
          const erroBackend = err.error
            ? JSON.stringify(err.error)
            : 'Erro de conexão';
          this.toast.exibir('Erro ao cadastrar: ' + erroBackend, false);
        },
      });
    }
  }

  cancelar() {
    if (this.modoEdicao) {
      this.router.navigate(['/pagina-doador']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
