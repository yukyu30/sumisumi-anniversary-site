# 墨澄 -SumiSumi- 周年記念ジェネレーター

アバター「[墨澄](https://lp.suzuri.jp/3d-t-shirt)」との周年記念を、**検証できる記念画像**にして残すサイト。

- **発行**: ID（VRChat / X など）と周年数を入力して写真を選ぶと、墨テーマの記念画像が生成される。画像上部にはバーコード風の白黒もようが焼き込まれる
- **証明**: もようの中身は `{周年数, ID, 発行時刻}` を **AES-256-GCM**（鍵はサーバーのみ保管）で暗号化したもの。検証ページで画像を読み込むと復号・認証検証され、成功すれば「このシステムが発行した本物」と証明される（JWT 的な真正性保証）
- **頑健性**: SNS の JPEG 再圧縮・50% 縮小・明るさ変化・180° 回転を経ても読み取れる（テストで担保）

## アーキテクチャ

「暗号はサーバー、ピクセルはブラウザ」:

| 層 | 役割 |
| --- | --- |
| `/api/issue` | ID+周年を検証し、サーバー時刻を添えて暗号化ブロブを発行 |
| `/api/verify` | ブロブを復号、GCM タグ検証成功で ID/周年/発行時刻を返す |
| ブラウザ Canvas | バーコード描画・写真合成・読み取り（`src/lib` の純粋関数に委譲） |

ネイティブ依存（sharp 等）ゼロ。コアロジックは `src/lib` の純粋関数群で、Vitest でテストされている（`docs/test-list.md` 参照）。

## 開発

```bash
pnpm install
cp .env.example .env.local
# ANNIV_SECRET_KEY を設定（openssl rand -hex 32）
pnpm dev
```

```bash
pnpm test        # 全テスト（unit: node / ui: jsdom）
pnpm build       # 本番ビルド（standalone）
```

## デプロイ（ロリポップ デプロイナウ）

```bash
lolipop deploy --name sumisumi-anniversary --framework next
```

- リモートビルドは **npm** で行われるため `package-lock.json` をコミットしている（更新: 依存変更時に `npm install --package-lock-only`）
- **`.env` はデプロイ先で参照されない**。`ANNIV_SECRET_KEY` は必ずダッシュボードの「環境変数」タブに設定すること（未設定だと発行 API が 500 を返す）
- `next.config.ts` の `output: "standalone"` と `images.unoptimized: true` はデプロイナウの動作要件
