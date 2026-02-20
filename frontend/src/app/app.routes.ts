import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { GestaoPessoalComponent } from './pages/gestao-pessoal/gestao-pessoal.component';
import { GestaoPessoalCrudComponent } from './pages/gestao-pessoal-crud/gestao-pessoal-crud.component';

// isso aqui definie a home como pagina inicial galera
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'gestao-pessoal', component: GestaoPessoalComponent },
  { path: 'gestao-crud', component: GestaoPessoalCrudComponent },
];
