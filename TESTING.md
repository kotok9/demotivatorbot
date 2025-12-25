# Testing the Demotivator Bot

## Prerequisites Checklist

✅ Node.js installed
✅ Dependencies installed (`npm install`)
✅ ffmpeg and ffprobe installed and in PATH

## Setup for Testing

1. **Create a `.env` file** in the root directory:
```
BOT_TOKEN=your_telegram_bot_token_here
```

To get a bot token:
- Open Telegram and search for @BotFather
- Send `/newbot` and follow the prompts
- Copy the token and paste it in your `.env` file

2. **Start the bot**:
```bash
npm start
```

You should see:
```
Loaded 20 phrases
Demotivator bot is running...
```

## Test Cases

### Test 1: Image with Custom Caption
1. Open your bot in Telegram
2. Send `/start` - verify you get the welcome message
3. Send any image (JPG or PNG)
4. Bot should respond: "Provide your caption for your image/gif" with a "🎲 Random" button
5. Type a custom caption (e.g., "PRODUCTIVITY")
6. Bot should send back a poster with black borders and your caption

### Test 2: Image with Random Caption
1. Send any image
2. Click the "🎲 Random" button
3. Bot should send back a poster with a random phrase from `phrases.json`

### Test 3: GIF
1. Send a GIF file (you can send as a file or as an animation)
2. Provide a caption or use random
3. Verify the output is still animated (GIF format preserved)

### Test 4: Video
1. Send a video file (MP4, MOV, etc.)
2. Provide a caption or use random
3. Verify the output is still a video with the caption overlay

### Test 5: Unsupported Format
1. Send a non-media file (like a .txt or .pdf)
2. Bot should respond: "Please send an image, GIF, or video."

### Test 6: Multiple Users
1. Have a friend also interact with the bot
2. Verify that your states don't interfere with each other

## Troubleshooting During Testing

### Bot doesn't start
- Check that BOT_TOKEN in `.env` is correct
- Verify no other instance of the bot is running
- Check console for error messages

### "ffmpeg not found" error
- Run `ffmpeg -version` and `ffprobe -version`
- If not found, install ffmpeg and add to PATH

### Font errors
- On Windows, verify Times New Roman is at `C:\Windows\Fonts\times.ttf`
- If errors persist, update the font path in `demotivator.js`

### Processing takes too long
- Large videos may take time to process
- Consider adding file size checks if needed

### Files not cleaning up
- Check the `temp/` directory
- Files should be automatically deleted after sending
- If they accumulate, there may be an error in the cleanup logic

## Expected Behavior

- Processing message appears: "⏳ Creating your demotivator..."
- Output maintains aspect ratio of original
- Black borders: 14% top/bottom, 8% left/right
- White text centered on bottom border
- Text in uppercase Times New Roman
- Original format preserved (PNG/GIF/MP4)
- Processing message deleted after completion
- No caption on the sent file

## Performance Notes

- Images process fastest (< 2 seconds)
- GIFs depend on length and size (2-10 seconds)
- Videos take longer (5-30 seconds depending on length)

## Ready for Production?

Once local testing passes:
1. Deploy to your VPS
2. Use PM2 for process management (see README.md)
3. Monitor logs: `pm2 logs demotivator-bot`
4. Test from Telegram to verify VPS deployment works

---

Happy captioning! 🎨

