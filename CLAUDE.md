# Site Gustavo Correa (@gvstavocorrea) — prévia

Site estático (HTML/CSS/JS puro) + uma rota `/api/seguidores` para o contador ao vivo. Conteúdo: Media Kit 2026 atualizado com pesquisa pública (out/2026).

## Direção visual (pedido do cliente)
- Sóbrio, monocromático (cinzas + tinta). Referências: Behance ProTip, Influence Code, Blurred Unboxing, Salimon.
- Uma família: Archivo (eixo wdth) para tudo; Space Mono só em rótulos. Instrument Serif SOMENTE na palavra "performático" do topo.
- "GUSTAVO" e "CORREA" na mesma fonte. Sem eyebrow "Criador de conteúdo · Rio de Janeiro".
- O personagem "homem performático" é o diferencial principal (seção logo após o topo), mas o site mostra outros territórios também.
- Ordem pensada para quem contrata: topo com números → personagem → números ao vivo → cases → audiência → sobre → agência → contato/links.
- Contador: soma de seguidores das três redes, ao vivo, via contadores públicos (Mixerno.Space, Livecounts.io, SocialCounts). NÃO usar tokens/APIs oficiais.

## Estrutura
- `index.html`, `assets/css/style.css`, `assets/js/main.js`.
- `api/fontes.mjs` (leitura das fontes públicas) e `api/seguidores.mjs` (rota com cache de 15 s).
- `dados/metricas.json` — reserva; `#metricas-iniciais` no HTML precisa bater com ele (teste).
- `assets/img/raw/` — originais do PDF do Media Kit.

## Testes
- `npm test` roda tudo (node:test + Playwright). Os testes de navegador usam `SEM_REDE` e simulam a API, então não dependem da internet.
- Dependências ficam FORA do Google Drive: `npm run deps` instala em `%LOCALAPPDATA%\gustavo-correa-site-deps`.
- Regressões em `tests/regression/`, um arquivo por bug.
- Prévia local: `npm run servir` → http://127.0.0.1:4173/ (no app, o launch.json da pasta FOTOS 360 GRAUS sobe o mesmo servidor).

## Vídeos e publis
- Player (`.player[data-tiktok]` ou `[data-instagram]`) mostra a capa e só carrega o embed (TikTok player v1 / Instagram embed) no clique.
- Capas em `assets/img/videos/<id>.webp`; logos das marcas em `assets/img/marcas/` (exibidas em escala de cinza).
- Publis são GERADAS: editar a lista `MARCAS` em `scripts/gerar-publis.py` e rodar `python scripts/gerar-publis.py` (reescreve o trecho entre `<!-- PUBLIS:INICIO -->` e `<!-- PUBLIS:FIM -->`). Não editar esse trecho à mão.
- Capas do Instagram: `assets/img/videos/ig-<codigo>.webp`. O Gustavo oculta curtidas no Instagram; quando o mesmo vídeo está no TikTok, a métrica usada é a view do TikTok (conferido pela capa e data).
- Bagaggio e Zerezes ainda sem link do reel (usam o print do Media Kit e o perfil). Quando o cliente mandar, trocar para `"ig"` na lista e remover a exceção `SEM_LINK_AINDA` do teste.
- Classe `.marca` é o logo do menu; a linha de publi é `.publi-marca` (regressão em `tests/regression/logo-menu-com-estilo-de-publi.test.js`).

## SEO
- Prévia usa URLs relativas e `noindex`. `npm run publicar -- https://dominio` gera `dist/` com canonical/OG/JSON-LD absolutos, sem noindex, com `sitemap.xml` e `robots.txt` liberado.
- JSON-LD: ProfilePage + Person + VideoObject. Título ≤ 60 caracteres.

## Pendências para publicar
- Prévia com `noindex` e `robots.txt` bloqueando; liberar ao publicar.
- Hospedagem precisa suportar a função `api/seguidores.mjs` (ex.: Vercel); sem ela o site cai para `dados/metricas.json`.
- Confirmar relação MUDAH × MOOTS.

## Mobile (camada final)
- `assets/css/mobile.css` carrega depois do `style.css`: refinamento ≤ 640px, barra fixa (`#dock`) e a barra/selo de "nível de performance" (desktop + mobile).
- Menu do celular (≤ 960px, onde existe o botão de menu): o painel desce e as opções entram uma a uma (`menu-painel`/`menu-opcao` no fim do `mobile.css`); desktop sem animação e "reduzir movimento" desliga.
- Testes em `tests/mobile.test.js` (320/360/390/430px: sem vazamento lateral, toque ≥ 44px, texto ≥ 11px, carrosséis, barra fixa, autoplay do fundo, player).
- `npm test` roda com `--test-concurrency=2` para não estourar tempo em máquinas lentas.
