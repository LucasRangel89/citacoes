#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const JSON_PATH = path.join(ROOT, "citacoes.json");

function main() {
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
    "fonte",
    "tema_principal",
    "como_usar",
    "verificacao",
  ];

  const seenIds = new Set();
  const errors = [];

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
    }
  });

  if (errors.length > 0) {
    console.error(`Validação falhou com ${errors.length} erro(s):`);
    for (const err of errors) console.error(" -", err);
    process.exit(1);
  }

  const eixos = new Set(data.map((d) => d.eixo));
  console.log(`Validação concluída com sucesso: ${data.length} citações válidas em ${eixos.size} eixos temáticos.`);
}

main();
