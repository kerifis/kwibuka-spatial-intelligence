import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

function googleGeminiConfigPlugin(env) {
  function install(middlewares) {
    middlewares.use('/api/gemini/config', (req, res) => {
      const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || env.GOOGLE_API_KEY;
      if (!apiKey) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not set in .env' }));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ready: true, key: apiKey }));
    });
  }

  return {
    name: 'google-gemini-config',
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    },
  };
}

function castSyncPlugin() {
  const clients = new Set();
  let latestState = null;

  function install(middlewares, server) {
    // 1. SSE stream endpoint for TV browsers / cross-device clients
    middlewares.use('/api/cast-sync/events', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('\n');
      clients.add(res);

      if (latestState) {
        res.write(`data: ${JSON.stringify(latestState)}\n\n`);
      }

      req.on('close', () => {
        clients.delete(res);
      });
    });

    // 2. HTTP POST endpoint to publish sync messages
    middlewares.use('/api/cast-sync/publish', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
      }
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          if (data.type === 'FULL_STATE' || data.type === 'STATE_CHANGE') {
            latestState = data;
          }
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          for (const client of clients) {
            client.write(payload);
          }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ ok: true, receivers: clients.size }));
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    });

    // 3. Local network IP helper endpoint
    middlewares.use('/api/cast-sync/info', async (req, res) => {
      const os = await import('os');
      const nets = os.networkInterfaces();
      let localIp = 'localhost';
      for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
          if (net.family === 'IPv4' && !net.internal) {
            localIp = net.address;
            break;
          }
        }
        if (localIp !== 'localhost') break;
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({
        localIp,
        port: server?.config?.server?.port || 5173,
        receivers: clients.size,
      }));
    });
  }

  return {
    name: 'cast-sync-relay',
    configureServer(server) {
      install(server.middlewares, server);
    },
    configurePreviewServer(server) {
      install(server.middlewares, server);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = process.env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || env.GOOGLE_API_KEY || '';
  return {
    root: '.',
    publicDir: 'public',
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(apiKey),
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          museum: resolve(__dirname, 'museum.html'),
        },
      },
    },
    server: {
      port: 5173,
      open: true,
    },
    plugins: [
      googleGeminiConfigPlugin(env),
      castSyncPlugin(),
    ],
  };
});
