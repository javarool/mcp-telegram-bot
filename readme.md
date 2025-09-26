# Telegram Bot MCP Server

MCP server for sending messages and asking questions through Telegram bot.

## Features

- **ask(questionText)** - Send question to Telegram chat and wait for user response
- **send(textMessage)** - Send message to Telegram chat

## Setup

1. **Get Chat ID:**
   ```bash
   TELEGRAM_BOT_TOKEN=your_token npm run get-chat-id
   ```
   Send message to your bot/group and copy the Chat ID from console.

2. **Test server:**
   ```bash
   npm run dev
   ```

## MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "telegram-bot": {
      "command": "npx",
      "args": ["tsx", "/home/user/mcp-servers/mcp-telegram-bot/src/server.ts", "--timeout", "10"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your_bot_token_here",
        "TELEGRAM_CHAT_ID": "your_chat_id_here"
      }
    }
  }
}
```

## Command Line Arguments

- `--timeout <minutes>` - Timeout in minutes for waiting user response (default: 10)

## Environment Variables

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from @BotFather
- `TELEGRAM_CHAT_ID` - Target chat ID where messages will be sent