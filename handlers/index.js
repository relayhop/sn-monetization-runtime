// handlers/index.js
// Importar todos os handlers
const writeMyBio = require('./writeMyBio');

// Registry de handlers
const handlers = {
  'Write my bio': writeMyBio,
  // outros handlers podem ser adicionados aqui
};

module.exports = handlers;
