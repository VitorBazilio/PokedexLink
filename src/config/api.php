<?php
/**
 * Carrega os dados da Pokédex a partir da API, com cache local em arquivo.
 *
 * - A API só é consultada quando o cache não existe ou tem mais de POKEDEX_CACHE_TTL segundos.
 * - Se a API estiver fora do ar, o último cache válido continua sendo usado.
 */

const POKEDEX_API_URL    = 'https://www.canalti.com.br/api/pokemons.json';
const POKEDEX_CACHE_FILE = __DIR__ . '/../cache/pokemons.json';
const POKEDEX_CACHE_TTL  = 86400; // 24 horas

function pokedex_fetch_remote(): ?string
{
    if (!function_exists('curl_init')) {
        return null;
    }

    $curl = curl_init(POKEDEX_API_URL);
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => 15,
    ];
    // No Windows o PHP não traz bundle de certificados; usa o repositório do sistema.
    if (defined('CURLSSLOPT_NATIVE_CA')) {
        $options[CURLOPT_SSL_OPTIONS] = CURLSSLOPT_NATIVE_CA;
    }
    curl_setopt_array($curl, $options);

    $body   = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);

    return ($body !== false && $status === 200) ? $body : null;
}

function pokedex_decode(?string $json): ?array
{
    if ($json === null || $json === '') {
        return null;
    }
    $data = json_decode($json, true);
    return (is_array($data) && isset($data['pokemon']) && is_array($data['pokemon'])) ? $data['pokemon'] : null;
}

function pokedex_normalize(array $p): array
{
    $evolutions = static function ($list): array {
        $out = [];
        foreach ((array) $list as $e) {
            $out[] = ['id' => (int) $e['num'], 'num' => (string) $e['num'], 'name' => (string) $e['name']];
        }
        return $out;
    };

    return [
        'id'         => (int) $p['id'],
        'num'        => (string) $p['num'],
        'name'       => (string) $p['name'],
        'types'      => array_values((array) ($p['type'] ?? [])),
        'height'     => (string) ($p['height'] ?? '—'),
        'weight'     => (string) ($p['weight'] ?? '—'),
        'weaknesses' => array_values((array) ($p['weaknesses'] ?? [])),
        'prev'       => $evolutions($p['prev_evolution'] ?? []),
        'next'       => $evolutions($p['next_evolution'] ?? []),
        'egg'        => (string) ($p['egg'] ?? ''),
        'candy'      => (string) ($p['candy'] ?? ''),
        'candyCount' => isset($p['candy_count']) ? (int) $p['candy_count'] : null,
        'spawn'      => isset($p['spawn_chance']) ? (float) $p['spawn_chance'] : null,
        'fallback'   => str_replace('http://', 'https://', (string) ($p['img'] ?? '')),
    ];
}

/**
 * @return array Lista de Pokémon normalizada (vazia se API e cache falharem).
 */
function pokedex_load(): array
{
    $cacheFresh = is_file(POKEDEX_CACHE_FILE) && (time() - filemtime(POKEDEX_CACHE_FILE)) < POKEDEX_CACHE_TTL;

    if (!$cacheFresh) {
        $body = pokedex_fetch_remote();
        if (pokedex_decode($body) !== null) {
            if (!is_dir(dirname(POKEDEX_CACHE_FILE))) {
                @mkdir(dirname(POKEDEX_CACHE_FILE), 0775, true);
            }
            @file_put_contents(POKEDEX_CACHE_FILE, $body, LOCK_EX);
            return array_map('pokedex_normalize', pokedex_decode($body));
        }
    }

    $cached = is_file(POKEDEX_CACHE_FILE) ? pokedex_decode((string) file_get_contents(POKEDEX_CACHE_FILE)) : null;
    return $cached ? array_map('pokedex_normalize', $cached) : [];
}
