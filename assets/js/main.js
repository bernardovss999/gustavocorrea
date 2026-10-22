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

  /* ---------- loops contínuos: duplica o conteúdo dos trilhos ---------- */
  function duplicar(trilho) {
    Array.prototype.slice.call(trilho.children).forEach(function (filho) {
      var copia = filho.cloneNode(true);
      copia.setAttribute("data-clone", "");
      copia.setAttribute("aria-hidden", "true");
      copia.querySelectorAll("img").forEach(function (im) { im.alt = ""; });
      trilho.appendChild(copia);
    });
  }
  document.querySelectorAll(".ticker__trilho, .letreiro__trilho, .vitrine__col").forEach(duplicar);

  /* ---------- vitrine: vídeos do fundo só tocam com o topo visível ---------- */
  var conexao = navigator.connection || {};
  var videosFundo = document.querySelectorAll(".vitrine video");
  function carregar(video) {
    if (video.dataset.carregado) return;
    video.querySelectorAll("source[data-src]").forEach(function (s) { s.src = s.getAttribute("data-src"); });
    video.dataset.carregado = "1";
    video.load();
  }
  // todos os vídeos da vitrine tocam juntos enquanto o topo está na tela (pausam fora dela)
  function tocarTodos() {
    videosFundo.forEach(function (v) {
      carregar(v);
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }
  var vitrine = document.querySelector(".vitrine");
  if (vitrine && !reduzMovimento && !conexao.saveData) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        if (entradas[0].isIntersecting) tocarTodos();
        else videosFundo.forEach(function (v) { v.pause(); });
      }).observe(vitrine);
    } else {
      tocarTodos();
    }
  }

  /* ---------- retrato acompanha o mouse ---------- */
  var retrato = document.getElementById("retrato");
  var figura = document.querySelector(".hero__figura");
  if (retrato && figura && !reduzMovimento && window.matchMedia("(hover: hover)").matches) {
    figura.addEventListener("mousemove", function (e) {
      var r = figura.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      retrato.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
      retrato.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
    });
    figura.addEventListener("mouseleave", function () {
      retrato.style.setProperty("--ry", "0deg");
      retrato.style.setProperty("--rx", "0deg");
    });
  }

  /* ---------- jogo: monte o seu homem performático ---------- */
  var FRASES = [
    [0, "Apenas um cara tranquilo"],
    [1, "Começando a performar"],
    [3, "Achei conceito"],
    [5, "Bem astéric"],
    [6, "100% homem performático 💆🏾‍♂️"]
  ];
  function frasePara(qtd) {
    var f = FRASES[0][1];
    FRASES.forEach(function (par) { if (qtd >= par[0]) f = par[1]; });
    return f;
  }
  globalThis.GVST.frasePara = frasePara;

  var monte = document.getElementById("monte");
  if (monte) {
    var itens = monte.querySelectorAll(".item");
    var medidor = document.getElementById("medidor");
    var nivel = document.getElementById("nivel");
    var nivelFrase = document.getElementById("nivel-frase");
    var carinha = document.getElementById("nivel-emoji");
    var confete = document.getElementById("confete");
    var CARINHAS = ["😐", "🙂", "🙂", "😎", "😎", "💅🏾", "💆🏾‍♂️"];
    var soltarConfete = function () {
      if (reduzMovimento || !confete) return;
      var bichos = ["🍃", "✨", "💆🏾‍♂️", "☕", "📚", "🤎", "✌🏾"];
      for (var i = 0; i < 18; i++) {
        var e = document.createElement("span");
        e.textContent = bichos[i % bichos.length];
        e.style.left = Math.round(Math.random() * 92) + "%";
        e.style.animationDelay = (Math.random() * 0.5).toFixed(2) + "s";
        e.style.setProperty("--g", Math.round(Math.random() * 120 - 60) + "deg");
        confete.appendChild(e);
      }
      setTimeout(function () { confete.textContent = ""; }, 2600);
    };
    var atualizarMedidor = function () {
      var qtd = monte.querySelectorAll('.item[aria-pressed="true"]').length;
      var pct = Math.round((qtd / itens.length) * 100);
      var frase = frasePara(qtd);
      medidor.style.setProperty("--nivel", pct + "%");
      var emoji = CARINHAS[qtd];
      if (carinha.textContent !== emoji) {
        carinha.textContent = emoji;
        carinha.classList.remove("is-mudou"); void carinha.offsetWidth; carinha.classList.add("is-mudou");
      }
      medidor.setAttribute("aria-valuenow", String(pct));
      medidor.setAttribute("aria-valuetext", pct + "%, " + frase.toLowerCase());
      nivel.textContent = pct + "%";
      nivelFrase.textContent = frase;
      var completo = qtd === itens.length;
      if (completo && !monte.classList.contains("is-completo")) soltarConfete();
      monte.classList.toggle("is-completo", completo);
    };
    itens.forEach(function (item) {
      item.addEventListener("click", function () {
        item.setAttribute("aria-pressed", String(item.getAttribute("aria-pressed") !== "true"));
        atualizarMedidor();
      });
    });
  }

  /* ---------- copiar cupom ---------- */
  document.querySelectorAll(".cupom__copiar").forEach(function (b) {
    b.addEventListener("click", function () {
      var codigo = b.getAttribute("data-cupom");
      var ok = function () {
        b.textContent = "Copiado! ✌🏾";
        b.classList.add("is-copiado");
        setTimeout(function () { b.textContent = "Copiar cupom"; b.classList.remove("is-copiado"); }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(codigo).then(ok, ok);
      else ok();
    });
  });

  /* ---------- vibe performática: barra e selo de "nível de performance" + barra fixa do mobile ---------- */
  var fill = document.getElementById("performance-fill");
  var selo = document.getElementById("performance-selo");
  var seloNum = document.getElementById("performance-num");
  var dock = document.getElementById("dock");
  var contato = document.getElementById("contato");
  function nivelPerformance() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
  }
  globalThis.GVST.nivelPerformance = nivelPerformance;
  var pendente = false;
  function atualizarPerformance() {
    pendente = false;
    var pct = nivelPerformance();
    if (fill) fill.style.setProperty("--p", (pct / 100).toFixed(3));
    if (seloNum) seloNum.textContent = pct + "%";
    var passouTopo = window.scrollY > window.innerHeight * 0.8;
    var noContato = contato && contato.getBoundingClientRect().top < window.innerHeight * 0.85;
    if (selo) {
      selo.classList.toggle("is-visivel", passouTopo);
      selo.classList.toggle("is-max", pct >= 99);
    }
    if (dock) dock.classList.toggle("is-visivel", passouTopo && !noContato);
  }
  window.addEventListener("scroll", function () {
    if (!pendente) { pendente = true; requestAnimationFrame(atualizarPerformance); }
  }, { passive: true });
  window.addEventListener("resize", atualizarPerformance);
  atualizarPerformance();

  /* ---------- revelação suave ---------- */
  // itens de grade entram em cascata
  document.querySelectorAll(".redes-grandes, .cupons, .mais-links, .grade-videos, .marca__videos, .galeria, .alem__lista").forEach(function (grade) {
    Array.prototype.forEach.call(grade.children, function (filho, i) { filho.style.setProperty("--atraso", (i % 6) * 0.07 + "s"); });
  });
  var alvos = document.querySelectorAll(".cabeca, .redes-grandes > li, .cupom, .mais-links > li, .personagem, .grade-videos > li, .alem__lista > li, .tabela-plat, .soma, .letreiro, .publi-marca, .audiencia, .sobre, .galeria > figure, .mais-vistos .subtitulo, .agencia, .contato__topo");
  if ("IntersectionObserver" in window && !reduzMovimento) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visivel"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -5% 0px" });
    alvos.forEach(function (el) { el.classList.add("revela"); io.observe(el); });
    // rede de segurança: em rolagem muito rápida o observer pode pular itens; revela tudo que já passou pela tela
    var agendado = false;
    var revelarPassados = function () {
      agendado = false;
      var limite = window.innerHeight * 0.95;
      document.querySelectorAll(".revela:not(.is-visivel)").forEach(function (el) {
        if (el.getBoundingClientRect().top < limite) { el.classList.add("is-visivel"); io.unobserve(el); }
      });
    };
    window.addEventListener("scroll", function () {
      if (!agendado) { agendado = true; requestAnimationFrame(revelarPassados); }
    }, { passive: true });
  }
})();
