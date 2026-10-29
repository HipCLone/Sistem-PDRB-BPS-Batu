const test = require('node:test');
const assert = require('node:assert/strict');
const {PGlite} = require('@electric-sql/pglite');
const {restoredState, validateSnapshot} = require('./restore-original.cjs');
const {flatten, restore} = require('../backend/database/model');
const {migrate, importState, loadRows, writeChanges, verifyState} = require('../backend/database/repository');
const seed = require('../backend/data/workbooks.json');
const snapshot = {format: 'pdrb-original-v1', seed, files: seed.workbooks.map(w => ({file: w.file, sheets: w.sheets.length, sha256: 'a'.repeat(64)}))};
function fixture() {
  return {seed: structuredClone(seed), db: {users: [{id: 'restore-test', username: 'restore-test', role: 'admin', passwordHash: 'unchanged-test-hash'}], audit: [{id: 'history-test', action: 'EDIT_CELL'}], notifications: [{id: 'notice-test', recipientId: 'restore-test', readAt: null}], uploadedWorkbooks: [{...structuredClone(seed.workbooks[0]), id: 'test-upload'}], overrides: {[seed.workbooks[0].id]: {'0:1:1': {v: 999}}}, addedRows: {}, addedColumns: {}, editedRows: {}, extraSheets: {}, tableState: {}, workbookDetails: {}, deletedWorkbooks: {[seed.workbooks[1].id]: true}, otherMetadata: {keep: true}}};
}
test('original reset removes uploads and all overlays while preserving identities, history, notifications and source', () => {
  const before = fixture(), untouched = structuredClone(before), next = restoredState(before, snapshot);
  assert.deepEqual(before, untouched);
  assert.deepEqual(next.seed, seed);
  assert.equal(next.db.uploadedWorkbooks.length, 0);
  for (const key of ['overrides', 'addedRows', 'addedColumns', 'editedRows', 'extraSheets', 'tableState', 'workbookDetails', 'deletedWorkbooks']) assert.deepEqual(next.db[key], {});
  assert.deepEqual(next.db.users, before.db.users);
  assert.deepEqual(next.db.audit.slice(1), before.db.audit);
  assert.deepEqual(next.db.notifications, before.db.notifications);
  assert.deepEqual(next.db.otherMetadata, before.db.otherMetadata);
  assert.equal(next.db.audit[0].action, 'RESTORE_ORIGINAL_DATA');
  assert.throws(() => validateSnapshot({...snapshot, files: []}));
  assert.throws(() => validateSnapshot({...snapshot, seed: {...seed, workbooks: []}}));
});
test('SQL original reset is lossless, supports rollback and never changes presensi', async () => {
  const db = new PGlite();
  const client = {async query(sql, params) {
    if (sql.includes('pg_advisory_xact_lock')) return {rows: []};
    if (!params && (sql.includes('CREATE TABLE') || sql.includes('CREATE OR REPLACE FUNCTION'))) {await db.exec(sql); return {rows: []};}
    return db.query(sql, params);
  }};
  try {
    await db.exec("CREATE SCHEMA presensi; CREATE TABLE presensi.restore_sentinel (id int); INSERT INTO presensi.restore_sentinel VALUES(7);");
    const before = fixture();
    await client.query('BEGIN'); await migrate(client); await importState(client, before.seed, before.db, {seed: 'original-reset-test', db: 'test'}); await client.query('COMMIT');
    const next = restoredState(before, snapshot);
    await client.query('BEGIN'); await writeChanges(client, await loadRows(client), flatten(next.seed, next.db)); await verifyState(client, next.seed, next.db); await client.query('ROLLBACK');
    assert.deepEqual(restore(await loadRows(client)), before);
    await client.query('BEGIN'); await writeChanges(client, await loadRows(client), flatten(next.seed, next.db)); await verifyState(client, next.seed, next.db); await client.query('COMMIT');
    assert.deepEqual(restore(await loadRows(client)), next);
    assert.deepEqual((await db.query('SELECT * FROM presensi.restore_sentinel')).rows, [{id: 7}]);
  } finally {await db.close();}
});
