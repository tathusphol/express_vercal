const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '31.220.110.101',
  user: 'u350327849_copy',
  password: '!Bacoom123!',
  database: 'u350327849_co_project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;