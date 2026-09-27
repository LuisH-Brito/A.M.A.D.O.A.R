import { test, expect } from '@playwright/test';
import { Buffer } from 'buffer';

function gerarCpfValido() {
  const num = () => Math.floor(Math.random() * 10);
  const n = Array.from({ length: 9 }, num);

  let d1 = 11 - (n.reduce((total, digit, index) => total + digit * (10 - index), 0) % 11);
  if (d1 >= 10) d1 = 0;
  n.push(d1);

  let d2 = 11 - (n.reduce((total, digit, index) => total + digit * (11 - index), 0) % 11);
  if (d2 >= 10) d2 = 0;
  n.push(d2);

  return n.join('');
}

function nomeAleatorio() {
  const nomes = ['Larissa', 'Mariana', 'Camila', 'Juliana', 'Beatriz', 'Amanda', 'Gabriela', 'Hayssa', 'Almecina', 'Raquel', 'Catarina', 'Billie', 'Sabrina', 'Taylor', 'Tate', 'Gracie', 'Maya', 'Ava', 'Luna', 'Zoe', 'Chloe', 'Lily', 'Ella', 'Aria', 'Scarlett', 'Aurora', 'Hazel', 'Violet', 'Stella', 'Nova', 'Emilia', 'Isla', 'Freya', 'Ivy'];
  const sobrenomes = ['Nobrega', 'Figueredo', 'Silva', 'Souza', 'Oliveira', 'Costa', 'Sousa', 'Santos', 'Ishii', 'Braga', 'Eilish', 'Carpenter', 'Swift', 'McRae', 'Abrams', "O'Connel", 'Hernandez', 'Miller', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Martinez', 'Rodriguez', 'Lee', 'Walker', 'Hall', 'Allen', 'Young'];

  const primeiroNome = nomes[Math.floor(Math.random() * nomes.length)];
  const segundoNome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  const terceiroNome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];

  return `${primeiroNome} ${segundoNome} ${terceiroNome}`;
}

function emailAleatorio(nomeBase: string) {
  const provedores = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];
  const provedor = provedores[Math.floor(Math.random() * provedores.length)];
  const nomeLimpo = nomeBase.toLowerCase().replace(/\s+/g, '.');
  const sufixoUnico = Date.now().toString().slice(-5);
  
  return `${nomeLimpo}${sufixoUnico}@${provedor}`;
}

test.describe.serial('fluxo doador no deploy', () => {

// Substitui a URL base apenas para os testes dentro deste arquivo
test.use({ baseURL: 'http://rldiasbr.duckdns.org:3301' });

// Credenciais dinâmicas para evitar conflito com cadastro já existente
const cpf = gerarCpfValido();
const nome = nomeAleatorio();
const email = emailAleatorio(nome);
const senha = 'SenhaForte123';
const cpfRecepcionista = '04692461209';
const cpfEnfermeiro = '32952616280';
const cpfMedico = '97042023269';
const senhaFuncionarios = 'senha123';

// Cadastro de Doador
test('cadastro de doador com sucesso', async ({ page }) => {
  await page.goto('/cadastro');

  await page.fill('input[name="nome"]', nome);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="cpf"]', cpf);
  await page.fill('input[name="endereco"]', 'Rua Samambaia, 100');
  await page.fill('input[name="data"]', '1995-05-20');
  await page.fill('input[name="telefone"]', '(68) 97455-7624');

  await page.check('input[name="sexo"][value="Feminino"]');
  await page.getByRole('radio', { name: 'O+', exact: true }).check();

  await page.fill('input[name="senha"]', senha);
  await page.fill('input[name="confirmar"]', senha);

  await page.click('button.btn-concluir');

  // Novo passo: confirmar no modal
  await expect(page.locator('.modal-overlay')).toBeVisible();
  await page.getByRole('button', { name: 'Sim, Cadastrar', exact: true }).click();

  await expect(page).toHaveURL(/\/login\?cadastrado=true/);
  
  // Usamos o .first() porque a mensagem aparece tanto no banner quanto no toast
  await expect(
    page.getByText('Cadastro realizado com sucesso! Faça seu login.').first()
  ).toBeVisible();
});

// Login como doador
test('login como doador com sucesso', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="username"]', cpf);
  await page.fill('input[name="password"]', senha);
  await page.click('button.btn-login');

  await expect(page).toHaveURL('/');
  await expect
    .poll(async () =>
      page.evaluate(() => ({
        access: localStorage.getItem('access'),
        cargo: localStorage.getItem('cargo'),
      }))
    )
    .toMatchObject({
      access: expect.any(String),
      cargo: 'doador',
    });
});


