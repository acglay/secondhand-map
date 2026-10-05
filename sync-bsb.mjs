// BOOKOFF SUPER BAZAAR 公式一覧(https://www.bookoff.co.jp/brand/bsb/)の売場面積を正本として data に反映する
// - 既存の店(source の shopNNNNN で突き合わせ)は floor_m2 を公式値に置き換える
// - データに無い店は data/far.json に追加(住所・営業時間・駐車場は各店舗ページから取得)
// 使い方: node sync-bsb.mjs → node geocode.mjs → node build.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const LIST = "https://www.bookoff.co.jp/brand/bsb/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]*>/g, "\n").split("\n").map((s) => s.trim()).filter(Boolean);

const listHtml = await (await fetch(LIST)).text();
const official = [...listHtml.matchAll(/shop(\d+)\.html">(BOOKOFF SUPER BAZAAR [^<(]+(?:\([^)]*館\))?)\(平米数：([\d.]+)㎡\)</g)]
  .map(([, id, name, m2]) => ({ id, name: name.trim(), m2: Number(m2) }));
console.log(`公式一覧: ${official.length}店`);

const dir = new URL("./data/", import.meta.url);
const files = Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => [f, JSON.parse(readFileSync(new URL(f, dir), "utf8"))]));
const idOf = (s) => (s.source || "").match(/shop(\d+)\.html/)?.[1];
const today = new Date().toISOString().slice(0, 10);

const seen = new Set();
for (const [f, shops] of Object.entries(files)) {
  for (const s of shops) {
    const o = official.find((x) => x.id === idOf(s));
    if (!o) continue;
    seen.add(o.id);
    const prev = s.floor_m2 && Math.round(s.floor_m2) !== Math.round(o.m2) ? `(以前の値 ${Math.round(s.floor_m2)}㎡: ${s.floor_note || ""})` : "";
    s.floor_m2 = o.m2;
    s.floor_source = LIST;
    s.floor_note = `ブックオフ公式BSB一覧の平米数(${today}取得)${prev}`;
    console.log(`更新 ${f} ${s.name} ${o.m2}㎡ ${prev ? "※値が変わった" : ""}`);
  }
}

const far = files["far.json"];
for (const o of official.filter((x) => !seen.has(x.id))) {
  const url = `https://www.bookoff.co.jp/shop/shop${o.id}.html`;
  const t = text(await (await fetch(url)).text());
  const after = (label) => t[t.indexOf(label) + 1] || "";
  // 所在地 → 〒 → 住所 の順に別行で並ぶ
  const i = t.indexOf("所在地");
  const addr = i < 0 ? "" : /^〒/.test(t[i + 1]) ? t[i + 2] : t[i + 1];
  const parkLine = after("駐車場");
  const count = Number(parkLine.match(/(\d[\d,]*)台/)?.[1].replace(/,/g, "")) || null;
  far.push({
    name: o.name, chain: "BOOKOFF", area: "far", address: addr, nearest: "",
    categories: ["本", "ゲーム", "トレカ", "ホビー", "家電", "服", "ブランド", "雑貨"],
    fashion_only: false, super_bazaar: true, large: true,
    size: `BOOKOFF SUPER BAZAAR(公式一覧で${o.m2}㎡)`, highlight: "",
    hours: after("営業時間"), source: url, confidence: addr ? "high" : "medium",
    parking: /あり/.test(parkLine) ? "yes" : /なし/.test(parkLine) ? "no" : "unknown",
    parking_count: count, parking_fee: null,
    parking_ease: /なし/.test(parkLine) ? "none" : count == null ? null : count >= 30 ? "ok" : count >= 10 ? "ok" : "hard",
    parking_note: parkLine, parking_source: url,
    floor_m2: o.m2, floor_source: LIST, floor_note: `ブックオフ公式BSB一覧の平米数(${today}取得)`,
  });
  console.log(`追加 far ${o.name} | ${addr} | ${parkLine}`);
  await sleep(500);
}

for (const [f, shops] of Object.entries(files)) writeFileSync(new URL(f, dir), JSON.stringify(shops, null, 2));
