import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FuncionariosService } from '../../services/funcionarios.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cadastro-funcionario',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cadastro-funcionario.component.html',
  styleUrl: './cadastro-funcionario.component.scss',
})
export class CadastroFuncionarioComponent {
  form: FormGroup;
  modoEdicao = false;
  idFuncionario: number | null = null;
  tituloPagina = 'Cadastro Funcionário';
  somenteVisualizar: boolean = false;

  constructor(
    private fb: FormBuilder,
    private funcionarioService: FuncionariosService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      nomeCompleto: ['', Validators.required],
      cargo: ['', Validators.required],
      email: ['', Validators.required],
      telefone: [''],
      dataNascimento: ['', Validators.required],
      cpf: ['', Validators.required],
      endereco: [''],
      registro: [''],
      senha: ['', Validators.required],
      confirmarSenha: ['', Validators.required],
    });
  }

  ngOnInit() {
    const estado = window.history.state;

    console.log('Estado recebido:', estado);

    if (estado && estado.funcionario) {
      const f = estado.funcionario;
      this.modoEdicao = true;
      this.idFuncionario = f.id;

      this.somenteVisualizar = !!estado.visualizar;

      this.form.patchValue({
        nomeCompleto: f.nome_completo,
        cargo: f.cargo,
        email: f.email,
        telefone: f.telefone || '',
        dataNascimento: f.data_nascimento,
        cpf: f.cpf,
        endereco: f.endereco || '',
        registro: f.crm || f.coren || '',
      });

      if (this.somenteVisualizar) {
        this.form.disable();
      }

      this.form.get('senha')?.clearValidators();
      this.form.get('confirmarSenha')?.clearValidators();
      this.form.get('senha')?.updateValueAndValidity();
      this.form.get('confirmarSenha')?.updateValueAndValidity();
    }
  }

  salvar() {
    if (this.form.invalid && !this.form.disabled) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    const dados = this.form.getRawValue();

    if (this.modoEdicao && this.idFuncionario) {
      if (!dados.senha || dados.senha.trim() === '') {
        delete dados.senha;
        delete dados.confirmarSenha;
      } else if (dados.senha !== dados.confirmarSenha) {
        alert('As senhas novas não coincidem!');
        return;
      }

      this.funcionarioService.editar(this.idFuncionario, dados).subscribe({
        next: () => {
          alert('Dados atualizados com sucesso!');
          this.router.navigate(['/gestao-pessoal']);
        },
        error: (err) => alert('Erro ao atualizar funcionário.'),
      });
    } else {
      this.funcionarioService.cadastrar(dados).subscribe({
        next: () => this.router.navigate(['/gestao-pessoal']),
        error: () => alert('Erro ao cadastrar'),
      });
    }
  }
  voltar() {
    this.router.navigate(['/gestao-crud']);
  }
}
