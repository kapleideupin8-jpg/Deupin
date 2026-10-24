const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Route de santé pour que Render valide le site immédiatement
app.get('/healthz', (req, res) => res.status(200).send('OK'));

// Route IA (compatible toutes clés ou mode test)
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'TEMPORAIRE') {
    return res.status(503).json({ 
      error: "Le serveur fonctionne parfaitement ! Pour activer l'IA, ajoute simplement ta clé API dans les paramètres Render." 
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: "Tu es Deupin, professeur et tuteur ivoirien d'excellence pour le CEPE, BEPC et BAC.",
        messages: messages
      })
    });

    const data = await response.json();
    if (data.content && data.content[0] && data.content[0].text) {
      res.json({ text: data.content[0].text });
    } else {
      res.json({ text: "Deupin est en ligne et prêt à répondre." });
    }
  } catch (err) {
    res.status(500).json({ error: "Erreur de connexion avec l'IA." });
  }
});

// Installation téléphone (Manifest PWA)
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

// Page principale complète
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
<style>
:root{--paper:#FBF9F2;--card:#FFFFFF;--ink:#1B2233;--blue:#2447B8;--blue-soft:#E7EDFC;--line:#D9DDE8}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font-family:system-ui,sans-serif;margin:0;padding:16px 16px 80px;line-height:1.5}
.wrap{max-width:600px;margin:auto;display:flex;flex-direction:column;gap:14px}
h1{color:var(--blue);margin:0;font-size:1.5rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 2px 4px rgba(0,0,0,0.04)}
input,select,textarea{width:100%;border:1.5px solid var(--line);border-radius:8px;padding:10px;font:inherit}
textarea{min-height:90px}
.btn{background:var(--blue);color:#fff;border:0;border-radius:10px;padding:12px;font-weight:bold;cursor:pointer;font-size:1rem}
.btn.ghost{background:transparent;color:var(--blue);border:1.5px solid var(--blue);padding:8px 12px}
.top{display:flex;align-items:center;justify-content:space-between}
.msg{padding:10px 14px;border-radius:10px;margin-top:6px}
.msg.me{background:var(--blue-soft)}
.msg.ai{background:#fff;border:1px solid var(--line);white-space:pre-wrap}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div>
      <h1>🧠 Deupin le cerveau</h1>
      <p style="margin:2px 0 0;font-size:0.85rem;color:#666">Cahier & Assistants d'étude • Côte d'Ivoire</p>
    </div>
    <button class="btn ghost" id="btnInstall" type="button">Installer</button>
  </div>

  <div class="card">
    <label><b>Ma classe :</b>
      <select id="selClasse">
        <option>CM2 (CEPE)</option>
        <option>3ème (BEPC)</option>
        <option selected>Terminale D (BAC)</option>
        <option>Terminale A (BAC)</option>
        <option>Terminale C (BAC)</option>
        <option>Université / Supérieur</option>
      </select>
    </label>
    <label><b>Matière :</b>
      <select id="selMat">
        <option>Mathématiques</option>
        <option>Français / Philosophie</option>
        <option>Physique-Chimie</option>
        <option>SVT</option>
        <option>Histoire-Géographie</option>
        <option>Anglais</option>
      </select>
    </label>
  </div>

  <div class="card">
    <h3>📖 Demander un cours ou poser une question</h3>
    <textarea id="inpQ" placeholder="Écris ton chapitre ou ta question ici (ex: Explique-moi le théorème de Thalès avec un exemple)..."></textarea>
    <button class="btn" id="btnSend" type="button">Demander à Deupin</button>
    <div id="out" style="margin-top:10px"></div>
  </div>
</div>

<script>
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
document.getElementById('btnInstall').addEventListener('click', () => {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
  else { alert("Pour installer l'application sur ton téléphone :\\n- Sur Android (Chrome) : menu 3 points en haut à droite > 'Installer l'application'.\\n- Sur iPhone : bouton Partager > 'Sur l'écran d'accueil'."); }
});

document.getElementById('btnSend').addEventListener('click', async () => {
  const q = document.getElementById('inpQ').value.trim();
  const c = document.getElementById('selClasse').value;
  const m = document.getElementById('selMat').value;
  if (!q) return;

  const out = document.getElementById('out');
  out.innerHTML = '<div class="msg ai"><i>⏳ Deupin réfléchit...</i></div>';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: '[' + c + ' - ' + m + '] ' + q }]
      })
    });
    const data = await res.json();
    if (data.error) {
      out.innerHTML = '<div class="msg ai" style="color:#c23a2e">' + data.error + '</div>';
    } else {
      out.innerHTML = '<div class="msg ai">' + data.text + '</div>';
    }
  } catch(e) {
    out.innerHTML = '<div class="msg ai" style="color:#c23a2e">Erreur de connexion avec le serveur.</div>';
  }
});
</script>
</body>
</html>`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Serveur démarré avec succès sur le port ' + PORT);
});
