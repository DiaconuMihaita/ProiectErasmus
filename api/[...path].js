// Funcție serverless Vercel: toate rutele /api/* ajung aici
const { handle } = require('../lib/core.js');
module.exports = (req, res) => handle(req, res);
