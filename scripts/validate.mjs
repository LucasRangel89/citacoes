#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { buildCitationsFromMarkdown, loadAuthorsMetadata } from "./sync-markdown.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const JSON_PATH = path.join(ROOT, "citacoes.json");

function normalizeForDupCheck(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function main() {
  const checkSync = process.argv.includes("--check-sync");

  if (!fs.existsSync(JSON_PATH)) {
    console.error("Erro: citacoes.json não encontrado.");
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  } catch (err) {
    console.error("Erro ao ler JSON de citacoes.json:", err.message);
    process.exit(1);
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.error("Erro: citacoes.json deve ser um array não vazio.");
    process.exit(1);
  }

  const requiredStringFields = [
    "id",
    "eixo",
    "citacao",
    "autor",
    "autor_info",
    "fonte",
    "conceito_chave",
    "tema_principal",
    "como_usar",
    "verificacao",
  ];

  const seenIds = new Set();
  const seenQuotes = new Map();
  const errors = [];
  const warnings = [];

  data.forEach((item, index) => {
    const label = item?.id || `#${index + 1}`;
    for (const field of requiredStringFields) {
      if (typeof item[field] !== "string" || item[field].trim() === "") {
        errors.push(`[${label}] Campo obrigatório ausente ou vazio: ${field}`);
      }
    }

    if (typeof item.ano !== "string") {
      errors.push(`[${label}] Campo 'ano' deve ser string (pode ser vazia "").`);
    }

    if (seenIds.has(item.id)) {
      errors.push(`[${label}] ID duplicado.`);
    }
    seenIds.add(item.id);

    const normQuote = normalizeForDupCheck(item.citacao);
    if (seenQuotes.has(normQuote)) {
      errors.push(`[${label}] Citação duplicada em relação a ${seenQuotes.get(normQuote)}.`);
    } else {
      seenQuotes.set(normQuote, label);
    }

    if (!["#fonte-confirmada", "#verificar-fonte"].includes(item.verificacao)) {
      errors.push(`[${label}] Verificação inválida: ${item.verificacao}`);
    }

    if (!Array.isArray(item.tags) || item.tags.length === 0) {
      errors.push(`[${label}] Campo 'tags' deve ser um array não vazio.`);
    } else {
      for (const tag of item.tags) {
        if (typeof tag !== "string" || !tag.startsWith("#")) {
          errors.push(`[${label}] Tag inválida: ${tag}`);
        }
      }
      if (!item.tags.some((t) => t.startsWith("#tema-"))) {
        errors.push(`[${label}] Deve conter pelo menos uma tag #tema-...`);
      }
      if (!item.tags.includes(item.verificacao)) {
        errors.push(`[${label}] A verificação (${item.verificacao}) deve constar nas tags.`);
      }
      if (item.tags.includes("#autor-generico")) {
        errors.push(`[${label}] Tag #autor-generico encontrada; utilize autoria específica verificável.`);
      }
    }

    if (item.verificacao === "#verificar-fonte") {
      warnings.push(`[${label}] Marcada como #verificar-fonte (${item.autor}).`);
    }
  });

  if (checkSync) {
    try {
      const authorsMeta = loadAuthorsMetadata();
      for (const item of data) {
        if (!authorsMeta[item.autor]?.info) {
          errors.push(`[${item.id}] Autor "${item.autor}" ausente ou sem descrição em dados/autores.json.`);
        }
      }
      const { allItems } = buildCitationsFromMarkdown();
      const expected = JSON.stringify(allItems, null, 2) + "\n";
      const actual = fs.readFileSync(JSON_PATH, "utf8");
      if (expected !== actual) {
        errors.push(
          "citacoes.json está fora de sincronia com dados/*.md / dados/autores.json. Execute `node scripts/sync-markdown.mjs`."
        );
      }
    } catch (err) {
      errors.push(`Falha ao verificar sincronia com dados/*.md: ${err.message}`);
    }
  }

  if (warnings.length > 0) {
    console.log(`Avisos (${warnings.length}):`);
    for (const w of warnings) console.log(" !", w);
  }

  if (errors.length > 0) {
    console.error(`Validação falhou com ${errors.length} erro(s):`);
    for (const err of errors) console.error(" -", err);
    process.exit(1);
  }

  const eixos = new Set(data.map((d) => d.eixo));
  const confirmedCount = data.filter((d) => d.verificacao === "#fonte-confirmada").length;
  console.log(
    `Validação concluída com sucesso: ${data.length} citações válidas em ${eixos.size} eixos temáticos (${confirmedCount} confirmadas, ${data.length - confirmedCount} para verificação).`
  );
}

main();
