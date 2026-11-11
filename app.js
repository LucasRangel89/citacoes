(() => {
  "use strict";

  const STORAGE_KEYS = {
    favorites: "citacoes_favoritas_v1",
    theme: "citacoes_tema_v1",
    view: "citacoes_view_v1",
    copyFormat: "citacoes_copy_format_v1",
    drafts: "citacoes_rascunhos_v1",
  };

  const TAG_LABELS = {
    "#uso-introducao": "Introdução",
    "#uso-tese": "Tese",
    "#uso-desenvolvimento": "Desenvolvimento",
    "#uso-contrargumento": "Contrargumento",
    "#uso-conclusao": "Conclusão",

    "#tipo-filosofica": "Filosófica",
    "#tipo-cientifica": "Científica",
    "#tipo-juridica": "Jurídica",
    "#tipo-historica": "Histórica",
    "#tipo-literaria": "Literária",
    "#tipo-popular": "Popular",

    "#arg-dignidade-humana": "Dignidade humana",
    "#arg-eficiencia": "Eficiência",
    "#arg-igualdade": "Igualdade",
    "#arg-justica": "Justiça",
    "#arg-liberdade": "Liberdade",
    "#arg-participacao": "Participação",
    "#arg-prevencao": "Prevenção",
    "#arg-solidariedade": "Solidariedade",

    "#tom-critico": "Crítico",
    "#tom-formal": "Formal",
    "#tom-propositivo": "Propositivo",
    "#tom-reflexivo": "Reflexivo",

    "#fonte-confirmada": "Fonte confirmada",
    "#verificar-fonte": "Verificar fonte",
  };

  const state = {
    baseQuotes: [],
    draftQuotes: [],
    allQuotes: [],
    filteredQuotes: [],

    search: "",
    eixo: "",
    uso: "",
    tipo: "",
    arg: "",
    tom: "",
    autor: "",
    verificacao: "",
    extraTag: "",
    onlyFavorites: false,

    sortOrder: "default",
    tableSort: { col: null, dir: "asc" },

    view: "cards",
    simulado: false,
    revealedIds: new Set(),
    favorites: new Set(),
    copyFormat: "citation-author",

    flashcards: {
      deck: [],
      index: 0,
      revealed: false,
      knownIds: new Set(),
      reviewIds: new Set(),
    },
  };

  const dom = {};

  function cacheDom() {
    const ids = [
      "poolBadge",
      "btnFavoritesFilter",
      "favoritesCount",
      "btnStartFlashcards",
      "btnOpenNewModal",
      "btnOpenExportModal",
      "btnThemeToggle",
      "themeIcon",
      "searchInput",
      "btnClearSearch",
      "btnToggleFilters",
      "facetsPanel",
      "axesStrip",
      "filterUso",
      "filterTipo",
      "filterArg",
      "filterTom",
      "filterAutor",
      "filterVerificacao",
      "sortOrder",
      "activeFiltersBar",
      "activeFiltersList",
      "btnClearAllFilters",
      "resultsCounter",
      "toggleSimulado",
      "copyFormat",
      "btnViewCards",
      "btnViewTable",
      "simuladoBanner",
      "btnRevealAll",
      "btnHideAll",
      "errorBanner",
      "manualJsonInput",
      "cardsGrid",
      "tableWrapper",
      "quotesTable",
      "tableBody",
      "emptyState",
      "btnResetFromEmpty",
      "toast",
      "flashcardModal",
      "flashcardDeckInfo",
      "btnShuffleDeck",
      "btnCloseFlashcards",
      "fcProgressLabel",
      "fcKnownCount",
      "fcReviewCount",
      "fcProgressBar",
      "fcStage",
      "fcId",
      "fcAxis",
      "fcQuote",
      "fcTags",
      "fcAnswer",
      "fcAuthor",
      "fcSource",
      "fcTheme",
      "fcHowToUse",
      "btnFcReveal",
      "fcEvalButtons",
      "btnFcReview",
      "btnFcCopy",
      "btnFcKnown",
      "fcSummary",
      "fcSummaryText",
      "btnFcRetryWrong",
      "btnFcRestart",
      "btnFcFinish",
      "exportModal",
      "btnCloseExport",
      "exportScope",
      "exportFormat",
      "exportPreview",
      "btnCopyExport",
      "btnDownloadExport",
      "newQuoteModal",
      "btnCloseNewQuote",
      "newQuoteForm",
      "nqId",
      "nqEixo",
      "eixosDatalist",
      "nqCitacao",
      "nqAutor",
      "nqFonte",
      "nqAno",
      "nqTipo",
      "nqUso",
      "nqArg",
      "nqTom",
      "nqTema",
      "nqVerificacao",
      "nqComoUsar",
      "nqJsonPreview",
      "localDraftsInfo",
      "btnCopyNewJson",
    ];
    for (const id of ids) {
      dom[id] = document.getElementById(id);
    }
  }

  function normalizeText(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function slugify(str) {
    return normalizeText(str)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function formatTagLabel(tag) {
    if (TAG_LABELS[tag]) return TAG_LABELS[tag];
    const clean = tag.replace(/^#(tema|tipo|arg|uso|tom|autor|fonte)-/, "");
    return clean
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function getTagCategoryClass(tag) {
    if (tag.startsWith("#uso-")) return "tag-uso";
    if (tag.startsWith("#tipo-")) return "tag-tipo";
    if (tag.startsWith("#arg-")) return "tag-arg";
    if (tag.startsWith("#tom-")) return "tag-tom";
    return "tag-default";
  }

  function formatSourceFull(q) {
    const parts = [];
    if (q.fonte) parts.push(q.fonte);
    const meta = [];
    if (q.ano) meta.push(q.ano);
    if (q.pagina) meta.push(q.pagina);
    if (meta.length > 0) parts.push(`(${meta.join(", ")})`);
    return parts.join(" ");
  }

  function loadPreferences() {
    try {
      const savedFavs = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || "[]");
      if (Array.isArray(savedFavs)) {
        state.favorites = new Set(savedFavs);
      }
    } catch {
      state.favorites = new Set();
    }

    try {
      const savedDrafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.drafts) || "[]");
      if (Array.isArray(savedDrafts)) {
        state.draftQuotes = savedDrafts.map((q) => ({ ...q, _isDraft: true }));
      }
    } catch {
      state.draftQuotes = [];
    }

    const savedView = localStorage.getItem(STORAGE_KEYS.view);
    if (savedView === "cards" || savedView === "table") {
      state.view = savedView;
    }

    const savedCopyFormat = localStorage.getItem(STORAGE_KEYS.copyFormat);
    if (["citation-author", "quote-only", "full"].includes(savedCopyFormat)) {
      state.copyFormat = savedCopyFormat;
      dom.copyFormat.value = savedCopyFormat;
    }

    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(savedTheme || (prefersDark ? "dark" : "light"), false);
  }

  function applyTheme(theme, persist = true) {
    document.documentElement.setAttribute("data-theme", theme);
    dom.themeIcon.textContent = theme === "dark" ? "☀" : "☾";
    if (persist) {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    }
  }

  function saveFavorites() {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...state.favorites]));
  }

  function saveDrafts() {
    const clean = state.draftQuotes.map(({ _isDraft, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEYS.drafts, JSON.stringify(clean));
  }

  let toastTimer = null;
  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.hidden = true;
    }, 2600);
  }

  function copyToClipboard(text, buttonEl = null) {
    const finish = () => {
      showToast("Copiado para a área de transferência!");
      if (buttonEl) {
        const original = buttonEl.textContent;
        buttonEl.textContent = "✓ Copiado";
        buttonEl.classList.add("copied");
        setTimeout(() => {
          buttonEl.textContent = original;
          buttonEl.classList.remove("copied");
        }, 1400);
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(finish).catch(() => fallbackCopy(text, finish));
    } else {
      fallbackCopy(text, finish);
    }
  }

  function fallbackCopy(text, onSuccess) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      onSuccess();
    } catch {
      showToast("Não foi possível copiar automaticamente.");
    }
    document.body.removeChild(ta);
  }

  function formatQuoteForCopy(q) {
    const sourceText = formatSourceFull(q);
    if (state.copyFormat === "quote-only") {
      return `“${q.citacao}”`;
    }
    if (state.copyFormat === "full") {
      return `“${q.citacao}” — ${q.autor}${sourceText ? ` (${sourceText})` : ""}\nTema: ${q.tema_principal}\nComo usar: ${q.como_usar}`;
    }
    return `“${q.citacao}” — ${q.autor}${sourceText ? ` (${sourceText})` : ""}`;
  }

  function normalizeQuoteRecord(item, index) {
    return {
      id: String(item.id || `CIT${index + 1}`),
      eixo: String(item.eixo || inferEixoFromTags(item.tags) || "Geral"),
      citacao: String(item.citacao || ""),
      autor: String(item.autor || "Autor desconhecido"),
      fonte: String(item.fonte || ""),
      ano: item.ano != null ? String(item.ano) : "",
      pagina: item.pagina != null ? String(item.pagina) : "",
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      tema_principal: String(item.tema_principal || ""),
      como_usar: String(item.como_usar || ""),
      verificacao: String(item.verificacao || "#fonte-confirmada"),
      _isDraft: Boolean(item._isDraft),
      _order: index,
    };
  }

  function inferEixoFromTags(tags) {
    if (!Array.isArray(tags)) return "";
    const t = tags.find((tag) => tag.startsWith("#tema-"));
    return t ? formatTagLabel(t) : "";
  }

  function mergeAndIndexQuotes(rawArray) {
    state.baseQuotes = rawArray.map((item, idx) => normalizeQuoteRecord(item, idx));
    const merged = [
      ...state.baseQuotes,
      ...state.draftQuotes.map((d, idx) =>
        normalizeQuoteRecord({ ...d, _isDraft: true }, state.baseQuotes.length + idx)
      ),
    ];

    state.allQuotes = merged.map((q) => {
      const searchBlob = normalizeText(
        [
          q.id,
          q.eixo,
          q.citacao,
          q.autor,
          q.fonte,
          q.ano,
          q.tema_principal,
          q.como_usar,
          q.tags.join(" "),
        ].join(" ")
      );
      return { ...q, _searchBlob: searchBlob };
    });

    populateFacetOptions();
    renderAxesStrip();
    updatePoolBadge();
    updateFavoritesBadge();
    applyFilters();
  }

  function updatePoolBadge() {
    const eixosCount = new Set(state.allQuotes.map((q) => q.eixo)).size;
    dom.poolBadge.textContent = `${state.allQuotes.length} citações · ${eixosCount} eixos`;
  }

  function updateFavoritesBadge() {
    const validFavCount = state.allQuotes.filter((q) => state.favorites.has(q.id)).length;
    dom.favoritesCount.textContent = String(validFavCount);
    dom.btnFavoritesFilter.setAttribute("aria-pressed", String(state.onlyFavorites));
  }

  function buildTagFacetCounts(prefix) {
    const counts = new Map();
    for (const q of state.allQuotes) {
      for (const tag of q.tags) {
        if (tag.startsWith(prefix)) {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        }
      }
    }
    return [...counts.entries()].sort((a, b) =>
      formatTagLabel(a[0]).localeCompare(formatTagLabel(b[0]), "pt-BR")
    );
  }

  function fillSelect(selectEl, defaultText, entries, labelFormatter, currentVal) {
    selectEl.textContent = "";
    const defOpt = document.createElement("option");
    defOpt.value = "";
    defOpt.textContent = defaultText;
    selectEl.appendChild(defOpt);

    for (const [val, count] of entries) {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = `${labelFormatter(val)} (${count})`;
      selectEl.appendChild(opt);
    }
    selectEl.value = currentVal || "";
  }

  function populateFacetOptions() {
    fillSelect(dom.filterUso, "Todos os momentos", buildTagFacetCounts("#uso-"), formatTagLabel, state.uso);
    fillSelect(dom.filterTipo, "Todos os tipos", buildTagFacetCounts("#tipo-"), formatTagLabel, state.tipo);
    fillSelect(dom.filterArg, "Todos os argumentos", buildTagFacetCounts("#arg-"), formatTagLabel, state.arg);
    fillSelect(dom.filterTom, "Todos os tons", buildTagFacetCounts("#tom-"), formatTagLabel, state.tom);
    fillSelect(
      dom.filterVerificacao,
      "Todas",
      buildTagFacetCounts("#fonte-").concat(buildTagFacetCounts("#verificar-")),
      formatTagLabel,
      state.verificacao
    );

    const authorCounts = new Map();
    for (const q of state.allQuotes) {
      authorCounts.set(q.autor, (authorCounts.get(q.autor) || 0) + 1);
    }
    const sortedAuthors = [...authorCounts.entries()].sort((a, b) =>
      a[0].localeCompare(b[0], "pt-BR")
    );
    fillSelect(dom.filterAutor, "Todos os autores", sortedAuthors, (a) => a, state.autor);

    dom.eixosDatalist.textContent = "";
    const eixos = [...new Set(state.allQuotes.map((q) => q.eixo))];
    for (const eixo of eixos) {
      const opt = document.createElement("option");
      opt.value = eixo;
      dom.eixosDatalist.appendChild(opt);
    }
  }

  function renderAxesStrip() {
    dom.axesStrip.textContent = "";
    const eixoCounts = new Map();
    for (const q of state.allQuotes) {
      eixoCounts.set(q.eixo, (eixoCounts.get(q.eixo) || 0) + 1);
    }

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = `axis-filter-btn${state.eixo === "" ? " active" : ""}`;
    allBtn.textContent = "Todos ";
    const allCount = document.createElement("span");
    allCount.className = "axis-count";
    allCount.textContent = `(${state.allQuotes.length})`;
    allBtn.appendChild(allCount);
    allBtn.addEventListener("click", () => {
      state.eixo = "";
      applyFilters();
    });
    dom.axesStrip.appendChild(allBtn);

    for (const [eixo, count] of eixoCounts.entries()) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `axis-filter-btn${state.eixo === eixo ? " active" : ""}`;
      btn.textContent = `${eixo} `;
      const countSpan = document.createElement("span");
      countSpan.className = "axis-count";
      countSpan.textContent = `(${count})`;
      btn.appendChild(countSpan);
      btn.addEventListener("click", () => {
        state.eixo = state.eixo === eixo ? "" : eixo;
        applyFilters();
      });
      dom.axesStrip.appendChild(btn);
    }
  }

  function applyFilters() {
    const queryNorm = normalizeText(state.search.trim());
    const terms = queryNorm ? queryNorm.split(/\s+/).filter(Boolean) : [];

    let results = state.allQuotes.filter((q) => {
      if (state.onlyFavorites && !state.favorites.has(q.id)) return false;
      if (state.eixo && q.eixo !== state.eixo) return false;
      if (state.uso && !q.tags.includes(state.uso)) return false;
      if (state.tipo && !q.tags.includes(state.tipo)) return false;
      if (state.arg && !q.tags.includes(state.arg)) return false;
      if (state.tom && !q.tags.includes(state.tom)) return false;
      if (state.autor && q.autor !== state.autor) return false;
      if (state.verificacao && q.verificacao !== state.verificacao && !q.tags.includes(state.verificacao)) {
        return false;
      }
      if (state.extraTag && !q.tags.includes(state.extraTag)) return false;

      if (terms.length > 0) {
        for (const term of terms) {
          if (!q._searchBlob.includes(term)) return false;
        }
      }
      return true;
    });

    results = sortQuotes(results);
    state.filteredQuotes = results;

    renderAxesStrip();
    renderActiveFilters();
    renderResultsCounter();
    renderResults();
  }

  function sortQuotes(list) {
    const arr = [...list];
    const { col, dir } = state.tableSort;
    const factor = dir === "desc" ? -1 : 1;

    if (state.view === "table" && col) {
      arr.sort((a, b) => {
        if (col === "id") return a.id.localeCompare(b.id, "pt-BR") * factor;
        if (col === "eixo") return a.eixo.localeCompare(b.eixo, "pt-BR") * factor;
        if (col === "author") return a.autor.localeCompare(b.autor, "pt-BR") * factor;
        if (col === "year") {
          const ya = parseInt(a.ano, 10) || 0;
          const yb = parseInt(b.ano, 10) || 0;
          return (ya - yb) * factor;
        }
        return (a._order - b._order) * factor;
      });
      return arr;
    }

    switch (state.sortOrder) {
      case "author":
        arr.sort((a, b) => a.autor.localeCompare(b.autor, "pt-BR") || a._order - b._order);
        break;
      case "year-desc":
        arr.sort((a, b) => (parseInt(b.ano, 10) || -9999) - (parseInt(a.ano, 10) || -9999));
        break;
      case "length-asc":
        arr.sort((a, b) => a.citacao.length - b.citacao.length);
        break;
      case "favorites":
        arr.sort((a, b) => {
          const fa = state.favorites.has(a.id) ? 0 : 1;
          const fb = state.favorites.has(b.id) ? 0 : 1;
          return fa - fb || a._order - b._order;
        });
        break;
      default:
        arr.sort((a, b) => a._order - b._order);
        break;
    }
    return arr;
  }

  function renderActiveFilters() {
    const active = [];
    if (state.search.trim()) {
      active.push({ label: `Busca: "${state.search.trim()}"`, clear: () => { state.search = ""; dom.searchInput.value = ""; dom.btnClearSearch.hidden = true; } });
    }
    if (state.onlyFavorites) {
      active.push({ label: "Somente Favoritas", clear: () => { state.onlyFavorites = false; updateFavoritesBadge(); } });
    }
    if (state.eixo) {
      active.push({ label: `Eixo: ${state.eixo}`, clear: () => { state.eixo = ""; } });
    }
    if (state.uso) {
      active.push({ label: `Uso: ${formatTagLabel(state.uso)}`, clear: () => { state.uso = ""; dom.filterUso.value = ""; } });
    }
    if (state.tipo) {
      active.push({ label: `Tipo: ${formatTagLabel(state.tipo)}`, clear: () => { state.tipo = ""; dom.filterTipo.value = ""; } });
    }
    if (state.arg) {
      active.push({ label: `Argumento: ${formatTagLabel(state.arg)}`, clear: () => { state.arg = ""; dom.filterArg.value = ""; } });
    }
    if (state.tom) {
      active.push({ label: `Tom: ${formatTagLabel(state.tom)}`, clear: () => { state.tom = ""; dom.filterTom.value = ""; } });
    }
    if (state.autor) {
      active.push({ label: `Autor: ${state.autor}`, clear: () => { state.autor = ""; dom.filterAutor.value = ""; } });
    }
    if (state.verificacao) {
      active.push({ label: `Verificação: ${formatTagLabel(state.verificacao)}`, clear: () => { state.verificacao = ""; dom.filterVerificacao.value = ""; } });
    }
    if (state.extraTag) {
      active.push({ label: `Tag: ${state.extraTag}`, clear: () => { state.extraTag = ""; } });
    }

    dom.activeFiltersList.textContent = "";
    dom.activeFiltersBar.hidden = active.length === 0;

    for (const item of active) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "active-filter-chip";
      btn.textContent = `${item.label} ×`;
      btn.addEventListener("click", () => {
        item.clear();
        applyFilters();
      });
      dom.activeFiltersList.appendChild(btn);
    }
  }

  function clearAllFilters() {
    state.search = "";
    state.eixo = "";
    state.uso = "";
    state.tipo = "";
    state.arg = "";
    state.tom = "";
    state.autor = "";
    state.verificacao = "";
    state.extraTag = "";
    state.onlyFavorites = false;

    dom.searchInput.value = "";
    dom.btnClearSearch.hidden = true;
    dom.filterUso.value = "";
    dom.filterTipo.value = "";
    dom.filterArg.value = "";
    dom.filterTom.value = "";
    dom.filterAutor.value = "";
    dom.filterVerificacao.value = "";
    updateFavoritesBadge();
    applyFilters();
  }

  function renderResultsCounter() {
    const shown = state.filteredQuotes.length;
    const total = state.allQuotes.length;
    dom.resultsCounter.textContent =
      shown === total
        ? `Exibindo todas as ${total} citações`
        : `Exibindo ${shown} de ${total} citações`;
  }

  function appendHighlightedText(parentEl, text, rawQuery) {
    const cleanText = String(text || "");
    const q = normalizeText(rawQuery.trim());
    if (!q) {
      parentEl.appendChild(document.createTextNode(cleanText));
      return;
    }

    const terms = [...new Set(q.split(/\s+/).filter((t) => t.length >= 2))];
    if (terms.length === 0) {
      parentEl.appendChild(document.createTextNode(cleanText));
      return;
    }

    const normChars = [];
    const origIndices = [];
    for (let i = 0; i < cleanText.length; i++) {
      const n = normalizeText(cleanText[i]);
      for (let j = 0; j < n.length; j++) {
        normChars.push(n[j]);
        origIndices.push(i);
      }
    }
    const normStr = normChars.join("");
    const ranges = [];

    for (const term of terms) {
      let startIndex = 0;
      while (startIndex < normStr.length) {
        const idx = normStr.indexOf(term, startIndex);
        if (idx === -1) break;
        const origStart = origIndices[idx];
        const origEnd = origIndices[idx + term.length - 1] + 1;
        ranges.push([origStart, origEnd]);
        startIndex = idx + term.length;
      }
    }

    if (ranges.length === 0) {
      parentEl.appendChild(document.createTextNode(cleanText));
      return;
    }

    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      const prev = merged[merged.length - 1];
      if (ranges[i][0] <= prev[1]) {
        prev[1] = Math.max(prev[1], ranges[i][1]);
      } else {
        merged.push(ranges[i]);
      }
    }

    let cursor = 0;
    for (const [s, e] of merged) {
      if (s > cursor) {
        parentEl.appendChild(document.createTextNode(cleanText.slice(cursor, s)));
      }
      const mark = document.createElement("mark");
      mark.textContent = cleanText.slice(s, e);
      parentEl.appendChild(mark);
      cursor = e;
    }
    if (cursor < cleanText.length) {
      parentEl.appendChild(document.createTextNode(cleanText.slice(cursor)));
    }
  }

  function handleTagClick(tag) {
    if (tag.startsWith("#uso-")) {
      state.uso = state.uso === tag ? "" : tag;
      dom.filterUso.value = state.uso;
    } else if (tag.startsWith("#tipo-")) {
      state.tipo = state.tipo === tag ? "" : tag;
      dom.filterTipo.value = state.tipo;
    } else if (tag.startsWith("#arg-")) {
      state.arg = state.arg === tag ? "" : tag;
      dom.filterArg.value = state.arg;
    } else if (tag.startsWith("#tom-")) {
      state.tom = state.tom === tag ? "" : tag;
      dom.filterTom.value = state.tom;
    } else if (tag.startsWith("#tema-")) {
      const matching = state.allQuotes.find((q) => q.tags.includes(tag));
      if (matching) {
        state.eixo = state.eixo === matching.eixo ? "" : matching.eixo;
      }
    } else if (tag === "#fonte-confirmada" || tag === "#verificar-fonte") {
      state.verificacao = state.verificacao === tag ? "" : tag;
      dom.filterVerificacao.value = state.verificacao;
    } else {
      state.extraTag = state.extraTag === tag ? "" : tag;
    }
    applyFilters();
  }

  function isTagActive(tag) {
    return (
      state.uso === tag ||
      state.tipo === tag ||
      state.arg === tag ||
      state.tom === tag ||
      state.verificacao === tag ||
      state.extraTag === tag
    );
  }

  function createTagsElement(tags, includeStructural = true, hideAuthorTags = false) {
    const container = document.createElement("div");
    container.className = "tags-row";

    const displayTags = includeStructural
      ? tags.filter((t) => {
          if (t.startsWith("#tema-") || t.startsWith("#fonte-") || t.startsWith("#verificar-")) {
            return false;
          }
          if (hideAuthorTags && t.startsWith("#autor-")) {
            return false;
          }
          return true;
        })
      : tags;

    for (const tag of displayTags) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `tag-chip ${getTagCategoryClass(tag)}${isTagActive(tag) ? " is-active" : ""}`;
      btn.textContent = tag;
      btn.title = `Filtrar por ${formatTagLabel(tag)}`;
      btn.addEventListener("click", () => handleTagClick(tag));
      container.appendChild(btn);
    }
    return container;
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
    } else {
      state.favorites.add(id);
    }
    saveFavorites();
    updateFavoritesBadge();
    applyFilters();
  }

  function renderResults() {
    const list = state.filteredQuotes;
    const isEmpty = list.length === 0 && state.allQuotes.length > 0;
    dom.emptyState.hidden = !isEmpty;

    if (isEmpty) {
      dom.cardsGrid.hidden = true;
      dom.tableWrapper.hidden = true;
      return;
    }

    if (state.view === "cards") {
      dom.cardsGrid.hidden = false;
      dom.tableWrapper.hidden = true;
      renderCards(list);
    } else {
      dom.cardsGrid.hidden = true;
      dom.tableWrapper.hidden = false;
      renderTable(list);
    }
  }

  function renderCards(list) {
    dom.cardsGrid.textContent = "";
    const frag = document.createDocumentFragment();

    for (const q of list) {
      const card = document.createElement("article");
      card.className = "quote-card";

      const top = document.createElement("div");
      top.className = "card-top";

      const metaLeft = document.createElement("div");
      metaLeft.className = "card-meta-left";

      const idSpan = document.createElement("span");
      idSpan.className = "id-badge";
      idSpan.textContent = q.id;
      metaLeft.appendChild(idSpan);

      const axisBtn = document.createElement("button");
      axisBtn.type = "button";
      axisBtn.className = "axis-pill";
      axisBtn.textContent = q.eixo;
      axisBtn.title = `Filtrar pelo eixo ${q.eixo}`;
      axisBtn.addEventListener("click", () => {
        state.eixo = state.eixo === q.eixo ? "" : q.eixo;
        applyFilters();
      });
      metaLeft.appendChild(axisBtn);

      if (q._isDraft) {
        const draftBadge = document.createElement("span");
        draftBadge.className = "draft-pill";
        draftBadge.textContent = "Rascunho";
        metaLeft.appendChild(draftBadge);
      }

      const verifSpan = document.createElement("span");
      const isConfirmed = q.verificacao === "#fonte-confirmada";
      verifSpan.className = `verif-badge ${isConfirmed ? "verif-confirmed" : "verif-pending"}`;
      verifSpan.textContent = isConfirmed ? "✓ Confirmada" : "⚠ Verificar";
      verifSpan.title = q.verificacao;
      metaLeft.appendChild(verifSpan);

      const actions = document.createElement("div");
      actions.className = "card-actions";

      const isFav = state.favorites.has(q.id);
      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = `btn-fav${isFav ? " is-fav" : ""}`;
      favBtn.textContent = isFav ? "★" : "☆";
      favBtn.setAttribute("aria-label", isFav ? "Remover dos favoritos" : "Adicionar aos favoritos");
      favBtn.title = isFav ? "Remover dos favoritos" : "Favoritar citação";
      favBtn.addEventListener("click", () => toggleFavorite(q.id));

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-secondary btn-copy";
      copyBtn.textContent = "Copiar";
      copyBtn.addEventListener("click", () => copyToClipboard(formatQuoteForCopy(q), copyBtn));

      actions.appendChild(favBtn);
      actions.appendChild(copyBtn);
      top.appendChild(metaLeft);
      top.appendChild(actions);
      card.appendChild(top);

      const blockquote = document.createElement("blockquote");
      blockquote.className = "quote-text";
      blockquote.appendChild(document.createTextNode("“"));
      appendHighlightedText(blockquote, q.citacao, state.search);
      blockquote.appendChild(document.createTextNode("”"));
      card.appendChild(blockquote);

      const hiddenBySimulado = state.simulado && !state.revealedIds.has(q.id);

      if (hiddenBySimulado) {
        const hiddenBox = document.createElement("div");
        hiddenBox.className = "simulado-hidden-box";

        const label = document.createElement("span");
        label.textContent = "Autor, fonte e uso na redação ocultos no Modo Simulado.";

        const revealBtn = document.createElement("button");
        revealBtn.type = "button";
        revealBtn.className = "btn btn-sm btn-primary";
        revealBtn.textContent = "Revelar resposta";
        revealBtn.addEventListener("click", () => {
          state.revealedIds.add(q.id);
          renderResults();
        });

        hiddenBox.appendChild(label);
        hiddenBox.appendChild(revealBtn);
        card.appendChild(hiddenBox);
      } else {
        const attrRow = document.createElement("div");
        attrRow.className = "attribution-row";

        const authorBtn = document.createElement("button");
        authorBtn.type = "button";
        authorBtn.className = "author-btn";
        appendHighlightedText(authorBtn, q.autor, state.search);
        authorBtn.title = `Filtrar citações de ${q.autor}`;
        authorBtn.addEventListener("click", () => {
          state.autor = state.autor === q.autor ? "" : q.autor;
          dom.filterAutor.value = state.autor;
          applyFilters();
        });
        attrRow.appendChild(authorBtn);

        const srcText = formatSourceFull(q);
        if (srcText) {
          const sep = document.createElement("span");
          sep.textContent = "·";
          const srcSpan = document.createElement("span");
          srcSpan.className = "source-text";
          appendHighlightedText(srcSpan, srcText, state.search);
          attrRow.appendChild(sep);
          attrRow.appendChild(srcSpan);
        }

        if (state.simulado) {
          const hideBtn = document.createElement("button");
          hideBtn.type = "button";
          hideBtn.className = "btn-link";
          hideBtn.textContent = "Ocultar";
          hideBtn.style.marginLeft = "auto";
          hideBtn.addEventListener("click", () => {
            state.revealedIds.delete(q.id);
            renderResults();
          });
          attrRow.appendChild(hideBtn);
        }

        card.appendChild(attrRow);

        const usageBox = document.createElement("div");
        usageBox.className = "usage-box";

        const themeDiv = document.createElement("div");
        themeDiv.className = "usage-theme";
        appendHighlightedText(themeDiv, q.tema_principal, state.search);

        const descP = document.createElement("p");
        descP.className = "usage-desc";
        appendHighlightedText(descP, q.como_usar, state.search);

        usageBox.appendChild(themeDiv);
        usageBox.appendChild(descP);
        card.appendChild(usageBox);
      }

      card.appendChild(createTagsElement(q.tags, true, hiddenBySimulado));
      frag.appendChild(card);
    }

    dom.cardsGrid.appendChild(frag);
  }

  function renderTable(list) {
    dom.tableBody.textContent = "";
    const frag = document.createDocumentFragment();

    const headerCells = dom.quotesTable.querySelectorAll("thead th.sortable");
    headerCells.forEach((th) => {
      th.classList.remove("sort-asc", "sort-desc");
      if (state.tableSort.col === th.dataset.sort) {
        th.classList.add(state.tableSort.dir === "asc" ? "sort-asc" : "sort-desc");
      }
    });

    for (const q of list) {
      const tr = document.createElement("tr");
      const hiddenBySimulado = state.simulado && !state.revealedIds.has(q.id);

      const tdId = document.createElement("td");
      const idBadge = document.createElement("span");
      idBadge.className = "id-badge";
      idBadge.textContent = q.id;
      tdId.appendChild(idBadge);
      tr.appendChild(tdId);

      const tdEixo = document.createElement("td");
      const axisBtn = document.createElement("button");
      axisBtn.type = "button";
      axisBtn.className = "axis-pill";
      axisBtn.textContent = q.eixo;
      axisBtn.addEventListener("click", () => {
        state.eixo = state.eixo === q.eixo ? "" : q.eixo;
        applyFilters();
      });
      tdEixo.appendChild(axisBtn);
      tr.appendChild(tdEixo);

      const tdQuote = document.createElement("td");
      tdQuote.className = "table-quote-cell";
      tdQuote.appendChild(document.createTextNode("“"));
      appendHighlightedText(tdQuote, q.citacao, state.search);
      tdQuote.appendChild(document.createTextNode("”"));
      tr.appendChild(tdQuote);

      const tdAuthor = document.createElement("td");
      if (hiddenBySimulado) {
        const note = document.createElement("span");
        note.className = "hidden-cell-note";
        note.textContent = "[Oculto]";
        tdAuthor.appendChild(note);
      } else {
        const authorBtn = document.createElement("button");
        authorBtn.type = "button";
        authorBtn.className = "author-btn";
        appendHighlightedText(authorBtn, q.autor, state.search);
        authorBtn.addEventListener("click", () => {
          state.autor = state.autor === q.autor ? "" : q.autor;
          dom.filterAutor.value = state.autor;
          applyFilters();
        });
        tdAuthor.appendChild(authorBtn);
      }
      tr.appendChild(tdAuthor);

      const tdSource = document.createElement("td");
      if (hiddenBySimulado) {
        const note = document.createElement("span");
        note.className = "hidden-cell-note";
        note.textContent = "[Oculto]";
        tdSource.appendChild(note);
      } else {
        appendHighlightedText(tdSource, formatSourceFull(q) || "—", state.search);
      }
      tr.appendChild(tdSource);

      const tdTheme = document.createElement("td");
      if (hiddenBySimulado) {
        const note = document.createElement("span");
        note.className = "hidden-cell-note";
        note.textContent = "[Oculto]";
        tdTheme.appendChild(note);
      } else {
        appendHighlightedText(tdTheme, q.tema_principal, state.search);
      }
      tr.appendChild(tdTheme);

      const tdUsage = document.createElement("td");
      tdUsage.className = "table-usage-cell";
      if (hiddenBySimulado) {
        const revBtn = document.createElement("button");
        revBtn.type = "button";
        revBtn.className = "btn btn-sm btn-primary";
        revBtn.textContent = "Revelar resposta";
        revBtn.addEventListener("click", () => {
          state.revealedIds.add(q.id);
          renderResults();
        });
        tdUsage.appendChild(revBtn);
      } else {
        appendHighlightedText(tdUsage, q.como_usar, state.search);
      }
      tr.appendChild(tdUsage);

      const tdTags = document.createElement("td");
      tdTags.className = "table-tags-cell";
      tdTags.appendChild(createTagsElement(q.tags, true, hiddenBySimulado));
      tr.appendChild(tdTags);

      const tdVerif = document.createElement("td");
      const vSpan = document.createElement("span");
      const isConfirmed = q.verificacao === "#fonte-confirmada";
      vSpan.className = `verif-badge ${isConfirmed ? "verif-confirmed" : "verif-pending"}`;
      vSpan.textContent = isConfirmed ? "Confirmada" : "Verificar";
      tdVerif.appendChild(vSpan);
      tr.appendChild(tdVerif);

      const tdActions = document.createElement("td");
      const actionsWrap = document.createElement("div");
      actionsWrap.className = "table-actions";

      const isFav = state.favorites.has(q.id);
      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = `btn-fav${isFav ? " is-fav" : ""}`;
      favBtn.textContent = isFav ? "★" : "☆";
      favBtn.setAttribute("aria-label", isFav ? "Remover dos favoritos" : "Favoritar");
      favBtn.addEventListener("click", () => toggleFavorite(q.id));

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-secondary btn-copy";
      copyBtn.textContent = "Copiar";
      copyBtn.addEventListener("click", () => copyToClipboard(formatQuoteForCopy(q), copyBtn));

      actionsWrap.appendChild(favBtn);
      actionsWrap.appendChild(copyBtn);
      tdActions.appendChild(actionsWrap);
      tr.appendChild(tdActions);

      frag.appendChild(tr);
    }

    dom.tableBody.appendChild(frag);
  }

  /* Flashcards Modal */
  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function startFlashcards(customDeck = null) {
    const source = customDeck || state.filteredQuotes;
    if (source.length === 0) {
      showToast("Nenhuma citação selecionada para treinar.");
      return;
    }

    state.flashcards.deck = shuffleArray(source);
    state.flashcards.index = 0;
    state.flashcards.revealed = false;
    state.flashcards.knownIds = new Set();
    state.flashcards.reviewIds = new Set();

    dom.flashcardDeckInfo.textContent = `${state.flashcards.deck.length} carta(s) no baralho atual`;
    dom.fcStage.hidden = false;
    dom.fcSummary.hidden = true;
    dom.flashcardModal.hidden = false;
    renderFlashcard();
  }

  function renderFlashcard() {
    const fc = state.flashcards;
    const total = fc.deck.length;

    dom.fcKnownCount.textContent = String(fc.knownIds.size);
    dom.fcReviewCount.textContent = String(fc.reviewIds.size);

    if (fc.index >= total) {
      dom.fcProgressLabel.textContent = `Concluído (${total} de ${total})`;
      dom.fcProgressBar.style.width = "100%";
      dom.fcStage.hidden = true;
      dom.fcSummary.hidden = false;

      const known = fc.knownIds.size;
      const review = fc.reviewIds.size;
      const pct = total > 0 ? Math.round((known / total) * 100) : 0;
      dom.fcSummaryText.textContent = `Você dominou ${known} de ${total} citações (${pct}%) e marcou ${review} para revisão.`;
      dom.btnFcRetryWrong.hidden = review === 0;
      dom.btnFcRetryWrong.textContent = `Revisar apenas as marcadas (${review})`;
      return;
    }

    const q = fc.deck[fc.index];
    dom.fcStage.hidden = false;
    dom.fcSummary.hidden = true;
    dom.fcProgressLabel.textContent = `Carta ${fc.index + 1} de ${total}`;
    dom.fcProgressBar.style.width = `${Math.round((fc.index / total) * 100)}%`;

    dom.fcId.textContent = q.id;
    dom.fcAxis.textContent = q.eixo;
    dom.fcQuote.textContent = `“${q.citacao}”`;

    dom.fcTags.textContent = "";
    const hintTags = q.tags.filter(
      (t) => !t.startsWith("#autor-") && !t.startsWith("#fonte-") && !t.startsWith("#verificar-") && !t.startsWith("#tema-")
    );
    for (const tag of hintTags) {
      const span = document.createElement("span");
      span.className = `tag-chip ${getTagCategoryClass(tag)}`;
      span.textContent = `${formatTagLabel(tag)} (${tag})`;
      dom.fcTags.appendChild(span);
    }

    dom.fcAuthor.textContent = q.autor;
    dom.fcSource.textContent = formatSourceFull(q) || "Sem fonte específica";
    dom.fcTheme.textContent = q.tema_principal;
    dom.fcHowToUse.textContent = q.como_usar;

    dom.fcAnswer.hidden = !fc.revealed;
    dom.btnFcReveal.hidden = fc.revealed;
    dom.fcEvalButtons.hidden = !fc.revealed;
  }

  function revealFlashcard() {
    state.flashcards.revealed = true;
    renderFlashcard();
  }

  function evaluateFlashcard(known) {
    const fc = state.flashcards;
    if (fc.index >= fc.deck.length) return;
    const q = fc.deck[fc.index];
    if (known) {
      fc.knownIds.add(q.id);
      fc.reviewIds.delete(q.id);
    } else {
      fc.reviewIds.add(q.id);
      fc.knownIds.delete(q.id);
    }
    fc.index += 1;
    fc.revealed = false;
    renderFlashcard();
  }

  /* Export Modal */
  function getExportItems() {
    const scope = dom.exportScope.value;
    let items;
    if (scope === "favorites") {
      items = state.allQuotes.filter((q) => state.favorites.has(q.id));
    } else if (scope === "all") {
      items = state.allQuotes;
    } else {
      items = state.filteredQuotes;
    }
    return items.map(({ _searchBlob, _order, _isDraft, ...clean }) => clean);
  }

  function formatExportContent() {
    const items = getExportItems();
    const format = dom.exportFormat.value || "json";

    if (format === "markdown") {
      const lines = [
        "| ID | Eixo | Citação | Autor | Fonte/Ano | Tags | Tema principal | Como usar na redação | Verificação |",
        "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
      ];
      for (const q of items) {
        const src = formatSourceFull(q) || "-";
        const tags = q.tags.join(" ");
        lines.push(
          `| ${q.id} | ${q.eixo} | “${q.citacao}” | ${q.autor} | ${src} | ${tags} | ${q.tema_principal} | ${q.como_usar} | ${q.verificacao} |`
        );
      }
      return lines.join("\n");
    }

    if (format === "txt") {
      return items
        .map((q) => {
          const src = formatSourceFull(q);
          return `[${q.id} · ${q.eixo}] “${q.citacao}”\nAutor: ${q.autor}${src ? ` — ${src}` : ""}\nTema: ${q.tema_principal}\nComo usar: ${q.como_usar}\nTags: ${q.tags.join(" ")}\n`;
        })
        .join("\n----------------------------------------\n\n");
    }

    return JSON.stringify(items, null, 2);
  }

  function updateExportPreview() {
    dom.exportPreview.value = formatExportContent();
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* New Quote Modal */
  function buildNewQuoteObject() {
    const id = dom.nqId.value.trim().toUpperCase() || "NOV01";
    const eixo = dom.nqEixo.value.trim() || "Educação";
    const citacao = dom.nqCitacao.value.trim().replace(/^[“"]|[”"]$/g, "");
    const autor = dom.nqAutor.value.trim() || "Autor";
    const fonte = dom.nqFonte.value.trim() || "Fonte";
    const ano = dom.nqAno.value.trim();
    const tipo = dom.nqTipo.value;
    const uso = dom.nqUso.value;
    const arg = dom.nqArg.value;
    const tom = dom.nqTom.value;
    const tema_principal = dom.nqTema.value.trim();
    const como_usar = dom.nqComoUsar.value.trim();
    const verificacao = dom.nqVerificacao.value;

    const temaTag = `#tema-${slugify(eixo) || "geral"}`;
    const autorTag = `#autor-${slugify(autor) || "generico"}`;

    return {
      id,
      eixo,
      citacao,
      autor,
      fonte,
      ano,
      tags: [temaTag, tipo, arg, uso, tom, autorTag, verificacao],
      tema_principal,
      como_usar,
      verificacao,
    };
  }

  function updateNewQuotePreview() {
    const obj = buildNewQuoteObject();
    dom.nqJsonPreview.value = JSON.stringify(obj, null, 2);
  }

  function suggestNextIdForEixo(eixo) {
    const norm = normalizeText(eixo.trim());
    const matching = state.allQuotes.filter((q) => normalizeText(q.eixo) === norm);
    if (matching.length === 0) return;
    const samplePrefix = matching[0].id.replace(/\d+$/, "");
    let maxNum = 0;
    for (const q of matching) {
      const m = q.id.match(/(\d+)$/);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    }
    if (samplePrefix) {
      dom.nqId.value = `${samplePrefix}${String(maxNum + 1).padStart(2, "0")}`;
    }
  }

  function renderLocalDraftsInfo() {
    dom.localDraftsInfo.textContent = "";
    const count = state.draftQuotes.length;
    if (count === 0) {
      dom.localDraftsInfo.textContent = "Nenhum rascunho local salvo.";
      return;
    }
    const span = document.createElement("span");
    span.textContent = `${count} rascunho(s) salvo(s) localmente no navegador.`;
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "btn-link";
    clearBtn.textContent = "Limpar rascunhos";
    clearBtn.addEventListener("click", () => {
      state.draftQuotes = [];
      saveDrafts();
      mergeAndIndexQuotes(state.baseQuotes);
      renderLocalDraftsInfo();
      showToast("Rascunhos locais removidos.");
    });
    dom.localDraftsInfo.appendChild(span);
    dom.localDraftsInfo.appendChild(clearBtn);
  }

  /* View & Events */
  function setView(view) {
    state.view = view;
    localStorage.setItem(STORAGE_KEYS.view, view);
    const isCards = view === "cards";
    dom.btnViewCards.classList.toggle("active", isCards);
    dom.btnViewCards.setAttribute("aria-pressed", String(isCards));
    dom.btnViewTable.classList.toggle("active", !isCards);
    dom.btnViewTable.setAttribute("aria-pressed", String(!isCards));
    applyFilters();
  }

  function bindEvents() {
    dom.btnThemeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark", true);
    });

    dom.btnFavoritesFilter.addEventListener("click", () => {
      state.onlyFavorites = !state.onlyFavorites;
      updateFavoritesBadge();
      applyFilters();
    });

    dom.searchInput.addEventListener("input", (e) => {
      state.search = e.target.value;
      dom.btnClearSearch.hidden = state.search.length === 0;
      applyFilters();
    });

    dom.btnClearSearch.addEventListener("click", () => {
      state.search = "";
      dom.searchInput.value = "";
      dom.btnClearSearch.hidden = true;
      dom.searchInput.focus();
      applyFilters();
    });

    dom.btnToggleFilters.addEventListener("click", () => {
      const isHidden = !dom.facetsPanel.hidden;
      dom.facetsPanel.hidden = isHidden;
      dom.btnToggleFilters.setAttribute("aria-expanded", String(!isHidden));
    });

    dom.filterUso.addEventListener("change", (e) => { state.uso = e.target.value; applyFilters(); });
    dom.filterTipo.addEventListener("change", (e) => { state.tipo = e.target.value; applyFilters(); });
    dom.filterArg.addEventListener("change", (e) => { state.arg = e.target.value; applyFilters(); });
    dom.filterTom.addEventListener("change", (e) => { state.tom = e.target.value; applyFilters(); });
    dom.filterAutor.addEventListener("change", (e) => { state.autor = e.target.value; applyFilters(); });
    dom.filterVerificacao.addEventListener("change", (e) => { state.verificacao = e.target.value; applyFilters(); });
    dom.sortOrder.addEventListener("change", (e) => { state.sortOrder = e.target.value; state.tableSort.col = null; applyFilters(); });

    dom.btnClearAllFilters.addEventListener("click", clearAllFilters);
    dom.btnResetFromEmpty.addEventListener("click", clearAllFilters);

    dom.toggleSimulado.addEventListener("change", (e) => {
      state.simulado = e.target.checked;
      dom.simuladoBanner.hidden = !state.simulado;
      if (!state.simulado) state.revealedIds.clear();
      renderResults();
    });

    dom.btnRevealAll.addEventListener("click", () => {
      for (const q of state.filteredQuotes) state.revealedIds.add(q.id);
      renderResults();
    });

    dom.btnHideAll.addEventListener("click", () => {
      state.revealedIds.clear();
      renderResults();
    });

    dom.copyFormat.addEventListener("change", (e) => {
      state.copyFormat = e.target.value;
      localStorage.setItem(STORAGE_KEYS.copyFormat, state.copyFormat);
    });

    dom.btnViewCards.addEventListener("click", () => setView("cards"));
    dom.btnViewTable.addEventListener("click", () => setView("table"));

    dom.quotesTable.querySelectorAll("thead th.sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const col = th.dataset.sort;
        if (state.tableSort.col === col) {
          state.tableSort.dir = state.tableSort.dir === "asc" ? "desc" : "asc";
        } else {
          state.tableSort.col = col;
          state.tableSort.dir = "asc";
        }
        applyFilters();
      });
    });

    /* Flashcards */
    dom.btnStartFlashcards.addEventListener("click", () => startFlashcards());
    dom.btnCloseFlashcards.addEventListener("click", () => { dom.flashcardModal.hidden = true; });
    dom.btnShuffleDeck.addEventListener("click", () => startFlashcards(state.flashcards.deck));
    dom.btnFcReveal.addEventListener("click", revealFlashcard);
    dom.btnFcKnown.addEventListener("click", () => evaluateFlashcard(true));
    dom.btnFcReview.addEventListener("click", () => evaluateFlashcard(false));
    dom.btnFcCopy.addEventListener("click", () => {
      const q = state.flashcards.deck[state.flashcards.index];
      if (q) copyToClipboard(formatQuoteForCopy(q));
    });
    dom.btnFcRestart.addEventListener("click", () => startFlashcards(state.flashcards.deck));
    dom.btnFcRetryWrong.addEventListener("click", () => {
      const reviewDeck = state.flashcards.deck.filter((q) => state.flashcards.reviewIds.has(q.id));
      startFlashcards(reviewDeck);
    });
    dom.btnFcFinish.addEventListener("click", () => { dom.flashcardModal.hidden = true; });

    /* Export Modal */
    dom.btnOpenExportModal.addEventListener("click", () => {
      const favCount = state.allQuotes.filter((q) => state.favorites.has(q.id)).length;
      dom.exportScope.options[0].textContent = `Seleção filtrada atual (${state.filteredQuotes.length})`;
      dom.exportScope.options[1].textContent = `Apenas favoritas (${favCount})`;
      dom.exportScope.options[2].textContent = `Pool completo (${state.allQuotes.length})`;
      updateExportPreview();
      dom.exportModal.hidden = false;
    });
    dom.btnCloseExport.addEventListener("click", () => { dom.exportModal.hidden = true; });
    dom.exportScope.addEventListener("change", updateExportPreview);
    dom.exportFormat.addEventListener("change", updateExportPreview);
    dom.btnCopyExport.addEventListener("click", () => copyToClipboard(dom.exportPreview.value));
    dom.btnDownloadExport.addEventListener("click", () => {
      const fmt = dom.exportFormat.value;
      const ext = fmt === "json" ? "json" : fmt === "markdown" ? "md" : "txt";
      const mime = fmt === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8";
      downloadFile(`citacoes-export.${ext}`, dom.exportPreview.value, mime);
      showToast(`Arquivo citacoes-export.${ext} baixado!`);
    });

    /* New Quote Modal */
    dom.btnOpenNewModal.addEventListener("click", () => {
      renderLocalDraftsInfo();
      updateNewQuotePreview();
      dom.newQuoteModal.hidden = false;
    });
    dom.btnCloseNewQuote.addEventListener("click", () => { dom.newQuoteModal.hidden = true; });
    dom.nqEixo.addEventListener("change", (e) => {
      if (!dom.nqId.value.trim()) suggestNextIdForEixo(e.target.value);
      updateNewQuotePreview();
    });
    dom.newQuoteForm.addEventListener("input", updateNewQuotePreview);
    dom.btnCopyNewJson.addEventListener("click", () => copyToClipboard(dom.nqJsonPreview.value));
    dom.newQuoteForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const obj = buildNewQuoteObject();
      if (state.allQuotes.some((q) => q.id === obj.id)) {
        showToast(`Já existe uma citação com o ID ${obj.id}. Escolha outro ID.`);
        dom.nqId.focus();
        return;
      }
      state.draftQuotes.push({ ...obj, _isDraft: true });
      saveDrafts();
      mergeAndIndexQuotes(state.baseQuotes);
      renderLocalDraftsInfo();
      dom.newQuoteForm.reset();
      updateNewQuotePreview();
      dom.newQuoteModal.hidden = true;
      showToast(`Citação ${obj.id} adicionada como rascunho local!`);
    });

    /* Backdrop close */
    [dom.flashcardModal, dom.exportModal, dom.newQuoteModal].forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) backdrop.hidden = true;
      });
    });

    /* Manual JSON fallback */
    dom.manualJsonInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const list = Array.isArray(parsed) ? parsed : parsed.citacoes;
          if (!Array.isArray(list)) throw new Error("Formato inválido");
          dom.errorBanner.hidden = true;
          mergeAndIndexQuotes(list);
          showToast(`${list.length} citações carregadas!`);
        } catch {
          showToast("Arquivo JSON inválido.");
        }
      };
      reader.readAsText(file);
    });

    /* Keyboard Shortcuts */
    document.addEventListener("keydown", (e) => {
      if (!dom.flashcardModal.hidden) {
        if (e.key === "Escape") {
          dom.flashcardModal.hidden = true;
          return;
        }
        if (dom.fcStage.hidden) return;
        if (e.key === " " || e.key === "Enter") {
          if (!state.flashcards.revealed) {
            e.preventDefault();
            revealFlashcard();
          }
        } else if (state.flashcards.revealed) {
          if (e.key === "1") evaluateFlashcard(false);
          else if (e.key === "2") evaluateFlashcard(true);
          else if (e.key.toLowerCase() === "c") {
            const q = state.flashcards.deck[state.flashcards.index];
            if (q) copyToClipboard(formatQuoteForCopy(q));
          }
        }
        return;
      }

      if (!dom.exportModal.hidden || !dom.newQuoteModal.hidden) {
        if (e.key === "Escape") {
          dom.exportModal.hidden = true;
          dom.newQuoteModal.hidden = true;
        }
        return;
      }

      const tagName = document.activeElement?.tagName;
      const isTyping = tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        dom.searchInput.focus();
      } else if (e.key === "Escape" && document.activeElement === dom.searchInput) {
        state.search = "";
        dom.searchInput.value = "";
        dom.btnClearSearch.hidden = true;
        dom.searchInput.blur();
        applyFilters();
      }
    });
  }

  async function init() {
    cacheDom();
    loadPreferences();
    bindEvents();
    setView(state.view);

    try {
      const response = await fetch("./citacoes.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const list = Array.isArray(json) ? json : json.citacoes;
      if (!Array.isArray(list)) throw new Error("JSON sem lista de citações");
      mergeAndIndexQuotes(list);
    } catch (err) {
      console.error("Erro ao carregar citacoes.json:", err);
      dom.errorBanner.hidden = false;
      dom.poolBadge.textContent = "Erro ao carregar";
      dom.resultsCounter.textContent = "Aguardando arquivo citacoes.json…";
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
