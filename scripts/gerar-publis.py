# Gera o bloco <ul class="marcas"> do index.html a partir da lista de publis abaixo.
# Uso: python scripts/gerar-publis.py   (reescreve o trecho entre <!-- PUBLIS:INICIO --> e <!-- PUBLIS:FIM -->)
import html
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

IG = "https://www.instagram.com/"
TT = "https://www.tiktok.com/@gvstavoccorrea/video/"

# Cada vídeo: (titulo, plataforma, id/código, capa, métrica ou None, data, links extras [(rótulo, url)])
MARCAS = [
    {
        "nome": "TV Globo", "logo": ("tv-globo.svg", 160, 37), "cat": "Entretenimento · Copa do Mundo 2026 e Avenida Brasil",
        "desc": "Seis reels em collab com a @tvglobo: a torcida performática na Copa do Mundo e as ruas do Rio comentando Avenida Brasil.",
        "resumo": "6 vídeos · mais de 61 mil curtidas no perfil da TV Globo",
        "videos": [
            ("Quem é cria tá ligado: Escócia x Brasil", "ig", "tvglobo/reel/DZ-vl7CRLTk", "ig-DZ-vl7CRLTk.webp", "24 mil curtidas", "jun 2026", []),
            ("Brasil x Haiti no fuso gringo", "ig", "tvglobo/reel/DZxuGw_gl0F", "ig-DZxuGw_gl0F.webp", "14 mil curtidas", "jun 2026", []),
            ("Look apro ou repro pro jogo do Brasil?", "ig", "tvglobo/reel/DZi06R6xfCl", "ig-DZi06R6xfCl.webp", "8.871 curtidas", "jun 2026", []),
            ("Atrás do hexa", "ig", "tvglobo/reel/DaLR7WXRLdt", "ig-DaLR7WXRLdt.webp", "6.341 curtidas", "jun 2026", []),
            ("O momento mais marcante de Avenida Brasil", "ig", "tvglobo/reel/Dcb9g8BCmay", "ig-Dcb9g8BCmay.webp", "4.164 curtidas", "ago 2026", []),
            ("Avenida Brasil no Vale a Pena Ver de Novo", "ig", "tvglobo/reel/Dcg_znojEUG", "ig-Dcg_znojEUG.webp", "3.713 curtidas", "ago 2026", []),
        ],
    },
    {
        "nome": "CeraVe", "logo": ("cerave.webp", 480, 182), "cat": "Skincare",
        "desc": "Duas campanhas com o personagem performático, publicadas no TikTok e no YouTube Shorts.",
        "resumo": "2 vídeos · 4,7 mi views no TikTok",
        "videos": [
            ("Look de frio no RJ #BarreiraSoComCeraVe", "tt", "7671401764389801234", "7671401764389801234.webp", "4,1 mi views", "ago 2026", []),
            ("Performando com o Water Gel", "tt", "7673634857402027271", "7673634857402027271.webp", "622 mil views", "ago 2026", []),
        ],
    },
    {
        "nome": "Voe Nuvy", "logo": ("voe-nuvy.webp", 480, 115), "cat": "Viagens",
        "desc": "Parceria de viagens: o personagem no aeroporto e a Segunda Expedição para Caraíva, com vagas para a audiência.",
        "resumo": "2 publicações no Instagram",
        "videos": [
            ("Segunda Expedição para Caraíva", "ig", "gvstavocorrea/p/DeHSPbxEU1u", "voe-nuvy-caraiva.webp", None, "out 2026", []),
            ("Eu até tento parar de voar, Gui", "ig", "gvstavocorrea/reel/DX_5KKsBfsq", "ig-DX_5KKsBfsq.webp", None, "mai 2026", []),
        ],
    },
    {
        "nome": "Reserva Go", "logo": ("reserva.svg", 28, 32), "icone": True, "cat": "Moda · calçados · ArtRio 2026",
        "desc": "O “artista plástico contemporâneo” na ArtRio com o conforto do tênis R-Oskaka.",
        "resumo": "Publicidade no TikTok e no Instagram",
        "videos": [
            ("Dia de arte contemporânea na ArtRio", "tt", "7688352647174278418", "7688352647174278418.webp", "48,4 mil views", "set 2026",
             [("Ver no Instagram", IG + "gvstavocorrea/reel/DdlzNv7R93X/")]),
        ],
    },
    {
        "nome": "Coca-Cola", "logo": ("coca-cola.svg", 160, 52), "cat": "Bebidas · Rock in Rio 2026",
        "desc": "Cobertura do último dia de Rock in Rio a convite da marca.",
        "resumo": "1 vídeo no TikTok",
        "videos": [
            ("Último dia de RiR a convite da Coca-Cola", "tt", "7685517607063112968", "7685517607063112968.webp", "49,5 mil views", "set 2026", []),
        ],
    },
    {
        "nome": "QuintoAndar", "logo": ("quinto-andar.svg", 160, 32), "cat": "Imóveis",
        "desc": "Bem-vindo à Astéric House: o cantinho vintage do personagem e o aluguel sem fiador e sem burocracia.",
        "resumo": "Publicidade no Instagram",
        "videos": [
            ("Seja bem-vindo à Astéric House", "ig", "gvstavocorrea/reel/DcySvSBRjm4", "ig-DcySvSBRjm4.webp", None, "set 2026", []),
        ],
    },
    {
        "nome": "639Hertz", "logo": ("639hertz.webp", 200, 200), "icone": True, "cat": "App de relacionamento",
        "desc": "O app que conecta pessoas pelo mapa astral, antes da aparência.",
        "resumo": "Publicidade no Instagram",
        "videos": [
            ("Conexão pelo mapa astral, sem foto", "ig", "gvstavocorrea/reel/DcqzKpRRLTX", "ig-DcqzKpRRLTX.webp", None, "ago 2026", []),
        ],
    },
    {
        "nome": "Lev Bicicletas", "logo": ("lev.webp", 191, 64), "cat": "Mobilidade elétrica · cupom GVSTA",
        "desc": "Duas parcerias com a bike elétrica, incluindo o “playboy metido a cria” do Media Kit.",
        "resumo": "2 vídeos · 431 mil views no TikTok",
        "videos": [
            ("Maior sufoco em Buzin", "ig", "gvstavocorrea/reel/DYkPt0Wxn3l", "ig-DYkPt0Wxn3l.webp", "431,4 mil views", "mai 2026",
             [("Ver no TikTok", TT + "7642010653644901650")]),
            ("Eu sou movido a arte, Bru", "ig", "gvstavocorrea/reel/DcLq7ycRjs2", "ig-DcLq7ycRjs2.webp", None, "ago 2026", []),
        ],
    },
    {
        "nome": "Jappa da Quitanda", "logo": ("jappa.webp", 303, 181), "icone": True, "cat": "Restaurante",
        "desc": "O clima clean astéric do Jappa e os 7 Golden Tickets dos 7 anos da marca.",
        "resumo": "Publicidade no Instagram",
        "videos": [
            ("7 anos do Jappa com Golden Tickets", "ig", "gvstavocorrea/reel/Db51RUYB1xE", "ig-Db51RUYB1xE.webp", None, "ago 2026", []),
        ],
    },
    {
        "nome": "Bagaggio", "logo": ("bagaggio.webp", 480, 69), "cat": "Malas e acessórios",
        "desc": "Arrumação da mochila de viagem na rotina do Gustavo.",
        "resumo": "Reel do Media Kit",
        "videos": [
            ("Arrumando a mochila", "kit", "", "../publi-bagaggio.webp", "160 comentários", "Media Kit", []),
        ],
    },
    {
        "nome": "Zerezes", "logo": ("zerezes.webp", 247, 200), "icone": True, "cat": "Óculos · cupom EZ-GVST",
        "desc": "Visita à loja e escolha de armações.",
        "resumo": "Reel do Media Kit",
        "videos": [
            ("Escolhendo armações na loja", "kit", "", "../publi-zerezes.webp", "217 comentários", "Media Kit", []),
        ],
    },
]

