#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DADOS_DIR = path.join(ROOT, "dados");
const AUTORES_JSON = path.join(DADOS_DIR, "autores.json");
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
  "IGUALDADE DE GENERO": "Igualdade de Gênero",
  "IGUALDADE DE GÊNERO": "Igualdade de Gênero",
  "URBANISMO E MORADIA": "Urbanismo e Moradia",
  "COMUNICACAO E CIENCIA": "Comunicação e Ciência",
  "COMUNICAÇÃO E CIÊNCIA": "Comunicação e Ciência",
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
  let suffix = "";
  const suffixMatch = s.match(/\((Paráfrase(?:\s+conceitual)?|Alusão\s+literária)\)$/i);
  if (suffixMatch) {
    suffix = suffixMatch[1];
    s = s.replace(/\s*\((?:Paráfrase(?:\s+conceitual)?|Alusão\s+literária)\)$/i, "").trim();
  }
  if ((s.startsWith("“") && s.endsWith("”")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1).trim();
  }
  if (suffix) {
    s = `${s} (${suffix})`;
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

export function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const items = [];
  let currentEixo = "";
  let hasConceptCol = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const eixoMatch = trimmed.match(/^#{2,4}\s*EIXO:\s*(.+)$/i);
    if (eixoMatch) {
      currentEixo = formatEixo(eixoMatch[1]);
      continue;
    }

    if (!trimmed.startsWith("|")) continue;
    if (/^\|\s*ID\s*\|/i.test(trimmed)) {
      hasConceptCol = /Conceito-chave/i.test(trimmed);
      continue;
    }
    if (/^\|\s*:?-+:?\s*\|/.test(trimmed)) continue;

    const cols = trimmed.split("|").slice(1, -1).map((c) => c.trim());
    if (cols.length < 8) continue;

    let id, citacaoRaw, autor, fonteRaw, conceitoChave, tagsRaw, temaPrincipal, comoUsar, verificacao;

    if (hasConceptCol || cols.length >= 9) {
      [id, citacaoRaw, autor, fonteRaw, conceitoChave, tagsRaw, temaPrincipal, comoUsar, verificacao] = cols;
    } else {
      [id, citacaoRaw, autor, fonteRaw, tagsRaw, temaPrincipal, comoUsar, verificacao] = cols;
      conceitoChave = temaPrincipal;
    }

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
      conceito_chave: conceitoChave,
      tags,
      tema_principal: temaPrincipal,
      como_usar: comoUsar,
      verificacao,
    };

    items.push(record);
  }

  return items;
}

export function loadAuthorsMetadata() {
  if (!fs.existsSync(AUTORES_JSON)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(AUTORES_JSON, "utf8"));
}

export function buildCitationsFromMarkdown() {
  if (!fs.existsSync(DADOS_DIR)) {
    throw new Error("Diretório dados/ não encontrado.");
  }

  const authorsMeta = loadAuthorsMetadata();
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
        throw new Error(`ID duplicado encontrado: ${item.id} (em ${file})`);
      }
      seenIds.add(item.id);
      const authorEntry = authorsMeta[item.autor];
      allItems.push({
        ...item,
        autor_info: authorEntry?.info || "",
        autor_artigo: authorEntry?.artigo || "",
        autor_tipo: authorEntry?.tipo || "pessoa",
      });
    }
  }

  const groupedByEixo = new Map();
  for (const item of allItems) {
    if (!groupedByEixo.has(item.eixo)) {
      groupedByEixo.set(item.eixo, []);
    }
    groupedByEixo.get(item.eixo).push(item);
  }

  const orderedItems = [];
  for (const group of groupedByEixo.values()) {
    orderedItems.push(...group);
  }

  return { allItems: orderedItems, fileCount: mdFiles.length };
}

function main() {
  const { allItems, fileCount } = buildCitationsFromMarkdown();
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allItems, null, 2) + "\n", "utf8");
  console.log(
    `Sincronizado com sucesso: ${allItems.length} citações geradas em citacoes.json a partir de ${fileCount} arquivo(s).`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
