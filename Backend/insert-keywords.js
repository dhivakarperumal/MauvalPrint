const { connectDB } = require('./src/config/db');

async function insertKeywords() {
  try {
    const pool = await connectDB();
    const keywords = ["Trending", "Oversize", "Best Seller", "New Arrival", "Summer Collection"];
    
    for (const keyword of keywords) {
      try {
        await pool.query("INSERT INTO keyword_master (keyword_name) VALUES (?)", [keyword]);
        console.log(`Added keyword: ${keyword}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`Keyword already exists: ${keyword}`);
        } else {
          console.error(`Error adding ${keyword}:`, err.message);
        }
      }
    }
    
    console.log('Finished adding keywords.');
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

insertKeywords();
