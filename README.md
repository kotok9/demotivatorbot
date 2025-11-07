# Demotivator Bot 🖤

A Telegram bot that creates demotivational posters from your images, GIFs, and videos.

## Features

- **Multiple media types**: Works with images (JPG, PNG), GIFs, and videos (MP4, MOV, etc.)
- **Custom or random captions**: Provide your own caption or use a randomly selected demotivational phrase
- **Classic demotivator style**: Black borders (14% top/bottom, 8% sides) with white text in Times New Roman
- **Preserves format**: Images stay as PNG, GIFs stay as GIF, videos stay as MP4
- **Automatic cleanup**: Temporary files are deleted after processing

## Prerequisites

- **Node.js** (v14 or higher)
- **ffmpeg** and **ffprobe** installed and available in PATH
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
  - Linux: `sudo apt install ffmpeg`
  - macOS: `brew install ffmpeg`
- **Telegram Bot Token** from [@BotFather](https://t.me/botfather)

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
BOT_TOKEN=your_telegram_bot_token_here
```

4. Make sure ffmpeg and ffprobe are installed:
```bash
ffmpeg -version
ffprobe -version
```

## Usage

### Running Locally

```bash
npm start
```

The bot will start polling for messages.

### Running on VPS with PM2

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the bot:
```bash
pm2 start index.js --name demotivator-bot
```

3. Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

4. Monitor the bot:
```bash
pm2 logs demotivator-bot
pm2 status
```

## Bot Commands

- `/start` - Display welcome message and instructions

## How to Use

1. Send an image, GIF, or video to the bot
2. The bot will ask: "Provide your caption for your image/gif"
3. Either:
   - Type your custom caption
   - Click the "🎲 Random" button for a random demotivational phrase
4. Receive your demotivational poster!

## Customization

### Adding More Phrases

Edit `phrases.json` to add or modify demotivational phrases. The bot will randomly select from this list when users click the "Random" button.

### Adjusting Border Sizes

In `demotivator.js`, modify these lines:
```javascript
const borderTopBottom = Math.round(height * 0.14); // 14% top/bottom
const borderLeftRight = Math.round(width * 0.08);   // 8% left/right
```

### Changing Text Size

In `demotivator.js`, modify:
```javascript
const fontSize = Math.round(width * 0.05); // 5% of width
```

### Changing Font

In `demotivator.js`, update the font path:
```javascript
fontfile=/Windows/Fonts/times.ttf  // Windows
fontfile=/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf  // Linux
```

## Project Structure

```
demotivator/
├── index.js           # Main bot logic and handlers
├── demotivator.js     # ffmpeg processing functions
├── phrases.json       # Demotivational phrases collection
├── package.json       # Dependencies
├── .env               # Bot token (create this)
├── .gitignore         # Git ignore rules
└── temp/              # Temporary file storage (auto-created)
```

## Troubleshooting

### "ffmpeg not found" error
- Make sure ffmpeg is installed and in your system PATH
- Test with: `ffmpeg -version`

### Bot doesn't respond
- Check if the bot is running: `pm2 status` (if using PM2)
- Check logs: `pm2 logs demotivator-bot`
- Verify BOT_TOKEN in `.env` is correct

### File processing errors
- Ensure ffmpeg supports the input format
- Check file size limits (Telegram has a 20MB limit for bot API)
- Check disk space in the `temp/` directory

### Font errors
- On Windows: Times New Roman is at `/Windows/Fonts/times.ttf`
- On Linux: Install liberation fonts: `sudo apt install fonts-liberation`
  - Or use: `/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf`

## License

ISC

## Contributing

Feel free to fork, modify, and submit pull requests. Add more demotivational phrases to `phrases.json`!

---

*Because your dreams were never going to come true anyway.* 💀