e = html.escape


def video(v, marca):
    titulo, plat, ident, capa, metrica, data, extras = v
    alt = f"Capa do vídeo {titulo} ({marca})"
    if plat == "tt":
        attr, url, rede = f'data-tiktok="{ident}"', TT + ident, "TikTok"
    elif plat == "ig":
        attr, url, rede = f'data-instagram="{ident.split("/", 1)[1]}"', IG + ident + "/", "Instagram"
    else:
        attr, url, rede = 'data-instagram=""', IG + "gvstavocorrea/", "Instagram"
    w, h = (483, 871) if plat == "kit" else ((640, 640) if "caraiva" in capa else (360, 640))
    if plat == "kit":
        botao = f'<a class="player__play player__play--link" href="{url}" target="_blank" rel="noopener" aria-label="Ver {e(titulo)} no Instagram"><svg class="ico" aria-hidden="true"><use href="#i-instagram"/></svg></a>'
    else:
        botao = f'<button class="player__play" type="button" aria-label="Assistir {e(titulo)} aqui no site"><svg class="ico" aria-hidden="true"><use href="#i-play"/></svg></button>'
    meta = f"<strong>{e(metrica)}</strong> · {data}" if metrica else f"{rede} · {data}"
    links = [f'<a class="video__link" href="{url}" target="_blank" rel="noopener">Ver no {rede}</a>']
    links += [f'<a class="video__link" href="{u}" target="_blank" rel="noopener">{e(r)}</a>' for r, u in extras]
    return f"""              <li class="video">
                <div class="player" {attr}>
                  <img src="assets/img/videos/{capa}" width="{w}" height="{h}" loading="lazy" alt="{e(alt)}">
                  {botao}
                </div>
                <div class="video__info">
                  <p class="video__t">{e(titulo)}</p>
                  <p class="video__meta">{meta}</p>
                  <p class="video__links">{' '.join(links)}</p>
                </div>
              </li>"""


