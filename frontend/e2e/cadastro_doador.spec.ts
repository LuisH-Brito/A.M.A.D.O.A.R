import { test, expect } from '@playwright/test';

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

test.describe('Testes Exclusivos de Cadastro de Doador', () => {

  test.use({ baseURL: 'http://rldiasbr.duckdns.org:3301' });

  test('deve realizar o cadastro de um novo doador com sucesso', async ({ page }) => {
    const cpf = gerarCpfValido();
    const nome = nomeAleatorio();
    const email = emailAleatorio(nome);
    const senha = 'SenhaForte123';

    await page.goto('/cadastro');

    await page.fill('input[name="nome"]', nome);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="cpf"]', cpf);
    await page.fill('input[name="endereco"]', 'Rua Samambaia, 100');
    await page.fill('input[name="data"]', '1995-05-20');
    await page.fill('input[name="telefone"]', '(68) 97455-7624');

    // Seleciona o sexo de forma dinâmica (Masculino ou Feminino)
    await page.check(`input[name="sexo"][value="${generoGerado}"]`);
    await page.getByRole('radio', { name: 'O+', exact: true }).check();

    await page.fill('input[name="senha"]', senha);
    await page.fill('input[name="confirmar"]', senha);

    await page.click('button.btn-concluir');

    // Confirmação no modal
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await page.getByRole('button', { name: 'Sim, Cadastrar', exact: true }).click();

    await expect(page).toHaveURL(/\/login\?cadastrado=true/);
    
    await expect(
      page.getByText('Cadastro realizado com sucesso! Faça seu login.').first()
    ).toBeVisible();
  });

});