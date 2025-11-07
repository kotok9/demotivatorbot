require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { createDemotivator, deleteFile } = require('./demotivator');

// Initialize bot
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Load demotivational phrases
let phrases = [];
fs.readFile('./phrases.json', 'utf8')
  .then(data => {
    phrases = JSON.parse(data);
    console.log(`Loaded ${phrases.length} demotivational phrases`);
  })
  .catch(err => {
    console.error('Failed to load phrases.json:', err);
    process.exit(1);
  });

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
fs.mkdir(tempDir, { recursive: true })
  .then(() => console.log('Temp directory ready'))
  .catch(err => console.error('Failed to create temp directory:', err));

// User state management
const userStates = {};

// Helper: Download file from Telegram
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading file to: ${filePath}`);
    const protocol = url.startsWith('https') ? https : http;
    
    try {
      const file = require('fs').createWriteStream(filePath);
      
      file.on('error', (err) => {
        console.error('File write stream error:', err);
        reject(err);
      });
      
      protocol.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('File downloaded successfully');
          resolve();
        });
      }).on('error', (err) => {
        console.error('Download error:', err);
        require('fs').unlink(filePath, () => {});
        reject(err);
      });
    } catch (err) {
      console.error('Failed to create write stream:', err);
      reject(err);
    }
  });
}

// Helper: Get random phrase
function getRandomPhrase() {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Helper: Determine file type from mime or extension
function getFileType(mimeType, fileName) {
  if (mimeType) {
    if (mimeType.startsWith('image/gif')) return 'gif';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
  }
  
  if (fileName) {
    const ext = path.extname(fileName).toLowerCase();
    if (ext === '.gif') return 'gif';
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';
    if (['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(ext)) return 'video';
  }
  
  return 'unknown';
}

// Command: /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `🖤 Welcome to Demotivator Bot! 🖤

Send me an image, GIF, or video, and I'll turn it into a demotivational poster.

How it works:
1. Send me your image/GIF/video
2. I'll ask for a caption (or choose random)
3. Receive your demotivational masterpiece

Let's embrace the futility of existence together! 💀`;

  bot.sendMessage(chatId, welcomeMessage);
});

// Handle photos
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    // Get the highest quality photo
    const photo = msg.photo[msg.photo.length - 1];
    
    // Store user state
    userStates[userId] = {
      fileId: photo.file_id,
      fileType: 'image',
      waitingForCaption: true
    };
    
    console.log(`Created user state for user ${userId}, fileType: image`);
    
    // Ask for caption with inline keyboard
    const keyboard = {
      inline_keyboard: [[
        { text: '🎲 Random', callback_data: 'random_caption' }
      ]]
    };
    
    await bot.sendMessage(
      chatId,
      'Provide your caption for your image/gif:',
      { reply_markup: keyboard }
    );
  } catch (err) {
    console.error('Error handling photo:', err);
    bot.sendMessage(chatId, 'An error occurred. Please try again.');
  }
});

// Handle documents (GIFs, videos sent as files)
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const doc = msg.document;
  
  try {
    const fileType = getFileType(doc.mime_type, doc.file_name);
    
    if (fileType === 'unknown') {
      await bot.sendMessage(chatId, 'Please send an image, GIF, or video.');
      return;
    }
    
    // Store user state
    userStates[userId] = {
      fileId: doc.file_id,
      fileType: fileType,
      fileName: doc.file_name,
      waitingForCaption: true
    };
    
    // Ask for caption with inline keyboard
    const keyboard = {
      inline_keyboard: [[
        { text: '🎲 Random', callback_data: 'random_caption' }
      ]]
    };
    
    await bot.sendMessage(
      chatId,
      'Provide your caption for your image/gif:',
      { reply_markup: keyboard }
    );
  } catch (err) {
    console.error('Error handling document:', err);
    bot.sendMessage(chatId, 'An error occurred. Please try again.');
  }
});

// Handle videos
bot.on('video', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const video = msg.video;
  
  try {
    // Store user state
    userStates[userId] = {
      fileId: video.file_id,
      fileType: 'video',
      fileName: video.file_name || 'video.mp4',
      waitingForCaption: true
    };
    
    // Ask for caption with inline keyboard
    const keyboard = {
      inline_keyboard: [[
        { text: '🎲 Random', callback_data: 'random_caption' }
      ]]
    };
    
    await bot.sendMessage(
      chatId,
      'Provide your caption for your image/gif:',
      { reply_markup: keyboard }
    );
  } catch (err) {
    console.error('Error handling video:', err);
    bot.sendMessage(chatId, 'An error occurred. Please try again.');
  }
});

