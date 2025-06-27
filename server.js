require('dotenv').config();

const express = require("express");
const fetch = require("node-fetch");
const app = express();
const port = 3000;

const apiKey = process.env.API_KEY;

app.use(express.static("public"));

app.get("/api/analyzeAll", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "L'URL est requise" });
  }

  try {
    const categoriesParam = `&category=performance&category=accessibility&category=best-practices&category=seo&category=pwa`;
    
    // Lance les deux analyses en parallèle
    const [desktopResponse, mobileResponse] = await Promise.all([
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&key=${apiKey}${categoriesParam}`),
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${apiKey}${categoriesParam}`)
    ]);

    if (!desktopResponse.ok || !mobileResponse.ok) {
      const errors = {
        desktop: desktopResponse.ok ? null : await desktopResponse.text(),
        mobile: mobileResponse.ok ? null : await mobileResponse.text()
      };
      return res.status(400).json({ error: "Erreur API Google", details: errors });
    }

    const [desktopData, mobileData] = await Promise.all([
      desktopResponse.json(),
      mobileResponse.json()
    ]);

    res.json({ 
      desktop: desktopData, 
      mobile: mobileData,
      analyzedUrl: url
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});