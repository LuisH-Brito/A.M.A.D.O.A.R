// Run with the Angular dev server at 127.0.0.1:4200:
// node scripts/responsive-audit.cjs --mock --fixture=many
// The mock mode provides local layout fixtures; it does not exercise the backend.
const { chromium } = require('@playwright/test');
const os = require('os');
const path = require('path');

const routes = [
  '/', '/login', '/cadastro', '/redefinir-senha',
  '/redefinir-senha/codigo', '/redefinir-senha/nova-senha',
  '/gestao-pessoal', '/gestao-crud', '/questionario', '/questionario_form',
  '/processo-doacao-REC', '/processo-doacao-MED', '/iniciar-doacao',
  '/form-pre-triagem', '/form-pre-triagem/1', '/form-triagem',
  '/form-triagem/1', '/form-coleta', '/form-coleta/1',
  '/processo-doacao-andamento', '/pagina-doador', '/cadastro-funcionario',
  '/aguardando-validacao-bolsa', '/validar-bolsa/1', '/estoque-bolsas',
  '/questionario-processo', '/questionario-processo/proc/1/00000000000',
  '/questionario-processo/00000000000', '/listar-doadores', '/carteira-doacao',
];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const mock = process.argv.includes('--mock');
  const fixtureCount = process.argv.includes('--fixture=one') ? 1
    : process.argv.includes('--fixture=many') ? 12 : 0;
  const routeFilter = process.argv.find(arg => arg.startsWith('--route='))?.slice(8);
  const widthFilter = Number(process.argv.find(arg => arg.startsWith('--width='))?.slice(8));
  const heightFilter = Number(process.argv.find(arg => arg.startsWith('--height='))?.slice(9));
  const selectedRoutes = routeFilter ? routes.filter(route => route === routeFilter) : routes;
  const selectedWidths = widthFilter ? [widthFilter] : [375, 430, 768, 1024, 1366, 1920];
  let checked = 0;
  let failures = 0;
  for (const width of selectedWidths) {
    const context = await browser.newContext({ viewport: { width, height: heightFilter || 900 } });
    await context.addInitScript(() => {
      const path = window.location.pathname;
      const cargo = path.startsWith('/form-coleta/') ? 'enfermeiro'
        : path.startsWith('/form-pre-triagem/') || path.startsWith('/form-triagem/')
          || path.startsWith('/questionario-processo/proc/') || path.startsWith('/processo-doacao-MED')
          ? 'medico' : 'administrador';
      localStorage.setItem('cargo', cargo);
      localStorage.setItem('access', 'responsive-audit');
      window.alert = () => {};
    });
    if (mock) {
      await context.route('**/api/**', async route => {
        const url = new URL(route.request().url());
        const path = url.pathname;
        let body = { count: 0, results: [] };
        if (/\/processos\/\d+\/$/.test(path)) {
          body = { id: 1, status: 2, doador: {
            id: 1, nome_completo: 'Doador de Exemplo', sexo: 'M', cpf: '12345678909', data_nascimento: '1990-01-01',
          }, dados_clinicos: null };
        } else if (path.endsWith('/processos/') && fixtureCount) {
          body = Array.from({ length: fixtureCount }, (_, index) => ({
            id: index + 1, status: index % 3 + 2, data_inicio: '2026-09-26T10:00:00Z',
            doador: { nome_completo: `Doador de Exemplo com Nome Longo ${index + 1}`, cpf: '12345678909' },
          }));
        } else if (/\/estoque\/\d+\/$/.test(path)) {
          body = { id: 1, doador: 1, doador_nome: 'Doador de Exemplo', tipo_sanguineo: 1, status: 1 };
        } else if (path.includes('/dashboard/')) {
          body = { resumoGeral: { total: 12, validas: 10, vencidas: 1, vencendo: 1, utilizadas: 0, descartadas: 0 }, tiposSanguineos: [] };
        } else if (path.endsWith('/doadores_aptos_carteirinha/') && fixtureCount) {
          body = Array.from({ length: fixtureCount === 1 ? 1 : 8 }, (_, index) => ({
            doador_id: index + 1, nome: `Doador de Exemplo com Nome Longo ${index + 1}`,
            cpf: '12345678909', tipo_sanguineo: 'A+',
          }));
        } else if (path.endsWith('/doadores/') && fixtureCount) {
          body = Array.from({ length: fixtureCount }, (_, index) => ({
            id: index + 1, nome_completo: `Doador de Exemplo com Nome Longo ${index + 1}`,
            cpf: '12345678909', telefone: '68999999999', tipo_sanguineo_declarado: 'A', fator_rh: '+',
            endereco: 'Avenida de Exemplo, bairro com nome longo', email: 'doador@example.com',
          }));
        } else if (['/medicos/', '/enfermeiros/', '/recepcionistas/'].some(suffix => path.endsWith(suffix)) && fixtureCount) {
          body = Array.from({ length: fixtureCount === 1 ? 1 : 4 }, (_, index) => ({
            id: index + 1, nome_completo: `Profissional de Exemplo com Nome Longo ${index + 1}`,
            cpf: '12345678909', is_active: true,
          }));
        } else if (path.endsWith('/estoque/') && fixtureCount) {
          body = { count: fixtureCount, results: Array.from({ length: Math.min(fixtureCount, 10) }, (_, index) => ({
            id: index + 1, tipo_sanguineo_detalhe: { tipo: 'A', fator_rh: '+' },
            estado_temporal: 'valida', doador_nome: `Doador de Exemplo com Nome Longo ${index + 1}`,
            doador_email: 'doador@example.com', data_vencimento: '2026-12-30',
            processo_data_inicio: '2026-09-26T10:00:00Z',
          })) };
        } else if (url.searchParams.get('filtro_aba') === 'Aguardando' && process.argv.includes('--badge=12')) {
          body = { count: 12, results: [] };
        } else if (path.endsWith('/enfermeiros/') || path.endsWith('/tipos-sanguineos/')) {
          body = [];
        } else if (path.endsWith('/perguntas/')) {
          body = [
            { id: 1, texto: 'Você apresentou algum sintoma ou condição de saúde que precise ser esclarecida antes de continuar o processo de doação de sangue?', resposta_esperada: 'Não', motivo_inaptidao: 'Revisão necessária.' },
            { id: 2, texto: 'Você realizou algum procedimento médico recentemente?', resposta_esperada: 'Não', motivo_inaptidao: 'Revisão necessária.' },
          ];
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body),
          headers: { 'access-control-allow-origin': '*' } });
      });
    }
    const page = await context.newPage();
    for (const route of selectedRoutes) {
      try {
        await page.goto(`http://127.0.0.1:4200${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(180);
        if (process.argv.includes('--menu')) {
          await page.locator('.btn-hamburger').click();
          await page.waitForTimeout(400);
        }
        if (process.argv.includes('--modal') && route.startsWith('/form-pre-triagem/')) {
          await page.locator('#altura').fill('1,75');
          await page.locator('#peso').fill('70,0');
          await page.locator('#hemoglobina').fill('13,5');
          await page.getByRole('button', { name: 'Apto', exact: true }).click();
          await page.waitForTimeout(400);
        }
        if (process.argv.includes('--result') && route === '/questionario_form') {
          await page.getByRole('button', { name: 'Não', exact: true }).click();
          await page.waitForTimeout(400);
          await page.getByRole('button', { name: 'Não', exact: true }).click();
          await page.waitForTimeout(400);
          await page.getByRole('button', { name: 'Finalizar', exact: true }).click();
          await page.waitForTimeout(200);
        }
        const result = await page.evaluate(() => {
          const documentWidth = document.documentElement.scrollWidth;
          const viewportWidth = window.innerWidth;
          const offenders = [...document.querySelectorAll('body *')]
            .filter(element => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return style.position !== 'fixed' && rect.width > 0 && rect.right > viewportWidth + 2 && rect.left >= -1;
            })
            .slice(0, 8)
            .map(element => `${element.tagName.toLowerCase()}${element.className && typeof element.className === 'string' ? '.' + element.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`);
          return { documentWidth, offenders, page: document.querySelector('main')?.textContent?.trim().slice(0, 50) || '' };
        });
        checked += 1;
        if (result.documentWidth > width + 1 || result.page.length === 0) failures += 1;
        if (process.argv.includes('--screenshot')) {
          const file = path.join(os.tmpdir(), `amadoar-ui03-${width}-${route.replace(/\W/g, '_')}.png`);
          await page.screenshot({ path: file, fullPage: !process.argv.includes('--menu') && !process.argv.includes('--modal') });
          console.log(`SCREENSHOT ${file}`);
        }
        if (process.argv.includes('--menu')) {
          const menuFits = await page.locator('.mobile-menu.show').evaluate(element => {
            const rect = element.getBoundingClientRect();
            return rect.left >= 0 && rect.right <= window.innerWidth && rect.top >= 0
              && rect.bottom <= window.innerHeight && element.scrollHeight >= element.clientHeight;
          });
          await page.locator('.menu-overlay.show').click({ position: { x: width - 10, y: 10 } });
          if (!menuFits || await page.locator('.mobile-menu.show').count()) failures += 1;
        }
        if (process.argv.includes('--modal') && route.startsWith('/form-pre-triagem/')) {
          const modalFits = await page.locator('.modal-box').evaluate(element => {
            const rect = element.getBoundingClientRect();
            return rect.left >= 0 && rect.right <= window.innerWidth && rect.top >= 0
              && rect.bottom <= window.innerHeight && getComputedStyle(element).overflowY === 'auto';
          });
          await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
          if (!modalFits || await page.locator('.modal-box').count()) failures += 1;
        }
        if (result.documentWidth > width + 1 || result.page.length === 0 || process.argv.includes('--all')) {
          console.log(JSON.stringify({ width, route, ...result }));
        }
      } catch (error) {
        failures += 1;
        console.log(JSON.stringify({ width, route, error: String(error).slice(0, 120) }));
      }
    }
    await context.close();
  }
  await browser.close();
  console.log(`SUMMARY ${checked} views checked, ${failures} failures`);
  if (failures) process.exitCode = 1;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
