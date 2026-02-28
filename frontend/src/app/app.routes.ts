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

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Define Home como padrão
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'gestao-pessoal', component: GestaoPessoalComponent },
  { path: 'gestao-crud', component: GestaoPessoalCrudComponent },
  { path: 'questionario', component: QuestionarioIntroComponent },
  { path: 'questionario_form', component: QuestionarioComponent },
  { path: 'processo-doacao', component: ProcessoDoacaoComponent },
  { path: 'iniciar-doacao', component: ProcessoDoacaoIntroComponent },
  { path: 'form-pre-triagem', component: FormPreTriagemComponent },
  { path: 'form-triagem', component: FormTriagemComponent },
  { path: 'form-coleta', component: FormColetaComponent },
  {
    path: 'processo-doacao-andamento',
    component: ListaProcessoDoacaoComponent,
  },
  { path: 'pagina-doador', component: DoadorComponent },
  { path: 'cadastro-funcionario', component: CadastroFuncionarioComponent },
  {
    path: 'aguardando-validacao-bolsa',
    component: BolsaAguardandoValidacaoComponent,
  },
  { path: 'validar-bolsa', component: ValidacaoBolsaComponent },
  { path: 'estoque-bolsas', component: EstoqueBolsasComponent },
];