// Handle animation (GIF sent as animation)
bot.on('animation', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const animation = msg.animation;
  
  try {
    // Store user state
    userStates[userId] = {
      fileId: animation.file_id,
      fileType: 'gif',
      fileName: animation.file_name || 'animation.gif',
      waitingForCaption: true
    };
    
    // Ask for caption with inline keyboard
    const keyboard = {
      inline_keyboard: [[
        { text: '🎲 Random', callback_data: 'random_caption' }
      ]]
    };
    
    await bot.sendMessage(
      chatId,
      'Provide your caption for your image/gif:',
      { reply_markup: keyboard }
    );
  } catch (err) {
    console.error('Error handling animation:', err);
    bot.sendMessage(chatId, 'An error occurred. Please try again.');
  }
});

// Handle text messages (captions)
bot.on('message', async (msg) => {
  // Skip if not a text message or if it's a command
  if (!msg.text || msg.text.startsWith('/')) return;
  
  // Skip if message contains media (already handled by other handlers)
  if (msg.photo || msg.document || msg.video || msg.animation) return;
  
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userState = userStates[userId];
  
  // Check if we're waiting for a caption
  if (!userState || !userState.waitingForCaption) {
    return;
  }
  
  // Check caption length
  if (msg.text.length > 70) {
    await bot.sendMessage(chatId, 'Caption is too long! Maximum 70 characters allowed.');
    return;
  }
  
  try {
    await processMedia(chatId, userId, msg.text);
  } catch (err) {
    console.error('Error processing caption:', err);
    bot.sendMessage(chatId, 'An error occurred while creating your demotivator. Please try again.');
  }
});

// Handle callback queries (inline button clicks)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const userState = userStates[userId];

  try {
    if (query.data === 'random_caption') {
      // Answer callback to remove loading state
      await bot.answerCallbackQuery(query.id);
      
      if (!userState || !userState.waitingForCaption) {
        console.log('No user state found for random caption');
        await bot.sendMessage(chatId, 'Session expired. Please send your image/GIF/video again.');
        return;
      }
      
      // Get random phrase and process
      const caption = getRandomPhrase();
      await processMedia(chatId, userId, caption);
    }
  } catch (err) {
    console.error('Error handling callback query:', err);
    bot.answerCallbackQuery(query.id, { text: 'An error occurred' });
  }
});

// Process media with caption
async function processMedia(chatId, userId, caption) {
  const userState = userStates[userId];
  
  if (!userState) {
    await bot.sendMessage(chatId, 'Please send an image, GIF, or video first.');
    return;
  }
  
  // Mark as processing
  userState.waitingForCaption = false;
  
  let inputPath = null;
  let outputPath = null;
  
  try {
    // Send "processing" message
    const processingMsg = await bot.sendMessage(chatId, '⏳ Creating your demotivator...');
    
    // Get file info from Telegram
    const file = await bot.getFile(userState.fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    
    // Determine file extension
    let ext = path.extname(file.file_path);
    if (!ext && userState.fileName) {
      ext = path.extname(userState.fileName);
    }
    if (!ext) {
      ext = userState.fileType === 'video' ? '.mp4' : 
            userState.fileType === 'gif' ? '.gif' : '.jpg';
    }
    
    // Download file
    inputPath = path.join(__dirname, 'temp', `input_${userId}_${Date.now()}${ext}`);
    await downloadFile(fileUrl, inputPath);
    
    // Create demotivator
    outputPath = await createDemotivator(inputPath, caption);
    
    // Send result based on file type
    const sendOptions = { disable_notification: true };
    
    if (userState.fileType === 'video') {
      await bot.sendVideo(chatId, outputPath, sendOptions);
    } else if (userState.fileType === 'gif') {
      await bot.sendAnimation(chatId, outputPath, sendOptions);
    } else {
      await bot.sendPhoto(chatId, outputPath, sendOptions);
    }
    
    // Delete processing message
    await bot.deleteMessage(chatId, processingMsg.message_id);
    
  } catch (err) {
    console.error('Error in processMedia:', err);
    throw err;
  } finally {
    // Cleanup
    if (inputPath) await deleteFile(inputPath);
    if (outputPath) await deleteFile(outputPath);
    delete userStates[userId];
  }
}

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('Demotivator bot is running...');

