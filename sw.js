/*
  📋 出勤簿 — 電波が無いときのための「控え」係
  （ネット上に置いたときだけ働く。パソコンでファイルを直に開いたときは何もしない）

  やっていること＝下の FILES を一度そっくり控えておき、
  以後は「まず控えから出す」。だから電波が無い所でも開ける。

  🔴 index.html を直したら CACHE の版番号を1つ上げること。
     上げないと iPhone が古い控えを出し続ける（publish.py が上げ忘れを止める）。

  🔴 古い控えを消すときは **自分の名前（PREFIX）で始まるものだけ**。
     🧮計算機（shiire-…）・📱タスク（todo-…）と同じ住所（luca-708.github.io）で動くので、控えの置き場は共有になる。
     「自分以外を全部消す」と、片方を更新したときにもう片方の控えを消し、
     電波の無い所で開けなくなる（2026-09-26 に作る前に気づいた）。
*/

var PREFIX = "shukkin-";
var CACHE = PREFIX + "v2";

// 控える物の一覧。"./" は入口（ホーム画面のアイコンが開くアドレス）＝中身は index.html
var FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png"];

// 控えが「全部そろった」ときだけ書く印。画面はこれを見て「電波が無くても開けます」と出す。
var MARK = "./__offline_ok";

// 控えを作った日（日本時間の日付。toISOString は世界標準時なので朝9時前は前の日になる）
function localDay(d) {
  function p(n) { return (n < 10 ? "0" : "") + n; }
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // 🔴 cache:"reload"＝ブラウザの一時置き場（GitHub Pages は10分持つ）を通さず必ず取り直す。
      //    通すと、公開から10分以内の直しで「新しい版の控えに古い画面」が入り、次の版まで直らない
      return c.addAll(FILES.map(function (f) { return new Request(f, { cache: "reload" }); })).then(function () {
        var body = JSON.stringify({ cache: CACHE, files: FILES, cachedOn: localDay(new Date()) });
        return c.put(MARK, new Response(body, { headers: { "Content-Type": "application/json" } }));
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) {
        return n.indexOf(PREFIX) === 0 && n !== CACHE ? caches.delete(n) : null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // 🔴 Discord への送信はここを通らない（別の住所）。控えから出すのは自分の画面だけ
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req);
    })
  );
});
