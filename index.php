<?php
require_once __DIR__ . '/src/config/api.php';

$pokemons = pokedex_load();

$ids = array_column($pokemons, 'id');
$selectedId = filter_input(INPUT_GET, 'pokemon', FILTER_VALIDATE_INT);
$openDetail = $selectedId !== null && $selectedId !== false && in_array($selectedId, $ids, true);
if (!$openDetail) {
    $selectedId = $ids[0] ?? 1;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- A página define as próprias cores: impede o "modo escuro forçado" do navegador e do Dark Reader -->
    <meta name="color-scheme" content="light dark">
    <meta name="darkreader-lock">
    <title>Pokédex</title>
    <link rel="icon" href="src/img/pokedex.ico" type="image/x-icon">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://raw.githubusercontent.com">
    <link rel="preconnect" href="https://pokeapi.co">
    <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="src/css/pokemon.css">
    <script>
        // Aplica o tema antes de desenhar a página (evita "piscar" a cor errada)
        (function () {
            var t = null;
            try { t = localStorage.getItem('pokedex-theme'); } catch (e) {}
            if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            document.documentElement.dataset.theme = t;
        })();
    </script>
</head>
<body data-view="<?= $openDetail ? 'detail' : 'list' ?>">

<header class="topbar">
    <a class="brand" href="index.php" aria-label="Pokédex - início">
        <span class="brand-icon" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="brand-title">Pokédex</span>
    </a>

    <button class="emblem" id="theme-toggle" type="button" aria-label="Alternar tema claro / escuro">
        <span class="emblem-stars"></span>
        <span class="emblem-orb"></span>
    </button>

    <div class="filters">
        <label class="search">
            <span class="visually-hidden">Buscar Pokémon</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/></svg>
            <input id="search" type="search" placeholder="Nome ou número" autocomplete="off">
        </label>
        <label class="type-filter">
            <span class="visually-hidden">Filtrar por tipo</span>
            <select id="type-filter">
                <option value="">Todos os tipos</option>
            </select>
        </label>
    </div>
</header>

<?php if (!$pokemons): ?>
    <main class="empty-state">
        <h1>Não foi possível carregar a Pokédex</h1>
        <p>A API não respondeu e ainda não existe cache local. Verifique sua conexão e recarregue a página.</p>
    </main>
<?php else: ?>

<!-- Estante: cada livro é um Pokémon -->
<main class="library" id="list-view">
    <p class="shelf-msg" id="shelf-msg" aria-live="polite"></p>

    <section class="preview" id="preview" aria-live="polite">
        <img class="preview-img" id="preview-img" alt="">
        <div class="preview-plate">
            <span class="preview-num" id="preview-num"></span>
            <strong class="preview-name" id="preview-name"></strong>
            <span class="types" id="preview-types"></span>
            <button class="btn-open" id="preview-open" type="button">Abrir registro</button>
        </div>
    </section>

    <div class="shelf-area">
        <button class="shelf-nav prev" id="shelf-prev" type="button" aria-label="Livro anterior">‹</button>
        <div class="shelf" id="shelf" role="listbox" aria-label="Estante de Pokémon" aria-orientation="horizontal" tabindex="0"></div>
        <button class="shelf-nav next" id="shelf-next" type="button" aria-label="Próximo livro">›</button>
        <p class="shelf-empty" id="shelf-empty" hidden>Nenhum Pokémon encontrado nesta estante.</p>
    </div>
    <div class="ledge" aria-hidden="true"></div>
</main>

<!-- Registro detalhado -->
<main class="entry" id="detail-view" aria-hidden="true">
    <section class="entry-hero">
        <button class="entry-nav prev" id="detail-prev" type="button" aria-label="Pokémon anterior">‹</button>

        <div class="entry-text">
            <span class="entry-num" id="detail-num"></span>
            <h1 class="entry-name" id="detail-name"></h1>
            <p class="entry-genus" id="detail-genus"></p>
            <div class="types" id="detail-types"></div>
            <div class="entry-actions">
                <button class="pill-btn" id="btn-cry" type="button" title="Ouvir o grito do Pokémon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.47 4.47 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg>
                    Ouvir grito
                </button>
                <button class="pill-btn" id="btn-shiny" type="button" aria-pressed="false" title="Alternar versão shiny">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7L12 2zm7 12l1 2.6 2.5.9-2.5 1-1 2.5-1-2.5-2.5-1 2.5-.9 1-2.6z"/></svg>
                    <span id="shiny-label">Ver shiny</span>
                </button>
            </div>
            <p class="entry-flavor" id="detail-flavor"></p>
        </div>

        <div class="entry-art" id="entry-art">
            <img class="entry-img" id="detail-img" alt="">
            <span class="shiny-tag">✦ Shiny</span>
        </div>

        <dl class="entry-measures">
            <div><dt>Altura</dt><dd id="detail-height"></dd></div>
            <div><dt>Peso</dt><dd id="detail-weight"></dd></div>
        </dl>

        <button class="entry-nav next" id="detail-next" type="button" aria-label="Próximo Pokémon">›</button>
    </section>

    <section class="entry-extra">
        <div class="extra-block">
            <h2>Fraquezas</h2>
            <div class="types small" id="detail-weak"></div>
        </div>
        <div class="extra-block">
            <h2>Gênero</h2>
            <p id="detail-gender"></p>
        </div>
        <div class="extra-block">
            <h2>Grupos de ovo</h2>
            <p id="detail-egg-groups"></p>
        </div>
        <div class="extra-block">
            <h2>Taxa de captura</h2>
            <p id="detail-capture"></p>
        </div>
        <div class="extra-block evo-block">
            <h2>Evolução <span class="tag">jogos principais</span></h2>
            <div class="evo-list" id="detail-evo"></div>
        </div>
        <div class="extra-block go-block">
            <h2>Pokémon GO</h2>
            <dl class="go-list">
                <div><dt>Ovo</dt><dd id="detail-go-egg"></dd></div>
                <div><dt>Doces p/ evoluir</dt><dd id="detail-go-candy"></dd></div>
            </dl>
        </div>
    </section>
</main>

<?php endif; ?>

<footer class="hints">
    <span class="hint list-only"><kbd>←</kbd><kbd>→</kbd> Passar livros</span>
    <span class="hint list-only"><kbd>⇆</kbd> Arraste a estante</span>
    <span class="hint list-only"><kbd>Enter</kbd> Abrir registro</span>
    <span class="hint detail-only"><kbd>←</kbd><kbd>→</kbd> Anterior / Próximo</span>
    <span class="hint detail-only"><kbd>G</kbd> Grito</span>
    <span class="hint detail-only"><kbd>S</kbd> Shiny</span>
    <span class="hint detail-only"><kbd>Esc</kbd> Voltar à estante</span>
    <span class="hint"><kbd>/</kbd> Buscar</span>
    <span class="hint"><kbd>T</kbd> Tema claro / escuro</span>
    <button class="btn-back" id="btn-back" type="button">Voltar à estante</button>
</footer>

<script id="pokedex-data" type="application/json"><?= json_encode(
    ['pokemon' => $pokemons, 'selected' => $selectedId, 'detail' => $openDetail],
    JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE
) ?></script>
<script src="src/js/pokemon.js"></script>
</body>
</html>
