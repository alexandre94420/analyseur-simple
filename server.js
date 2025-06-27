require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Désactivation du cache
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Endpoint d'analyse
app.get('/api/analyzeAll', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url?.match(/^https?:\/\//)) {
      return res.status(400).json({ error: 'URL doit commencer par http:// ou https://' });
    }

    const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
    const params = new URLSearchParams();
    categories.forEach(cat => params.append('category', cat));
    params.append('key', apiKey);
    params.append('_', Date.now());

    const [desktopRes, mobileRes] = await Promise.all([
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&${params}`),
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&${params}`)
    ]);

    if (!desktopRes.ok || !mobileRes.ok) {
      const error = await desktopRes.json();
      throw new Error(error.error || 'Erreur API Google');
    }

    const [desktop, mobile] = await Promise.all([
      desktopRes.json(),
      mobileRes.json()
    ]);

    res.json({
      desktop: { lighthouseResult: desktop.lighthouseResult },
      mobile: { lighthouseResult: mobile.lighthouseResult },
      analyzedUrl: url,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack 
    });
  }
});

app.listen(port, () => {
  console.log(`Serveur prêt sur http://localhost:${port}`);
});