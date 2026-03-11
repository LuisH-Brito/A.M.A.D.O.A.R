import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EstoqueBolsaService } from '../../services/estoque-bolsa.service';

@Component({
  selector: 'app-validacao-bolsa',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './validacao-bolsa.component.html',
  styleUrl: './validacao-bolsa.component.scss',
})
export class ValidacaoBolsaComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  bolsaId!: number;
  bolsaDados: any = null;
  tiposSanguineos: any[] = [];

  tipoSanguineoSelecionado: number | null = null;
  arquivoLaudo: File | null = null;
  carregando: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private estoqueService: EstoqueBolsaService,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.bolsaId = +idParam;
      this.carregarDadosBolsa();
      this.carregarTiposSanguineos();
    } else {
      this.voltar();
    }
  }

  carregarDadosBolsa() {
    this.estoqueService.obterBolsa(this.bolsaId).subscribe({
      next: (res) => (this.bolsaDados = res),
      error: () => {
        alert('Erro ao carregar os dados da bolsa.');
        this.voltar();
      },
    });
  }

  carregarTiposSanguineos() {
    this.estoqueService.obterTiposSanguineos().subscribe({
      next: (res) => {
        this.tiposSanguineos = Array.isArray(res) ? res : res.results;
      },
      error: () => console.error('Erro ao buscar tipos sanguíneos.'),
    });
  }

  acionarInputArquivo() {
    this.fileInput.nativeElement.click();
  }

  aoSelecionarArquivo(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.arquivoLaudo = file;
    } else {
      alert('Por favor, selecione apenas arquivos PDF.');
      this.arquivoLaudo = null;
    }
  }

  liberarParaEstoque() {
    if (!this.tipoSanguineoSelecionado || !this.arquivoLaudo) {
      alert('Selecione o tipo sanguíneo e anexe o laudo laboratorial.');
      return;
    }
    if (confirm('Tem certeza que deseja liberar a bolsa para o estoque?')) {
      this.carregando = true;
      const formData = new FormData();
      formData.append(
        'tipo_sanguineo',
        this.tipoSanguineoSelecionado.toString(),
      );
      formData.append('arquivo_laudo', this.arquivoLaudo);

      const medicoId = localStorage.getItem('usuario_id');
      if (medicoId) formData.append('medico_validacao', medicoId);

      this.estoqueService.validarBolsa(this.bolsaId, formData).subscribe({
        next: (res) => {
          alert('Bolsa validada e enviada para o estoque com sucesso!');
          this.router.navigate(['/aguardando-validacao-bolsa']);
        },
        error: (err) => {
          alert(err.error?.erro || 'Erro ao validar a bolsa.');
          this.carregando = false;
        },
      });
    }
  }

  marcarComoInapto() {
    if (!this.tipoSanguineoSelecionado || !this.arquivoLaudo) {
      alert(
        'Para descartar, é obrigatório selecionar o tipo sanguíneo e anexar o laudo comprovando a inaptidão.',
      );
      return;
    }

    if (
      confirm(
        'Tem certeza que deseja marcar esta bolsa como Inapta? O laudo será salvo como evidência do descarte.',
      )
    ) {
      this.carregando = true;
      const formData = new FormData();
      formData.append(
        'tipo_sanguineo',
        this.tipoSanguineoSelecionado.toString(),
      );
      formData.append('arquivo_laudo', this.arquivoLaudo);
      const medicoId = localStorage.getItem('usuario_id');
      if (medicoId) {
        formData.append('medico_validacao', medicoId);
      } else {
        alert('Acesso negado: Médico não identificado.');
        this.carregando = false;
        return;
      }
      this.estoqueService.descartar(this.bolsaId, formData).subscribe({
        next: () => {
          alert('Bolsa descartada e evidências clínicas salvas com sucesso.');
          this.router.navigate(['/aguardando-validacao-bolsa']);
        },
        error: (err) => {
          alert(err.error?.erro || 'Erro ao descartar a bolsa.');
          this.carregando = false;
        },
      });
    }
  }
  voltar() {
    this.router.navigate(['/aguardando-validacao-bolsa']);
  }
}
