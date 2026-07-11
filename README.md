# 墨澄 -SumiSumi- 2周年記念ジェネレーター

アバター「[墨澄](https://lp.suzuri.jp/3d-t-shirt)」の2周年を、写真にフレームを重ねた**チェキ風の記念画像**にして残すサイト（ファンによる非公式）。

[**Deploy with ロリポップ！デプロイナウ**](https://lolipop.jp/deploy-now)

- **つくる**: ID を入れてフレーム色と写真を選ぶと、チェキ風カードに合成。フレーム（リボン）はドラッグで移動・リサイズできる。下部に QR コードと `#Sumi3D`、ID を焼き込む
- **認証**: 画像の QR を読み込むと、**Ed25519 署名**を検証。正当な画像だけが立体的なチェキとして表示され、ID・周年・発行時刻が復元される

## 署名の仕組み（発行＝秘密鍵 / 検証＝公開鍵）

共通鍵ではなく **Ed25519 の公開鍵署名**を使う。

| 層 | 役割 |
| --- | --- |
| `/api/issue` | `{id}` を受け取り、サーバー時刻＋固定の周年数(2)を **秘密鍵で署名** → `token = payload + 署名(64B)` を base64 で返す |
| `/api/verify` | QR の token を **公開鍵で検証** → 成功で `{id, years, issuedAt}` を返す |
| ブラウザ | QR 生成（`qrcode`）・チェキ合成・QR 読取（`jsqr`）。実サイズ出力 |

秘密鍵はサーバーだけが持つため、**このサイト（の秘密鍵）でしか正しい署名を作れない**。検証は公開鍵だけででき、後述のとおりサイトが無くても第三者が独立に検証できる。

## 開発

```bash
pnpm install
cp .env.example .env.local   # 鍵ペアを生成して両方セット（.env.example のコマンド参照）
pnpm dev
```

```bash
pnpm test    # 全テスト
pnpm build   # 本番ビルド（standalone）
```

鍵ペアの生成:

```bash
node -e 'const c=require("crypto").webcrypto;(async()=>{const k=await c.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);console.log("ANNIV_PRIVATE_KEY="+Buffer.from(await c.subtle.exportKey("pkcs8",k.privateKey)).toString("base64"));console.log("ANNIV_PUBLIC_KEY="+Buffer.from(await c.subtle.exportKey("raw",k.publicKey)).toString("base64"))})()'
```

## デプロイ（ロリポップ デプロイナウ）

```bash
lolipop deploy --name sumisumi-anniversary --framework next
```

- リモートビルドは **npm**（`package-lock.json` をコミット）。`output: "standalone"` / `images.unoptimized` はデプロイナウの要件
- **`.env` は参照されない** → ダッシュボードの「環境変数」に `ANNIV_PRIVATE_KEY`（秘密鍵）と `ANNIV_PUBLIC_KEY`（公開鍵）を設定。生成受付は `src/app/api/issue/route.ts` の `GENERATION_DEADLINE` まで

---

## 署名を自分で検証する（サイトが無くても確認できる）

記念画像の QR には検証 URL `…/verify?t=<TOKEN>` が入っている（`TOKEN` は base64）。
このサイトが閉じても、**公開鍵さえあれば誰でも独立に署名を検証**できる。

### 公開鍵（Ed25519, raw 32バイトを base64）

```
3CzZqgYAoRhXwtfosec4UKmAe9LAcxU0By7dlGg1CWI=
```

### トークン / ペイロードの形式

```
token   = payload || signature(64B)          … すべて連結し base64 化
signature = Ed25519( payload )               … payload 全体への署名

payload（署名対象、ビッグエンディアン）:
  offset size  内容
  0      1     version (0x01)
  1      1     years (=2)
  2      8     timestamp : 発行時刻 unix秒 (uint64 BE)
  10     1     idLength = N
  11     N     id : UTF-8
```

### 検証スクリプト（Node.js 単体・依存なし）

```js
// verify-token.mjs — 使い方: node verify-token.mjs "<QRのt=に入っている文字列>"
const PUBLIC_KEY_B64 = "3CzZqgYAoRhXwtfosec4UKmAe9LAcxU0By7dlGg1CWI=";

const tokenB64 = decodeURIComponent(process.argv[2] ?? "");
const token = Buffer.from(tokenB64, "base64");
const payload = token.subarray(0, token.length - 64);
const signature = token.subarray(token.length - 64);

const key = await crypto.subtle.importKey(
  "raw",
  Buffer.from(PUBLIC_KEY_B64, "base64"),
  { name: "Ed25519" },
  false,
  ["verify"],
);
const ok = await crypto.subtle.verify("Ed25519", key, signature, payload);
if (!ok) {
  console.error("❌ 署名が不正です（このサイトが発行した画像ではありません）");
  process.exit(1);
}

const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
const years = payload[1];
const timestamp = Number(view.getBigUint64(2));
const idLen = payload[10];
const id = Buffer.from(payload.subarray(11, 11 + idLen)).toString("utf8");
console.log("✅ 本物です");
console.log({ id, years, issuedAt: new Date(timestamp * 1000).toISOString() });
```

QR の中身が URL（`…/verify?t=XXXX`）の場合は、`t` の値（`XXXX`）を渡す。
検証に成功すれば、その画像は確かにこのサイトの秘密鍵で発行されたもの。