// Doador responde questionário
test('doador responde questionário com sucesso', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="username"]', cpf);
  await page.fill('input[name="password"]', senha);
  await page.click('button.btn-login');

  await expect(page).toHaveURL('/');

  await page.goto('/questionario');
  await expect(page).toHaveURL('/questionario');

  await page.locator('.checkbox-regras input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Iniciar Questionário', exact: true }).click();

  await expect(page).toHaveURL('/questionario_form');
  await expect(page.locator('.contador')).toBeVisible();

  const botaoSim = page.getByRole('button', { name: 'Sim', exact: true });
  const botaoNao = page.getByRole('button', { name: 'Não', exact: true });
  const botaoFinalizar = page.locator('button.btn-finalizar');

  for (let i = 0; i < 100; i++) {
    if (await botaoFinalizar.isVisible()) {
      break;
    }

    if (i < 4) {
      await botaoSim.click();
    } else {
      await botaoNao.click();
    }
  }

  await expect(botaoFinalizar).toBeVisible();
  await botaoFinalizar.click();

  await expect(page.locator('.resultado-box')).toBeVisible();
  await expect(page.getByRole('button', { name: 'OK', exact: true })).toBeVisible();
  await expect(page.locator('.resultado-box h3')).toContainText(/Parabéns|Infelizmente/);
});

// Recepcionista inicia doação para o doador recém-cadastrado
test('recepcionista inicia doação do doador recém-cadastrado', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', cpfRecepcionista);
  await page.fill('input[name="password"]', senhaFuncionarios);
  await page.click('button.btn-login');
  await expect(page).toHaveURL('/');

  await page.goto('/iniciar-doacao');
  await expect(page).toHaveURL('/iniciar-doacao');

  await page.fill('input[placeholder="000.000.000-00"]', cpf);
  await expect(page.locator('.perfil-container')).toBeVisible();
  await expect(page.locator('.info-doador')).toContainText(nome);

  await page.click('button.btn-iniciar');
  await expect(page.locator('.modal-overlay')).toBeVisible();
  await page.getByRole('button', { name: 'Sim, iniciar', exact: true }).click();

  await expect(page.locator('.toast-notificacao.show .toast-conteudo p')).toContainText(/iniciada com sucesso/i);
});

// Enfermeiro realiza a pré-triagem do doador recém-cadastrado
test('enfermeiro realiza pré-triagem do doador recém-cadastrado', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', cpfEnfermeiro);
  await page.fill('input[name="password"]', senhaFuncionarios);
  await page.click('button.btn-login');
  await expect(page).toHaveURL('/');

  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('cargo')))
    .toBe('enfermeiro');

  await page.goto('/processo-doacao-andamento');
  await expect(page).toHaveURL('/processo-doacao-andamento');

  const cardDoador = page.locator('.usuario-card', { hasText: nome }).first();
  await expect(cardDoador).toBeVisible();
  await cardDoador.getByRole('button', { name: 'Realizar Pré-triagem', exact: true }).click();

  await expect(page).toHaveURL(/\/form-pre-triagem\/\d+/);
  await page.fill('input[name="altura"]', '1.68');
  await page.fill('input[name="peso"]', '63.4');
  await page.fill('input[name="hemoglobina"]', '14.1');

  await page.click('button.btn-concluir');
  await expect(page.locator('.modal-overlay')).toBeVisible();
  await page.getByRole('button', { name: 'Sim, Aprovar', exact: true }).click();

  await expect(page).toHaveURL('/processo-doacao-andamento', { timeout: 15000 });
});

