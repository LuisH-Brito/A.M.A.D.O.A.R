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
  modoRecepcionista = false;
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
    if (this.modoRecepcionista) {
      this.router.navigate(['/processo-doacao-REC']);
    } else if (this.modoEdicao) {
      this.router.navigate(['/pagina-perfil']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.modoEdicao = params['modo'] === 'editar';
      this.modoRecepcionista = params['modo'] === 'recepcionista';
      if (params['modo'] === 'editar') {
        this.carregarDadosDoador();
        this.tituloPagina = 'Editar Perfil do Doador';
      } else if (params['modo'] === 'recepcionista') {
        this.tituloPagina = 'Cadastrar Doador';
      } else {
        this.tituloPagina = 'Cadastro do Doador';
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
    if (!this.modoEdicao && !this.cpfValido(this.dados.cpf)) {
      this.toast.exibir('CPF inválido.', false);
      return;
    }

    if (this.dados.data_nascimento > this.dataMaxima) {
      this.toast.exibir(
        'A data de nascimento não pode ser futura.',
        false,
      );
      return;
    }

    if (!this.modoRecepcionista && (this.dados.senha || this.dados.confirmarSenha)) {
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

    if (!this.modoRecepcionista && this.dados.senha) {
      doadorParaEnviar.password = this.dados.senha;
    }

    if (this.modoEdicao) {
      this.doadorService.atualizarDoador(doadorParaEnviar).subscribe({
        next: () => {
          this.toast.exibir('Dados atualizados com sucesso!', true);
          setTimeout(() => this.router.navigate(['/pagina-perfil']), 1500);
        },
        error: (err) => {
          this.toast.exibir('Erro ao atualizar os dados.', false);
        },
      });
    } else if (this.modoRecepcionista) {
      this.doadorService.cadastrarPelaRecepcao(doadorParaEnviar).subscribe({
        next: () => {
          this.toast.exibir(
            'Doador cadastrado com sucesso. A senha inicial é Senha123 e deverá ser alterada no primeiro acesso.',
            true,
          );
          this.dados = {
            nome_completo: '', email: '', cpf: '', endereco: '',
            data_nascimento: '', telefone: '', senha: '', confirmarSenha: '',
            sexo: '', tipoCompleto: '',
          };
        },
        error: (err) => {
          const detalhes = err?.error ? JSON.stringify(err.error) : 'Erro de conexão';
          this.toast.exibir('Erro ao cadastrar: ' + detalhes, false);
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
    if (this.modoRecepcionista) {
      this.router.navigate(['/processo-doacao-REC']);
    } else if (this.modoEdicao) {
      this.router.navigate(['/pagina-perfil']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  aplicarMascaraCpf(event: any): void {
    const input = event.target as HTMLInputElement;
    const apenasNumeros = input.value.replace(/\D/g, '').slice(0, 11);
    
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
    this.dados.cpf = cpfFormatado;
  }

  cpfValido(cpf: string): boolean {
    const numeros = (cpf || '').replace(/\D/g, '');

    if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
      return false;
    }

    const calcularDigito = (base: string, pesoInicial: number): number => {
      const soma = base.split('').reduce((total, numero, indice) => {
        return total + Number(numero) * (pesoInicial - indice);
      }, 0);

      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const primeiroDigito = calcularDigito(numeros.slice(0, 9), 10);

    if (primeiroDigito !== Number(numeros[9])) {
      return false;
    }

    const segundoDigito = calcularDigito(numeros.slice(0, 10), 11);

    return segundoDigito === Number(numeros[10]);
  }

  telefoneValido(telefone: string): boolean {
    const numeros = (telefone || '').replace(/\D/g, '');

    if (!/^\d{10,11}$/.test(numeros)) {
      return false;
    }

    const ddd = Number(numeros.slice(0, 2));
    const numero = numeros.slice(2);

    if (ddd < 11 || ddd > 99 || /^0+$/.test(numero)) {
      return false;
    }

    if (numero.length === 9) {
      return numero.startsWith('9');
    }

    return /^[2-5]/.test(numero);
  }

  get dataMaxima(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }
}
