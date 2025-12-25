<div align="center">

# Custom captions Bot!

**A Telegram bot that adds captions to your images, GIFs, and videos in a classic style.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

</div>

---

## What It Does

Send an image, GIF, or video to the bot → Add your caption (or generate a random one) → Receive your media with a styled frame and text.

Built with Node.js and FFmpeg. Produces standardized 690×718px posters with black borders, white frames, and Times New Roman text. The name "Demotivator" is historical, but the bot is used for any kind of captioning.

## Features

- 📸 Supports images, animated GIFs, and videos
- ✍️ Custom captions or random phrases
- 🎯 Smart text wrapping and auto-sizing
- 🔄 Preserves original format (PNG/GIF/MP4)
- ⚡ Fast FFmpeg-powered processing

## Tech Stack

- Node.js + `node-telegram-bot-api`
- FFmpeg for image/video processing
- `child_process.spawn` for direct FFmpeg control

## Requirements

- Node.js v14+
- FFmpeg installed
- Telegram Bot Token from [@BotFather](https://t.me/botfather)

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

<div align="center">

*Add some context to your media.* 🎨

</div>
