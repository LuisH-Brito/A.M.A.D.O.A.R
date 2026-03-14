import { test, expect } from '@playwright/test';

test.describe.serial('fluxo doador', () => {

// Credenciais dinâmicas para evitar conflito com cadastro já existente
const ts = Date.now();
const cpf = String(10000000000 + (ts % 89999999999)).padStart(11, '0').slice(0, 11);
const email = 'AMADOAR2026@gmail.com';
const senha = 'SenhaForte123';

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

  const botaoNao = page.getByRole('button', { name: 'Não', exact: true });
  const botaoFinalizar = page.locator('button.btn-finalizar');

  for (let i = 0; i < 100; i++) {
    if (await botaoFinalizar.isVisible()) {
      break;
    }

    await botaoNao.click();
  }

  await expect(botaoFinalizar).toBeVisible();
  await botaoFinalizar.click();

  await expect(page.locator('.resultado-box')).toBeVisible();
  await expect(page.getByRole('button', { name: 'OK', exact: true })).toBeVisible();
  await expect(page.locator('.resultado-box h3')).toContainText(/Parabéns|Infelizmente/);
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

