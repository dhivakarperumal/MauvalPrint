const { connectDB } = require('./src/config/db');
connectDB().then(() => {
  console.log('Database initialized successfully');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