def marca(m):
    arq, w, h = m["logo"]
    classe = "publi__logo publi__logo--icone" if m.get("icone") else "publi__logo"
    vids = "\n".join(video(v, m["nome"]) for v in m["videos"])
    return f"""          <li class="publi-marca">
            <div class="marca__info">
              <img class="{classe}" src="assets/img/marcas/{arq}" width="{w}" height="{h}" loading="lazy" alt="Logo {e(m['nome'])}">
              <h3 class="marca__nome">{e(m['nome'])}</h3>
              <p class="marca__cat">{e(m['cat'])}</p>
              <p class="marca__desc">{e(m['desc'])}</p>
              <p class="marca__resumo">{e(m['resumo'])}</p>
            </div>
            <ul class="marca__videos">
{vids}
            </ul>
          </li>"""


def main():
    p = RAIZ / "index.html"
    s = p.read_text(encoding="utf-8")
    bloco = "<!-- PUBLIS:INICIO -->\n        <ul class=\"marcas\">\n" + "\n".join(marca(m) for m in MARCAS) + "\n        </ul>\n        <!-- PUBLIS:FIM -->"
    novo, n = re.subn(r"<!-- PUBLIS:INICIO -->.*?<!-- PUBLIS:FIM -->", lambda _: bloco, s, flags=re.S)
    if n != 1:
        raise SystemExit("marcadores PUBLIS não encontrados")
    p.write_text(novo, encoding="utf-8")
    print(f"{len(MARCAS)} marcas, {sum(len(m['videos']) for m in MARCAS)} vídeos")


if __name__ == "__main__":
    main()
