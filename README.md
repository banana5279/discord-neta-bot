# Discordネタbot

`discord.js` で作った軽めのネタ返し用 Discord bot です。

## できること

- `!ping` でゆるい生存確認
- 特定画像が投稿されたら、その投稿より上のメッセージを1秒ごとに削除する

## 使い方

```powershell
cd "C:\Users\Owner\OneDrive\ドキュメント\discord-neta-bot"
npm.cmd install
Copy-Item .env.example .env
notepad .env
```

`.env` に bot トークンを入れたら起動:

```powershell
npm.cmd start
```

## AWS で常時起動するなら

一番ラクなのは Amazon Lightsail の小さい Linux インスタンスです。料金が読みやすく、Discord bot みたいな常駐プロセスと相性がいいです。

### おすすめ構成

- まずは `Lightsail Linux/Unix $5/月` か `IPv6 only $3.50/月` 相当の小さいプラン
- Ubuntu を選ぶ
- bot のロールに `Manage Messages` を付けたまま運用

### Lightsail に置く流れ

1. インスタンスを作る
2. SSH で入る
3. Node.js 24 を入れる
4. このプロジェクトを配置する
5. `.env` を作る
6. `npm ci` して `systemd` で常駐化する

### systemd の例

```ini
[Unit]
Description=discord-neta-bot
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/ubuntu/discord-neta-bot
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
User=ubuntu
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Docker で載せたい場合

このリポジトリには [Dockerfile](C:\Users\Owner\OneDrive\ドキュメント\discord-neta-bot\Dockerfile) も入れてあるので、Lightsail Container、App Runner、ECS にも持っていけます。

## 画像トリガー削除の設定

1. 削除トリガーにしたい画像を `assets/delete-trigger.png` として置く
2. bot のロールに `Manage Messages` 権限を付ける
3. 必要なら `.env` に設定を足す

```env
DISCORD_TOKEN=ここにBotのトークン
PREFIX=!
DELETE_INTERVAL_MS=1000
DELETE_MAX_MESSAGES=50
TRIGGER_IMAGE_PATH=assets/delete-trigger.png
TRIGGER_IMAGE_FILENAME=delete-trigger.png
TRIGGER_TEXT=ふむふむ
AUTO_DELETE_TEXTS=やっぱ裸が一番いい
```

同じ画像ファイルが投稿されるか、同じファイル名の画像が投稿されていて、本文に `ふむふむ` を含むときだけ、そのメッセージより上にあるメッセージを新しい順に1秒ごとに消していきます。

`AUTO_DELETE_TEXTS` に入れた文言は、その文言どおりのメッセージが送られた瞬間に自動削除します。複数入れたいときは `||` 区切りです。
