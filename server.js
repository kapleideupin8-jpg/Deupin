const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;
const ACCESS_CODE = (process.env.ACCESS_CODES || 'DEUPIN').trim().toUpperCase();

// Route IA (Streaming en direct)
app.post('/api/chat', async (req, res) => {
  const { messages, code } = req.body;

  if (code && code.trim().toUpperCase() !== ACCESS_CODE) {
    return res.status(401).json({ error: "Code d'accès incorrect." });
  }
  if (!anthropic) {
    return res.status(503).json({ error: "Clé API non configurée sur Render (vérifie la variable ANTHROPIC_API_KEY)." });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 3000,
      system: "Tu es Deupin, professeur bienveillant et tuteur d'excellence pour les élèves et étudiants de Côte d'Ivoire (CEPE, BEPC, BAC, Supérieur). Réponds clairement, avec pédagogie et méthode.",
      messages: messages
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Erreur API :', err);
    res.write(`data: ${JSON.stringify({ error: "Erreur de connexion avec l'IA. Réessaie dans un instant." })}\n\n`);
    res.end();
  }
});

// Fichier d'installation mobile (Manifest PWA)
app.get('/manifest.webmanifest', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.json({
    name: "Deupin le cerveau",
    short_name: "Deupin",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF9F2",
    theme_color: "#2447B8",
    icons: [{ src: "https://api.iconify.design/lucide:brain.svg?color=%232447B8", sizes: "512x512", type: "image/svg+xml" }]
  });
});

// Service Worker pour l'installation sur téléphone
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    self.addEventListener('install', e => self.skipWaiting());
    self.addEventListener('activate', e => clients.claim());
    self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
  `);
});

// Route principale : l'application complète
app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deupin le cerveau</title>
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#2447B8">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:wght@700;800&display=swap">
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
<style>
:root{--paper:#FBF9F2;--card:#FFFFFF;--ink:#1B2233;--blue:#2447B8;--blue-soft:#E7EDFC;--line:#D9DDE8;}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font-family:'Atkinson Hyperlegible',sans-serif;margin:0;padding:14px 14px 90px;line-height:1.5}
.wrap{max-width:680px;margin:auto;display:flex;flex-direction:column;gap:12px}
h1{font-family:'Bricolage Grotesque',sans-serif;font-size:1.6rem;color:var(--blue);margin:0}
.top{display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid var(--line)}
.btn{background:var(--blue);color:#fff;border:0;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:0.95rem}
.btn.ghost{background:transparent;color:var(--blue);border:1.5px solid var(--blue)}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;box-shadow:0 2px 4px rgba(0,0,0,0.03)}
input,select,textarea{width:100%;border:1.5px solid var(--line);border-radius:8px;padding:10px;background:#fff;font:inherit;color:inherit}
textarea{min-height:90px;resize:vertical}
.nav{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--line);display:flex;justify-content:space-around;padding:10px}
.nav button{background:none;border:0;font-weight:700;color:#666;font-size:0.85rem;cursor:pointer}
.nav button.active{color:var(--blue)}
.msg{border-radius:12px;padding:10px 14px;margin-bottom:8px}
.msg.me{background:var(--blue-soft);align-self:flex-end}
.msg.ai{background:#fff;border:1px solid var(--line)}
</style
