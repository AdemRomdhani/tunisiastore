const mongoose = require('mongoose');
require('dotenv').config();

async function fixCarts() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  try {
    const r = await db.collection('carts').deleteMany({ user: null });
    console.log('✅ Deleted', r.deletedCount, 'carts with null user');
  } catch(e) { console.log('Delete error:', e.message); }
  
  try {
    await db.collection('carts').dropIndex('user_1');
    console.log('✅ Dropped user_1 index');
  } catch(e) { console.log('Drop index error:', e.message); }
  
  await mongoose.disconnect();
  console.log('✅ Done!');
  process.exit();
}

fixCarts();