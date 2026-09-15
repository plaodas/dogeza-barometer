# 土下座バロメーター

表情・声量・話速から「今、床と融合すべきか」を 0〜100 で出す、ブラウザ完結のジョーク AR です。

- デモ: [dogeza-barometer.vercel.app](https://dogeza-barometer.vercel.app/)
- リポジトリ: [github.com/plaodas/dogeza-barometer](https://github.com/plaodas/dogeza-barometer)

フリーランスエンジニアのポートフォリオ兼、**AI ペアプロでゼロからプロダクトを出す**実験です。仕様・実機確認・やり直しの判断は自分、実装の大半は Cursor 上のエージェントに任せています。

## できること

- **ホーム → 計測 → 結果** まで一通りの画面
- カメラの顔（MediaPipe Face Landmarker）とマイク（音量 dB・話速 WPM）から土下座レベルを算出
- 計測中だけ、顔の上に Three.js の鬼の角。レベルで大きさと色が変わる
- 正面 / 背面 / 仮想カメラの切り替え（スマホはストリームを止めてから撮り直し）
- 床テクスチャと、レベル 80 以上で「土下座推奨」アラート

スコアの骨子は次の式です。表情を主、声を副にしています。

```text
level = lift(face × 0.6 + volume × 0.3 + wpm × 0.1)
```

サーバーも API キーもありません。カメラとマイクは端末内だけで使います。

## 技術

| 領域 | 内容 |
| --- | --- |
| UI | React 19 + TypeScript + Vite |
| 顔 | MediaPipe Face Landmarker（blendshape → 怒り / 困惑 / 悲しみ） |
| 角 | Three.js のオーバレイ。映像と同じ向きに合わせる |
| 音声 | Web Audio（RMS → dB、ピーク間隔 → WPM） |
| カメラ | `getUserMedia`、iOS / Android の facingMode 差を考慮 |

ブラウザのカメラ・音声・WebGL を一本の画面に載せるところと、**正面カメラの左右反転で角がずれる問題を実機で切り分けたところ**が、このリポジトリの技術的な中身です。

## AI との役割分担

丸投げのノーコードではなく、次の分担です。

- **自分** — 何を作るか、画面フロー、スコアの意味、スマホでの合否、次に直す箇所
- **AI** — TypeScript の実装、コンポーネント分割、カメラ / MediaPipe / Three.js の配線

「速く出す」ことより、出してから実機で見て、仮説を変えて、もう一度出す、というループを残しています。

## 動かし方

公開版は [https://dogeza-barometer.vercel.app/](https://dogeza-barometer.vercel.app/) です。カメラとマイクを使うので、スマホ実機か HTTPS / `localhost` で開いてください。

```bash
npm install
npm run dev
```

ブラウザで `http://127.0.0.1:5173/` 。同じ LAN のスマホから触る場合は、Vite が `host: true` なので端末の IP でも届きます。HTTPS が必要な環境では、その前提でホストしてください。

初回はカメラ・マイクの許可が必要です。顔が暗いと「顔なし」になることがあります。

## 制約と今後

- フロントエンドのみの MVP です
- スマホの角位置は、機種によってまだ頭からずれることがあります（実機合わせを継続中）
- ホーム画面には角を出していません。計測（LIVE）だけです

## ライセンス

MIT License で公開しています。
