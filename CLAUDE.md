# secondhand-map — 中古店まとめ(門仲・大船・湯河原)

## 目的
家族の拠点(門前仲町・大船・湯河原)から行けるブックオフ/ハードオフ系などの中古店一覧。BOOKOFF SUPER BAZAAR・大型店・品揃えが特徴的な店を上に出す。ファッション専門店は載せるが既定で非表示(チェックで表示)。

## 構成(素のHTML、ビルドツールなし)
- `data/<area>.json` — 店データ(area: monnaka / ofuna / yugawara)。フィールド: name, chain, area, address, nearest, categories[], fashion_only, super_bazaar, large, size, highlight, hours, source, confidence(high|medium|low。lowは「要確認」バッジ)
- `template.html` — 画面。`__DATA__` にデータが埋め込まれる
- `build.mjs` — data/*.json → `index.html`(生成物。直接編集しない)
- hub: tag=tool。🏠は `#hub=` 付きで開いたときのみ表示

## Build, Test & Verify
- `node build.mjs` — index.html 生成(データ・テンプレ変更後は必須)
- 確認: `npx serve .` などで開き `node Z:/Claude/_tools/smoke.mjs --app secondhand-map <url>`
- デプロイ: `"C:/Users/Taro/AppData/Roaming/npm/vercel.cmd" deploy --prod --yes`(Bashツールで)→ https://secondhand-map.vercel.app

## データ更新の注意
- 閉店が多い業態。追加・更新時は公式店舗ページで確認し source にURLを残す。推測の数値は書かない
