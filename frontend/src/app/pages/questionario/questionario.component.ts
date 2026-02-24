import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerguntasComponent } from '../../componentes/perguntas/perguntas.component';
import { QuestionarioService } from '../../services/questionario.service';

@Component({
  selector: 'app-questionario',
  standalone: true,
  imports: [CommonModule, PerguntasComponent], 
  templateUrl: './questionario.component.html',
  styleUrl: './questionario.component.scss'
})
export class QuestionarioComponent implements OnInit {
  passoAtual: number = 1;
  fraseMotivacional: string = 'Falta pouco para você salvar vidas!';
  carregando: boolean = true;
  listaDePerguntas: { id: number, texto: string, resposta?: 'Sim' | 'Não' | null }[] = [];
  router: any;

  constructor(private questionarioService: QuestionarioService) { }
  ngOnInit() {
    this.questionarioService.getPerguntas().subscribe({
      next: (dadosDaApi) => {
        this.listaDePerguntas = dadosDaApi.map(p => ({
          id: p.id,
          texto: p.texto,
          resposta: null
        }));
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao buscar as perguntas no backend:', erro);
        alert('Erro ao carregar o questionário. Verifique se o backend está funcionando corretamente.');
        this.carregando = false;
      }
    });
  }

  get totalPassos(): number {
    return this.listaDePerguntas.length;
  }

  get perguntaAtual(): string {
    return this.listaDePerguntas[this.passoAtual - 1].texto;
  }

  get respostaAtual() {
    return this.listaDePerguntas[this.passoAtual - 1].resposta;
  }

  lidarComResposta(resposta: 'Sim' | 'Não') {
    this.listaDePerguntas[this.passoAtual - 1].resposta = resposta;
    console.log('Respostas até agora:', this.listaDePerguntas);
    
    if (this.passoAtual < this.totalPassos) {
      this.avancar();
    }
  }

  voltar() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
    }
  }

  avancar() {
    if (this.passoAtual < this.totalPassos) {
      this.passoAtual++;
    }
  }

  finalizar() {
    const primeiraNaoRespondida = this.listaDePerguntas.findIndex(p => p.resposta === null);

    if (primeiraNaoRespondida !== -1) {
      this.passoAtual = primeiraNaoRespondida + 1;
      alert(`Por favor, responda à pergunta ${this.passoAtual} antes de finalizar.`);
    } else {

      this.questionarioService.salvarQuestionario(this.listaDePerguntas).subscribe({
        next: (respostaBackend) => {
          alert('Questionário finalizado e salvo com sucesso!');
          console.log('Resposta:', respostaBackend);
          this.router.navigate(['/home']);
        },
        error: (erro) => {
          console.error('Erro ao salvar no banco:', erro);
          alert('Ocorreu um erro ao enviar suas respostas.');
        }
      });
      
    }
  }
}