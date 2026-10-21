// Bug original: no topo, "GUSTAVO" e "CORREA" ficavam por cima do rosto e das pernas do Gustavo (a foto ficava "cortada" pelo texto).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "../playwright.js";
import { iniciar, SEM_REDE } from "../servidor.js";

let servidor, browser;
before(async () => { servidor = await iniciar(0, { ler: SEM_REDE }); browser = await chromium.launch(); });
after(async () => { await browser?.close(); servidor?.srv.close(); });

const sobrepoe = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;

// estilo antigo, usado só para provar que o teste pega o defeito
export const ESTILO_ANTIGO = `.hero__palco{display:block!important;position:relative;height:760px}
.hero__titulo{position:absolute!important;inset:0 48px;z-index:3}
.hero__l1{position:absolute;left:0;top:7%}.hero__l2{position:absolute;right:0;bottom:30%}
.hero__figura{position:absolute!important;left:50%;bottom:0;transform:translateX(-50%);height:96%}`;

async function medir(page) {
  return page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect().toJSON();
    const img = document.querySelector(".hero__figura img");
    return { img: r(".hero__figura img"), l1: r(".hero__l1"), l2: r(".hero__l2"), lede: r(".hero__lede"), hero: r(".hero"), carregou: img.complete && img.naturalWidth > 0, vw: innerWidth };
  });
}

for (const [w, h] of [[1440, 900], [1920, 1000], [768, 1024], [375, 812]]) {
  test(`foto do Gustavo inteira e sem texto por cima em ${w}px`, async () => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(servidor.url);
    await page.evaluate(() => document.fonts.ready);
    const m = await medir(page);
    assert.ok(m.carregou, "imagem do topo não carregou");
    for (const k of ["l1", "l2", "lede"]) assert.ok(!sobrepoe(m.img, m[k]), `${k} está por cima da foto`);
    assert.ok(m.img.left >= -1 && m.img.right <= m.vw + 1, "foto cortada na lateral");
    assert.ok(m.img.top >= m.hero.top - 1, "foto cortada em cima");
    await page.close();
  });
}

// Bug: o "GVST" do fundo foi pintado na frente de "CORREA" e do texto do topo (1920px)
test("GVST do fundo fica atrás do nome e do texto", async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1000 } });
  await page.goto(servidor.url);
  await page.evaluate(() => document.fonts.ready);
  const cobertos = await page.evaluate(() => (document.querySelector(".hero__gvst").style.pointerEvents = "auto", [".hero__l2", ".hero__lede"]).filter((sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    for (let x = r.left + 4; x < r.right; x += 12) {
      const topo = document.elementFromPoint(x, r.top + r.height / 2);
      if (topo && topo.closest(".hero__gvst")) return true;
    }
    return false;
  }));
  assert.deepEqual(cobertos, []);
  await page.close();
});

test("o teste pega o defeito com o layout antigo", async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(servidor.url);
  await page.addStyleTag({ content: ESTILO_ANTIGO });
  const m = await medir(page);
  assert.ok(sobrepoe(m.img, m.l1) || sobrepoe(m.img, m.l2), "com o layout antigo o texto deveria cobrir a foto");
  await page.close();
});
