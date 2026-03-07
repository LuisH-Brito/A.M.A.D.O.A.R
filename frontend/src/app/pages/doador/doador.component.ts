import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DoadorService } from '../../services/doador.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-doador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './doador.component.html',
  styleUrl: './doador.component.scss',
})
export class DoadorComponent implements OnInit {
  modoEdicao = false;
  idDoador!: number;

  doador = {
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
  };

  constructor(private doadorService: DoadorService) {}

  ngOnInit(): void {
    this.carregarDadosDoador();
  }

  carregarDadosDoador() {
    this.doadorService.obterDoador().subscribe({
      next: (res: any) => {
        const dados = res;

        this.idDoador = dados.id;

        this.doador.nome = dados.nome_completo;
        this.doador.telefone = dados.telefone;
        this.doador.email = dados.email;
        this.doador.dataNascimento = dados.data_nascimento;
        this.doador.sexo = dados.sexo;
        this.doador.cpf = dados.cpf;
        this.doador.rua = dados.endereco;

        this.doador.tipoSanguineo =
          (dados.tipo_sanguineo_declarado || '') + (dados.fator_rh || '');
      },

      error: (err) => {
        console.error('Erro ao carregar dados do doador', err);
      },
    });
  }

  ativarEdicao() {
    this.modoEdicao = true;
  }

  cancelarEdicao() {
    this.modoEdicao = false;
    this.carregarDadosDoador();
  }

  salvarAlteracoes() {
    const dadosAtualizados = {
      nome_completo: this.doador.nome,
      telefone: this.doador.telefone,
      email: this.doador.email,
      endereco: `${this.doador.rua}, ${this.doador.numero}`,
    };

    this.doadorService.atualizarDoador(dadosAtualizados).subscribe({
      next: () => {
        alert('Dados atualizados com sucesso!');
        this.modoEdicao = false;
      },

      error: (err) => {
        console.error(err);
      },
    });
  }
  exames = [{ nome: 'Exame laboratorial', data: '12/01/2025' }];
}
