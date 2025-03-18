const express = require('express');
const app = express();
const port = 3002;

app.get('/', (req, res) => {
  res.send('Backend de Guerre des Départements S2');
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});