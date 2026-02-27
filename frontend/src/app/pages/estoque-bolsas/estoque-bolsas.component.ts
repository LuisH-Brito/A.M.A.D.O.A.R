import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginacaoComponent } from '../../componentes/paginacao/paginacao.component';

@Component({
  selector: 'app-estoque-bolsas',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginacaoComponent],
  templateUrl: './estoque-bolsas.component.html',
  styleUrl: './estoque-bolsas.component.scss'
})
export class EstoqueBolsasComponent {
  abaAtiva: string = 'Todos';
  busca: string = '';
  filtroSelecionado: string = 'recente';
  menuFiltroAberto: boolean = false;

  paginaAtual: number = 1;
  itensPorPagina: number = 10; // mudar a paginacao a vontade

  resumoGeral = { validas: 234, vencendo: 67, vencidas: 8 };

  tiposSanguineos = [
    { tipo: 'A+', contagem: 67 }, { tipo: 'B+', contagem: 34 }, { tipo: 'AB+', contagem: 94 }, { tipo: 'O+', contagem: 69 },
    { tipo: 'A-', contagem: 13 }, { tipo: 'B-', contagem: 22 }, { tipo: 'AB-', contagem: 21 }, { tipo: 'O-', contagem: 33 }
  ];

  abasMenu = ['Todos', 'Bolsa Validas', 'Bolsa Vencendo', 'Bolsa Vencidas', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+', 'O-', 'O+'];

  bolsas = [
    { 
      id: 'BOL-2024-004', tipo: 'AB+', status: 'vencida', doadorNome: 'Joana Alves', doadorEmail: 'joana@email.com',
      textoVencimento: 'Vencida há 2 dias', enfermeiro: 'enf.ana@hemo.ac.gov.br', medico: 'dr.carla@hemo.ac.gov.br',
      dataValidacao: '20/01/2026 às 10:00', expandido: false
    },
    { 
      id: 'BOL-2024-003', tipo: 'B+', status: 'vencendo', doadorNome: 'Rafael Lima', doadorEmail: 'rafael@email.com',
      textoVencimento: 'Vence em 3 dias (02/03)', enfermeiro: 'enf.ana@hemo.ac.gov.br', medico: 'dr.carla@hemo.ac.gov.br',
      dataValidacao: '26/01/2026 às 11:00', expandido: false
    },
    { 
      id: 'BOL-2024-008', tipo: 'A+', status: 'valida', doadorNome: 'Carlos Eduardo', doadorEmail: 'carlos@email.com',
      textoVencimento: 'Válida até 15/04', enfermeiro: 'enf.pedro@hemo.ac.gov.br', medico: 'dr.marcos@hemo.ac.gov.br',
      dataValidacao: '28/01/2026 às 09:30', expandido: false
    }
  ];

  constructor(private router: Router) {}

  get bolsasFiltradas() {
    return this.bolsas.filter(bolsa => {
      let matchAba = false;
      if (this.abaAtiva === 'Todos') matchAba = true;
      else if (this.abaAtiva === 'Bolsa Validas') matchAba = bolsa.status === 'valida';
      else if (this.abaAtiva === 'Bolsa Vencendo') matchAba = bolsa.status === 'vencendo';
      else if (this.abaAtiva === 'Bolsa Vencidas') matchAba = bolsa.status === 'vencida';
      else matchAba = bolsa.tipo === this.abaAtiva;

      const termoBusca = this.busca.toLowerCase();
      const matchBusca = bolsa.id.toLowerCase().includes(termoBusca) || 
                         bolsa.doadorNome.toLowerCase().includes(termoBusca);

      return matchAba && matchBusca;
    });
  }

  get bolsasPaginadas() {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    return this.bolsasFiltradas.slice(inicio, fim);
  }

  mudarPagina(novaPagina: number) {
    this.paginaAtual = novaPagina;
  }

  voltar() { this.router.navigate(['/']); }

  toggleMenuFiltro() { this.menuFiltroAberto = !this.menuFiltroAberto; }

  selecionarAba(aba: string) { 
    this.abaAtiva = aba; 
    this.menuFiltroAberto = false; 
    this.paginaAtual = 1; 
  }

  toggleExpand(bolsa: any) { bolsa.expandido = !bolsa.expandido; }
  registrarUso(bolsa: any) {
    const confirmacao = confirm(`Tem certeza que deseja REGISTRAR O USO da bolsa ID: ${bolsa.id}?`);
    
    if (confirmacao) {
      alert(`Uso da bolsa ${bolsa.id} registrado com sucesso!`);
      this.bolsas = this.bolsas.filter(b => b.id !== bolsa.id);
    }
  }

  descartarBolsa(bolsa: any) {
    const confirmacao = confirm(`ATENÇÃO! Tem certeza que deseja DESCARTAR a bolsa ID: ${bolsa.id}? Esta ação não pode ser desfeita.`);
    
    if (confirmacao) {
      // Simulação - pensar se deve realmente excluir ou apenas marcar como descartada
      alert(`Bolsa ${bolsa.id} descartada e removida do estoque.`);
      this.bolsas = this.bolsas.filter(b => b.id !== bolsa.id);
    }
  }
}
