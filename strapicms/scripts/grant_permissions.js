const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const client = new Client({
  host: env.DATABASE_HOST || 'localhost',
  port: parseInt(env.DATABASE_PORT || '5432'),
  database: env.DATABASE_NAME || 'yahaya_scool',
  user: env.DATABASE_USERNAME || 'postgres',
  password: env.DATABASE_PASSWORD || 'postgres'
});

async function main() {
  await client.connect();

  // Find columns in up_permissions and link tables
  const colsRes = await client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_name LIKE 'up_permissions%'
  `);
  console.log('Permission table columns:', colsRes.rows);

  const rolesRes = await client.query('SELECT id, type, name FROM up_roles');
  console.log('Roles:', rolesRes.rows.map(r => ({ id: r.id, type: r.type, name: r.name })));

  const linkTable = colsRes.rows.some(r => r.table_name === 'up_permissions_role_lnk')
    ? 'up_permissions_role_lnk'
    : (colsRes.rows.some(r => r.table_name === 'up_permissions_role_links') ? 'up_permissions_role_links' : null);
  
  console.log('Link table:', linkTable);

  const apis = [
    'finance-account', 'finance-accounting-period', 'finance-budget', 'finance-currency',
    'finance-exchange-rate', 'finance-expense', 'finance-fee-structure', 'finance-financial-statement',
    'finance-hold', 'finance-invoice', 'finance-journal-entry', 'finance-ledger-entry',
    'finance-payroll', 'finance-receipt', 'finance-scholarship', 'finance-sequence-counter',
    'fixed-asset', 'donation-campaign', 'donation-setting'
  ];
  const actions = ['find', 'findOne', 'create', 'update', 'delete'];

  let created = 0;
  for (const api of apis) {
    for (const action of actions) {
      const actionName = `api::${api}.${api}.${action}`;
      for (const role of rolesRes.rows) {
        // Check if permission exists in up_permissions for this role
        if (linkTable) {
          const permRes = await client.query(
            `SELECT p.id FROM up_permissions p 
             JOIN ${linkTable} l ON p.id = l.permission_id 
             WHERE p.action = $1 AND l.role_id = $2`,
            [actionName, role.id]
          );
          if (permRes.rows.length === 0) {
            const insRes = await client.query(
              `INSERT INTO up_permissions (action, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id`,
              [actionName]
            );
            const permId = insRes.rows[0].id;
            await client.query(
              `INSERT INTO ${linkTable} (permission_id, role_id) VALUES ($1, $2)`,
              [permId, role.id]
            );
            created++;
          }
        }
      }
    }
  }

  console.log(`Successfully granted ${created} permissions across all roles!`);

  // Let's inspect finance accounts table
  const accs = await client.query('SELECT * FROM finance_accounts LIMIT 20');
  console.log('Finance accounts in DB:', accs.rows.length);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
