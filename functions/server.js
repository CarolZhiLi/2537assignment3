const serverless = require('serverless-http');
const app = require('../main'); // Adjust the path as necessary to import your Express app

module.exports.handler = serverless(app);