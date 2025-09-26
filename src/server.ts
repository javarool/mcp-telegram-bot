import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { Telegraf } from 'telegraf';

// Parse command line arguments
const args = process.argv.slice(2);
const timeoutMinutes = args.includes('--timeout')
  ? parseInt(args[args.indexOf('--timeout') + 1]) || 10
  : 10;

// Create MCP server instance
const server = new FastMCP({
  name: "Telegram/Tg Bot MCP Server",
  version: "1.0.0",
});

// Initialize Telegram bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token) {
  console.error('Error: Set TELEGRAM_BOT_TOKEN environment variable');
  process.exit(1);
}

if (!chatId) {
  console.error('Error: Set TELEGRAM_CHAT_ID environment variable');
  process.exit(1);
}

const bot = new Telegraf(token);

// Storage for pending questions
const pendingQuestions = new Map<string, {
  resolve: (answer: string) => void;
  reject: (error: Error) => void;
}>();

let waitingForAnswer = false;
let currentQuestionId: string | null = null;

// Handle incoming messages
bot.on('text', (ctx) => {
  if (waitingForAnswer && currentQuestionId) {
    const pending = pendingQuestions.get(currentQuestionId);
    if (pending) {
      pending.resolve(ctx.message.text);
      pendingQuestions.delete(currentQuestionId);
      waitingForAnswer = false;
      currentQuestionId = null;
    }
  }
});

// Launch bot
bot.launch();

// Tool: ask - Send a question and get an answer
server.addTool({
  name: 'ask',
  description: 'Ask a question in telegram/tg group and wait for an answer',
  parameters: z.object({
    questionText: z.string().describe('The question to ask'),
  }),
  execute: async (args) => {
    try {
      const questionId = Date.now().toString();

      // Send question to chat
      await bot.telegram.sendMessage(chatId, args.questionText);

      // Set up waiting state
      waitingForAnswer = true;
      currentQuestionId = questionId;

      // Create promise to wait for user answer
      return new Promise((resolve, reject) => {
        pendingQuestions.set(questionId, {
          resolve: (answer: string) => {
            resolve(answer); // Return user answer as-is
          },
          reject
        });

        // Set timeout
        setTimeout(() => {
          if (pendingQuestions.has(questionId)) {
            pendingQuestions.delete(questionId);
            waitingForAnswer = false;
            currentQuestionId = null;
            reject(new Error('Timeout waiting for user response'));
          }
        }, timeoutMinutes * 60 * 1000);
      });
    } catch (error) {
      throw new Error(`Error processing question: ${error}`);
    }
  },
});

// Tool: send - Send a text message via bot
server.addTool({
  name: 'send',
  description: 'Send a text message to telegram/tg group via bot',
  parameters: z.object({
    textMessage: z.string().describe('The message to send'),
  }),
  execute: async (args) => {
    try {
      // Send message to chat
      await bot.telegram.sendMessage(chatId, args.textMessage);

      // Return empty response
      return '';
    } catch (error) {
      throw new Error(`Error sending message: ${error}`);
    }
  },
});

// Start the server
server.start({
  transportType: 'stdio',
});