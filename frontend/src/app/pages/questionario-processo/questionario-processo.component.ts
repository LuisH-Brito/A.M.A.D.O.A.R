import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
  cpfDoador: string | null = null;
  processoId: number | null = null;
  perguntas: any[] = [];
  modoEdicao: boolean = false;
  somenteLeitura: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionarioService: QuestionarioService,
    private location: Location
  ) {}

  ngOnInit() {
    const processoIdParam = this.route.snapshot.paramMap.get('processoId');
    const cpfParam = this.route.snapshot.paramMap.get('cpf');
    
    const cpfQuery = this.route.snapshot.queryParamMap.get('cpf');
    const leituraQuery = this.route.snapshot.queryParamMap.get('somenteLeitura');
    this.somenteLeitura = leituraQuery === 'true';

    // Associa o CPF 
    this.cpfDoador = cpfQuery || cpfParam;
    this.processoId = processoIdParam ? Number(processoIdParam) : null;

    if (this.processoId && this.processoId.toString().length >= 11) {
      this.cpfDoador = this.processoId.toString();
      this.processoId = null;
    }

    console.log("Diagnóstico de Rota -> CPF:", this.cpfDoador, "| Processo ID:", this.processoId);

    this.questionarioService.getPerguntas().subscribe({
      next: (todasPerguntas) => {
        this.perguntas = todasPerguntas.map(p => ({
          id: p.id,
          texto: p.texto,
          resposta_esperada: p.resposta_esperada,
          motivo_inaptidao: p.motivo_inaptidao,
          resposta_dada: null 
        }));

        //  buscar por CPF 
        if (this.cpfDoador) {
          this.carregarUltimoQuestionarioPorCpf();
        } else if (this.processoId) {
          this.carregarQuestionarioPorProcesso();
        } else {
          this.carregando = false;
        }
      }
    });
  }

  carregarUltimoQuestionarioPorCpf() {
    this.questionarioService.getQuestionariosPorCpf(this.cpfDoador!).subscribe({
      next: (resposta: any) => {
        const questionarios = Array.isArray(resposta) ? resposta : (resposta.results || []);

        if (questionarios && questionarios.length > 0) {
          const ultimoQuestionario = questionarios[0];
          
          const listaRespostas = ultimoQuestionario.respostas || ultimoQuestionario.resposta_set || [];

          listaRespostas.forEach((respBackend: any) => {
            const perguntaEncontrada = this.perguntas.find(p => p.texto === respBackend.pergunta_texto);
            if (perguntaEncontrada) {
              perguntaEncontrada.resposta_dada = respBackend.resposta_dada;
            }
          });
        } else {
          this.modoEdicao = true;
        }
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao buscar o histórico pelo CPF:', erro);
        this.carregando = false;
      }
    });
  }

  carregarQuestionarioPorProcesso() {
    this.questionarioService.getQuestionarioPorProcesso(this.processoId!).subscribe({
      next: (q: any) => {
        console.log('Resposta bruta API (Triagem):', q);

        const dadosProcesso = Array.isArray(q) ? q[0] : (q.results ? q.results[0] : q);
        const listaRespostas = dadosProcesso?.respostas || dadosProcesso?.resposta_set || [];

        listaRespostas.forEach((respBackend: any) => {
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
  }

  responder(index: number, resposta: string) {
    if (this.modoEdicao) {
      this.perguntas[index].resposta_dada = resposta;
    }
  }

  respostaIncorreta(respostaDada: string, respostaEsperada: string): boolean {
    return respostaDada !== null && respostaDada !== respostaEsperada;
  }

  alternarEdicao() {
    if (this.modoEdicao) {
      this.salvarQuestionarioEditado();
    } else {
      this.modoEdicao = true;
    }
  }

  salvarQuestionarioEditado() {
    const cargo = localStorage.getItem('cargo'); 
    if (!this.cpfDoador && cargo !== 'doador') {
      alert('O sistema precisa do CPF na URL para salvar as respostas.');
      return;
    }

    const temPerguntaVazia = this.perguntas.some(p => p.resposta_dada === null);
    if (temPerguntaVazia) {
      alert('Preencha todas as perguntas antes de salvar.');
      return;
    }

    const respostas = this.perguntas.map(p => ({
      id: p.id,
      resposta: p.resposta_dada
    }));

    const payload: any = { respostas: respostas };

    if (this.cpfDoador) {
      payload.cpf = this.cpfDoador;
    }

    if (this.processoId) {
      payload.processo_id = this.processoId; 
    }

    this.questionarioService.salvarQuestionario(payload).subscribe({
      next: () => {
        alert('Questionário revisado e salvo no banco com sucesso!');
        this.modoEdicao = false; 
      },
      error: (erro) => {
        console.error('Erro ao salvar questionário:', erro);
        alert('Erro ao salvar as respostas. Verifique o console.');
      }
    });
  }

  voltar() {
    const cargo = localStorage.getItem('cargo');
    
    if (cargo === 'doador') {
      this.location.back(); 
      return;
    }

    if (this.processoId) {
      this.router.navigate(['/form-triagem', this.processoId]);
      return;
    }
    this.router.navigate(['/form-triagem']);
  }
}