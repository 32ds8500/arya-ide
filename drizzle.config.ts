export default {
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './local.db',
  },
};
