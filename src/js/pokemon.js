(() => {
  "use strict";

  /* ---------- Tema claro / escuro (símbolo do topo) ---------- */

  const root = document.documentElement;
  const themeBtn = document.getElementById("theme-toggle");

  function setTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === "dark";
    themeBtn.setAttribute("aria-pressed", dark);
    themeBtn.title = dark ? "Tema escuro — clique para o tema claro" : "Tema claro — clique para o tema escuro";
    try { localStorage.setItem("pokedex-theme", theme); } catch (_) { /* sem storage: só não lembra */ }
  }
  function toggleTheme() { setTheme(root.dataset.theme === "dark" ? "light" : "dark"); }

  themeBtn.addEventListener("click", toggleTheme);
  setTheme(root.dataset.theme === "dark" ? "dark" : "light");

  const dataEl = document.getElementById("pokedex-data");
  if (!dataEl) return;

  const { pokemon: ALL, selected, detail } = JSON.parse(dataEl.textContent);
  if (!ALL.length) return;

  const TYPE_PT = {
    Bug: "Inseto", Dark: "Sombrio", Dragon: "Dragão", Electric: "Elétrico", Fairy: "Fada",
    Fighting: "Lutador", Fire: "Fogo", Flying: "Voador", Ghost: "Fantasma", Grass: "Planta",
    Ground: "Terra", Ice: "Gelo", Normal: "Normal", Poison: "Venenoso", Psychic: "Psíquico",
    Rock: "Pedra", Steel: "Aço", Water: "Água",
  };

  const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
  const artUrl = (id, shiny = false) => `${SPRITES}/other/home/${shiny ? "shiny/" : ""}${id}.png`;
  const artFallbackUrl = (id, shiny = false) => `${SPRITES}/other/official-artwork/${shiny ? "shiny/" : ""}${id}.png`;
  const iconUrl = (id) => `${SPRITES}/versions/generation-vii/icons/${id}.png`;
  const cryUrl = (id) => `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

  // Nomes oficiais em português (fallback: nome em inglês formatado)
  const ITEM_PT = {
    "fire-stone": "Pedra de Fogo", "water-stone": "Pedra d'Água", "thunder-stone": "Pedra do Trovão",
    "leaf-stone": "Pedra Folha", "moon-stone": "Pedra da Lua", "sun-stone": "Pedra do Sol",
    "shiny-stone": "Pedra Brilhante", "dusk-stone": "Pedra Noturna", "dawn-stone": "Pedra do Despertar",
    "ice-stone": "Pedra de Gelo", "kings-rock": "Pedra do Rei", "metal-coat": "Revestimento Metálico",
    "dragon-scale": "Escama de Dragão", "upgrade": "Melhoria", "dubious-disc": "Disco Duvidoso",
    "protector": "Protetor", "electirizer": "Eletrizador", "magmarizer": "Magmatizador",
    "razor-claw": "Garra Afiada", "razor-fang": "Presa Afiada", "oval-stone": "Pedra Oval",
    "black-augurite": "Augurita Negra", "reaper-cloth": "Tecido Ceifador", "prism-scale": "Escama Prismática",
  };
  const EGG_PT = {
    monster: "Monstro", water1: "Água 1", water2: "Água 2", water3: "Água 3", bug: "Inseto",
    flying: "Voador", ground: "Campo", fairy: "Fada", plant: "Planta", humanshape: "Humanoide",
    mineral: "Mineral", indeterminate: "Amorfo", ditto: "Ditto", dragon: "Dragão", "no-eggs": "Desconhecido",
  };
  const pretty = (slug = "") => slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const itemName = (slug) => ITEM_PT[slug] || pretty(slug);
  const idFromUrl = (url) => Number(url.split("/").filter(Boolean).pop());
  const byId = new Map(ALL.map((p) => [p.id, p]));

  const $ = (id) => document.getElementById(id);
  const el = {
    body: document.body,
    shelf: $("shelf"),
    shelfEmpty: $("shelf-empty"),
    shelfMsg: $("shelf-msg"),
    search: $("search"),
    typeFilter: $("type-filter"),
    pImg: $("preview-img"),
    pNum: $("preview-num"),
    pName: $("preview-name"),
    pTypes: $("preview-types"),
    dImg: $("detail-img"),
    dNum: $("detail-num"),
    dName: $("detail-name"),
    dGenus: $("detail-genus"),
    dFlavor: $("detail-flavor"),
    dTypes: $("detail-types"),
    dHeight: $("detail-height"),
    dWeight: $("detail-weight"),
    dWeak: $("detail-weak"),
    dGender: $("detail-gender"),
    dEggGroups: $("detail-egg-groups"),
    dCapture: $("detail-capture"),
    dGoEgg: $("detail-go-egg"),
    dGoCandy: $("detail-go-candy"),
    dEvo: $("detail-evo"),
    art: $("entry-art"),
    btnCry: $("btn-cry"),
    btnShiny: $("btn-shiny"),
    shinyLabel: $("shiny-label"),
    dPrev: $("detail-prev"),
    dNext: $("detail-next"),
  };

  const state = {
    filtered: ALL,
    currentId: byId.has(selected) ? selected : ALL[0].id,
    view: detail ? "detail" : "list",
    shiny: false,
  };

  /* ---------- Helpers ---------- */

  const fmtNum = (num) => `Nº ${num}`;

  function make(tag, props = {}, children = []) {
    const node = Object.assign(document.createElement(tag), props);
    for (const c of [].concat(children)) node.append(c);
    return node;
  }

  function typeBadge(type) {
    const badge = make("span", { className: `type t-${type}` }, [
      make("img", { src: `src/icons/${type}.svg`, alt: "" }),
      TYPE_PT[type] || type,
    ]);
    badge.style.setProperty("--tc", `var(--t-${type})`);
    return badge;
  }

  function setArt(img, p, shiny = false) {
    img.classList.remove("swap");
    let tries = 0;
    img.onerror = () => {
      tries += 1;
      if (tries === 1) img.src = artFallbackUrl(p.id, shiny);
      else if (tries === 2 && !shiny && p.fallback) img.src = p.fallback;
      else img.onerror = null;
    };
    img.src = artUrl(p.id, shiny);
    img.alt = p.name;
    void img.offsetWidth; // reinicia a animação
    img.classList.add("swap");
  }

  function preload(ids) {
    for (const id of ids) if (id) new Image().src = artUrl(id);
  }

  /* ---------- Dados dos jogos principais via PokeAPI ---------- */

  const speciesCache = new Map();
  const chainCache = new Map();

  function getJson(url) {
    return fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  }

  function loadChain(url) {
    if (!chainCache.has(url)) {
      chainCache.set(url, getJson(url).then((d) => d.chain).catch(() => { chainCache.delete(url); return null; }));
    }
    return chainCache.get(url);
  }

  // Texto do método de evolução (usa o método padrão dos jogos atuais)
  function evoMethod(details) {
    const d = details.find((x) => x.is_default) || details.at(-1);
    if (!d) return "Condição especial";

    const TRIGGERS = {
      "three-critical-hits": "3 acertos críticos em uma batalha",
      "take-damage": "Receber dano e passar por um local especial",
      spin: "Girar segurando um doce",
      shed: "Nível 20 com espaço livre na equipe",
      "tower-of-darkness": "Completar a Torre da Escuridão",
      "tower-of-waters": "Completar a Torre das Águas",
    };

    let main;
    switch (d.trigger.name) {
      case "level-up": main = d.min_level ? `Nível ${d.min_level}` : "Subir de nível"; break;
      case "use-item": main = itemName(d.item?.name); break;
      case "trade": main = "Troca"; break;
      default: main = TRIGGERS[d.trigger.name] || "Condição especial";
    }

    const extra = [];
    if (d.held_item) extra.push(`segurando ${itemName(d.held_item.name)}`);
    if (d.trade_species) extra.push(`por ${pretty(d.trade_species.name)}`);
    if (d.min_happiness || d.min_affection) extra.push("com amizade alta");
    if (d.min_beauty) extra.push("com beleza alta");
    if (d.known_move) extra.push(`conhecendo ${pretty(d.known_move.name)}`);
    if (d.known_move_type) extra.push(`com golpe do tipo ${TYPE_PT[pretty(d.known_move_type.name)] || pretty(d.known_move_type.name)}`);
    if (d.time_of_day === "day") extra.push("de dia");
    if (d.time_of_day === "night") extra.push("à noite");
    if (d.gender === 1) extra.push("(só fêmeas)");
    if (d.gender === 2) extra.push("(só machos)");
    if (d.party_species) extra.push(`com ${pretty(d.party_species.name)} na equipe`);
    if (d.needs_overworld_rain) extra.push("com chuva");
    if (d.turn_upside_down) extra.push("com o console de cabeça para baixo");
    if (d.relative_physical_stats === 1) extra.push("(Ataque > Defesa)");
    if (d.relative_physical_stats === -1) extra.push("(Ataque < Defesa)");
    if (d.relative_physical_stats === 0) extra.push("(Ataque = Defesa)");
    if (d.location && !extra.length && main === "Subir de nível") extra.push("em um local especial");

    return [main, ...extra].join(" ");
  }

  function loadSpecies(id) {
    if (!speciesCache.has(id)) {
      const req = getJson(`https://pokeapi.co/api/v2/pokemon-species/${id}/`)
        .then((d) => {
          const langs = ["pt-br", "pt", "en"];
          const genus = langs.map((l) => d.genera.find((g) => g.language.name === l)).find(Boolean);
          let flavor = null;
          for (const l of langs) {
            const entries = d.flavor_text_entries.filter((f) => f.language.name === l);
            if (entries.length) { flavor = entries.at(-1); break; }
          }
          return {
            genus: genus ? genus.genus : "",
            flavor: flavor ? flavor.flavor_text.replace(/[\f\n\r­]+/g, " ").replace(/\s+/g, " ") : "",
            genderRate: d.gender_rate,
            captureRate: d.capture_rate,
            eggGroups: d.egg_groups.map((g) => EGG_PT[g.name] || pretty(g.name)),
            chainUrl: d.evolution_chain?.url || null,
          };
        })
        .catch(() => { speciesCache.delete(id); return null; });
      speciesCache.set(id, req);
    }
    return speciesCache.get(id);
  }

  /* ---------- Estante ---------- */

  function buildTypeFilter() {
    const types = [...new Set(ALL.flatMap((p) => p.types))]
      .sort((a, b) => (TYPE_PT[a] || a).localeCompare(TYPE_PT[b] || b, "pt-BR"));
    for (const t of types) el.typeFilter.append(make("option", { value: t, textContent: TYPE_PT[t] || t }));
  }

  function bookFor(p) {
    const book = make("button", { className: "book", id: `book-${p.id}`, type: "button" }, [
      make("img", { className: "icon", src: iconUrl(p.id), alt: "", loading: "lazy" }),
      make("span", { className: "title", textContent: p.name }),
      make("span", { className: "no", textContent: p.num }),
    ]);
    book.dataset.id = p.id;
    book.tabIndex = -1;
    book.setAttribute("role", "option");
    book.setAttribute("aria-label", `${fmtNum(p.num)} ${p.name}`);
    book.style.setProperty("--c", `var(--t-${p.types[0]})`);
    return book;
  }

  function renderShelf() {
    const frag = document.createDocumentFragment();
    for (const p of state.filtered) frag.append(bookFor(p));
    el.shelf.replaceChildren(frag);
    el.shelfEmpty.hidden = state.filtered.length > 0;
    el.shelfMsg.textContent = state.filtered.length === ALL.length
      ? `${ALL.length} Pokémon registrados na estante`
      : `${state.filtered.length} de ${ALL.length} Pokémon encontrados`;
    markActive("instant");
  }

  function applyFilters() {
    const q = el.search.value.trim().toLowerCase().replace(/^n[º°o]?\.?\s*/, "");
    const type = el.typeFilter.value;
    state.filtered = ALL.filter((p) => {
      if (type && !p.types.includes(type)) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.num.includes(q) || String(p.id) === q;
    });
    renderShelf();
    if (state.filtered.length && !state.filtered.some((p) => p.id === state.currentId)) {
      select(state.filtered[0].id, "instant");
    }
    $("preview").style.visibility = state.filtered.length ? "" : "hidden";
  }

  // Centraliza o livro selecionado na estante
  function centerBook(book, behavior = "smooth") {
    const left = book.offsetLeft - (el.shelf.clientWidth - book.offsetWidth) / 2;
    // Marca rolagem automática para não confundir com rolagem do usuário (arrasto/toque)
    if (behavior === "smooth" && Math.abs(left - el.shelf.scrollLeft) > 1) state.autoScroll = true;
    el.shelf.scrollTo({ left, behavior });
  }

  // Livro mais próximo do centro da estante
  function nearestBookId() {
    const books = el.shelf.children;
    if (!books.length) return null;
    const first = books[0];
    const step = books.length > 1 ? books[1].offsetLeft - first.offsetLeft : first.offsetWidth;
    const center = el.shelf.scrollLeft + el.shelf.clientWidth / 2;
    const i = Math.round((center - first.offsetLeft - first.offsetWidth / 2) / step);
    const book = books[Math.max(0, Math.min(books.length - 1, i))];
    return Number(book.dataset.id);
  }

  function markActive(behavior = "smooth") {
    const prev = el.shelf.querySelector(".book.active");
    if (prev) { prev.classList.remove("active"); prev.removeAttribute("aria-selected"); }
    const book = $(`book-${state.currentId}`);
    if (!book) return;
    book.classList.add("active");
    book.setAttribute("aria-selected", "true");
    el.shelf.setAttribute("aria-activedescendant", book.id);
    if (state.view === "list" && behavior) centerBook(book, behavior); // behavior=false: não rola
  }

  /* ---------- Seleção ---------- */

  function indexInFiltered() {
    return state.filtered.findIndex((p) => p.id === state.currentId);
  }

  function select(id, behavior = "smooth") {
    const p = byId.get(id);
    if (!p) return;
    state.currentId = id;
    markActive(behavior);

    setArt(el.pImg, p);
    el.pNum.textContent = fmtNum(p.num);
    el.pName.textContent = p.name;
    el.pTypes.replaceChildren(...p.types.map(typeBadge));

    const i = indexInFiltered();
    preload([state.filtered[i - 1]?.id, state.filtered[i + 1]?.id]);

    if (state.view === "detail") renderDetail(p);
  }

  function move(delta) {
    if (!state.filtered.length) return;
    const i = indexInFiltered();
    const next = Math.min(state.filtered.length - 1, Math.max(0, (i < 0 ? 0 : i) + delta));
    if (state.filtered[next].id !== state.currentId) {
      select(state.filtered[next].id);
      if (state.view === "detail") { updateUrl(true); playCry(); }
    }
  }

  /* ---------- Grito e shiny ---------- */

  const cry = new Audio();
  cry.preload = "none";
  cry.volume = 0.5;
  cry.addEventListener("playing", () => el.btnCry.classList.add("playing"));
  for (const ev of ["ended", "pause", "error"]) cry.addEventListener(ev, () => el.btnCry.classList.remove("playing"));

  function playCry(id = state.currentId) {
    const src = cryUrl(id);
    if (cry.src !== src) cry.src = src;
    cry.currentTime = 0;
    // O navegador pode bloquear som sem interação (ex.: abrir por link): o botão continua disponível
    cry.play().catch(() => {});
  }

  function setShiny(on) {
    state.shiny = on;
    el.btnShiny.setAttribute("aria-pressed", on);
    el.shinyLabel.textContent = on ? "Ver normal" : "Ver shiny";
    el.art.classList.toggle("is-shiny", on);
    const p = byId.get(state.currentId);
    if (p) setArt(el.dImg, p, on);
  }

  /* ---------- Registro detalhado ---------- */

  // Chip de um Pokémon na evolução (clicável se estiver na Pokédex de Kanto)
  function evoChip(id, name, currentId) {
    const inDex = byId.has(id);
    const isCurrent = id === currentId;
    const chip = make(inDex && !isCurrent ? "button" : "span", {
      className: "evo" + (isCurrent ? " current" : "") + (inDex ? "" : " outside"),
    }, [make("img", { src: iconUrl(id), alt: "", loading: "lazy" }), inDex ? byId.get(id).name : name]);
    if (inDex && !isCurrent) {
      chip.type = "button";
      chip.title = fmtNum(byId.get(id).num);
      chip.addEventListener("click", () => openDetail(id));
    } else if (!inDex) {
      chip.title = "Fora da Pokédex de Kanto (Nº 001–151)";
    }
    return chip;
  }

  const evoArrow = (method) => make("span", { className: "evo-step" }, [
    make("span", { className: "evo-method", textContent: method }),
    make("span", { className: "evo-arrow", textContent: "→" }),
  ]);

  // Monta a evolução a partir da cadeia da PokeAPI (com nível/método)
  function renderChain(chain, currentId) {
    const edges = [];
    const walk = (node) => node.evolves_to.forEach((child) => {
      edges.push({ from: node.species, to: child.species, method: evoMethod(child.evolution_details) });
      walk(child);
    });
    walk(chain);

    if (!edges.length) {
      el.dEvo.replaceChildren(make("p", { className: "evo-none", textContent: "Este Pokémon não evolui." }));
      return;
    }

    const node = (s) => evoChip(idFromUrl(s.url), pretty(s.name), currentId);
    const linear = edges.every((e, i) => i === 0 || e.from.name === edges[i - 1].to.name);

    if (linear) {
      // Ex.: Bulbasaur → (Nível 16) → Ivysaur → (Nível 32) → Venusaur
      const row = make("div", { className: "evo-row" }, [node(edges[0].from)]);
      for (const e of edges) row.append(evoArrow(e.method), node(e.to));
      el.dEvo.replaceChildren(row);
    } else {
      // Ramificada (ex.: Eevee): o Pokémon de origem aparece uma vez, com as evoluções ao lado
      const groups = new Map();
      for (const e of edges) {
        if (!groups.has(e.from.name)) groups.set(e.from.name, { from: e.from, list: [] });
        groups.get(e.from.name).list.push(e);
      }
      el.dEvo.replaceChildren(...[...groups.values()].map((g) =>
        make("div", { className: "evo-branch" }, [
          node(g.from),
          make("div", { className: "evo-targets" },
            g.list.map((e) => make("div", { className: "evo-row" }, [evoArrow(e.method), node(e.to)]))),
        ])));
    }
  }

  // Sem PokeAPI: usa a cadeia da API local (sem métodos)
  function renderLocalChain(p) {
    const chain = [...p.prev, { id: p.id, name: p.name }, ...p.next];
    if (chain.length === 1) {
      el.dEvo.replaceChildren(make("p", { className: "evo-none", textContent: "Este Pokémon não evolui." }));
      return;
    }
    const row = make("div", { className: "evo-row" });
    chain.forEach((e, i) => {
      if (i) row.append(make("span", { className: "evo-arrow", textContent: "→" }));
      row.append(evoChip(e.id, e.name, p.id));
    });
    el.dEvo.replaceChildren(row);
  }

  function genderNode(rate) {
    if (rate === -1) return document.createTextNode("Sem gênero");
    const female = (rate / 8) * 100;
    const fmt = (n) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
    return make("span", { className: "gender" }, [
      make("span", { className: "male", textContent: `♂ ${fmt(100 - female)}` }),
      make("span", { className: "female", textContent: `♀ ${fmt(female)}` }),
    ]);
  }

  function renderDetail(p) {
    setArt(el.dImg, p, state.shiny);
    el.dNum.textContent = fmtNum(p.num);
    el.dName.textContent = p.name;
    el.dTypes.replaceChildren(...p.types.map(typeBadge));
    el.dHeight.textContent = p.height.replace(".", ",");
    el.dWeight.textContent = p.weight.replace(".", ",");
    el.dWeak.replaceChildren(...p.weaknesses.map(typeBadge));

    // Pokémon GO (dados da API local)
    el.dGoEgg.textContent = p.egg && p.egg !== "Not in Eggs" ? p.egg : "Não sai de ovos";
    el.dGoCandy.textContent = p.candyCount
      ? `${p.candyCount} doces de ${p.candy.replace(/ Candy$/, "")}`
      : p.next.length ? "Evolução especial" : "Não evolui";

    // Jogos principais (PokeAPI, carregado sob demanda)
    const loading = "Carregando…";
    el.dGenus.textContent = loading;
    el.dGenus.classList.add("loading");
    el.dFlavor.textContent = "";
    el.dGender.textContent = loading;
    el.dEggGroups.textContent = loading;
    el.dCapture.textContent = loading;
    el.dEvo.replaceChildren(make("p", { className: "evo-none", textContent: loading }));

    loadSpecies(p.id).then((info) => {
      if (state.currentId !== p.id) return;
      el.dGenus.classList.remove("loading");
      if (!info) {
        el.dGenus.textContent = "";
        el.dFlavor.textContent = "Não foi possível carregar os dados dos jogos principais (PokeAPI).";
        el.dGender.textContent = el.dEggGroups.textContent = el.dCapture.textContent = "—";
        renderLocalChain(p);
        return;
      }
      el.dGenus.textContent = info.genus;
      el.dFlavor.textContent = info.flavor;
      el.dGender.replaceChildren(genderNode(info.genderRate));
      el.dEggGroups.textContent = info.eggGroups.join(", ") || "—";
      el.dCapture.textContent = `${info.captureRate} / 255`;
      if (!info.chainUrl) { renderLocalChain(p); return; }
      loadChain(info.chainUrl).then((chain) => {
        if (state.currentId !== p.id) return;
        chain ? renderChain(chain, p.id) : renderLocalChain(p);
      });
    });

    const i = indexInFiltered();
    el.dPrev.disabled = i <= 0;
    el.dNext.disabled = i < 0 || i >= state.filtered.length - 1;
    document.title = `${p.name} · Pokédex`;
  }

  function setView(view) {
    state.view = view;
    el.body.dataset.view = view;
    $("list-view").setAttribute("aria-hidden", view !== "list");
    $("detail-view").setAttribute("aria-hidden", view !== "detail");
    if (view === "list") {
      document.title = "Pokédex";
      requestAnimationFrame(() => markActive("instant"));
      el.shelf.focus({ preventScroll: true });
    } else {
      $("detail-view").scrollTop = 0;
    }
  }

  function openDetail(id = state.currentId, push = true) {
    // Pokémon fora do filtro atual (ex.: clicado nas evoluções): limpa os filtros
    if (!state.filtered.some((p) => p.id === id)) {
      el.search.value = "";
      el.typeFilter.value = "";
      state.filtered = ALL;
      renderShelf();
      $("preview").style.visibility = "";
    }
    const wasDetail = state.view === "detail";
    setView("detail");
    select(id, "instant");
    updateUrl(wasDetail, push);
    playCry(id);
  }

  function closeDetail() {
    if (history.state?.pokedex === "detail") {
      history.back();
    } else {
      setView("list");
      history.replaceState({ pokedex: "list" }, "", location.pathname);
    }
  }

  function updateUrl(replace, push = true) {
    if (!push) return;
    const url = `${location.pathname}?pokemon=${state.currentId}`;
    const st = { pokedex: "detail", id: state.currentId };
    replace ? history.replaceState(st, "", url) : history.pushState(st, "", url);
  }

  window.addEventListener("popstate", (e) => {
    const st = e.state;
    if (st?.pokedex === "detail" && byId.has(st.id)) openDetail(st.id, false);
    else setView("list");
  });

  /* ---------- Eventos ---------- */

  // Clique: seleciona o livro; clique no livro já selecionado abre o registro
  el.shelf.addEventListener("click", (e) => {
    if (drag.justDragged) return; // terminou um arrasto: não conta como clique
    const book = e.target.closest(".book");
    if (!book) return;
    const id = Number(book.dataset.id);
    if (id === state.currentId) openDetail(id);
    else select(id);
  });

  /* ---------- Arrastar a estante (mouse) + rolagem por toque ---------- */

  const drag = { active: false, moved: false, justDragged: false, inertia: false,
                 startX: 0, startLeft: 0, lastX: 0, lastT: 0, v: 0, raf: 0 };
  let liveRaf = 0;
  let scrollTimer = 0;

  // Atualiza a prévia conforme o livro que passa pelo centro (sem mexer na rolagem)
  function liveSelect() {
    if (liveRaf) return;
    liveRaf = requestAnimationFrame(() => {
      liveRaf = 0;
      const id = nearestBookId();
      if (id && id !== state.currentId) select(id, false);
    });
  }

  // Encaixa o livro mais próximo no centro
  function snapToNearest() {
    const id = nearestBookId();
    if (!id) return;
    if (id !== state.currentId) select(id);
    else centerBook($(`book-${id}`));
  }

  el.shelf.addEventListener("dragstart", (e) => e.preventDefault()); // impede arrastar as imagens

  el.shelf.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    cancelAnimationFrame(drag.raf);
    drag.inertia = false;
    Object.assign(drag, {
      active: true, moved: false, startX: e.clientX, startLeft: el.shelf.scrollLeft,
      lastX: e.clientX, lastT: performance.now(), v: 0,
    });
  });

  window.addEventListener("pointermove", (e) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < 6) return; // tolerância: abaixo disso ainda é clique
      drag.moved = true;
      state.autoScroll = false;
      el.shelf.classList.add("dragging");
    }
    el.shelf.scrollLeft = drag.startLeft - dx;
    const now = performance.now();
    const dt = now - drag.lastT;
    if (dt > 0) drag.v = 0.8 * ((drag.lastX - e.clientX) / dt) + 0.2 * drag.v; // px/ms
    drag.lastX = e.clientX;
    drag.lastT = now;
    liveSelect();
  });

  window.addEventListener("pointerup", () => {
    if (!drag.active) return;
    drag.active = false;
    if (!drag.moved) return;
    el.shelf.classList.remove("dragging");
    drag.justDragged = true;
    setTimeout(() => { drag.justDragged = false; }, 0);

    // Se soltou parado há um tempo, sem inércia
    let v = performance.now() - drag.lastT > 80 ? 0 : drag.v;
    let last = performance.now();
    drag.inertia = true;
    const step = (t) => {
      const dt = Math.min(t - last, 40);
      last = t;
      el.shelf.scrollLeft += v * dt;
      v *= Math.pow(0.94, dt / 16);
      liveSelect();
      if (Math.abs(v) > 0.04) drag.raf = requestAnimationFrame(step);
      else { drag.inertia = false; snapToNearest(); }
    };
    drag.raf = requestAnimationFrame(step);
  });

  // Toque (celular) ou barra de rolagem: prévia ao vivo e encaixe ao parar
  el.shelf.addEventListener("scroll", () => {
    if (drag.active || drag.inertia) return;
    if (!state.autoScroll) liveSelect();
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (drag.active || drag.inertia) return;
      if (state.autoScroll) { state.autoScroll = false; return; }
      snapToNearest();
    }, 140);
  }, { passive: true });

  // Roda do mouse passa os livros um a um
  let wheelAcc = 0;
  let wheelLock = 0;
  $("list-view").addEventListener("wheel", (e) => {
    e.preventDefault();
    wheelAcc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const now = performance.now();
    if (Math.abs(wheelAcc) >= 40 && now - wheelLock > 70) {
      move(Math.sign(wheelAcc));
      wheelAcc = 0;
      wheelLock = now;
    }
  }, { passive: false });

  $("shelf-prev").addEventListener("click", () => move(-1));
  $("shelf-next").addEventListener("click", () => move(1));
  $("preview-open").addEventListener("click", () => openDetail());
  $("preview-img").addEventListener("click", () => openDetail());
  el.btnCry.addEventListener("click", () => playCry());
  el.btnShiny.addEventListener("click", () => setShiny(!state.shiny));
  el.dPrev.addEventListener("click", () => move(-1));
  el.dNext.addEventListener("click", () => move(1));
  $("btn-back").addEventListener("click", closeDetail);
  el.search.addEventListener("input", applyFilters);
  el.typeFilter.addEventListener("change", applyFilters);

  el.search.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && state.filtered.length) { e.preventDefault(); openDetail(); }
    if (e.key === "Escape") { el.search.value = ""; applyFilters(); el.shelf.focus(); }
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select, textarea") || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === "t" || k === "T") { toggleTheme(); return; }
    if (k === "/") {
      e.preventDefault();
      if (state.view === "detail") closeDetail();
      el.search.focus();
      el.search.select();
      return;
    }

    const actions = state.view === "list"
      ? {
          ArrowRight: () => move(1), ArrowLeft: () => move(-1),
          PageDown: () => move(10), PageUp: () => move(-10),
          Home: () => move(-Infinity), End: () => move(Infinity),
          Enter: () => openDetail(), ArrowUp: () => openDetail(), " ": () => openDetail(),
        }
      : {
          ArrowRight: () => move(1), ArrowLeft: () => move(-1),
          Escape: closeDetail, Backspace: closeDetail, ArrowDown: closeDetail,
          s: () => setShiny(!state.shiny), S: () => setShiny(!state.shiny),
          g: () => playCry(), G: () => playCry(),
        };
    if (actions[k]) { e.preventDefault(); actions[k](); }
  });

  window.addEventListener("resize", () => {
    const book = $(`book-${state.currentId}`);
    if (book && state.view === "list") centerBook(book, "instant");
  });


  /* ---------- Início ---------- */

  buildTypeFilter();
  renderShelf();
  if (state.view === "detail") {
    history.replaceState({ pokedex: "list" }, "", location.pathname);
    history.pushState({ pokedex: "detail", id: state.currentId }, "", `${location.pathname}?pokemon=${state.currentId}`);
    setView("detail");
    select(state.currentId, "instant");
    playCry(); // pode ser bloqueado pelo navegador ao abrir direto por link
  } else {
    setView("list");
    select(state.currentId, "instant");
  }
})();
