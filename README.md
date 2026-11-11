# Banco de Citações — Painel Interativo para Redação e Concursos

Painel estático em **HTML + CSS + JavaScript puro (Vanilla JS)** alimentado por um arquivo único [`citacoes.json`](citacoes.json), pensado para consulta rápida, revisão ativa e uso em simulados e treinos de redação dissertativa.

A base inicial reúne **150 citações** distribuídas igualmente em **15 eixos temáticos** (10 por eixo):

Educação · Saúde · Tecnologia · Meio Ambiente · Direitos Humanos · Desigualdade Social · Democracia · Administração Pública · Ética · Cultura · Trabalho · Segurança Pública · Infância e Juventude · Idoso · Pessoa com Deficiência

---

## Funcionalidades do Painel

- **Busca textual instantânea (sem acentos):** procura simultaneamente em citação, autor, obra/fonte, tema principal, orientações de uso (`como_usar`), ID (`EDU01`, `SAU05`...) e `#tags`. Atalho: `/`.
- **Filtros combinados por dimensão:**
  - **Eixo temático** (barra rápida com contadores por eixo)
  - **Uso na redação** (`#uso-introducao`, `#uso-tese`, `#uso-desenvolvimento`, `#uso-contrargumento`, `#uso-conclusao`)
  - **Tipo de repertório** (`#tipo-filosofica`, `#tipo-cientifica`, `#tipo-juridica`, `#tipo-historica`, `#tipo-literaria`, `#tipo-popular`)
  - **Argumento-chave** (`#arg-dignidade-humana`, `#arg-justica`, `#arg-eficiencia`, `#arg-participacao`, `#arg-solidariedade`, `#arg-igualdade`, `#arg-liberdade`, `#arg-prevencao`)
  - **Tom** (`#tom-formal`, `#tom-reflexivo`, `#tom-critico`, `#tom-propositivo`)
  - **Autor**, **Verificação** (`#fonte-confirmada` / `#verificar-fonte`) e **Favoritos** (salvos no navegador via `localStorage`).
- **Visualização em Cartões e Tabela Dinâmica:** alterne entre cartões editoriais e uma tabela dinâmica com ordenação por coluna.
- **Modo Simulado (Ocultar respostas):** oculta autor, fonte/ano, tags de autor e o bloco "como usar", deixando visíveis apenas a citação e as pistas temáticas/argumentativas para você testar a memória com botão de revelação individual ou global.
- **Treino em Flashcards:** sessões interativas sobre a seleção filtrada atual, com embaralhamento, controle de acertos vs. revisão (`Espaço`, `1`, `2`, `C`) e revisão focada nas cartas marcadas.
- **Cópia Rápida & Exportação:** copie no formato *Citação + Autor*, *Só citação* ou *Completa*, ou exporte qualquer seleção em `.json`, `.md` ou `.txt`.
- **Adicionar Nova Citação:** formulário integrado que gera o objeto JSON no padrão do projeto e permite testar rascunhos localmente no navegador.
- **Tema Claro e Escuro:** alternância persistida no navegador.

---

## Estrutura do Repositório

```text
.
├── index.html                   # Interface principal do painel
├── styles.css                   # Estilos (tema claro/escuro e layout responsivo)
├── app.js                       # Lógica de busca, filtros, tabela, simulado e flashcards
├── citacoes.json                # Base estruturada com as 150 citações
├── .nojekyll                    # Garante publicação estática direta no GitHub Pages
├── dados/
│   └── lote-01.md               # Tabelas Markdown originais do 1º lote
├── scripts/
│   ├── sync-markdown.mjs        # Compila dados/*.md -> citacoes.json
│   └── validate.mjs             # Valida o esquema e integridade de citacoes.json
└── .github/
    └── workflows/
        └── validate.yml         # Validação automática de citacoes.json em push/PR
```

---

## Como Executar Localmente

Como o painel carrega `citacoes.json` via `fetch`, utilize um servidor estático simples na raiz do repositório:

```bash
python3 -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador.

---

## Publicação no GitHub Pages

O repositório já utiliza caminhos relativos e inclui `.nojekyll`, estando pronto para hospedagem gratuita no GitHub Pages:

1. No GitHub, acesse **Settings → Pages**.
2. Em **Build and deployment**, selecione **Source: Deploy from a branch**.
3. Escolha a branch **`main`** e a pasta **`/ (root)`**, e clique em **Save**.
4. Em poucos segundos o painel ficará disponível em `https://<seu-usuario>.github.io/citacoes/`.

---

## Como Expandir a Base (Próximos Lotes)

### Opção A — Editar `citacoes.json` diretamente
Adicione novos objetos seguindo o esquema abaixo (ou use o botão **+ Nova Citação** no próprio painel para gerar o JSON):

```json
{
  "id": "EDU01",
  "eixo": "Educação",
  "citacao": "O homem não pode se tornar um verdadeiro homem senão pela educação. Ele é aquilo que a educação dele faz.",
  "autor": "Immanuel Kant",
  "fonte": "Sobre a Pedagogia",
  "ano": "1999",
  "pagina": "p. 32",
  "tags": [
    "#tema-educacao",
    "#tipo-filosofica",
    "#arg-dignidade-humana",
    "#uso-tese",
    "#tom-formal",
    "#autor-kant",
    "#fonte-confirmada"
  ],
  "tema_principal": "Formação humana",
  "como_usar": "Para fundamentar a tese de que a educação é condição para a humanização e o desenvolvimento pleno do indivíduo.",
  "verificacao": "#fonte-confirmada"
}
```

### Opção B — Fluxo Híbrido com Markdown
1. Crie um novo arquivo em `dados/` (ex.: `dados/lote-02.md`) no mesmo formato de tabela do `dados/lote-01.md`.
2. Execute os scripts de sincronização e validação (Node.js 18+):

```bash
node scripts/sync-markdown.mjs
node scripts/validate.mjs
```
