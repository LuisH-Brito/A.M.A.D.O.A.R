import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { FormPreTriagemComponent } from './form-pre-triagem.component';

describe('FormPreTriagemComponent', () => {
  let component: FormPreTriagemComponent;
  let fixture: ComponentFixture<FormPreTriagemComponent>;
  let api: jasmine.SpyObj<ApiService>;

  function preencher(altura: string, peso: string, hemoglobina: string): void {
    for (const [nome, valor] of [
      ['altura', altura], ['peso', peso], ['hemoglobina', hemoglobina],
    ]) {
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        `input[name="${nome}"]`,
      );
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
  }

  function botoes(): { apto: HTMLButtonElement; inapto: HTMLButtonElement } {
    return {
      apto: fixture.nativeElement.querySelector('.btn-concluir'),
      inapto: fixture.nativeElement.querySelector('.btn-cancelar'),
    };
  }

  beforeEach(async () => {
    localStorage.setItem('usuario_id', '7');
    localStorage.setItem('tipo_usuario', 'medico');
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getProcessoById', 'salvarDadosClinicos', 'atualizarDadosClinicos',
      'atualizarStatusProcesso',
    ]);
    api.getProcessoById.and.returnValue(
      of({ doador: { nome_completo: 'Teste', sexo: 'M', cpf: '90000000003' } }),
    );
    api.salvarDadosClinicos.and.returnValue(of({}));
    api.atualizarDadosClinicos.and.returnValue(of({}));
    api.atualizarStatusProcesso.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [FormPreTriagemComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: { get: () => '42' } },
        } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormPreTriagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('tipo_usuario');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  for (const [altura, apto] of [
    ['0', false], ['-1', false], ['1,75', true],
    ['3,00', true], ['3,01', false],
  ] as const) {
    it(`valida altura ${altura}`, async () => {
      preencher(altura, '70,0', '13,5');
      await fixture.whenStable();
      fixture.detectChanges();
      expect(botoes().apto.disabled).toBe(!apto);
      expect(component.alturaErro === null).toBe(apto);
    });
  }

  for (const [peso, apto, inapto] of [
    ['0', false, false], ['49,9', false, true],
    ['50,0', true, true], ['70', true, true],
    ['70,5', true, true], ['1000', false, false],
  ] as const) {
    it(`distingue peso ${peso} entre medição e aptidão`, async () => {
      preencher('1,75', peso, '13,5');
      await fixture.whenStable();
      fixture.detectChanges();
      expect(botoes().apto.disabled).toBe(!apto);
      expect(botoes().inapto.disabled).toBe(!inapto);
      if (peso === '49,9') {
        expect(component.orientacaoApto).toContain('peso mínimo');
      }
    });
  }

  for (const [sexo, hemoglobina, apto, inapto] of [
    ['F', '0', false, false], ['F', '12,4', false, true],
    ['F', '12,5', true, true], ['F', '13,0', true, true],
    ['F', '17,9', true, true], ['F', '18,0', false, true],
    ['F', '999', false, false], ['M', '0', false, false],
    ['M', '12,9', false, true], ['M', '13,0', true, true],
    ['M', '13,5', true, true], ['M', '17,9', true, true],
    ['M', '18,0', false, true], ['M', '999', false, false],
  ] as const) {
    it(`valida Hb ${hemoglobina} para sexo ${sexo}`, async () => {
      component.doador.sexo = sexo;
      preencher('1,75', '70,0', hemoglobina);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(botoes().apto.disabled).toBe(!apto);
      expect(botoes().inapto.disabled).toBe(!inapto);
      if (!apto) expect(component.orientacaoApto).toBeTruthy();
    });
  }

  for (const [digitado, formatado] of [
    ['12', '12,0'], ['12,', '12,0'],
    ['12,5', '12,5'], ['12.5', '12,5'],
  ] as const) {
    it(`formata hemoglobina ${digitado} no blur`, async () => {
      const campo: HTMLInputElement = fixture.nativeElement.querySelector(
        'input[name="hemoglobina"]',
      );
      campo.value = digitado;
      campo.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      fixture.detectChanges();
      campo.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.form.hemoglobina).toBe(formatado);
      expect(campo.value).toBe(formatado);
    });
  }

  it('formata peso com uma casa e altura com duas casas', async () => {
    preencher('1.75', '70', '13,5');
    await fixture.whenStable();
    component.formatarMedicao('altura');
    component.formatarMedicao('peso');
    expect(component.form.altura).toBe('1,75');
    expect(component.form.peso).toBe('70,0');
  });

  it('envia números JSON após entrada com vírgula', fakeAsync(() => {
    preencher('1,75', '70,5', '13,5');
    tick();
    fixture.detectChanges();
    component.salvarEAvancarTriagem();

    expect(api.salvarDadosClinicos).toHaveBeenCalledWith(jasmine.objectContaining({
      altura: 1.75, peso: 70.5, hemoglobina: 13.5, status_clinico: 1,
    }));
    tick(5000);
  }));

  it('reabre a ficha com vírgula e edita pelo endpoint existente', fakeAsync(() => {
    api.getProcessoById.and.returnValue(of({
      doador: { nome_completo: 'Teste', sexo: 'M', cpf: '90000000003' },
      dados_clinicos: { id: 8, altura: 1.75, peso: 70.5, hemoglobina: 13.5 },
    }));
    fixture.destroy();
    fixture = TestBed.createComponent(FormPreTriagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.form).toEqual({
      altura: '1,75', peso: '70,5', hemoglobina: '13,5',
    });
    const campo: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[name="hemoglobina"]',
    );
    expect(campo.value).toBe('13,5');

    component.salvarEAvancarTriagem();
    expect(api.atualizarDadosClinicos).toHaveBeenCalledWith(
      8,
      jasmine.objectContaining({ hemoglobina: 13.5 }),
    );
    expect(api.salvarDadosClinicos).not.toHaveBeenCalled();
    tick(5000);
  }));

  it('permite Inapto para medição plausível abaixo do corte e rejeita lixo clínico', async () => {
    component.doador.sexo = 'F';
    preencher('1,65', '48,0', '12,0');
    await fixture.whenStable();
    fixture.detectChanges();
    component.abrirModal('inapto');
    expect(component.modalVisivel).toBeTrue();
    component.fecharModal();

    preencher('0', '1000', '999');
    await fixture.whenStable();
    fixture.detectChanges();
    component.abrirModal('inapto');
    expect(component.modalVisivel).toBeFalse();
    expect(api.salvarDadosClinicos).not.toHaveBeenCalled();
  });
});
