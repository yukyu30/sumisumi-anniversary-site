#!/usr/bin/env node
/**
 * 本番スモークテスト:
 *   node scripts/smoke-production.mjs https://sumisumi-anniversary.lolipop-now.app
 *
 * ページ表示 / issue→verify 往復 / 改竄拒否 を確認する。
 * ANNIV_SECRET_KEY がダッシュボードに設定されていないと issue が 500 になる。
 */
const base = process.argv[2];
if (!base) {
  console.error("使い方: node scripts/smoke-production.mjs <BASE_URL>");
  process.exit(1);
}

let failed = false;
function check(name, ok, detail = "") {
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed = true;
}

for (const path of ["/", "/generate", "/verify"]) {
  const res = await fetch(base + path);
  check(`GET ${path}`, res.status === 200, `status ${res.status}`);
}

const issueRes = await fetch(`${base}/api/issue`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ id: "smoke-test" }),
});
const issued = await issueRes.json().catch(() => ({}));
check(
  "POST /api/issue",
  issueRes.status === 200 && !!issued.payload,
  `status ${issueRes.status}${issueRes.status === 500 ? "（ANNIV_SECRET_KEY 未設定の可能性）" : ""}`,
);

if (issued.payload) {
  const verifyRes = await fetch(`${base}/api/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload: issued.payload }),
  });
  const verified = await verifyRes.json().catch(() => ({}));
  check(
    "POST /api/verify（往復）",
    verifyRes.status === 200 && verified.id === "smoke-test",
    `status ${verifyRes.status}`,
  );

  const tampered = Buffer.from(issued.payload, "base64");
  tampered[14] ^= 1;
  const tamperRes = await fetch(`${base}/api/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload: tampered.toString("base64") }),
  });
  check("改竄ブロブの拒否 (422)", tamperRes.status === 422, `status ${tamperRes.status}`);
}

process.exit(failed ? 1 : 0);
