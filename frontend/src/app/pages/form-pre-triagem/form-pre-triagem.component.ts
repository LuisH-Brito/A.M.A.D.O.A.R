import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ModalConfirmacaoComponent } from '../../componentes/modal-confirmacao/modal-confirmacao.component';
import { ToastNotificacaoComponent } from '../../componentes/toast-notificacao/toast-notificacao.component';
import { PRE_TRIAGEM_LIMITES } from './pre-triagem-limites';

@Component({
  selector: 'app-form-pre-triagem',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalConfirmacaoComponent,
    ToastNotificacaoComponent,
  ],
  templateUrl: './form-pre-triagem.component.html',
  styleUrl: './form-pre-triagem.component.scss',
})
export class FormPreTriagemComponent implements OnInit {
  processoId!: number;
  dadosClinicosId: number | null = null;

  doador = { nome: '', sexo: '', cpf: '' };
  readonly limites = PRE_TRIAGEM_LIMITES;

  form = {
    altura: '',
    peso: '',
    hemoglobina: '',
  };

  @ViewChild('toast') toast!: ToastNotificacaoComponent;
  modalVisivel = false;
  acaoPendente: 'apto' | 'inapto' | null = null;
  modalConfig = {
    titulo: '',
    mensagem: '',
    tipo: 'padrao' as 'padrao' | 'usar' | 'descartar',
    textoConfirmar: '',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('processoId'));
    if (!id) {
      alert('Processo inválido.');
      this.router.navigate(['/processo-doacao-andamento']);
      return;
    }

    this.processoId = id;

