const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not defined in your environment variables.');
    return;
  }

  const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
  console.log('Testing connection to:', maskedUrl);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Successfully connected to the database!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
  } catch (err) {
    console.error('Connection error:', err.stack);
  } finally {
    await client.end();
  }
}

testConnection();
