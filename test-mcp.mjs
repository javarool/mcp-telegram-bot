import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env файл
const envPath = join(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

console.log('📝 Loaded env vars:', Object.keys(envVars).join(', '));

// Запускаем MCP сервер
const serverPath = join(__dirname, 'dist', 'server.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
    ...envVars
  }
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Попробуем парсить ответы (разделённые переносом строки)
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Сохраняем неполную строку
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Raw output:', line);
      }
    }
  });
});

function sendRequest(request) {
  return new Promise((resolve) => {
    console.log('\n📤 Sending:', JSON.stringify(request, null, 2));
    server.stdin.write(JSON.stringify(request) + '\n');
    setTimeout(resolve, 1000); // Даём время на ответ
  });
}

async function test() {
  try {
    console.log('🚀 Starting Telegram MCP Server tests...\n');

    // 1. Initialize
    console.log('=== Test 1: Initialize ===');
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: { listChanged: true }
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });

    // 2. Initialized notification
    await sendRequest({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    });

    // 3. List tools
    console.log('\n=== Test 2: List Tools ===');
    await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });

    // 4. Test send message tool
    console.log('\n=== Test 3: Send Message ===');
    await sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'send',
        arguments: {
          textMessage: '🧪 Test message from MCP server test suite!'
        }
      }
    });

    // Даём время на получение всех ответов
    setTimeout(() => {
      console.log('\n✅ Tests completed!');
      server.kill();
      process.exit(0);
    }, 3000);

  } catch (error) {
    console.error('❌ Error:', error);
    server.kill();
    process.exit(1);
  }
}

test();