    this.api.getProcessoById(this.processoId).subscribe({
      next: (processo) => {
        this.doador = {
          nome: processo?.doador?.nome_completo || '',
          sexo: processo?.doador?.sexo || '',
          cpf: processo?.doador?.cpf || '',
        };
        const dados = processo?.dados_clinicos;
        if (dados) {
          this.dadosClinicosId = dados.id;
          this.form.altura = this.formatarValorSalvo(dados.altura, 2);
          this.form.peso = this.formatarValorSalvo(dados.peso, 1);
          this.form.hemoglobina = this.formatarValorSalvo(dados.hemoglobina, 1);
        }
      },
      error: () => {
        alert('Não foi possível carregar o processo.');
        this.router.navigate(['/processo-doacao-andamento']);
      },
    });
  }

  abrirModal(acao: 'apto' | 'inapto'): void {
    if (acao === 'apto' && !this.podeMarcarApto) {
      this.toast.exibir(this.orientacaoApto || 'Corrija as medições.', false);
      return;
    }
    if (acao === 'inapto' && !this.medicoesValidas) {
      this.toast.exibir('Corrija as medições inválidas antes de registrar Inapto.', false);
      return;
    }

    this.acaoPendente = acao;

    if (acao === 'apto') {
      this.modalConfig = {
        titulo: 'Confirmar Aptidão',
        mensagem: `Deseja aprovar ${this.doador.nome || 'o doador'} na pré-triagem e avançar para a próxima etapa?`,
        tipo: 'usar',
        textoConfirmar: 'Sim, Aprovar',
      };
    } else {
      this.modalConfig = {
        titulo: 'Registrar Inaptidão',
        mensagem: `Atenção: Deseja registrar que ${this.doador.nome || 'o doador'} está INAPTO? Esta ação cancelará o processo de doação atual.`,
        tipo: 'descartar',
        textoConfirmar: 'Sim, Reprovar',
      };
    }

    this.modalVisivel = true;
  }

  fecharModal(): void {
    this.modalVisivel = false;
    this.acaoPendente = null;
  }

  confirmarAcaoModal(): void {
    this.modalVisivel = false;
    if (this.acaoPendente === 'apto') {
      this.salvarEAvancarTriagem();
    } else if (this.acaoPendente === 'inapto') {
      this.marcarInapto();
    }
  }

  formatarCPF(cpf: string): string {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private numero(valor: string, casas: number): number | null {
    const formato = new RegExp(`^\\d+(?:[,.]\\d{1,${casas}})?$`);
    const texto = valor.trim();
    if (!formato.test(texto)) return null;
    const numero = Number(texto.replace(',', '.'));
    return Number.isFinite(numero) ? numero : null;
  }

  private formatarValorSalvo(valor: number | null, casas: number): string {
    return valor == null ? '' : valor.toFixed(casas).replace('.', ',');
  }

  private salvarDadosClinicos(payload: {
    processo_id: number;
    altura: number | null;
    peso: number | null;
    hemoglobina: number | null;
    status_clinico: number;
    medico_id?: string;
    enfermeiro_id?: string;
  }) {
    return this.dadosClinicosId === null
      ? this.api.salvarDadosClinicos(payload)
      : this.api.atualizarDadosClinicos(this.dadosClinicosId, payload);
  }

  formatarMedicao(
    campo: 'altura' | 'peso' | 'hemoglobina',
    evento?: FocusEvent,
  ): void {
    const texto = this.form[campo].trim();
    const casas = campo === 'altura' ? 2 : 1;
    const formatoParcial = new RegExp(`^\\d+(?:[,.]\\d{0,${casas}})?$`);
    if (!formatoParcial.test(texto)) return;
    const numero = Number(texto.replace(',', '.'));
    if (Number.isFinite(numero)) {
      this.form[campo] = numero.toFixed(casas).replace('.', ',');
      if (evento?.target instanceof HTMLInputElement) {
        evento.target.value = this.form[campo];
      }
    }
  }

  get alturaValor(): number | null {
    return this.numero(this.form.altura, 2);
  }

  get pesoValor(): number | null {
    return this.numero(this.form.peso, 1);
  }

  get hemoglobinaValor(): number | null {
    return this.numero(this.form.hemoglobina, 1);
  }

  get alturaErro(): string | null {
    if (!this.form.altura.trim()) return 'Informe a altura.';
    const valor = this.alturaValor;
    return valor !== null && valor > 0 && valor <= this.limites.alturaMaxM
      ? null
      : 'Informe uma altura maior que 0 e de até 3,00 m.';
  }

  get pesoErro(): string | null {
    if (!this.form.peso.trim()) return 'Informe o peso.';
    const valor = this.pesoValor;
    return valor !== null && valor > 0 && valor <= this.limites.pesoMaxMedicaoKg
      ? null
      : `Informe um peso maior que 0 e de até ${this.limites.pesoMaxMedicaoKg} kg.`;
  }

  get hemoglobinaErro(): string | null {
    if (!this.form.hemoglobina.trim()) return 'Informe a hemoglobina.';
    const valor = this.hemoglobinaValor;
    return valor !== null && valor > 0 && valor <= this.limites.hemoglobinaMaxMedicaoGdl
      ? null
      : 'Informe um valor de hemoglobina válido em g/dL.';
  }

  get medicoesValidas(): boolean {
    return !this.alturaErro && !this.pesoErro && !this.hemoglobinaErro;
  }

  get pesoInvalidoParaDoacao(): boolean {
    return this.pesoValor === null || this.pesoValor < this.limites.pesoMinDoacaoKg;
  }

  get hemoglobinaIncompativel(): boolean {
    const valor = this.hemoglobinaValor;
    const minimo = this.limites.hemoglobinaMinAptoGdl[
      this.doador.sexo as 'F' | 'M'
    ];
    return valor === null || minimo === undefined ||
      valor < minimo || valor >= this.limites.hemoglobinaMaxAptoGdl;
  }

  get podeMarcarApto(): boolean {
    return this.medicoesValidas && !this.pesoInvalidoParaDoacao &&
      !this.hemoglobinaIncompativel;
  }

  get orientacaoApto(): string | null {
    if (this.alturaErro) return this.alturaErro;
    if (this.pesoErro) return this.pesoErro;
    if (this.hemoglobinaErro) return this.hemoglobinaErro;
    if (this.pesoInvalidoParaDoacao) {
      return `O peso mínimo para doação é ${this.limites.pesoMinDoacaoKg} kg.`;
    }
    const valor = this.hemoglobinaValor!;
    if (valor >= this.limites.hemoglobinaMaxAptoGdl) {
      return 'Hemoglobina igual ou superior a 18,0 g/dL impede a classificação como apto.';
    }
    const minimo = this.limites.hemoglobinaMinAptoGdl[
      this.doador.sexo as 'F' | 'M'
    ];
    if (minimo === undefined) return 'Confira o sexo do doador antes de classificar como apto.';
    if (valor < minimo) {
      return `A hemoglobina mínima para ${this.doador.sexo === 'F' ? 'mulheres' : 'homens'} é ${minimo.toFixed(1).replace('.', ',')} g/dL.`;
    }
    return null;
  }

  salvarEAvancarTriagem(): void {
    if (!this.podeMarcarApto) {
      this.toast.exibir(this.orientacaoApto || 'Corrija as medições.', false);
      return;
    }

    const usuarioId = localStorage.getItem('usuario_id');
    const tipoUsuario = localStorage.getItem('tipo_usuario');

    if (!usuarioId) {
      this.toast.exibir(
        'Acesso negado: Não foi possível identificar o profissional logado.',
        false,
      );
      return;
    }

    const payload: any = {
      processo_id: this.processoId,
      altura: this.alturaValor,
      peso: this.pesoValor,
      hemoglobina: this.hemoglobinaValor,
      status_clinico: 1,
    };

    const tipoNormalizado = tipoUsuario ? tipoUsuario.toLowerCase().trim() : '';
    if (tipoNormalizado === 'medico') {
      payload.medico_id = usuarioId;
    } else {
      payload.enfermeiro_id = usuarioId;
    }

    this.salvarDadosClinicos(payload).subscribe({
      next: () => {
        this.api.atualizarStatusProcesso(this.processoId, 3).subscribe({
          next: () => {
            this.toast.exibir('Pré-triagem concluída! Redirecionando...', true);
            setTimeout(
              () => this.router.navigate(['/processo-doacao-andamento']),
              1500,
            );
          },
          error: () =>
            this.toast.exibir(
              'Dados salvos, mas falhou ao atualizar status para Triagem.',
              false,
            ),
        });
      },
      error: (err) => {
        if (err?.error?.processo_id) {
          this.toast.exibir(err.error.processo_id, false);
          return;
        }
        this.toast.exibir('Erro ao salvar dados clínicos.', false);
      },
    });
  }

  marcarInapto(): void {
    if (!this.medicoesValidas) {
      this.toast.exibir('Corrija as medições inválidas antes de registrar Inapto.', false);
      return;
    }
    const usuarioId = localStorage.getItem('usuario_id');
    const tipoUsuario = localStorage.getItem('tipo_usuario');
    if (!usuarioId) {
      this.toast.exibir(
        'Acesso negado: Não foi possível identificar o profissional logado.',
        false,
      );
      return;
    }

    const payload: any = {
      processo_id: this.processoId,
      altura: this.alturaValor,
      peso: this.pesoValor,
      hemoglobina: this.hemoglobinaValor,
      status_clinico: 0,
    };

    const tipoNormalizado = tipoUsuario ? tipoUsuario.toLowerCase().trim() : '';
    if (tipoNormalizado === 'medico') {
      payload.medico_id = usuarioId;
    } else {
      payload.enfermeiro_id = usuarioId;
    }

    this.salvarDadosClinicos(payload).subscribe({
      next: () => {
        this.api.atualizarStatusProcesso(this.processoId, 0).subscribe({
          next: () => {
            this.toast.exibir(
              'Processo encerrado como Inapto. Redirecionando...',
              true,
            );
            setTimeout(
              () => this.router.navigate(['/processo-doacao-andamento']),
              1500,
            );
          },
          error: () =>
            this.toast.exibir(
              'Dados salvos, mas houve erro ao cancelar o processo.',
              false,
            ),
        });
      },
      error: () =>
        this.toast.exibir(
          'Erro ao registrar inaptidão nos dados clínicos.',
          false,
        ),
    });
  }
  voltar() {
    this.router.navigate(['/processo-doacao-andamento']);
  }
}
