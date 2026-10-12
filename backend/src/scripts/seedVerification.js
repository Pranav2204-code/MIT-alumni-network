/**
 * seedVerification.js
 *
 * Populates VerificationRecord from a CSV exported by the university.
 * Expected CSV columns (order matters):
 *   prn, fullName, department, degree, graduationYear, dob
 *
 * DOB format accepted: YYYY-MM-DD  or  DD/MM/YYYY  or  DD-MM-YYYY
 *
 * Usage:
 *   node src/scripts/seedVerification.js --file ./data/students.csv [--clear]
 *
 * --clear   drops existing records before seeding (use carefully)
 */

require('dotenv').config();
const fs        = require('fs');
const path      = require('path');
const readline  = require('readline');
const bcrypt    = require('bcryptjs');
const mongoose  = require('mongoose');
const VerificationRecord = require('../models/VerificationRecord');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDob(raw) {
  const s = raw.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  throw new Error(`Unrecognised DOB format: ${s}`);
}

async function hashDob(dob) {
  return bcrypt.hash(dob, 12);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args   = process.argv.slice(2);
  const fileArg = args.findIndex(a => a === '--file');
  const clear   = args.includes('--clear');

  if (fileArg === -1 || !args[fileArg + 1]) {
    console.error('Usage: node seedVerification.js --file <path/to/students.csv> [--clear]');
    process.exit(1);
  }

  const csvPath = path.resolve(args[fileArg + 1]);
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  if (clear) {
    await VerificationRecord.deleteMany({});
    console.log('Cleared existing verification records.');
  }

  const rl = readline.createInterface({ input: fs.createReadStream(csvPath) });
  const lines = [];

  for await (const line of rl) {
    lines.push(line);
  }

  // Skip header row
  const rows = lines.slice(1).filter(l => l.trim());
  let inserted = 0, skipped = 0, errors = 0;

  for (const row of rows) {
    // Basic CSV parse (no quoted commas in university data)
    const [prn, fullName, department, degree, graduationYear, dob] = row.split(',').map(c => c.trim());

    if (!prn || !fullName || !dob) {
      console.warn(`Skipping malformed row: ${row}`);
      errors++;
      continue;
    }

    try {
      const normalised = parseDob(dob);
      const dobHash = await hashDob(normalised);

      await VerificationRecord.updateOne(
        { prn: prn.toUpperCase() },
        {
          $setOnInsert: {
            prn:            prn.toUpperCase(),
            fullName:       fullName.trim(),
            department:     department?.trim() || 'Unknown',
            degree:         degree?.trim() || 'B.Tech',
            graduationYear: Number(graduationYear) || new Date().getFullYear(),
            dobHash,
          },
        },
        { upsert: true }
      );
      inserted++;
    } catch (err) {
      console.warn(`Error for PRN ${prn}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nSeed complete: ${inserted} upserted, ${skipped} skipped, ${errors} errors`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