// Médico realiza a triagem do doador recém-cadastrado
test('medico realiza triagem do doador recém-cadastrado', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', cpfMedico);
  await page.fill('input[name="password"]', senhaFuncionarios);
  await page.click('button.btn-login');
  await expect(page).toHaveURL('/');

  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('cargo')))
    .toBe('medico');

  await page.goto('/processo-doacao-andamento');
  await expect(page).toHaveURL('/processo-doacao-andamento');

  // Procura qualquer coisa com "Triagem", remove "Pré-Triagem" dos resultados e clica
  await page.getByText(/Triagem/i).filter({ hasNotText: 'Pré' }).first().click();

  const cardDoador = page.locator('.usuario-card', { hasText: nome }).first();
  await expect(cardDoador).toBeVisible();
  await cardDoador.getByRole('button', { name: 'Realizar Triagem', exact: true }).click();

  await expect(page).toHaveURL(/\/form-triagem\/\d+/);
  await page.fill('input[name="pressao_arterial"]', '12x8');

  // Passo adicionado: Revisar questionário para habilitar o botão "Apto"
  await page.getByRole('button', { name: 'Revisar Questionário', exact: true }).click();
  await page.waitForLoadState('load'); // Aguarda o carregamento da página de revisão
  await page.goBack(); // Retorna para a página anterior
  await expect(page).toHaveURL(/\/form-triagem\/\d+/); // Garante que voltou ao formulário

  await page.click('button.btn-concluir');
  await expect(page.locator('.modal-overlay')).toBeVisible();
  await page.getByRole('button', { name: 'Sim, Aprovar', exact: true }).click();

  await expect(page).toHaveURL('/processo-doacao-andamento', { timeout: 15000 });
});

// Enfermeiro realiza a coleta do doador recém-cadastrado
test('enfermeiro realiza coleta do doador recém-cadastrado', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', cpfEnfermeiro);
  await page.fill('input[name="password"]', senhaFuncionarios);
  await page.click('button.btn-login');
  await expect(page).toHaveURL('/');

  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('cargo')))
    .toBe('enfermeiro');

  await page.goto('/processo-doacao-andamento');
  await expect(page).toHaveURL('/processo-doacao-andamento');

  await page.getByText(/Coleta/i).first().click();

  const cardDoador = page.locator('.usuario-card', { hasText: nome }).first();
  await expect(cardDoador).toBeVisible();
  await cardDoador.getByRole('button', { name: 'Realizar Coleta', exact: true }).click();

  await expect(page).toHaveURL(/\/form-coleta\/\d+/);

  await page.selectOption('select[name="responsavel"]', { index: 1 });
  await page.getByLabel('Sim').check();

  await page.click('button.btn-coleta');
  await expect(page.locator('.modal-overlay')).toBeVisible();
  await page.getByRole('button', { name: 'Sim, Finalizar', exact: true }).click();

  await expect(page).toHaveURL('/processo-doacao-andamento', { timeout: 20000 });
});

// Médico realiza a validação da bolsa e libera para estoque
test('médico realiza a validação e liberação da bolsa', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', cpfMedico);
  await page.fill('input[name="password"]', senhaFuncionarios);
  await page.click('button.btn-login');
  await expect(page).toHaveURL('/');

  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('cargo')))
    .toBe('medico');

  await page.goto('/aguardando-validacao-bolsa');
  await expect(page).toHaveURL('/aguardando-validacao-bolsa');

  // Encontra a linha com o nome do doador e clica no botão "Realizar Validação" correspondente
  await page.locator('div').filter({ hasText: nome }).getByRole('button', { name: 'Realizar Validação' }).first().click();

  await expect(page).toHaveURL(/\/validar-bolsa\/\d+/);

  // Adicionar Laudo Laboratorial
  const [fileChooserLaudo] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Adicionar Laudo' }).click(),
  ]);
  await fileChooserLaudo.setFiles({
    name: 'laudo_laboratorial.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids []\n/Count 0\n>>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \ntrailer\n<<\n/Size 3\n/Root 1 0 R\n>>\nstartxref\n101\n%%EOF'),
  });

  // Adicionar Exame do Doador
  const [fileChooserExame] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Adicionar Exame' }).click(),
  ]);
  await fileChooserExame.setFiles({
    name: 'exame_doador.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids []\n/Count 0\n>>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \ntrailer\n<<\n/Size 3\n/Root 1 0 R\n>>\nstartxref\n101\n%%EOF'),
  });

  // Desce a página e clica em Liberar para o Estoque
  await page.getByRole('button', { name: 'Liberar para o Estoque', exact: true }).click();

  // Confirma a liberação no modal
  await expect(page.getByText('Confirma a validação da bolsa')).toBeVisible();
  await page.getByRole('button', { name: 'Sim, Liberar', exact: true }).click();
});

});