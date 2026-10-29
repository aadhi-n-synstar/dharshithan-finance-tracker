const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_Lt1UVxrTkp2q@ep-late-art-b5308bnc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

function hashPassword(password) {
  const salt = 'dwcs_salt_2026_enterprise';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

async function migrate() {
  console.log('--- Dharshithan Waterproofing: Neon PostgreSQL Enterprise Migration ---');
  console.log('Connecting to Neon Database...');

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Neon Database successfully.');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const ddl = fs.readFileSync(schemaPath, 'utf8');

  console.log('Applying Enterprise Schema DDL...');
  await client.query(ddl);
  console.log('  ✓ Schema DDL applied successfully.');

  console.log('\n--- Seeding Initial Finance Users ---');
  const users = [
    {
      full_name: 'Dharshithan Partiban (Super Admin)',
      email: 'dharshithanpartiban@gmail.com',
      password: hashPassword('admin@2026'),
      role: 'SUPER_ADMIN'
    },
    {
      full_name: 'Managing Partner (Owner)',
      email: 'owner@dharshithan.com',
      password: hashPassword('owner@2026'),
      role: 'OWNER'
    },
    {
      full_name: 'Accounts Executive (Finance)',
      email: 'finance@dharshithan.com',
      password: hashPassword('finance@2026'),
      role: 'FINANCE'
    },
    {
      full_name: 'Statutory GST Auditor',
      email: 'auditor@dharshithan.com',
      password: hashPassword('auditor@2026'),
      role: 'AUDITOR'
    }
  ];

  for (const u of users) {
    const existing = await client.query('SELECT id FROM finance_users WHERE email = $1', [u.email]);
    if (existing.rows.length === 0) {
      await client.query(
        'INSERT INTO finance_users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4::finance_role)',
        [u.full_name, u.email, u.password, u.role]
      );
      console.log(`  ✓ Created user: ${u.email} (${u.role})`);
    } else {
      await client.query(
        'UPDATE finance_users SET full_name = $1, password_hash = $2, role = $3::finance_role WHERE email = $4',
        [u.full_name, u.password, u.role, u.email]
      );
      console.log(`  ✓ Updated user: ${u.email} (${u.role})`);
    }
  }

  // Also ensure alias 'admin' works for super admin
  const adminCheck = await client.query("SELECT id FROM finance_users WHERE email = 'admin'");
  if (adminCheck.rows.length === 0) {
    await client.query(
      "INSERT INTO finance_users (full_name, email, password_hash, role) VALUES ('Super Admin', 'admin', $1, 'SUPER_ADMIN'::finance_role)",
      [hashPassword('admin@2026')]
    );
    console.log("  ✓ Created alias user: admin (SUPER_ADMIN)");
  }

  // Get Super Admin ID for created_by references
  const adminRes = await client.query('SELECT id FROM finance_users WHERE email = $1', ['dharshithanpartiban@gmail.com']);
  const adminId = adminRes.rows[0].id;

  console.log('\n--- Checking Initial Data Seeding ---');
  const invoiceCount = await client.query('SELECT count(*)::int as count FROM invoices_receipts');
  if (invoiceCount.rows[0].count === 0) {
    console.log('Seeding initial invoices & receipts...');
    const sampleInvoices = [
      {
        receipt_no: 'DWCS/REC/2026/001',
        date: '2026-10-15',
        client_name: 'Larsen & Toubro Ltd (C&A Division)',
        client_address: 'Mount Poonamallee Road, Manapakkam, Chennai - 600089',
        client_gstin: '33AAACL0140P1ZT',
        site_location: 'IT Park Phase II, DLF Porur, Chennai',
        work_description: 'Polyurethane Injection Grouting & Membrane Waterproofing',
        sub_total: 125000.00,
        is_interstate: false,
        cgst_rate: 9.00,
        cgst_amount: 11250.00,
        sgst_rate: 9.00,
        sgst_amount: 11250.00,
        igst_rate: 0.00,
        igst_amount: 0.00,
        grand_total: 147500.00,
        grand_total_words: 'One Lakh Forty Seven Thousand Five Hundred Rupees Only',
        payment_mode: 'NEFT',
        transaction_ref: 'NEFT998241029',
        status: 'PAID'
      },
      {
        receipt_no: 'DWCS/REC/2026/002',
        date: '2026-10-22',
        client_name: 'Prestige Estates Projects Ltd',
        client_address: 'Prestige Polygon, 471 Anna Salai, Nandanam, Chennai - 600035',
        client_gstin: '33AABCP8921R1ZW',
        site_location: 'Prestige Bella Vista, Porur, Chennai',
        work_description: 'Basement Retaining Wall Crystallization & Expansion Joint Sealing',
        sub_total: 84000.00,
        is_interstate: false,
        cgst_rate: 9.00,
        cgst_amount: 7560.00,
        sgst_rate: 9.00,
        sgst_amount: 7560.00,
        igst_rate: 0.00,
        igst_amount: 0.00,
        grand_total: 99120.00,
        grand_total_words: 'Ninety Nine Thousand One Hundred Twenty Rupees Only',
        payment_mode: 'RTGS',
        transaction_ref: 'RTGS2026102201',
        status: 'PAID'
      }
    ];

    for (const inv of sampleInvoices) {
      const inserted = await client.query(`
        INSERT INTO invoices_receipts (
          receipt_no, date, client_name, client_address, client_gstin, site_location,
          work_description, sub_total, is_interstate, cgst_rate, cgst_amount,
          sgst_rate, sgst_amount, igst_rate, igst_amount, grand_total, grand_total_words,
          payment_mode, transaction_ref, status, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING id
      `, [
        inv.receipt_no, inv.date, inv.client_name, inv.client_address, inv.client_gstin, inv.site_location,
        inv.work_description, inv.sub_total, inv.is_interstate, inv.cgst_rate, inv.cgst_amount,
        inv.sgst_rate, inv.sgst_amount, inv.igst_rate, inv.igst_amount, inv.grand_total, inv.grand_total_words,
        inv.payment_mode, inv.transaction_ref, inv.status, adminId
      ]);

      const invoiceId = inserted.rows[0].id;
      // Add line item
      await client.query(`
        INSERT INTO invoice_line_items (
          invoice_id, description, hsn_sac_code, quantity, unit, rate, total_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        invoiceId, inv.work_description, '9954', 2500, 'Sq.Ft', inv.sub_total / 2500, inv.sub_total
      ]);
      console.log(`  ✓ Seeded invoice: ${inv.receipt_no}`);
    }
  }

  // Seed sample vouchers
  const voucherCount = await client.query('SELECT count(*)::int as count FROM financial_vouchers');
  if (voucherCount.rows[0].count === 0) {
    console.log('Seeding initial financial vouchers...');
    const sampleVouchers = [
      {
        voucher_no: 'DWCS/VOU/2026/001',
        voucher_type: 'PAYMENT',
        category: 'Chemical Purchase',
        voucher_date: '2026-10-18',
        paid_to_or_received_from: 'Fosroc Chemicals India Pvt Ltd',
        amount: 38500.00,
        amount_in_words: 'Thirty Eight Thousand Five Hundred Rupees Only',
        payment_mode: 'Bank Transfer',
        reference_number: 'FOS-INV-44910',
        narration: 'Purchase of Brushbond crystalline slurry 50 bags and Conbextra GP grout for DLF Porur Site',
        status: 'CONFIRMED'
      },
      {
        voucher_no: 'DWCS/VOU/2026/002',
        voucher_type: 'PAYMENT',
        category: 'Material Cost',
        voucher_date: '2026-10-20',
        paid_to_or_received_from: 'Sri Balaji Hardware & Building Materials',
        amount: 14200.00,
        amount_in_words: 'Fourteen Thousand Two Hundred Rupees Only',
        payment_mode: 'UPI',
        reference_number: 'UPI-SB-99881',
        narration: 'Mesh wire rolls, application rollers, brushes, and PPE equipment for site workers',
        status: 'CONFIRMED'
      }
    ];

    for (const v of sampleVouchers) {
      await client.query(`
        INSERT INTO financial_vouchers (
          voucher_no, voucher_type, category, voucher_date, paid_to_or_received_from,
          amount, amount_in_words, payment_mode, reference_number, narration, prepared_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        v.voucher_no, v.voucher_type, v.category, v.voucher_date, v.paid_to_or_received_from,
        v.amount, v.amount_in_words, v.payment_mode, v.reference_number, v.narration, adminId, v.status
      ]);
      console.log(`  ✓ Seeded voucher: ${v.voucher_no}`);
    }
  }

  // Seed sample salary disbursement
  const salaryCount = await client.query('SELECT count(*)::int as count FROM salary_disbursements');
  if (salaryCount.rows[0].count === 0) {
    console.log('Seeding initial salary disbursement...');
    const s = {
      disbursement_no: 'DWCS/SAL/2026/001',
      disbursement_month: 'October 2026',
      disbursement_date: '2026-10-28',
      employee_name: 'K. Rajavel',
      employee_id: 'DWCS-EMP-004',
      designation: 'Senior Waterproofing Applicator',
      bank_account_no: '50100492819201',
      ifsc_code: 'HDFC0001244',
      basic_pay: 22000.00,
      hra: 4000.00,
      special_allowance: 2500.00,
      total_earnings: 28500.00,
      pf_deduction: 1800.00,
      esi_deduction: 215.00,
      tds_deduction: 0.00,
      advance_adjustment: 1000.00,
      total_deductions: 3015.00,
      net_salary: 25485.00,
      net_salary_words: 'Twenty Five Thousand Four Hundred Eighty Five Rupees Only',
      payment_mode: 'Bank Transfer',
      transaction_ref: 'SAL20261028KR'
    };

    // Auto-create linked voucher
    const linkedVou = await client.query(`
      INSERT INTO financial_vouchers (
        voucher_no, voucher_type, category, voucher_date, paid_to_or_received_from,
        amount, amount_in_words, payment_mode, reference_number, narration, prepared_by, status
      ) VALUES (
        $1, 'PAYMENT', 'Salary Disbursement', $2, $3, $4, $5, $6, $7, $8, $9, 'CONFIRMED'
      ) RETURNING id
    `, [
      'DWCS/VOU/2026/003', s.disbursement_date, s.employee_name, s.net_salary, s.net_salary_words,
      s.payment_mode, s.transaction_ref, `Salary for ${s.disbursement_month} - ${s.designation}`, adminId
    ]);

    await client.query(`
      INSERT INTO salary_disbursements (
        disbursement_no, disbursement_month, disbursement_date, employee_name, employee_id,
        designation, bank_account_no, ifsc_code, basic_pay, hra, special_allowance,
        total_earnings, pf_deduction, esi_deduction, tds_deduction, advance_adjustment,
        total_deductions, net_salary, net_salary_words, payment_mode, transaction_ref,
        linked_voucher_id, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      )
    `, [
      s.disbursement_no, s.disbursement_month, s.disbursement_date, s.employee_name, s.employee_id,
      s.designation, s.bank_account_no, s.ifsc_code, s.basic_pay, s.hra, s.special_allowance,
      s.total_earnings, s.pf_deduction, s.esi_deduction, s.tds_deduction, s.advance_adjustment,
      s.total_deductions, s.net_salary, s.net_salary_words, s.payment_mode, s.transaction_ref,
      linkedVou.rows[0].id, adminId
    ]);
    console.log(`  ✓ Seeded salary disbursement: ${s.disbursement_no} (Linked Voucher: DWCS/VOU/2026/003)`);
  }

  await client.end();
  console.log('\n======================================================');
  console.log('MIGRATION & SEEDING COMPLETED SUCCESSFULLY ON NEON DB!');
  console.log('======================================================');
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
