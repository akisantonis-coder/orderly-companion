import { pool } from "../server/db";

async function checkDatabase() {
  console.log("Checking database connection...");
  
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✓ Database connection successful!");
    console.log("Current time:", result.rows[0].now);
    
    // Check if suppliers table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log("✓ Suppliers table exists");
      
      // Count suppliers
      const countResult = await pool.query("SELECT COUNT(*) FROM suppliers");
      console.log(`✓ Found ${countResult.rows[0].count} suppliers in database`);
    } else {
      console.error("✗ Suppliers table does NOT exist!");
      console.log("Run: npm run db:push");
    }
    
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error("✗ Database connection failed!");
    console.error("Error:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    await pool.end();
    process.exit(1);
  }
}

checkDatabase();
