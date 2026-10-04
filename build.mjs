// data/*.json を1つにまとめて index.html に埋め込む(file:// で開けるように)
// 使い方: node build.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const dir = new URL("./data/", import.meta.url);
const shops = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8")));

const tpl = readFileSync(new URL("./template.html", import.meta.url), "utf8");
const json = JSON.stringify(shops).replace(/</g, "\\u003c");
writeFileSync(new URL("./index.html", import.meta.url), tpl.replace("__DATA__", json));
console.log(`${shops.length} shops -> index.html`);
