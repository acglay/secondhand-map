// 住所→緯度経度(国土地理院 住所検索API)と超大型フラグ(mega)を data/*.json に書き込む
// 使い方: node geocode.mjs   (lat/lng 済みの店はスキップ。やり直すときは --force)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

// data/ 内の全JSON(monnaka / ofuna / yugawara / wide-*.json)
const FILES = readdirSync(new URL("./data/", import.meta.url)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
// 距離チェックの基準点(遠征=wide は門仲からの距離を表示するだけで警告しない)
const BASE = { monnaka: [35.6717, 139.7958], ofuna: [35.3537, 139.5313], yugawara: [35.1460, 139.1083], wide: [35.6717, 139.7958] };
const force = process.argv.includes("--force");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const km = ([a, b], [c, d]) => {
  const R = 6371, t = Math.PI / 180;
  const x = Math.sin(((c - a) * t) / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin(((d - b) * t) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
// ビル名・階・括弧書きを落とす(「…1-2-7 アスミビル」→「…1-2-7」)
const clean = (addr) => addr.replace(/[((].*?[))]/g, "").split(/[\s ]/)[0].replace(/地下.*$/, "");

// 超大型: SUPER BAZAAR / 公式に売場300坪以上 / ハードオフとオフハウスが同一施設
function isMega(s, all) {
  if (s.area === "wide") return true; // 遠征枠は巨大店の基準で集めた店だけ
  if (s.super_bazaar) return true;
  const tsubo = Number((s.size || "").match(/(\d+)\s*坪/)?.[1] || 0);
  if (tsubo >= 300) return true;
  const fmt = (x) => (x.name.match(/ハードオフ|オフハウス/) || [])[0];
  if (fmt(s)) {
    const site = clean(s.address);
    const formats = new Set(all.filter((x) => clean(x.address) === site).map(fmt).filter(Boolean));
    if (formats.has("ハードオフ") && formats.has("オフハウス")) return true;
  }
  return false;
}

for (const file of FILES) {
  const path = new URL(`./data/${file}.json`, import.meta.url);
  const shops = JSON.parse(readFileSync(path, "utf8"));
  const area = shops[0]?.area ?? file;
  for (const s of shops) {
    s.mega = isMega(s, shops);
    if (s.lat && !force) continue;
    const q = clean(s.address);
    const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`);
    const hit = (await res.json())[0];
    if (hit) {
      [s.lng, s.lat] = hit.geometry.coordinates;
      s.geo_title = hit.properties.title;
    } else {
      s.lat = s.lng = null;
      s.geo_title = "";
    }
    const d = s.lat ? km(BASE[area], [s.lat, s.lng]) : NaN;
    console.log(`${(d > 35 && area !== "wide") || !s.lat ? "!" : " "} ${area} ${d.toFixed(1)}km | ${s.name} | ${q} -> ${s.geo_title}`);
    await sleep(300);
  }
  writeFileSync(path, JSON.stringify(shops, null, 2));
}
