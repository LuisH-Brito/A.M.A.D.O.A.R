import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FuncionariosService } from '../../services/funcionarios.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cadastro-funcionario',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './cadastro-funcionario.component.html',
  styleUrl: './cadastro-funcionario.component.scss',
})
export class CadastroFuncionarioComponent {
  form: FormGroup;

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

  salvar() {
    if (this.form.invalid) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    if (this.form.value.senha !== this.form.value.confirmarSenha) {
      alert('As senhas não coincidem');
      return;
    }

    this.funcionarioService.cadastrar(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/gestao-pessoal'], {
          queryParams: { cadastrado: 'true' },
        });
      },
      error: (err) => {
        console.error(err);
        alert('Erro ao cadastrar funcionário');
      },
    });
  }
}
