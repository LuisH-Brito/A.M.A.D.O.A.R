import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DoadorService } from '../../services/doador.service';
import { FuncionariosService } from '../../services/funcionarios.service';
import { ExameDoadorService } from '../../services/exame-doador.service';

@Component({
  selector: 'app-doador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './doador.component.html',
  styleUrl: './doador.component.scss',
})
export class DoadorComponent implements OnInit {
  modoEdicao = false;
  idUsuario!: number;
  cargoAtual = '';

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
  };

  exames: any[] = [];

  constructor(
    private doadorService: DoadorService,
    private funcionariosService: FuncionariosService,
    private exameDoadorService: ExameDoadorService,
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
      // Busca dados do Doador
      this.doadorService.obterDoador().subscribe({
        next: (res: any) => {
          this.preencherFormulario(res);
          this.usuario.tipoSanguineo =
            (res.tipo_sanguineo_declarado || '') + (res.fator_rh || '');
          this.usuario.telefone = res.telefone;
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
      // Busca dados do Funcionário (Médico, Enfermeiro, etc)
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
          alert('Dados atualizados com sucesso!');
          this.modoEdicao = false;
        },
        error: (err) => console.error(err),
      });
    } else {
      this.funcionariosService
        .atualizarPerfilPessoal(this.cargoAtual, dadosAtualizados)
        .subscribe({
          next: () => {
            alert('Dados atualizados com sucesso!');
            this.modoEdicao = false;
          },
          error: (err) => console.error(err),
        });
    }
  }
}
