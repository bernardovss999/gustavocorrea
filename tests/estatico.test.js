// Checagens estáticas do HTML, dados e arquivos referenciados.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import vm from "node:vm";
import { RAIZ } from "./servidor.js";

const html = await readFile(join(RAIZ, "index.html"), "utf8");
const existe = (p) => access(join(RAIZ, p)).then(() => true, () => false);

test("título, descrição, idioma e viewport presentes", () => {
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<title>[^<]{10,70}<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{50,170}">/);
  assert.match(html, /<meta name="viewport"/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, "deve haver exatamente um h1");
});

test("ids únicos", () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dup, []);
});

test("âncoras internas apontam para ids existentes", () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const ancoras = [...html.matchAll(/href="#([^"]*)"/g)].map((m) => m[1]);
  for (const a of ancoras) assert.ok(ids.has(a), `âncora #${a} sem destino`);
});

test("arquivos locais referenciados existem", async () => {
  const refs = [...html.matchAll(/(?:src|href)="(?!https?:|mailto:|#|data:)([^"]+)"/g)].map((m) => m[1].split("?")[0]);
  assert.ok(refs.length > 5);
  for (const r of refs) assert.ok(await existe(r), `não encontrado: ${r}`);
});

// Miniaturas da vitrine do topo e dos links são decorativas (o texto do link já descreve) e usam alt="" de propósito
test("toda imagem tem alt, width e height (alt vazio só nas decorativas)", () => {
  for (const tag of html.match(/<img\b[^>]*>/g)) {
    if (/class="(tile|deco)"/.test(tag)) assert.match(tag, /\salt=""/, tag);
    else assert.match(tag, /\salt="[^"]+"/, tag);
    assert.match(tag, /\swidth="\d+"/, tag);
    assert.match(tag, /\sheight="\d+"/, tag);
  }
});

test("links externos em nova aba usam rel=noopener", () => {
  for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(tag, /rel="[^"]*noopener/, tag);
});

// O JSON-LD passou a usar @graph (ProfilePage + Person + VideoObject) para SEO de vídeo
test("JSON-LD é válido e descreve a pessoa, a página e os vídeos", () => {
  const bloco = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  const grafo = JSON.parse(bloco)["@graph"];
  const pessoa = grafo.find((n) => n["@type"] === "Person");
  assert.equal(pessoa.name, "Gustavo Correa");
  assert.ok(pessoa.sameAs.length >= 3);
  assert.ok(grafo.some((n) => n["@type"] === "ProfilePage"));
  for (const v of grafo.filter((n) => n["@type"] === "VideoObject")) {
    for (const campo of ["name", "description", "thumbnailUrl", "uploadDate", "embedUrl"]) assert.ok(v[campo], `${v.name}: falta ${campo}`);
  }
});

test("SEO: título até 60 caracteres, Open Graph e Twitter completos", () => {
  const titulo = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(titulo.length <= 60, `título com ${titulo.length} caracteres`);
  for (const p of ["og:title", "og:description", "og:image", "og:url", "og:type"]) assert.match(html, new RegExp(`property="${p}" content="[^"]+"`), p);
  for (const n of ["twitter:card", "twitter:image"]) assert.match(html, new RegExp(`name="${n}" content="[^"]+"`), n);
  assert.match(html, /<link rel="canonical"/);
});

test("fonte monoespaçada não é usada (pedido do cliente)", async () => {
  const css = await readFile(join(RAIZ, "assets/css/style.css"), "utf8");
  assert.doesNotMatch(html + css, /Space Mono|JetBrains Mono|monospace/i);
});

// Publis passaram a ser uma linha por marca, com todos os vídeos da marca (pedido do cliente)
const marcas = html.split('<li class="publi-marca">').slice(1).map((p) => p.split("</ul>\n          </li>")[0]);

