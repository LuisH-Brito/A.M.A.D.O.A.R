import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerguntasComponent } from '../../componentes/perguntas/perguntas.component';
import { QuestionarioService } from '../../services/questionario.service';
import { Router } from '@angular/router';
import { QuestionarioResultadoComponent } from './questionario-resultado/questionario-resultado.component';

@Component({
  selector: 'app-questionario',
  standalone: true,
  imports: [CommonModule, PerguntasComponent, QuestionarioResultadoComponent],  templateUrl: './questionario.component.html',
  styleUrl: './questionario.component.scss'
})
export class QuestionarioComponent implements OnInit {
  passoAtual: number = 1;
  fraseMotivacional: string = 'Falta pouco para você salvar vidas!';
  carregando: boolean = true;

  mostrarResultado: boolean = false;
  isApto: boolean = true;
  motivosInaptidao: string[] = [];

  listaDePerguntas: { 
    id: number, 
    texto: string, 
    resposta?: 'Sim' | 'Não' | null,
    resposta_esperada: 'Sim' | 'Não',
    motivo_inaptidao: string 
  }[] = [];

  constructor(
    private questionarioService: QuestionarioService,
    private router: Router
  ) { }

  ngOnInit() {
    this.questionarioService.getPerguntas().subscribe({
      next: (dadosDaApi) => {
        this.listaDePerguntas = dadosDaApi.map(p => ({
          id: p.id,
          texto: p.texto,
          resposta_esperada: p.resposta_esperada, 
          motivo_inaptidao: p.motivo_inaptidao,
          resposta: null
        }));
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao buscar as perguntas no backend:', erro);
        alert('Erro ao carregar o questionário. Verifique se o backend está funcionando.');
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
      return;
    }

    // Verifica se as respostas batem com a esperada
    this.isApto = true;
    this.motivosInaptidao = [];

    for (let p of this.listaDePerguntas) {
      if (p.resposta !== p.resposta_esperada) {
        this.isApto = false;
        if (p.motivo_inaptidao && !this.motivosInaptidao.includes(p.motivo_inaptidao)) {
          this.motivosInaptidao.push(p.motivo_inaptidao);
        }
      }
    }

    // Envia pro banco independentemente de aprovado ou não
    this.questionarioService.salvarQuestionario(this.listaDePerguntas).subscribe({
      next: (respostaBackend) => {
        this.mostrarResultado = true; 
      },
      error: (erro) => {
        console.error('Erro ao salvar no banco:', erro);
        alert('Ocorreu um erro ao enviar suas respostas.');
      }
    });
  }

  fecharResultado() {
    this.router.navigate(['/']);
  }
}