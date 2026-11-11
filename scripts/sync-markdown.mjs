#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DADOS_DIR = path.join(ROOT, "dados");
const OUTPUT_JSON = path.join(ROOT, "citacoes.json");

const EIXO_LABELS = {
  "EDUCACAO": "Educação",
  "EDUCAÇÃO": "Educação",
  "SAUDE": "Saúde",
  "SAÚDE": "Saúde",
  "TECNOLOGIA": "Tecnologia",
  "MEIO AMBIENTE": "Meio Ambiente",
  "DIREITOS HUMANOS": "Direitos Humanos",
  "DESIGUALDADE SOCIAL": "Desigualdade Social",
  "DEMOCRACIA": "Democracia",
  "ADMINISTRACAO PUBLICA": "Administração Pública",
  "ADMINISTRAÇÃO PÚBLICA": "Administração Pública",
  "ETICA": "Ética",
  "ÉTICA": "Ética",
  "CULTURA": "Cultura",
  "TRABALHO": "Trabalho",
  "SEGURANCA PUBLICA": "Segurança Pública",
  "SEGURANÇA PÚBLICA": "Segurança Pública",
  "INFANCIA E JUVENTUDE": "Infância e Juventude",
  "INFÂNCIA E JUVENTUDE": "Infância e Juventude",
  "IDOSO": "Idoso",
  "PESSOA COM DEFICIENCIA": "Pessoa com Deficiência",
  "PESSOA COM DEFICIÊNCIA": "Pessoa com Deficiência",
};

function formatEixo(raw) {
  const key = raw.trim().toUpperCase();
  if (EIXO_LABELS[key]) return EIXO_LABELS[key];
  return raw
    .trim()
    .toLowerCase()
    .replace(/\b([a-záéíóúâêôãõç])/g, (m) => m.toUpperCase());
}

function cleanQuote(raw) {
  let s = raw.trim();
  let parafrase = false;
  if (/\(Paráfrase\)$/i.test(s)) {
    parafrase = true;
    s = s.replace(/\s*\(Paráfrase\)$/i, "").trim();
  }
  if ((s.startsWith("“") && s.endsWith("”")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1).trim();
  }
  if (parafrase) {
    s = `${s} (Paráfrase)`;
  }
  return s;
}

function parseFonte(raw) {
  let clean = raw.replace(/\*/g, "").trim();
  if (/^Dominio público$/i.test(clean)) {
    clean = "Domínio público";
  }

  let fonte = clean;
  let ano = "";
  let pagina = "";

  const yearPageMatch = clean.match(/^(.*?)\s*\((\d{4})(?:,\s*([^)]+))?\)\s*$/);
  if (yearPageMatch) {
    fonte = yearPageMatch[1].trim();
    ano = yearPageMatch[2].trim();
    pagina = (yearPageMatch[3] || "").trim();
  }

  return { fonte, ano, pagina };
}

function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const items = [];
  let currentEixo = "";

  for (const line of lines) {
    const trimmed = line.trim();
    const eixoMatch = trimmed.match(/^#{2,4}\s*EIXO:\s*(.+)$/i);
    if (eixoMatch) {
      currentEixo = formatEixo(eixoMatch[1]);
      continue;
    }

    if (!trimmed.startsWith("|")) continue;
    if (/^\|\s*ID\s*\|/i.test(trimmed) || /^\|\s*:?-+:?\s*\|/.test(trimmed)) continue;

    const cols = trimmed.split("|").slice(1, -1).map((c) => c.trim());
    if (cols.length < 8) continue;

    const [id, citacaoRaw, autor, fonteRaw, tagsRaw, temaPrincipal, comoUsar, verificacao] = cols;
    const { fonte, ano, pagina } = parseFonte(fonteRaw);
    const tags = tagsRaw.split(/\s+/).filter(Boolean);

    const record = {
      id,
      eixo: currentEixo,
      citacao: cleanQuote(citacaoRaw),
      autor,
      fonte,
      ano,
      ...(pagina ? { pagina } : {}),
      tags,
      tema_principal: temaPrincipal,
      como_usar: comoUsar,
      verificacao,
    };

    items.push(record);
  }

  return items;
}

function main() {
  if (!fs.existsSync(DADOS_DIR)) {
    console.error("Diretório dados/ não encontrado.");
    process.exit(1);
  }

  const mdFiles = fs
    .readdirSync(DADOS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const allItems = [];
  const seenIds = new Set();

  for (const file of mdFiles) {
    const parsed = parseMarkdownFile(path.join(DADOS_DIR, file));
    for (const item of parsed) {
      if (seenIds.has(item.id)) {
        console.error(`ID duplicado encontrado: ${item.id} (em ${file})`);
        process.exit(1);
      }
      seenIds.add(item.id);
      allItems.push(item);
    }
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allItems, null, 2) + "\n", "utf8");
  console.log(`Sincronizado com sucesso: ${allItems.length} citações geradas em citacoes.json a partir de ${mdFiles.length} arquivo(s).`);
}

main();
