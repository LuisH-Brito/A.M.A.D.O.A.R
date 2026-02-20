import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerguntasComponent } from '../../componentes/perguntas/perguntas.component';

@Component({
  selector: 'app-questionario',
  standalone: true,
  imports: [CommonModule, PerguntasComponent], 
  templateUrl: './questionario.component.html',
  styleUrl: './questionario.component.scss'
})
export class QuestionarioComponent {
  passoAtual: number = 1;
  fraseMotivacional: string = 'Falta pouco para você salvar vidas!';

  listaDePerguntas: { id: number, texto: string, resposta?: 'Sim' | 'Não' | null }[] = [
    { id: 1, texto: 'Você está se sentindo bem de saúde hoje?', resposta: null },
    { id: 2, texto: 'Você tem entre 16 e 69 anos?', resposta: null },
    { id: 3, texto: 'Você pesa mais de 50kg?', resposta: null }
  ];

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
      // mudar dps para enviar para o banco de dados
      console.log('ENVIAR PARA O BANCO DE DADOS:', this.listaDePerguntas);
      alert('Questionário finalizado com sucesso! ');
      
    }
  }
}