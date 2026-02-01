#!/usr/bin/env node
import 'dotenv/config';
import { connectDB } from '../../../lib/db.js';
import User from '../../../models/User.js';

const run = async () => {
  try {
    await connectDB();
    const result = await User.updateMany({ isPublic: { $exists: false } }, { $set: { isPublic: false } });
    console.log('Migration complete. Matched:', result.matchedCount || result.n, 'Modified:', result.modifiedCount || result.nModified);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
