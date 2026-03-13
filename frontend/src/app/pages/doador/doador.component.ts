import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { DoadorService } from '../../services/doador.service';
import { FuncionariosService } from '../../services/funcionarios.service';
import { ExameDoadorService } from '../../services/exame-doador.service';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';

@Component({
  selector: 'app-doador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ToastNotificacaoComponent],
  templateUrl: './doador.component.html',
  styleUrl: './doador.component.scss',
})
export class DoadorComponent implements OnInit {
  @ViewChild('toast') toastComponente!: ToastNotificacaoComponent;
  modoEdicao = false;
  idUsuario!: number;
  cargoAtual = '';
  carteiraUrl: string | null = null;
  mostrarCarteira = false;

  // Variáveis de controlo de interface
  isDoador = false;
  isMedico = false;
  isEnfermeiro = false;
  isRecepcionista = false;

  usuario = {
    nome: '',
    tipoSanguineo: '',
    estado: 'AC',
    cidade: '',
    rua: '',
    numero: '',
    telefone: '',
    email: '',
    dataNascimento: '',
    sexo: '',
    cpf: '',
    ultimaDoacao: '',
    proximaDoacao: '',
    crm: '',
    coren: '',
    cargo: '',
    apto: false,
  };

  exames: any[] = [];

  constructor(
    private doadorService: DoadorService,
    private funcionariosService: FuncionariosService,
    private exameDoadorService: ExameDoadorService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargoAtual = localStorage.getItem('cargo') || '';
    this.isDoador = this.cargoAtual === 'doador';
    this.isMedico = this.cargoAtual === 'medico';
    this.isEnfermeiro = this.cargoAtual === 'enfermeiro';
    this.isRecepcionista = this.cargoAtual === 'recepcionista';

    this.carregarDadosPerfil();
  }

  carregarDadosPerfil() {
    if (this.isDoador) {
      this.doadorService.obterDoador().subscribe({
        next: (res: any) => {
          this.preencherFormulario(res);

          // Lógica do Tipo Sanguíneo e Notificação
          const sangueNovo =
            (res.tipo_sanguineo_declarado || '') + (res.fator_rh || '');
          const sangueCache = localStorage.getItem('sangue_cache');
          if (
            sangueCache !== null &&
            sangueCache !== sangueNovo &&
            sangueNovo !== ''
          ) {
            setTimeout(() => {
              this.toastComponente.exibir(
                `Seu tipo sanguíneo foi validado pelo médico como ${sangueNovo}!`,
              );
            }, 800);
          }
          localStorage.setItem('sangue_cache', sangueNovo);
          this.usuario.tipoSanguineo = sangueNovo;
          // Lógica pra ve se ta apto e a proxima doação
          this.usuario.ultimaDoacao = res.data_ultima_doacao || '';
          this.usuario.proximaDoacao = res.data_proxima_doacao || '';
          this.usuario.apto = res.apto_para_doacao;

          const aptoCache = localStorage.getItem('apto_cache');
          if (this.usuario.apto === true && aptoCache !== 'true') {
            setTimeout(() => {
              this.toastComponente.exibir(
                'Boas notícias! Você já está apto para realizar uma nova doação de sangue.',
              );
            }, 1600);
          }
          localStorage.setItem(
            'apto_cache',
            this.usuario.apto ? 'true' : 'false',
          );
          this.usuario.telefone = res.telefone;
          this.carteiraUrl = res.carteira_doador;
        },
        error: (err) => console.error('Erro ao carregar dados do doador', err),
      });

      // Busca a lista de exames do doador
      this.exameDoadorService.listarMeusExames().subscribe({
        next: (resposta: any) => {
          const listaExames = Array.isArray(resposta)
            ? resposta
            : resposta.results || [];

          this.exames = listaExames.map((ex: any) => ({
            nome: ex.nome_arquivo,
            data: new Date(ex.data_upload).toLocaleDateString('pt-BR'),
            link: ex.arquivo,
          }));
        },
        error: (err) => console.error('Erro ao buscar exames do doador', err),
      });
    } else {
      this.funcionariosService.obterPerfilPessoal(this.cargoAtual).subscribe({
        next: (res: any) => {
          this.preencherFormulario(res);

          if (this.isMedico) this.usuario.crm = res.crm || res.registro;
          if (this.isEnfermeiro) this.usuario.coren = res.coren || res.registro;
        },
        error: (err) =>
          console.error('Erro ao carregar dados do profissional', err),
      });
    }
  }

  navegarComDados(apenasVisualizar: boolean = false) {
    let cargoFormatado = '';

    if (this.cargoAtual === 'medico') {
      cargoFormatado = 'Médico';
    } else if (this.cargoAtual === 'enfermeiro') {
      cargoFormatado = 'Enfermeiro';
    } else if (this.cargoAtual === 'recepcionista') {
      cargoFormatado = 'Recepcionista';
    }

    const funcionario = {
      id: this.idUsuario,
      nome_completo: this.usuario.nome,
      cargo: cargoFormatado,
      email: this.usuario.email,
      data_nascimento: this.usuario.dataNascimento,
      cpf: this.usuario.cpf,
      endereco: this.usuario.rua,
      crm: this.usuario.crm,
      coren: this.usuario.coren,
    };

    this.router.navigate(['/cadastro-funcionario'], {
      state: {
        funcionario: funcionario,
        visualizar: apenasVisualizar,
        origem: 'perfil',
      },
    });
  }

  visualizarCarteira() {
    if (this.carteiraUrl) {
      window.open(this.carteiraUrl, '_blank');
    }
  }
  abrirCarteira() {
    this.mostrarCarteira = true;
  }

  fecharCarteira() {
    this.mostrarCarteira = false;
  }

  abrirQuestionario() {
    if (!this.usuario.cpf) {
      alert('Doador não encontrado.');
      return;
    }
    this.router.navigate(['/questionario-processo/'], {
      queryParams: { cpf: this.usuario.cpf },
    });
  }

  private preencherFormulario(dadosBanco: any) {
    this.idUsuario = dadosBanco.id;
    this.usuario.nome = dadosBanco.nome_completo;
    this.usuario.email = dadosBanco.email;
    this.usuario.dataNascimento = dadosBanco.data_nascimento;
    this.usuario.sexo = dadosBanco.sexo;
    this.usuario.cpf = dadosBanco.cpf || dadosBanco.username;
    this.usuario.rua = dadosBanco.endereco;
  }

  ativarEdicao() {
    this.modoEdicao = true;
  }

  cancelarEdicao() {
    this.modoEdicao = false;
    this.carregarDadosPerfil();
  }

  salvarAlteracoes() {
    const dadosAtualizados: any = {
      nome_completo: this.usuario.nome,
      email: this.usuario.email,
      endereco: `${this.usuario.rua}, ${this.usuario.numero}`.replace(
        ', undefined',
        '',
      ),
    };

    if (this.isDoador) {
      dadosAtualizados.telefone = this.usuario.telefone;
      this.doadorService.atualizarDoador(dadosAtualizados).subscribe({
        next: () => {
          this.toastComponente.exibir('Dados atualizados com sucesso!');
          this.modoEdicao = false;
        },
        error: (err) => console.error(err),
      });
    } else {
      this.funcionariosService
        .atualizarPerfilPessoal(this.cargoAtual, dadosAtualizados)
        .subscribe({
          next: () => {
            this.toastComponente.exibir('Dados atualizados com sucesso!');
            this.modoEdicao = false;
          },
          error: (err) => console.error(err),
        });
    }
  }
}
