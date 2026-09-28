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

let generoGerado = 'Feminino';

function nomeAleatorio() {
  const nomesMasculinos = ['Carlos', 'Lucas', 'Gabriel', 'Mateus', 'Rafael', 'Bruno', 'Thiago', 'Daniel', 'Rodrigo', 'Felipe', 'Leonardo', 'Eduardo', 'Gustavo', 'Vinicius', 'Diego'];
  const nomesFemininos = ['Larissa', 'Mariana', 'Camila', 'Juliana', 'Beatriz', 'Amanda', 'Gabriela', 'Hayssa', 'Raquel', 'Catarina', 'Sabrina', 'Taylor', 'Maya', 'Luna', 'Chloe'];
  const sobrenomesComuns = ['Nobrega', 'Figueredo', 'Silva', 'Souza', 'Oliveira', 'Costa', 'Sousa', 'Santos', 'Ishii', 'Braga', 'Eilish', 'Carpenter', 'Swift', 'McRae', 'Abrams', "O'Connel", 'Hernandez', 'Miller', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Martinez', 'Rodriguez', 'Lee', 'Walker', 'Hall', 'Allen', 'Young'];

  const ehMasculino = Math.random() < 0.5;
  generoGerado = ehMasculino ? 'Masculino' : 'Feminino';

  const primeiroNome = ehMasculino 
    ? nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]
    : nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];

  const segundoNome = sobrenomesComuns[Math.floor(Math.random() * sobrenomesComuns.length)];
  const terceiroNome = sobrenomesComuns[Math.floor(Math.random() * sobrenomesComuns.length)];

  return `${primeiroNome} ${segundoNome} ${terceiroNome}`;
}

function emailAleatorio(nomeBase: string) {
  const provedores = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];
  const provedor = provedores[Math.floor(Math.random() * provedores.length)];
  const nomeLimpo = nomeBase.toLowerCase().replace(/\s+/g, '.');
  const sufixoUnico = Date.now().toString().slice(-5);
  
  return `${nomeLimpo}${sufixoUnico}@${provedor}`;
}

test.describe.serial('fluxo doador no deploy - até triagem (SEM questionário)', () => {

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

  // Seleciona de forma dinâmica o sexo com base no nome gerado (Masculino ou Feminino)
  await page.check(`input[name="sexo"][value="${generoGerado}"]`);
  await page.getByRole('radio', { name: 'B-', exact: true }).check();

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

});