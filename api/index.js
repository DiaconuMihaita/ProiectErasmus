// Funcție serverless Vercel: toate rutele /api/* ajung aici.
// Dacă încărcarea modulului eșuează, răspundem cu motivul (în loc de FUNCTION_INVOCATION_FAILED).
let core = null, loadError = null;
try { core = require('../lib/core.js'); } catch (e) { loadError = e; }

module.exports = (req, res) => {
  if (loadError) {
    res.statusCode = 500; res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Funcția API nu a putut porni', detail: String(loadError && loadError.stack || loadError).slice(0, 1500) }));
  }
  return core.handle(req, res);
};
