import { expect, test } from '@playwright/test';

function cpfValido(): string {
  const base = String(Date.now()).slice(-9).split('').map(Number);
  const digito = (numeros: number[], peso: number) => {
    const resto = numeros.reduce((total, numero, i) => total + numero * (peso - i), 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  base.push(digito(base, 10));
  base.push(digito(base, 11));
  return base.join('');
}

test('recepção cadastra, doador troca senha e passa a acessar o perfil', async ({ page }) => {
  test.setTimeout(90000);
  const cpf = cpfValido();
  const email = `recepcao-${cpf}@amadoar.test`;
  const novaSenha = 'NovaSenhaForte987';

  await page.goto('/login');
  await page.fill('input[name="username"]', '04692461209');
  await page.fill('input[name="password"]', 'senha123');
  await page.click('button.btn-login');
  await expect(page).toHaveURL('/');

  await page.locator('button.btn-hamburger').click();
  await page.getByRole('link', { name: 'Cadastrar Doador' }).click();
  await expect(page).toHaveURL(/\/cadastro\?modo=recepcionista/);
  await expect(page.locator('input[name="senha"]')).toHaveCount(0);
  await page.getByRole('radio', { name: 'O+', exact: true }).check();
  await page.locator('input[name="sexo"][value="Feminino"]').check();
  await page.fill('input[name="nome"]', 'Doador da Recepção');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="cpf"]', cpf);
  await page.fill('input[name="endereco"]', 'Rua de Teste, 10');
  await page.fill('input[name="data"]', '1990-01-01');
  await page.fill('input[name="telefone"]', '(68) 99999-9999');
  await page.locator('button.btn-concluir').click();
  await page.getByRole('button', { name: 'Sim, Cadastrar' }).click();
  await expect(page.getByText(/A senha inicial é Senha123/)).toBeVisible();

  await page.locator('button.btn-hamburger').click();
  await page.getByText('Sair', { exact: true }).click();
  await expect(page).toHaveURL('/login');

  await page.fill('input[name="username"]', cpf);
  await page.fill('input[name="password"]', 'Senha123');
  await page.click('button.btn-login');
  await expect(page).toHaveURL('/troca-senha-obrigatoria');
  await page.goto('/pagina-doador');
  await expect(page).toHaveURL('/troca-senha-obrigatoria');

  await page.fill('input[name="senhaAtual"]', 'Senha123');
  await page.fill('input[name="novaSenha"]', novaSenha);
  await page.fill('input[name="confirmarNovaSenha"]', novaSenha);
  await page.getByRole('button', { name: 'Alterar senha' }).click();
  await expect(page).toHaveURL(/\/login\?senhaAlterada=true/);

  await page.fill('input[name="username"]', cpf);
  await page.fill('input[name="password"]', novaSenha);
  await page.click('button.btn-login');
  await expect(page).toHaveURL('/');
  await page.goto('/pagina-doador');
  await expect(page).toHaveURL('/pagina-doador');

  await page.locator('button.btn-hamburger').click();
  await page.getByText('Sair', { exact: true }).click();
  await page.fill('input[name="username"]', cpf);
  await page.fill('input[name="password"]', 'Senha123');
  await page.click('button.btn-login');
  await expect(page).toHaveURL('/login');
  await expect(page.getByText('CPF ou senha incorretos.')).toBeVisible();

  await page.fill('input[name="password"]', novaSenha);
  await page.click('button.btn-login');
  await expect(page).toHaveURL('/');
  await page.goto('/pagina-doador');
  await expect(page).toHaveURL('/pagina-doador');
});
