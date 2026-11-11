# Banco de Citações — Painel Interativo para Redação e Concursos

Painel estático e instalável (**PWA offline**) em **HTML + CSS + JavaScript puro (Vanilla JS)** alimentado por [`citacoes.json`](citacoes.json), desenvolvido para consulta rápida, estudo com repetição espaçada e montagem de projetos de texto em simulados e treinos de redação.

A base inicial reúne **150 citações curadas** distribuídas igualmente em **15 eixos temáticos** (10 por eixo), todas com autoria nominal/normativa, `conceito_chave` e indicação clara entre `#fonte-confirmada` e `#verificar-fonte`:

Educação · Saúde · Tecnologia · Meio Ambiente · Direitos Humanos · Desigualdade Social · Democracia · Administração Pública · Ética · Cultura · Trabalho · Segurança Pública · Infância e Juventude · Idoso · Pessoa com Deficiência

---

## Funcionalidades do Painel

- **Busca textual instantânea (sem acentos):** procura simultaneamente em citação, `conceito_chave`, autor, obra/fonte, tema principal, orientações de uso (`como_usar`), ID (`EDU01`, `SAU05`...) e `#tags`. Atalho: `/`.
- **Filtros combinados e URL compartilhável:**
  - **Eixo temático** (barra rápida com contadores por eixo)
  - **Uso na redação** (`#uso-introducao`, `#uso-tese`, `#uso-desenvolvimento`, `#uso-contrargumento`, `#uso-conclusao`)
  - **Tipo de repertório** (`#tipo-filosofica`, `#tipo-cientifica`, `#tipo-juridica`, `#tipo-historica`, `#tipo-literaria`)
  - **Argumento-chave**, **Tom**, **Autor**, **Verificação** e **Favoritos**
  - Os filtros são sincronizados automaticamente com a querystring da URL (`?eixo=...&uso=...`) com botão **Copiar link**.
- **Cartões e Tabela Dinâmica:** alternância entre cartões editoriais e tabela ordenável por coluna (`ID`, `Eixo`, `Autor`, `Fonte / Ano`).
- **Modo Simulado (Ocultar respostas):** oculta autor, fonte/ano, `conceito_chave`, tags `#autor-*` e o bloco "como usar", mantendo apenas a citação e as pistas argumentativas para treino ativo.
- **Treino em Flashcards com Repetição Espaçada (SRS) e Painel de Progresso:**
  - Registra acertos e revisões por carta no `localStorage` com agendamento progressivo (`1d → 3d → 7d → 15d → 30d`).
  - Permite treinar a **Seleção do painel**, **Pendentes de revisão (SRS)** ou **Ainda não estudadas**, além de acompanhar o domínio por eixo em **Progresso**.
- **Mesa de Redação e Desafio 5 min:**
  - Fixe citações diretamente nos 4 parágrafos da dissertação (**Introdução**, **Desenvolvimento 1**, **Desenvolvimento 2**, **Conclusão**) e exporte o projeto de texto pronto em Markdown.
  - **Desafio 5m** sorteia temas de redação e inicia um cronômetro regressivo enquanto você monta o projeto na Mesa.
- **PWA Offline + Backup do Usuário:**
  - `manifest.webmanifest` e `sw.js` permitem instalar o painel e usá-lo offline no celular ou desktop.
  - Na aba **Backup do Usuário** em **Dados**, é possível exportar e restaurar favoritos, histórico SRS, Mesa de Redação e rascunhos locais em `.json`.
- **Cópia Rápida, Exportação e Nova Citação:** copie em 3 formatos, exporte em `.json`, `.md` ou `.txt`, ou crie rascunhos/objetos JSON direto pelo botão **+ Nova**.

---

## Estrutura do Repositório

```text
.
├── index.html                   # Interface principal do painel
├── styles.css                   # Estilos (tema claro/escuro, drawer e responsividade)
├── app.js                       # Busca, filtros na URL, SRS, Mesa, Desafio e PWA
├── citacoes.json                # Base estruturada com as 150 citações
├── manifest.webmanifest         # Manifesto PWA para instalação e uso offline
├── sw.js                        # Service Worker com cache offline
├── icon.svg                     # Ícone vetorial do app
├── .nojekyll                    # Garante publicação estática direta no GitHub Pages
├── dados/
│   └── lote-01.md               # Tabelas Markdown curadas do 1º lote (9 colunas)
├── scripts/
│   ├── sync-markdown.mjs        # Compila dados/*.md -> citacoes.json
│   └── validate.mjs             # Valida esquema, duplicatas e sincronismo com Markdown
└── .github/
    └── workflows/
        └── validate.yml         # Valida PRs e sincroniza dados/*.md -> citacoes.json na main
```

---

## Como Executar Localmente

```bash
python3 -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador.

---

## Como Expandir a Base (Fluxo Híbrido Automatizado)

1. Edite [`dados/lote-01.md`](dados/lote-01.md) ou crie um novo arquivo em `dados/` (ex.: `dados/lote-02.md`) seguindo o formato de 9 colunas com `Conceito-chave`.
2. Para gerar e validar localmente:

```bash
node scripts/sync-markdown.mjs
node scripts/validate.mjs --check-sync
```

3. Ao enviar alterações em `dados/*.md` diretamente para a `main`, o workflow do GitHub Actions recompila e valida `citacoes.json` automaticamente.
