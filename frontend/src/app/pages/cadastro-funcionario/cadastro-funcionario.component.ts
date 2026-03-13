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
  mostrarSenha = false;
  mostrarConfirmarSenha = false;
  erroApi: string = '';
  carregando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private funcionarioService: FuncionariosService,
    private router: Router,
  ) {
    this.form = this.fb.group(
      {
        nomeCompleto: ['', Validators.required],
        cargo: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        dataNascimento: ['', Validators.required],
        cpf: ['', Validators.required],
        endereco: ['', Validators.required],
        registro: [''],
        senha: [
          '',
          [
            Validators.required,
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/),
          ],
        ],
        confirmarSenha: ['', Validators.required],
      },
      { validators: this.senhasIguais },
    );
  }

  get mostrarCRM(): boolean {
    return this.form.get('cargo')?.value === 'Médico';
  }

  get mostrarCOREN(): boolean {
    return this.form.get('cargo')?.value === 'Enfermeiro';
  }

  formatarCPF(event: any) {
    let valor = event.target.value;

    valor = valor.replace(/[^a-zA-Z0-9]/g, '');

    if (valor.length > 3) {
      valor = valor.replace(/^(.{3})(.{3})(.{3})(.{0,2}).*/, '$1.$2.$3-$4');
    }

    this.form.get('cpf')?.setValue(valor, { emitEvent: false });
  }

  senhasIguais(form: FormGroup) {
    const senha = form.get('senha')?.value;
    const confirmar = form.get('confirmarSenha')?.value;

    return senha === confirmar ? null : { senhasDiferentes: true };
  }

  formatarRegistro(event: any) {
    let valor = event.target.value.toUpperCase();

    valor = valor.replace(/[^A-Z0-9-]/g, '');

    const cargo = this.form.get('cargo')?.value;

    if (cargo === 'Médico') {
      if (!valor.startsWith('CRM')) {
        valor = 'CRM-' + valor.replace(/^CRM-?/, '');
      }
    }

    if (cargo === 'Enfermeiro') {
      if (!valor.startsWith('COREN')) {
        valor = 'COREN-' + valor.replace(/^COREN-?/, '');
      }
    }

    this.form.get('registro')?.setValue(valor, { emitEvent: false });
  }

  toggleSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  toggleConfirmarSenha() {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }
  ngOnInit() {
    const estado = window.history.state;

    if (estado && estado.funcionario) {
      const f = estado.funcionario;

      this.modoEdicao = true;
      this.idFuncionario = f.id;
      this.somenteVisualizar = !!estado.visualizar;

      this.form.patchValue({
        nomeCompleto: f.nome_completo,
        cargo: f.cargo,
        email: f.email,
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

    this.form.get('cargo')?.valueChanges.subscribe((cargo) => {
      const registro = this.form.get('registro');

      if (cargo === 'Médico') {
        registro?.setValidators([
          Validators.required,
          Validators.pattern(/^CRM-[A-Z]{2}-\d{4,6}$/),
        ]);
      } else if (cargo === 'Enfermeiro') {
        registro?.setValidators([
          Validators.required,
          Validators.pattern(/^COREN-[A-Z]{2}-\d{4,6}$/),
        ]);
      } else {
        registro?.clearValidators();
      }

      registro?.updateValueAndValidity();
    });
  }

  aplicarErrosBackend(erros: any) {
    Object.keys(erros).forEach((campo) => {
      const controle = this.form.get(campo);

      if (controle) {
        controle.setErrors({
          backend: erros[campo][0],
        });
      }
    });
  }
  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.funcionarioService.cadastrar(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/gestao-pessoal']);
      },

      error: (erro) => {
        this.carregando = false;

        if (erro.status === 400) {
          this.erroApi =
            'Dados inválidos. CPF, CRM, COREN ou e-mail já cadastrado..';
        } else if (erro.status === 409) {
          this.erroApi = 'CPF ou e-mail já cadastrado.';
        } else if (erro.status === 500) {
          this.erroApi = 'Erro interno do servidor.';
        } else {
          this.erroApi = 'Erro ao cadastrar funcionário.';
        }
      },
    });
  }

  voltar() {
    this.router.navigate(['/gestao-pessoal']);
  }
}
