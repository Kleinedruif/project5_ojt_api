var db_config = require('../config/database.json');

module.exports = require('knex')(db_config);
