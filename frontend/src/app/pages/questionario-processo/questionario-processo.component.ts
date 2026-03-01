import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionarioService } from '../../services/questionario.service';
import { PerguntasComponent } from '../../componentes/perguntas/perguntas.component';

@Component({
  selector: 'app-questionario-processo',
  standalone: true,
  imports: [CommonModule, PerguntasComponent],
  templateUrl: './questionario-processo.component.html',
  styleUrl: './questionario-processo.component.scss'
})
export class QuestionarioProcessoComponent implements OnInit {
  carregando: boolean = true;
  cpfDoador: string | null = '';
  perguntas: any[] = [];
  modoEdicao: boolean = false; 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionarioService: QuestionarioService
  ) {}

  ngOnInit() {
    this.cpfDoador = this.route.snapshot.paramMap.get('cpf');

    this.questionarioService.getPerguntas().subscribe({
      next: (todasPerguntas) => {
        this.perguntas = todasPerguntas.map(p => ({
          id: p.id,
          texto: p.texto,
          resposta_esperada: p.resposta_esperada,
          motivo_inaptidao: p.motivo_inaptidao,
          resposta_dada: null 
        }));

        if (this.cpfDoador) {
          this.questionarioService.getQuestionariosPorCpf(this.cpfDoador).subscribe({
            next: (questionarios) => {
              // Pega APENAS o último questionário (índice 0)
              if (questionarios.length > 0) {
                const ultimoQuestionario = questionarios[0]; 
                
                ultimoQuestionario.respostas.forEach((respBackend: any) => {
                  const perguntaEncontrada = this.perguntas.find(p => p.texto === respBackend.pergunta_texto);
                  if (perguntaEncontrada) {
                    perguntaEncontrada.resposta_dada = respBackend.resposta_dada;
                  }
                });
              }
              this.carregando = false;
            },
            error: (erro) => {
              console.error('Erro ao buscar o histórico:', erro);
              this.carregando = false;
            }
          });
        }
      }
    });
  }

  responder(index: number, resposta: string) {
    if (this.modoEdicao) {
      this.perguntas[index].resposta_dada = resposta;
    }
  }

  respostaIncorreta(respostaDada: string, respostaEsperada: string): boolean {
    return respostaDada !== null && respostaDada !== respostaEsperada;
  }

  // Alterna entre Editar e Salvar
  alternarEdicao() {
    if (this.modoEdicao) {
      // Se estava editando, clica para Salvar no banco
      this.salvarQuestionarioEditado();
    } else {
      this.modoEdicao = true;
    }
  }

  salvarQuestionarioEditado() {
    const temPerguntaVazia = this.perguntas.some(p => p.resposta_dada === null);
    if (temPerguntaVazia) {
      alert('Preencha todas as perguntas antes de salvar.');
      return;
    }

    const payload = this.perguntas.map(p => ({
      id: p.id,
      resposta: p.resposta_dada
    }));

    this.questionarioService.salvarQuestionario(payload).subscribe({
      next: () => {
        alert('Questionário revisado e salvo no banco com sucesso!');
        this.modoEdicao = false; 
      },
      error: (erro) => {
        console.error('Erro ao salvar questionário:', erro);
        alert('Erro ao salvar as respostas.');
      }
    });
  }

  voltar() {
    this.router.navigate(['/form-triagem']);
  }
}