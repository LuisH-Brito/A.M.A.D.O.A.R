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
  processoId: number | null = null;
  perguntas: any[] = [];
  modoEdicao: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionarioService: QuestionarioService
  ) {}

  ngOnInit() {
    const processoIdParam = this.route.snapshot.paramMap.get('processoId');
    this.processoId = processoIdParam ? Number(processoIdParam) : null;
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

        if (this.processoId) {
          this.questionarioService.getQuestionarioPorProcesso(this.processoId).subscribe({
            next: (q) => {
              (q?.respostas || []).forEach((respBackend: any) => {
                const perguntaEncontrada = this.perguntas.find(p => p.texto === respBackend.pergunta_texto);
                if (perguntaEncontrada) {
                  perguntaEncontrada.resposta_dada = respBackend.resposta_dada;
                }
              });
              this.carregando = false;
            },
            error: (erro) => {
              console.error('Erro ao buscar questionário do processo:', erro);
              this.carregando = false;
            }
          });
          return;
        }

        if (this.cpfDoador) {
          this.questionarioService.getQuestionariosPorCpf(this.cpfDoador).subscribe({
            next: (questionarios) => {
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
        } else {
          this.carregando = false;
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

    const respostas = this.perguntas.map(p => ({
      id: p.id,
      resposta: p.resposta_dada
    }));

    const payload = {
      cpf: this.cpfDoador,
      respostas
    };

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
    if (this.processoId) {
      this.router.navigate(['/form-triagem', this.processoId]);
      return;
    }
    this.router.navigate(['/form-triagem']);
  }
}