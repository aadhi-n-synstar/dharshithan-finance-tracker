const { neon } = require('@neondatabase/serverless');

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_Lt1UVxrTkp2q@ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

function getSql() {
  const url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  return neon(url);
}

module.exports = {
  getSql,
  DEFAULT_DATABASE_URL
};
