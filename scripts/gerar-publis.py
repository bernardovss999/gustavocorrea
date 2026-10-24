# Gera o bloco de publis do index.html a partir das listas MARCAS e EVENTOS abaixo.
# Uso: python scripts/gerar-publis.py   (reescreve o trecho entre <!-- PUBLIS:INICIO --> e <!-- PUBLIS:FIM -->)
# Fonte: Media Kit 2026 + coletânea de publicidades do perfil (consulta de 22/10/2026).
import html
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

IG = "https://www.instagram.com/"
TT = "https://www.tiktok.com/@gvstavoccorrea/video/"

# Cada vídeo: (titulo, plataforma, id/código, capa, métrica ou None, data, links extras [(rótulo, url)])
# Só entram aqui publis confirmadas (#publi, parceria paga, collab oficial ou campanha declarada por ele).
MARCAS = [
    {
        "nome": "TV Globo", "logo": ("tv-globo.svg", 160, 37), "cat": "Entretenimento · Copa do Mundo 2026 e Avenida Brasil",
        "desc": "Time de criadores da Copa na @tvglobo: a torcida performática nos jogos do Brasil e as ruas do Rio comentando Avenida Brasil.",
        "resumo": "13 vídeos · mais de 72 mil curtidas no perfil da TV Globo",
        "videos": [
            ("Quem é cria tá ligado: Escócia x Brasil", "ig", "tvglobo/reel/DZ-vl7CRLTk", "ig-DZ-vl7CRLTk.webp", "24 mil curtidas", "jun 2026", []),
            ("Brasil x Haiti no fuso gringo", "ig", "tvglobo/reel/DZxuGw_gl0F", "ig-DZxuGw_gl0F.webp", "14 mil curtidas", "jun 2026", []),
            ("Look apro ou repro pro jogo do Brasil?", "ig", "tvglobo/reel/DZi06R6xfCl", "ig-DZi06R6xfCl.webp", "8.871 curtidas", "jun 2026", []),
            ("Atrás do hexa: todo jeito de torcer", "ig", "tvglobo/reel/DaLR7WXRLdt", "ig-DaLR7WXRLdt.webp", "6.341 curtidas", "jun 2026", []),
            ("O momento mais marcante de Avenida Brasil", "ig", "tvglobo/reel/Dcb9g8BCmay", "ig-Dcb9g8BCmay.webp", "4.164 curtidas", "ago 2026", []),
            ("Avenida Brasil no Vale a Pena Ver de Novo", "ig", "tvglobo/reel/Dcg_znojEUG", "ig-Dcg_znojEUG.webp", "3.713 curtidas", "ago 2026", []),
            ("O timaço de criadores da Copa", "ig", "tvglobo/p/DZir_YxGvGX", "ig-DZir_YxGvGX.webp", "3.022 curtidas", "jun 2026", []),
            ("Reação icônica pra todo gosto", "ig", "tvglobo/reel/DZi6yS4RyVh", "ig-DZi6yS4RyVh.webp", "2.060 curtidas", "jun 2026", []),
            ("Vem com o Bonde do Acredita", "ig", "tvglobo/reel/DZi0hDjx6VK", "ig-DZi0hDjx6VK.webp", "1.897 curtidas", "jun 2026", []),
            ("Pé frio não assiste jogo do meu lado", "ig", "tvglobo/reel/DZi8UigRO3h", "ig-DZi8UigRO3h.webp", "1.869 curtidas", "jun 2026", []),
            ("Recado pro Ancelotti", "ig", "tvglobo/reel/DZjAgjjxSmC", "ig-DZjAgjjxSmC.webp", "977 curtidas", "jun 2026", []),
            ("O papo do primeiro tempo", "ig", "tvglobo/reel/DZi1UWJRGzM", "ig-DZi1UWJRGzM.webp", "788 curtidas", "jun 2026", []),
            ("Bahia e Rio no mesmo molho", "ig", "tvglobo/reel/DZi4vSexzd0", "ig-DZi4vSexzd0.webp", "729 curtidas", "jun 2026", []),
        ],
    },
    {
        "nome": "CeraVe", "logo": ("cerave.webp", 480, 182), "cat": "Skincare",
        "desc": "Duas campanhas com o personagem performático, no TikTok, no Instagram e no YouTube Shorts.",
        "resumo": "2 campanhas · 4,7 mi views no TikTok",
        "videos": [
            ("Look de frio no RJ #BarreiraSoComCeraVe", "tt", "7671401764389801234", "7671401764389801234.webp", "4,1 mi views", "ago 2026",
             [("Ver no Instagram", IG + "gvstavocorrea/reel/DbwOXYCht4V/")]),
            ("Performando com o Water Gel", "tt", "7673634857402027271", "7673634857402027271.webp", "622 mil views", "ago 2026",
             [("Ver no Instagram", IG + "gvstavocorrea/reel/Db_tSxuhGTn/")]),
        ],
    },
    {
        "nome": "Nubank", "logo": ("nubank.svg", 160, 88), "cat": "Banco digital · bastidores de campanha",
        "desc": "A vida de um “quase influenciador” gravando uma campanha da Nubank, contada por ele mesmo.",
        "resumo": "Bastidores no Instagram",
        "videos": [
            ("Gravando uma campanha da Nubank", "ig", "gvstavocorrea/reel/DaSvXUvBqxQ", "ig-DaSvXUvBqxQ.webp", None, "jul 2026", []),
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
        "desc": "O app que conecta pessoas pelo mapa astral, antes da aparência. Duas campanhas.",
        "resumo": "2 publicidades no Instagram",
        "videos": [
            ("Conexão pelo mapa astral, sem foto", "ig", "gvstavocorrea/reel/DcqzKpRRLTX", "ig-DcqzKpRRLTX.webp", None, "ago 2026", []),
            ("Aqui não tem swipe infinito", "ig", "gvstavocorrea/reel/Da5Kg0JRfA0", "ig-Da5Kg0JRfA0.webp", None, "jul 2026", []),
        ],
    },
    {
        "nome": "Lev Bicicletas", "logo": ("lev.webp", 191, 64), "cat": "Mobilidade elétrica · cupom GVSTA",
        "desc": "Duas parcerias com a bike elétrica, incluindo o “playboy metido a cria” em Búzios.",
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
        "nome": "Voe Nuvy", "logo": ("voe-nuvy.webp", 480, 115), "cat": "Viagens · Expedição Caraíva",
        "desc": "A série de viagens com a agência: duas edições da Expedição Caraíva, com Yago Viajante, e o personagem performando no Sul da Bahia.",
        "resumo": "5 publicações no Instagram",
        "videos": [
            ("Segunda Expedição para Caraíva", "ig", "gvstavocorrea/p/DeHSPbxEU1u", "voe-nuvy-caraiva.webp", None, "out 2026", []),
            ("Eu até tento parar de voar, Gui", "ig", "gvstavocorrea/reel/DX_5KKsBfsq", "ig-DX_5KKsBfsq.webp", None, "mai 2026", []),
            ("Arrumando a mala pra performar na Bahia", "ig", "gvstavocorrea/reel/DUN39giDnuC", "ig-DUN39giDnuC.webp", None, "fev 2026", []),
            ("Roteiro Caraíva + Arraial d’Ajuda", "ig", "gvstavocorrea/p/DOHaPW0gYqU", "ig-DOHaPW0gYqU.webp", None, "set 2025", []),
            ("Acabou o suspense: vem pra expedição", "ig", "gvstavocorrea/reel/DOD8VABDUY1", "ig-DOD8VABDUY1.webp", "604 curtidas", "set 2025", []),
        ],
    },
    {
        "nome": "Bagaggio", "logo": ("bagaggio.webp", 480, 69), "cat": "Malas e acessórios",
        "desc": "A mochila que encarou um mochilão pela Europa, Fer.",
        "resumo": "Publicidade no Instagram",
        "videos": [
            ("Mochilão na Europa com a Bagaggio", "ig", "gvstavocorrea/reel/DV8ergqDaDa", "ig-DV8ergqDaDa.webp", None, "mar 2026", []),
        ],
    },
    {
        "nome": "Zerezes", "logo": ("zerezes.webp", 247, 200), "icone": True, "cat": "Óculos · cupom EZ-GVST",
        "desc": "A galera de Sanca só usa Zerezes, Fer.",
        "resumo": "Parceria no Instagram",
        "videos": [
            ("A galera de Sanca só usa Zerezes", "ig", "gvstavocorrea/reel/DUnirQkDphO", "ig-DUnirQkDphO.webp", None, "fev 2026", []),
        ],
    },
    {
        "nome": "Tuyo", "logo": ("tuyo.webp", 200, 200), "icone": True, "cat": "Garrafas · hidratação",
        "desc": "Bater a meta diária de água ficou fácil com a Tuyo na rotina.",
        "resumo": "Divulgação no Instagram",
        "videos": [
            ("A meta diária de água", "ig", "gvstavocorrea/reel/DNVlyN3tzp4", "ig-DNVlyN3tzp4.webp", None, "ago 2025", []),
        ],
    },
    {
        "nome": "Bold Snacks", "logo": ("bold-snacks.webp", 200, 200), "icone": True, "cat": "Alimentação",
        "desc": "Era pra ser um dia normal, mas tudo teve Bold.",
        "resumo": "Parceria paga no Instagram",
        "videos": [
            ("Um dia normal com Bold", "ig", "gvstavocorrea/reel/CjGu-ewg5wN", "ig-CjGu-ewg5wN.webp", "1.253 curtidas", "set 2022", []),
        ],
    },
]

# Eventos, convites e menções: aparecem à parte e NÃO são apresentados como publi (sem confirmação comercial).
EVENTOS = [
    ("Camarote Favela no Rock in Rio", "Dia 3 de Rock in Rio", "gvstavocorrea/p/Dc_sXIKFs3T", "ig-Dc_sXIKFs3T.webp", "set 2026"),
    ("20 anos da Reserva", "Festa de aniversário da marca", "gvstavocorrea/p/Dc03JGDlswp", "ig-Dc03JGDlswp.webp", "set 2026"),
    ("Soma Wellness", "Experiência em Atins", "gvstavocorrea/p/DX4lIa_Ef6v", "ig-DX4lIa_Ef6v.webp", "mai 2026"),
    ("The Simple Run Club", "Rotina bem wellness astéric", "gvstavocorrea/reel/DXtzEF5ATZ3", "ig-DXtzEF5ATZ3.webp", "abr 2026"),
    ("Hayo Praia · Réveillon Só Coisas Boas", "Réveillon performático", "gvstavocorrea/p/DTDPPVmjiat", "ig-DTDPPVmjiat.webp", "jan 2026"),
    ("CeraVe Awards BR", "A convite da CeraVe", "gvstavocorrea/p/DKSEWUAN8MD", "ig-DKSEWUAN8MD.webp", "mai 2025"),
    ("Casa de Criadores", "Desfile para a NOT EQUAL em SP", "gvstavocorrea/p/C0pbXofrhXw", "ig-C0pbXofrhXw.webp", "dez 2023"),
]

e = html.escape


def video(v, marca):
    titulo, plat, ident, capa, metrica, data, extras = v
    alt = f"Capa do vídeo {titulo} ({marca})"
    if plat == "tt":
        attr, url, rede = f'data-tiktok="{ident}"', TT + ident, "TikTok"
    else:
        attr, url, rede = f'data-instagram="{ident.split("/", 1)[1]}"', IG + ident + "/", "Instagram"
    w, h = (640, 640) if "caraiva" in capa else (360, 640)
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


def letreiro():
    # faixa de logos rolando; o conteúdo é duplicado no JS para o loop contínuo
    itens = []
    for m in MARCAS:
        arq, w, h = m["logo"]
        classe = "letreiro__logo letreiro__logo--icone" if m.get("icone") else "letreiro__logo"
        itens.append(f'<li><img class="{classe}" src="assets/img/marcas/{arq}" width="{w}" height="{h}" loading="lazy" alt="{e(m["nome"])}"></li>')
    return ('<section class="marcas-topo" aria-labelledby="marcas-topo-titulo">\n'
            '        <div class="wrap marcas-topo__cabeca">\n'
            '          <h2 class="marcas-topo__titulo" id="marcas-topo-titulo">Marcas que já colaboramos</h2>\n'
            '          <a class="marcas-topo__ver" href="#trabalhos">Ver as publis</a>\n'
            '        </div>\n'
            '        <div class="letreiro" aria-label="Logos das marcas">\n'
            '          <ul class="letreiro__trilho">\n            ' + "\n            ".join(itens) + "\n          </ul>\n        </div>\n      </section>")


def eventos():
    itens = []
    for nome, desc, cod, capa, data in EVENTOS:
        itens.append(f'            <li><a href="{IG}{cod}/" target="_blank" rel="noopener"><img class="deco" src="assets/img/videos/{capa}" width="360" height="360" loading="lazy" alt=""><span class="evento__nome">{e(nome)}</span><span class="evento__desc">{e(desc)} · {data}</span></a></li>')
    return ('        <div class="eventos">\n'
            '          <h3 class="subtitulo">Eventos e convites</h3>\n'
            '          <p class="eventos__nota">Onde ele já esteve com marcas, além das publis.</p>\n'
            '          <ul class="eventos__lista">\n' + "\n".join(itens) + "\n          </ul>\n        </div>\n")


def main():
    p = RAIZ / "index.html"
    s = p.read_text(encoding="utf-8")
    bloco = ("<!-- PUBLIS:INICIO -->\n" + "        <ul class=\"marcas\">\n" + "\n".join(marca(m) for m in MARCAS)
             + "\n        </ul>\n" + eventos() + "        <!-- PUBLIS:FIM -->")
    novo, n = re.subn(r"<!-- PUBLIS:INICIO -->.*?<!-- PUBLIS:FIM -->", lambda _: bloco, s, flags=re.S)
    if n != 1:
        raise SystemExit("marcadores PUBLIS não encontrados")
    novo, n2 = re.subn(r"<!-- MARCAS:INICIO -->.*?<!-- MARCAS:FIM -->", lambda _: "<!-- MARCAS:INICIO -->\n      " + letreiro() + "\n      <!-- MARCAS:FIM -->", novo, flags=re.S)
    if n2 != 1:
        raise SystemExit("marcadores MARCAS não encontrados")
    p.write_text(novo, encoding="utf-8")
    print(f"{len(MARCAS)} marcas, {sum(len(m['videos']) for m in MARCAS)} vídeos, {len(EVENTOS)} eventos")


if __name__ == "__main__":
    main()
