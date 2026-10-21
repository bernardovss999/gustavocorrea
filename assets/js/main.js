/* Gustavo Correa — interações e contador ao vivo */
(function () {
  "use strict";

  var INTERVALO_MS = 15000;
  var FONTES = ["api/seguidores", "dados/metricas.json"];

  /* ---------- formatação ---------- */
  function compacto(n) {
    if (n >= 1e6) return (Math.round(n / 1e5) / 10).toLocaleString("pt-BR") + " mi";
    if (n >= 1e3) return Math.round(n / 1e3).toLocaleString("pt-BR") + " mil";
    return String(n);
  }

  function formatar(m) {
    if (!m || typeof m.valor !== "number") return "—";
    return m.aprox ? compacto(m.valor) : m.valor.toLocaleString("pt-BR");
  }

  function totalSeguidores(p) {
    var partes = [p.instagram.seguidores, p.tiktok.seguidores, p.youtube.inscritos];
    return {
      valor: partes.reduce(function (s, m) { return s + m.valor; }, 0),
      aprox: partes.some(function (m) { return m.aprox; })
    };
  }

  function lerMetrica(dados, caminho) {
    var p = dados.plataformas;
    // a soma é sempre mostrada por extenso, mesmo com o YouTube arredondado
    if (caminho === "total.seguidores") return { valor: totalSeguidores(p).valor, aprox: false };
    var partes = caminho.split(".");
    return p[partes[0]] && p[partes[0]][partes[1]];
  }

  globalThis.GVST = { formatar: formatar, compacto: compacto, totalSeguidores: totalSeguidores, lerMetrica: lerMetrica };
  if (typeof document === "undefined") return;

  document.documentElement.classList.add("js");

  /* ---------- odômetro ---------- */
  var reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function montarOdometro(el, texto) {
    el.textContent = "";
    var caixa = document.createElement("span");
    caixa.className = "odo";
    caixa.setAttribute("aria-hidden", "true");
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i];
      if (/\d/.test(c)) {
        var d = document.createElement("span");
        d.className = "odo__d";
        var col = document.createElement("span");
        col.className = "odo__col";
        for (var k = 0; k <= 9; k++) {
          var s = document.createElement("span");
          s.textContent = k;
          col.appendChild(s);
        }
        d.appendChild(col);
        caixa.appendChild(d);
      } else {
        var sep = document.createElement("span");
        sep.className = "odo__s";
        sep.textContent = c === " " ? " " : c;
        caixa.appendChild(sep);
      }
    }
    el.appendChild(caixa);
    return caixa;
  }

  function girar(caixa, texto) {
    var digitos = texto.replace(/\D/g, "");
    caixa.querySelectorAll(".odo__col").forEach(function (col, i) {
      col.style.transform = "translateY(-" + digitos[i] + "em)";
    });
  }

  function escrever(el, texto, animarEntrada) {
    var anterior = el.dataset.texto;
    var mudou = anterior !== undefined && anterior !== texto;
    el.setAttribute("aria-label", texto);
    if (!el.hasAttribute("data-odometro") || reduzMovimento) {
      el.textContent = texto;
    } else {
      var mesmaForma = anterior && anterior.replace(/\d/g, "0") === texto.replace(/\d/g, "0");
      var caixa = mesmaForma ? el.querySelector(".odo") : montarOdometro(el, texto);
      if (animarEntrada && !mesmaForma) {
        requestAnimationFrame(function () { requestAnimationFrame(function () { girar(caixa, texto); }); });
      } else {
        girar(caixa, texto);
      }
    }
    el.dataset.texto = texto;
    if (mudou) {
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
    }
  }

  /* ---------- leitura e atualização ---------- */
  var statusTexto = document.getElementById("status-texto");
  var primeiraVez = true;
  var ultimoDado = null;

  function hora(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function aplicar(dados, animar, aoVivo) {
    document.querySelectorAll("[data-metrica]").forEach(function (el) {
      escrever(el, formatar(lerMetrica(dados, el.getAttribute("data-metrica"))), animar);
    });
    if (statusTexto) {
      statusTexto.textContent = (aoVivo ? "Ao vivo · " : "Última leitura · ") + hora(dados.atualizadoEm);
    }
    ultimoDado = dados;
  }

  function dadosIniciais() {
    var el = document.getElementById("metricas-iniciais");
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function buscarJson(url) {
    return fetch(url + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (dados) {
      if (!dados || !dados.plataformas) throw new Error("sem dados");
      return { dados: dados, aoVivo: url === FONTES[0] };
    });
  }

  function buscar() {
    if (!window.fetch || location.protocol === "file:") return Promise.reject(new Error("sem servidor"));
    return buscarJson(FONTES[0]).catch(function () { return buscarJson(FONTES[1]); });
  }

  function ciclo() {
    buscar().then(function (r) {
      var animar = primeiraVez;
      primeiraVez = false;
      aplicar(r.dados, animar, r.aoVivo);
    }).catch(function () {
      if (primeiraVez) {
        primeiraVez = false;
        var inicial = dadosIniciais();
        if (inicial) aplicar(inicial, true, false);
      }
    });
  }

  ciclo();
  setInterval(function () { if (!document.hidden) ciclo(); }, INTERVALO_MS);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) ciclo(); });

  /* ---------- menu ---------- */
  var btn = document.getElementById("menu-btn");
  var topo = document.getElementById("topo");
  function fecharMenu() {
    topo.classList.remove("menu-aberto");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Abrir menu");
  }
  btn.addEventListener("click", function () {
    var aberto = topo.classList.toggle("menu-aberto");
    btn.setAttribute("aria-expanded", String(aberto));
    btn.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  });
  document.querySelectorAll("#nav a").forEach(function (a) { a.addEventListener("click", fecharMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharMenu(); });

  /* ---------- player: troca a capa pelo vídeo na íntegra só no clique ---------- */
  function urlEmbed(player) {
    var tt = player.getAttribute("data-tiktok");
    if (tt) return "https://www.tiktok.com/player/v1/" + tt + "?autoplay=1&music_info=0&description=0&rel=0&native_context_menu=0";
    var ig = player.getAttribute("data-instagram");
    if (ig) return "https://www.instagram.com/" + ig + "/embed/";
    return null;
  }
  globalThis.GVST.urlEmbed = urlEmbed;

  document.querySelectorAll(".player").forEach(function (player) {
    var botao = player.querySelector("button.player__play");
    if (!botao) return;
    botao.addEventListener("click", function () {
      var src = urlEmbed(player);
      if (!src) return;
      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = botao.getAttribute("aria-label") || "Vídeo";
      iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      player.appendChild(iframe);
      player.classList.add("is-tocando");
      iframe.focus();
    });
  });

  /* ---------- revelação suave ---------- */
  var alvos = document.querySelectorAll(".cabeca, .botoes-links, .personagem, .videos-personagem, .alem, .tabela-plat, .soma, .marcas, .audiencia, .sobre, .mais-vistos, .agencia, .contato__topo");
  if ("IntersectionObserver" in window && !reduzMovimento) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visivel"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -5% 0px" });
    alvos.forEach(function (el) { el.classList.add("revela"); io.observe(el); });
  }
})();
