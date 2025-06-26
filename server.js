require('dotenv').config();

const express = require("express");
const fetch = require("node-fetch");
const app = express();
const port = 3000;

// Clé API personnalisée (la tienne ici)
const apiKey = process.env.API_KEY;

app.use(express.static("public")); // Le dossier avec index.html

app.get("/api/analyze", async (req, res) => {
  const url = req.query.url;
  const strategy = "desktop"; // ou "mobile"

  if (!url) {
    return res.status(400).json({ error: "L'URL est requise" });
  }

  try {
    const strategyParam = `&strategy=${strategy}`;
    const categoriesParam = `&category=performance&category=accessibility&category=best-practices&category=seo&category=pwa`;

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${API_KEY}${strategyParam}${categoriesParam}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Erreur API Google: ${text}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
