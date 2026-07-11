# テストリスト（t_wada 流 TDD）

完了したら `[x]`。実装中に気づいたことは随時追記する。

## Phase 1: コア codec

### ① crc16 (CRC-16/CCITT-FALSE)
- [x] 既知ベクタ `"123456789"` → `0x29B1`
- [x] 空バイト列 → 初期値 `0xFFFF`
- [x] 1 バイト入力

### ② bits (BitWriter / BitReader)
- [x] 書いたビット列がそのまま読める（往復）
- [x] バイト境界を跨ぐ書き込み・読み出し
- [x] 端数ビットは 0 パディングされてバイト列化される
- [x] 範囲外読み出しで例外

### ③ payload（平文 codec）
- [x] encode→decode ラウンドトリップ
- [x] years 境界: 1 / 255。0 と 256 は例外
- [x] ID 境界: 1 byte / 64 byte は OK、65 byte は例外、空は例外
- [x] マルチバイト UTF-8（日本語・絵文字）の往復
- [x] 不正 version の decode は例外

### ④ crypto (AES-256-GCM)
- [x] encrypt→decrypt ラウンドトリップ
- [x] ブロブ長 = 12(IV) + 平文長 + 16(tag)
- [x] IV は毎回異なる（同一平文でも暗号文が異なる）
- [x] 暗号文 1bit 改竄で reject
- [x] tag 改竄で reject
- [x] 別鍵で reject
- [x] AAD 不一致で reject

### ⑤ container（ヘッダ + 長さ + CRC）
- [x] frame→unframe ラウンドトリップ
- [x] CRC 不一致を検出
- [x] 長さ超過・切り詰めを検出
- [x] 不正フォーマット版を検出

## Phase 2: バーコードエンコード

### ⑥ layout
- [x] データ容量 = 890 bit
- [x] 四隅がファインダー
- [x] タイミング行・列の交互性
- [x] 全セルが排他的に分類される（64×18 全数チェック）

### ⑦ encode
- [x] 行列サイズ 64×18
- [x] layout 経由のビット往復（encode → データセル読み出し）
- [x] 容量超過で例外

### ⑧ rasterize
- [x] scale=20 で 1280×360 の RGBA
- [x] モジュール色が 0 or 255 の二値
- [x] 任意 scale 対応

## Phase 3: デコード（頑健性）

- [x] ⑨ 無劣化ラスタからのラウンドトリップ（scale 20）
- [x] ⑩ 整数縮小（1/2, 1/4 平均プーリング）後のデコード
- [x] ⑪ 非整数スケール（×0.53 バイリニア）後のデコード
- [x] ⑫ 輝度シフト（+40/−40）・コントラスト低下後のデコード
- [x] ⑬ box blur（3×3 ×2 回）後のデコード
- [x] ⑭ jpeg-js q=70 / q=50+50% 縮小（← Reed-Solomon 要否の判断ゲート）
- [x] ⑮ 乱数ノイズ画像 → 型付きエラー（ゴミを返さない）
- [x] ⑯ 180° 回転画像 → 自動補正して復元（エラーではなく補正を採用）

## Phase 4: API Routes

### ⑰ /api/issue
- [x] 正常系: base64 ブロブが返り、decrypt すると入力 ID・years・現在時刻±数秒の timestamp
- [x] ID 空 / 65 byte 超 / years 0・256 → 400
- [x] 鍵未設定 → 500

### ⑱ /api/verify
- [x] issue の出力を渡すと元データが返る
- [x] 改竄ブロブ → 422
- [x] base64 でない → 400

### ⑲ 統合
- [x] issue → frame → encode → rasterize → JPEG 劣化 → decode → unframe → verify の全経路

## Phase 5–6: UI

- [ ] ⑳ GeneratorForm: バリデーションメッセージ / 送信時の fetch body
- [ ] ㉑ VerifyResult: 成功時に ID・周年・JST 時刻 / 失敗理由の表示分岐

## 気づいたこと（随時追加）

- Phase 3 の判断ゲート（JPEG q=50 + 50% 縮小）を素通しで通過 → **Reed-Solomon は不要と確定**（ヘッダの ECC ビットは将来用に予約のまま）
- 180° 回転は「エラー」ではなく自動補正（rotate180 ビューで再試行）を採用
- 縦長の合成画像（ストリップ + 本文）を模したテストを追加（padBelow ヘルパー）
