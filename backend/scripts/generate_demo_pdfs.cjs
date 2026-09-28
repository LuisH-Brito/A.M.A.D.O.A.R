const fs = require('fs');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');
const laudosDir = path.join(backendRoot, 'demo_assets', 'laudos_bolsas', 'demonstracao');
const examesDir = path.join(backendRoot, 'demo_assets', 'exames_doador', 'demonstracao');

const principais = [
  { cpf: '11732693200', nome: 'Giovanni Ruan Renato Alves', tipo: 'A+' },
  { cpf: '10100000126', nome: 'Ana Clara Almeida', tipo: 'A-' },
  { cpf: '10100000207', nome: 'Bruno Barros Lima', tipo: 'B+' },
  { cpf: '10100000398', nome: 'Beatriz Nunes Silva', tipo: 'B-' },
  { cpf: '10100000479', nome: 'Alex Martins Costa', tipo: 'AB+' },
  { cpf: '10100000550', nome: 'Amanda Ribeiro Souza', tipo: 'AB-' },
  { cpf: '10100000630', nome: 'Otavio Pereira Melo', tipo: 'O+' },
  { cpf: '78974427214', nome: 'Louise Luzia Assuncao', tipo: 'O-' },
];

const apoioA = [
  '10100000983', '10100001017', '10100001106', '10100001289',
  '10100001360', '10100001440', '10100001521', '10100001602',
].map((cpf, index) => ({
  cpf,
  nome: `Doador Apoio A Positivo ${String(index + 1).padStart(2, '0')}`,
  tipo: 'A+',
  chave: `a_positivo_apoio_${String(index + 1).padStart(2, '0')}`,
}));

const apoioB = [
  '10100001793', '10100001874', '10100001955', '10100002099',
  '10100002170',
].map((cpf, index) => ({
  cpf,
  nome: `Doador Apoio B Positivo ${String(index + 1).padStart(2, '0')}`,
  tipo: 'B+',
  chave: `b_positivo_apoio_${String(index + 1).padStart(2, '0')}`,
}));

const laudos = [
  ...['utilizada', 'inapta', 'vencida'].map((estado) => ({
    chave: `a_positivo_${estado}`,
    nome: principais[0].nome,
    tipo: 'A+',
    resultado: estado === 'inapta' ? 'Amostra inapta para uso' : 'Amostra apta para demonstracao',
  })),
  { chave: 'a_positivo_atual', nome: principais[0].nome, tipo: 'A+', resultado: 'Amostra apta para demonstracao' },
  ...['utilizada', 'inapta', 'vencida'].map((estado) => ({
    chave: `b_positivo_${estado}`,
    nome: principais[2].nome,
    tipo: 'B+',
    resultado: estado === 'inapta' ? 'Amostra inapta para uso' : 'Amostra apta para demonstracao',
  })),
  { chave: 'b_positivo_atual', nome: principais[2].nome, tipo: 'B+', resultado: 'Amostra apta para demonstracao' },
  ...['utilizada', 'inapta', 'vencida'].map((estado) => ({
    chave: `o_positivo_${estado}`,
    nome: principais[6].nome,
    tipo: 'O+',
    resultado: estado === 'inapta' ? 'Amostra inapta para uso' : 'Amostra apta para demonstracao',
  })),
  { chave: 'o_positivo_atual', nome: principais[6].nome, tipo: 'O+', resultado: 'Amostra apta para demonstracao' },
  ...apoioA.map((doador) => ({ ...doador, resultado: 'Amostra apta para demonstracao' })),
  ...apoioB.map((doador) => ({ ...doador, resultado: 'Amostra apta para demonstracao' })),
  {
    chave: 'o_positivo_apoio_01',
    nome: 'Doador Apoio O Positivo 01',
    tipo: 'O+',
    resultado: 'Amostra apta para demonstracao',
  },
  {
    chave: 'o_negativo_atual',
    nome: principais[7].nome,
    tipo: 'O-',
    resultado: 'Amostra apta para demonstracao',
  },
];

function escapePdfText(text) {
  return text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function createPdf(filePath, title, lines) {
  const contentLines = [
    'BT',
    '/F1 18 Tf',
    '72 760 Td',
    `(${escapePdfText(title)}) Tj`,
    '/F1 11 Tf',
    ...lines.flatMap((line) => ['0 -28 Td', `(${escapePdfText(line)}) Tj`]),
    'ET',
  ];
  const stream = `${contentLines.join('\n')}\n`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}endstream`,
  ];

  let pdf = '%PDF-1.4\n%AMADOAR-DEMO\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(pdf, 'ascii'));
}

laudos.forEach((laudo) => {
  createPdf(
    path.join(laudosDir, `${laudo.chave}.pdf`),
    'LAUDO LABORATORIAL - AMBIENTE DE DEMONSTRACAO',
    [
      `Doador: ${laudo.nome}`,
      `Tipo sanguineo: ${laudo.tipo}`,
      `Resultado: ${laudo.resultado}`,
      'Documento sem validade clinica.',
      'Projeto A.M.A.D.O.A.R.',
    ],
  );
});

principais.forEach((doador) => {
  const quantidade = ['11732693200', '10100000207', '10100000630'].includes(doador.cpf) ? 2 : 1;
  for (let indice = 1; indice <= quantidade; indice += 1) {
    createPdf(
      path.join(examesDir, `exame_${doador.cpf}_${indice}.pdf`),
      'EXAME DO DOADOR - AMBIENTE DE DEMONSTRACAO',
      [
        `Doador: ${doador.nome}`,
        `Tipo sanguineo: ${doador.tipo}`,
        `Exame demonstrativo: ${indice}`,
        'Resultado: parametros compativeis com o cenario de demonstracao.',
        'Documento sem validade clinica.',
      ],
    );
  }
});

if (laudos.length !== 27) {
  throw new Error(`Quantidade inesperada de laudos: ${laudos.length}`);
}

const examesEsperados = principais.reduce(
  (total, doador) => total + (['11732693200', '10100000207', '10100000630'].includes(doador.cpf) ? 2 : 1),
  0,
);
if (examesEsperados !== 11) {
  throw new Error(`Quantidade inesperada de exames: ${examesEsperados}`);
}

console.log(`Gerados ${laudos.length} laudos e ${examesEsperados} exames.`);
