const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const {createHash, randomUUID} = require('crypto');
const {readSheets} = require('../backend/import-workbook');
const {flatten, restore} = require('../backend/database/model');
const {loadRows, writeChanges, lockWrites, verifyState} = require('../backend/database/repository');
const root = path.resolve(__dirname, '..');
const hash = value => createHash('sha256').update(value).digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));
const maps = ['overrides', 'addedRows', 'addedColumns', 'editedRows', 'extraSheets', 'tableState', 'workbookDetails', 'deletedWorkbooks'];

function prepare(sourceDirectory) {
  const source = path.resolve(sourceDirectory);
  const seed = JSON.parse(fs.readFileSync(path.join(root, 'backend/data/workbooks.json'), 'utf8'));
  const expected = seed.workbooks.map(w => w.file).sort();
  const actual = fs.readdirSync(source).filter(name => /\.xlsx$/i.test(name)).sort();
  assert.deepEqual(actual, expected, 'Daftar Excel tidak sesuai daftar sumber awal; pemulihan dibatalkan.');
  const files = [];
  for (const workbook of seed.workbooks) {
    assert.equal(path.basename(workbook.file), workbook.file);
    const filename = path.join(source, workbook.file);
    const before = hash(fs.readFileSync(filename));
    const sheets = readSheets(filename, workbook.id);
    assert.equal(hash(fs.readFileSync(filename)), before, 'Excel berubah saat dibaca.');
    const previous = workbook.sheets;
    for (const sheet of sheets) {
      const old = previous.find(item => item.name === sheet.name);
      if (old) sheet.id = old.id;
    }
    workbook.sheets = sheets;
    files.push({file: workbook.file, sha256: before, sheets: sheets.length});
  }
  return {format: 'pdrb-original-v1', preparedAt: new Date().toISOString(), files, seed};
}

function validateSnapshot(snapshot) {
  assert.equal(snapshot.format, 'pdrb-original-v1');
  assert.equal(snapshot.seed.workbooks.length, 37, 'Pemulihan harus memuat 37 Excel asli.');
  assert.equal(snapshot.seed.workbooks.reduce((n, w) => n + w.sheets.length, 0), 95);
  assert.equal(new Set(snapshot.seed.workbooks.map(w => w.id)).size, 37);
  assert.equal(snapshot.files.length, 37);
  for (const workbook of snapshot.seed.workbooks) {
    assert(snapshot.files.some(file => file.file === workbook.file && file.sheets === workbook.sheets.length && /^[a-f0-9]{64}$/.test(file.sha256)));
  }
}

function restoredState(before, snapshot) {
  validateSnapshot(snapshot);
  const db = clone(before.db);
  for (const key of maps) db[key] = {};
  db.uploadedWorkbooks = [];
  db.audit.unshift({id: randomUUID(), at: new Date().toISOString(), user: 'system', userName: 'Pemulihan data asli', action: 'RESTORE_ORIGINAL_DATA', details: {workbooks: 37, sheets: 95, sourceHashes: snapshot.files}});
  const result = {seed: clone(snapshot.seed), db};
  assert.deepEqual(restore(flatten(result.seed, result.db)), result);
  assert.deepEqual(db.users, before.db.users);
  assert.deepEqual(db.notifications, before.db.notifications);
  assert.deepEqual(db.audit.slice(1), before.db.audit);
  return result;
}

function inventory(state) {
  return {sourceDatasets: state.seed.workbooks.length, uploadedDatasets: state.db.uploadedWorkbooks.length,
    changes: Object.fromEntries(maps.map(key => [key, Object.keys(state.db[key] || {}).length])),
    accounts: state.db.users.length, history: state.db.audit.length, notifications: (state.db.notifications || []).length};
}

async function run() {
  const args = process.argv.slice(2);
  const option = name => {const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1];};
  if (args.includes('--prepare')) {
    assert(option('--source') && option('--out'), 'Gunakan --prepare --source FOLDER --out FILE.');
    const snapshot = prepare(option('--source'));
    validateSnapshot(snapshot);
    const buffer = JSON.stringify(snapshot);
    fs.writeFileSync(path.resolve(option('--out')), buffer, {flag: 'wx', mode: 0o600});
    console.log(JSON.stringify({prepared: true, datasets: 37, sheets: 95, snapshotHash: hash(buffer)}));
    return;
  }
  assert(option('--snapshot'), 'Gunakan --snapshot FILE untuk pemeriksaan; tambah --apply --expected HASH untuk pemulihan.');
  const snapshotBuffer = fs.readFileSync(path.resolve(option('--snapshot')));
  const snapshot = JSON.parse(snapshotBuffer);
  validateSnapshot(snapshot);
  const apply = args.includes('--apply');
  if (apply) assert(/^[a-f0-9]{64}$/.test(option('--expected') || ''), '--apply wajib menyertakan --expected dari pemeriksaan terbaru.');
  const {createPool, connectionConfig} = require('../backend/database/config');
  const config = connectionConfig(), pool = createPool();
  let client, begun = false;
  try {
    client = await pool.connect();
    await client.query(apply ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    begun = true;
    await client.query("SET LOCAL lock_timeout='10s'");
    await client.query("SET LOCAL statement_timeout='60s'");
    if (apply) await lockWrites(client);
    const identity = (await client.query('SELECT current_database() AS database, current_user AS username')).rows[0];
    assert.equal(identity.database, 'db_magang');
    assert.equal(identity.username, 'magang');
    const rows = await loadRows(client), before = restore(rows);
    const fingerprint = hash(JSON.stringify({before, snapshotHash: hash(snapshotBuffer)}));
    const report = {target: {host: config.host, port: config.port, ...identity, schema: 'pdrb'}, before: inventory(before), original: {datasets: 37, sheets: 95}, expected: fingerprint};
    if (!apply) {await client.query('COMMIT'); begun = false; console.log(JSON.stringify(report, null, 2)); return;}
    assert.equal(fingerprint, option('--expected'), 'Data berubah sejak pemeriksaan. Jalankan pemeriksaan ulang; belum ada data ditimpa.');
    const next = restoredState(before, snapshot);
    const directory = path.join(root, '.local-backups', 'restore-original-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID());
    fs.mkdirSync(directory, {recursive: true, mode: 0o700});
    const backup = JSON.stringify(before);
    fs.writeFileSync(path.join(directory, 'state-before.json'), backup, {flag: 'wx', mode: 0o600});
    assert.equal(hash(fs.readFileSync(path.join(directory, 'state-before.json'))), hash(backup));
    fs.writeFileSync(path.join(directory, 'original-snapshot.json'), snapshotBuffer, {flag: 'wx', mode: 0o600});
    fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({...report, backupHash: hash(backup)}, null, 2), {flag: 'wx', mode: 0o600});
    await writeChanges(client, rows, flatten(next.seed, next.db));
    await verifyState(client, next.seed, next.db);
    await client.query('COMMIT'); begun = false;
    console.log(JSON.stringify({restored: true, backup: directory, after: inventory(next), accountsAndHistoryPreserved: true}, null, 2));
  } catch (error) {
    if (begun) await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {client?.release(); await pool.end();}
}

module.exports = {prepare, validateSnapshot, restoredState, inventory};
if (require.main === module) run().catch(error => {console.error('Pemulihan dibatalkan:', error.code || error.message); process.exitCode = 1;});
