import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-gestao-pessoal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gestao-pessoal.component.html',
  styleUrl: './gestao-pessoal.component.scss',
})
export class GestaoPessoalComponent {
  mensagemSucesso: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['cadastrado'] === 'true') {
        this.mensagemSucesso = 'Funcionário cadastrado com sucesso!';

        setTimeout(() => {
          this.mensagemSucesso = null;
        }, 4000);
      }
    });
  }
}