test("toda marca tem logo, nome e ao menos um vídeo com player e link", () => {
  assert.ok(marcas.length >= 11, `só ${marcas.length} marcas`);
  for (const m of marcas) {
    const nome = (m.match(/class="marca__nome">([^<]+)</) || [])[1];
    assert.ok(nome, "nome da marca");
    assert.match(m, /class="publi__logo[^"]*" src="assets\/img\/marcas\//, `${nome}: logo`);
    assert.match(m, /class="player"/, `${nome}: player`);
    assert.match(m, /href="https:\/\/www\.(tiktok|instagram)\.com\//, `${nome}: link da rede`);
  }
});

test("links de publis enviados pelo cliente estão no site", () => {
  const codigos = ["Dcb9g8BCmay", "Dcg_znojEUG", "DaLR7WXRLdt", "DZ-vl7CRLTk", "DZxuGw_gl0F", "DZi06R6xfCl", "DeHSPbxEU1u", "DX_5KKsBfsq",
    "DdlzNv7R93X", "DcySvSBRjm4", "DcqzKpRRLTX", "DcLq7ycRjs2", "DYkPt0Wxn3l", "Db51RUYB1xE"];
  for (const c of codigos) assert.ok(html.includes(`/${c}/`), `post ${c} ausente`);
  const globo = marcas.find((m) => m.includes(">TV Globo<"));
  assert.equal((globo.match(/class="player"/g) || []).length, 13, "Globo deve ter os 13 vídeos da coletânea");
});

test("todo vídeo mostra métrica pública ou a rede e a data, e tem link direto", () => {
  const videos = html.split('class="video__info"').slice(1).map((v) => v.split("</li>")[0].split("</article>")[0]);
  assert.ok(videos.length >= 25, `só ${videos.length} vídeos`);
  for (const v of videos) {
    assert.match(v, /class="video__meta"><strong>[\d.,]+ (mi |mil )?(views|curtidas|comentários)<\/strong>|class="video__meta">(Instagram|TikTok) · /);
    const titulo = (v.match(/class="video__t">([^<]+)</) || [])[1];
    assert.match(v, /href="https:\/\/www\.(tiktok\.com\/@gvstavoccorrea\/video\/\d+|instagram\.com\/[\w.]+\/(reel|p)\/[\w-]+\/)"/, titulo);
  }
});

test("publis confirmadas da coletânea estão no site; eventos ficam fora das publis", () => {
  const confirmadas = ["DUN39giDnuC", "DOHaPW0gYqU", "DOD8VABDUY1", "Db_tSxuhGTn", "DbwOXYCht4V", "Da5Kg0JRfA0", "DV8ergqDaDa", "DUnirQkDphO",
    "DNVlyN3tzp4", "CjGu-ewg5wN", "DaSvXUvBqxQ", "DZir_YxGvGX", "DZi0hDjx6VK", "DZi1UWJRGzM", "DZi4vSexzd0", "DZi6yS4RyVh", "DZi8UigRO3h", "DZjAgjjxSmC"];
  const publis = html.split('<ul class="marcas">')[1].split('<div class="eventos">')[0];
  for (const c of confirmadas) assert.ok(publis.includes(`/${c}/`), `publi ${c} ausente`);
  const eventos = html.split('<div class="eventos">')[1].split("</ul>")[0];
  for (const c of ["Dc_sXIKFs3T", "Dc03JGDlswp", "DKSEWUAN8MD", "C0pbXofrhXw"]) {
    assert.ok(eventos.includes(`/${c}/`), `evento ${c} ausente`);
    assert.ok(!publis.includes(`/${c}/`), `menção ${c} não pode aparecer como publi`);
  }
  assert.ok(!html.includes("publi-bagaggio.webp") && !html.includes("publi-zerezes.webp"), "prints do Media Kit foram trocados pelos reels reais");
});

test("vídeo de destaque do personagem é o reel enviado pelo cliente", () => {
  const destaque = html.split('class="video video--destaque"')[1].split("</article>")[0];
  assert.match(destaque, /data-instagram="reel\/DeWxJ65tZM4"/);
});

test("seção Sobre tem as fotos dele", () => {
  const sobre = html.split('id="sobre"')[1].split("</section>")[0];
  assert.ok((sobre.match(/<img /g) || []).length >= 4, "foto principal + galeria");
});

test("robots coerente com prévia (noindex + Disallow)", async () => {
  assert.match(html, /<meta name="robots" content="noindex/);
  const robots = await readFile(join(RAIZ, "robots.txt"), "utf8");
  assert.match(robots, /Disallow: \//);
});

test("metricas.json tem todas as métricas usadas na página", async () => {
  const dados = JSON.parse(await readFile(join(RAIZ, "dados/metricas.json"), "utf8"));
  assert.ok(!isNaN(new Date(dados.atualizadoEm)));
  const usadas = new Set([...html.matchAll(/data-metrica="([^"]+)"/g)].map((m) => m[1]));
  for (const caminho of usadas) {
    if (caminho === "total.seguidores") continue;
    const [plat, chave] = caminho.split(".");
    const m = dados.plataformas[plat]?.[chave];
    assert.ok(m && Number.isFinite(m.valor) && typeof m.aprox === "boolean", `métrica ausente: ${caminho}`);
  }
});

test("dados embutidos (fallback) batem com metricas.json", async () => {
  const dados = JSON.parse(await readFile(join(RAIZ, "dados/metricas.json"), "utf8"));
  const inline = JSON.parse(html.match(/<script id="metricas-iniciais" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  for (const [plat, obj] of Object.entries(inline.plataformas)) {
    for (const [chave, m] of Object.entries(obj)) assert.deepEqual(m, dados.plataformas[plat][chave], `${plat}.${chave}`);
  }
});

test("formatação dos números em pt-BR", async () => {
  const ctx = { globalThis: {} };
  ctx.globalThis = ctx;
  vm.runInNewContext(await readFile(join(RAIZ, "assets/js/main.js"), "utf8"), ctx);
  const { formatar, totalSeguidores } = ctx.GVST;
  assert.equal(formatar({ valor: 159054, aprox: false }), "159.054");
  assert.equal(formatar({ valor: 112000, aprox: true }), "112 mil");
  assert.equal(formatar({ valor: 99300000, aprox: true }), "99,3 mi");
  assert.equal(formatar(undefined), "...", "sem travessão: o cliente pediu nenhum — no site");
  const t = totalSeguidores({ instagram: { seguidores: { valor: 1000, aprox: true } }, tiktok: { seguidores: { valor: 2, aprox: false } }, youtube: { inscritos: { valor: 3, aprox: false } } });
  assert.deepEqual({ ...t }, { valor: 1005, aprox: true });
});
