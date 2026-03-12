import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { GestaoPessoalComponent } from './pages/gestao-pessoal/gestao-pessoal.component';
import { GestaoPessoalCrudComponent } from './pages/gestao-pessoal-crud/gestao-pessoal-crud.component';
import { QuestionarioComponent } from './pages/questionario/questionario.component';
import { QuestionarioIntroComponent } from './pages/questionario-intro/questionario-intro.component';
import { ListaProcessoDoacaoComponent } from './pages/lista-processo-doacao/lista-processo-doacao.component';
import { ProcessoDoacaoComponent } from './pages/processo-doacao/processo-doacao.component';
import { DoadorComponent } from './pages/doador/doador.component';
import { CadastroFuncionarioComponent } from './pages/cadastro-funcionario/cadastro-funcionario.component';
import { BolsaAguardandoValidacaoComponent } from './pages/bolsa-aguardando-validacao/bolsa-aguardando-validacao.component';
import { ValidacaoBolsaComponent } from './pages/validacao-bolsa/validacao-bolsa.component';
import { EstoqueBolsasComponent } from './pages/estoque-bolsas/estoque-bolsas.component';
import { ProcessoDoacaoIntroComponent } from './pages/processo-doacao-intro/processo-doacao-intro.component';
import { FormPreTriagemComponent } from './pages/form-pre-triagem/form-pre-triagem.component';
import { FormTriagemComponent } from './pages/form-triagem/form-triagem.component';
import { FormColetaComponent } from './pages/form-coleta/form-coleta.component';
import { QuestionarioProcessoComponent } from './pages/questionario-processo/questionario-processo.component';
import { ProcessoDoacaoMedComponent } from './pages/processo-doacao-med/processo-doacao-med.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Define Home como padrão
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  {
    path: 'gestao-pessoal',
    component: GestaoPessoalComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['administrador'] },
  },
  {
    path: 'gestao-crud',
    component: GestaoPessoalCrudComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['administrador'] },
  },
  {
    path: 'questionario',
    component: QuestionarioIntroComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['doador', 'medico', 'administrador'] },
  },
  {
    path: 'questionario_form',
    component: QuestionarioComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['doador', 'medico', 'administrador'] },
  },
  {
    path: 'processo-doacao-REC',
    component: ProcessoDoacaoComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['recepcionista', 'administrador'] },
  },
  {
    path: 'processo-doacao-MED',
    component: ProcessoDoacaoMedComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['medico', 'enfermeiro', 'administrador'] },
  },
  {
    path: 'iniciar-doacao',
    component: ProcessoDoacaoIntroComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['recepcionista', 'administrador'] },
  },
  {
    path: 'form-pre-triagem',
    component: FormPreTriagemComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['enfermeiro', 'medico', 'administrador'] },
  },
  {
    path: 'form-pre-triagem/:processoId',
    component: FormPreTriagemComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['enfermeiro', 'medico'] },
  },
  {
    path: 'form-triagem',
    component: FormTriagemComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['medico', 'administrador'] },
  },
  {
    path: 'form-triagem/:processoId',
    component: FormTriagemComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['medico'] },
  },
  {
    path: 'form-coleta',
    component: FormColetaComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['enfermeiro', 'administrador'] },
  },
  {
    path: 'form-coleta/:processoId',
    component: FormColetaComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['enfermeiro'] },
  },
  {
    path: 'processo-doacao-andamento',
    component: ListaProcessoDoacaoComponent,
    canActivate: [authGuard],
    data: {
      cargoPermitido: [
        'enfermeiro',
        'medico',
        'recepcionista',
        'administrador',
      ],
    },
  },
  {
    path: 'pagina-doador',
    component: DoadorComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['doador', 'administrador', 'medico', 'recepcionista', 'enfermeiro'] },
  },
  {
    path: 'cadastro-funcionario',
    component: CadastroFuncionarioComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['administrador', 'medico', 'enfermeiro', 'recepcionista'] }, // Exemplo de dado para o guard usar
  },
  {
    path: 'aguardando-validacao-bolsa',
    component: BolsaAguardandoValidacaoComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['medico', 'administrador'] },
  },
  {
    path: 'validar-bolsa/:id',
    component: ValidacaoBolsaComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['medico', 'administrador'] },
  },
  {
    path: 'estoque-bolsas',
    component: EstoqueBolsasComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['administrador', 'medico', 'enfermeiro'] },
  },
  {
    path: 'questionario-processo',
    component: QuestionarioProcessoComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['doador', 'medico', 'administrador'] },
  },
{
    path: 'questionario-processo/proc/:processoId/:cpf', // <-- Tem que ter o /:cpf no final
    component: QuestionarioProcessoComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['medico'] },
  },
  {
    path: 'questionario-processo/:cpf',
    component: QuestionarioProcessoComponent,
    canActivate: [authGuard],
    data: { cargoPermitido: ['doador', 'medico', 'administrador'] },
  },
];
