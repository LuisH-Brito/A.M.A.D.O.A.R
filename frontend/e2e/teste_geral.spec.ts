import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

// Credenciais dinâmicas para evitar conflito com cadastro já existente
const ts = Date.now();
const cpf = String(10000000000 + (ts % 89999999999)).padStart(11, '0').slice(0, 11);
const email = 'AMADOAR2026@gmail.com';
const senha = 'SenhaForte123';

// Cadastro de Doador
test('cadastro de doador com sucesso', async ({ page }) => {
  await page.goto('/cadastro');

  await page.fill('input[name="nome"]', 'Larissa Nobrega Figueredo');
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

  await expect(page).toHaveURL(/\/login\?cadastrado=true/);
  await expect(page.getByText('Cadastro realizado com sucesso! Faça seu login.')).toBeVisible();
});

// Login como doador
test('login com o doador recém-cadastrado', async ({ page }) => {
  await page.goto('/login');

  await page.fill('#cpf', cpf);
  await page.fill('#senha', senha);
  await page.click('button.btn-login');

  await expect(page).toHaveURL('/');

  const token = await page.evaluate(() => localStorage.getItem('token'));
  const cargo = await page.evaluate(() => localStorage.getItem('cargo'));
  expect(token).not.toBeNull();
  expect(cargo).toBe('doador');
});

// Doador responde questionário
test('doador responde o questionário com sucesso', async ({ page, request }) => {
  page.on('dialog', async dialog => {
    console.log('ALERT:', dialog.message());
    await dialog.accept();
  });

  await page.goto('/login');

  await page.fill('#cpf', cpf);
  await page.fill('#senha', senha);
  await page.click('button.btn-login');

  await expect(page).toHaveURL('/');

  const perguntas = await request.get('http://127.0.0.1:8000/api/perguntas/');
  expect(perguntas.ok()).toBeTruthy();

  const listaPerguntas = await perguntas.json();
  expect(listaPerguntas.length).toBeGreaterThan(0);

  await page.goto('/questionario');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Iniciar Questionário', exact: true }).click();

  await expect(page).toHaveURL('/questionario_form');

  const contador = page.locator('.contador');
  await expect(contador).toHaveText(`1/${listaPerguntas.length}`);

  for (let index = 0; index < listaPerguntas.length; index++) {
    const respostaEsperada = listaPerguntas[index].resposta_esperada as 'Sim' | 'Não';

    await page.getByRole('button', { name: respostaEsperada, exact: true }).click();

    if (index < listaPerguntas.length - 1) {
      await expect(contador).toHaveText(`${index + 2}/${listaPerguntas.length}`);
    } else {
      await page.waitForTimeout(500);
    }
  }

  const finalizar = page.locator('button.btn-finalizar');
  await finalizar.scrollIntoViewIfNeeded();
  await expect(finalizar).toBeVisible();
  await expect(finalizar).toBeEnabled();

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/questionarios/') &&
      response.request().method() === 'POST'
    ),
    finalizar.click({ force: true }),
  ]);

  await expect(page.locator('.resultado-box')).toBeVisible({ timeout: 10000 });
});

