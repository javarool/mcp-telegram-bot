const { Telegraf } = require('telegraf');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Error: Set TELEGRAM_BOT_TOKEN environment variable');
  console.error('Usage: TELEGRAM_BOT_TOKEN=your_token node getChatId.js');
  process.exit(1);
}

const bot = new Telegraf(token);

console.log('🤖 Bot started! Send a message to any chat to get its ID...\n');

// Log all incoming messages with chat information
bot.use((ctx, next) => {
  console.log('='.repeat(50));
  console.log('📨 New message received!');
  console.log('Chat ID:', ctx.chat.id);
  console.log('Chat Type:', ctx.chat.type);

  if (ctx.chat.title) {
    console.log('Chat Title:', ctx.chat.title);
  }

  if (ctx.from) {
    console.log('From:', ctx.from.first_name, ctx.from.last_name || '');
    console.log('Username:', ctx.from.username || 'No username');
  }

  if (ctx.message && ctx.message.text) {
    console.log('Message Text:', ctx.message.text);
  }

  console.log('='.repeat(50));
  console.log('✅ Copy this Chat ID to your .env file:', ctx.chat.id);
  console.log('='.repeat(50), '\n');

  return next();
});

// Respond to any message
bot.on('message', (ctx) => {
  ctx.reply(`Chat ID: ${ctx.chat.id}\nChat Type: ${ctx.chat.type}`);
});

// Launch bot
bot.launch();
console.log('Bot is running... Press Ctrl+C to stop');

// Graceful stop
process.once('SIGINT', () => {
  console.log('\n👋 Stopping bot...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('\n👋 Stopping bot...');
  bot.stop('SIGTERM');
});