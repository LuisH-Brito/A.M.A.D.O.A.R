import { test, expect } from '@playwright/test';

test.describe.serial('fluxo doador', () => {

// Credenciais dinâmicas para evitar conflito com cadastro já existente
const ts = Date.now();
const cpf = String(10000000000 + (ts % 89999999999)).padStart(11, '0').slice(0, 11);
const email = 'AMADOAR2026@gmail.com';
const senha = 'SenhaForte123';
const cpfRecepcionista = '66666666666';
const cpfEnfermeiro = '22222222222';
const cpfMedico = '44444444444';
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
  await page.getByLabel('O+').check();

  await page.fill('input[name="senha"]', senha);
  await page.fill('input[name="confirmar"]', senha);

  await page.click('button.btn-concluir');

  // Novo passo: confirmar no modal
  await expect(page.locator('.modal-overlay')).toBeVisible();
  await page.getByRole('button', { name: 'Sim, Cadastrar', exact: true }).click();

  await expect(page).toHaveURL(/\/login\?cadastrado=true/);
  await expect(
    page.getByText('Cadastro realizado com sucesso! Faça seu login.')
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

    if (i < 5) {
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

  await page.getByRole('tab', { name: 'Triagem', exact: true }).click();

  const cardDoador = page.locator('.usuario-card', { hasText: nome }).first();
  await expect(cardDoador).toBeVisible();
  await cardDoador.getByRole('button', { name: 'Realizar Triagem', exact: true }).click();

  await expect(page).toHaveURL(/\/form-triagem\/\d+/);
  await page.fill('input[name="pressao_arterial"]', '12x8');

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

  await page.getByRole('tab', { name: 'Coleta', exact: true }).click();

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

});


function nomeAleatorio() {
  const nomes = ['Larissa', 'Mariana', 'Camila', 'Juliana', 'Beatriz', 'Amanda', 'Gabriela', 'Hayssa', 'Almecina', 'Raquel', 'Catarina', 'Billie', 'Sabrina', 'Taylor', 'Tate', 'Gracie'];
  const sobrenomes = ['Nobrega', 'Figueredo', 'Silva', 'Souza', 'Oliveira', 'Costa', 'Sousa', 'Santos', 'Ishii', 'Braga', 'Eilish', 'Carpenter', 'Swift', 'McRae', 'Abrams', "O'Connel"];

  const primeiroNome = nomes[Math.floor(Math.random() * nomes.length)];
  const segundoNome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  const terceiroNome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];

  return `${primeiroNome} ${segundoNome} ${terceiroNome}`;
}

const nome = nomeAleatorio();

