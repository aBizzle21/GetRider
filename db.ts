import { Pool } from 'pg';

// Railway injects DATABASE_URL. SSL is required on Railway Postgres.
const connectionString = process.env.DATABASE_URL;
export const pool = new Pool({
  connectionString,
  ssl: connectionString && !connectionString.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
});

// One row per (tester_key, test_id). Re-submitting the same test overwrites —
// so a tester changing a verdict just updates their row, never duplicates.
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS results (
      id            BIGSERIAL PRIMARY KEY,
      tester_key    TEXT NOT NULL,
      tester_name   TEXT NOT NULL,
      tag           TEXT NOT NULL,
      device        TEXT NOT NULL,
      role          TEXT NOT NULL,
      wave          TEXT,
      group_name    TEXT NOT NULL,
      test_id       TEXT NOT NULL,
      test_text     TEXT NOT NULL,
      pass_condition TEXT,
      verdict       TEXT NOT NULL,
      severity      TEXT,
      recording     BOOLEAN NOT NULL DEFAULT FALSE,
      notes         TEXT,
      logged_at     TIMESTAMPTZ,
      received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tester_key, test_id)
    );
    CREATE INDEX IF NOT EXISTS idx_results_verdict ON results (verdict);
    CREATE INDEX IF NOT EXISTS idx_results_tag ON results (tag);
    CREATE INDEX IF NOT EXISTS idx_results_testerkey ON results (tester_key);
  `);
  // Self-heal: if the table pre-dates the pass_condition column, add it.
  // Harmless on fresh databases where CREATE TABLE already included it.
  await pool.query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS pass_condition TEXT`);

  // General feedback (aesthetic / UX / suggestions) — separate from pass/fail results.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS issues (
      id            BIGSERIAL PRIMARY KEY,
      issue_id      TEXT UNIQUE,
      tester_key    TEXT NOT NULL,
      tester_name   TEXT NOT NULL,
      tag           TEXT NOT NULL,
      device        TEXT NOT NULL,
      role          TEXT NOT NULL,
      wave          TEXT,
      category      TEXT NOT NULL,
      note          TEXT,
      logged_at     TIMESTAMPTZ,
      received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_issues_testerkey ON issues (tester_key);
    CREATE INDEX IF NOT EXISTS idx_issues_category ON issues (category);
  `);
}

export interface IncomingResult {
  tester_key: string;
  tester: string;
  tag: string;
  device: string;
  role: string;
  wave?: string;
  group: string;
  test_id: string;
  test: string;
  pass_condition?: string;
  verdict: string;
  severity?: string;
  recording?: boolean;
  notes?: string;
  logged_at?: string;
}

export async function upsertResult(r: IncomingResult) {
  await pool.query(
    `INSERT INTO results
       (tester_key, tester_name, tag, device, role, wave, group_name,
        test_id, test_text, pass_condition, verdict, severity, recording, notes, logged_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (tester_key, test_id) DO UPDATE SET
       tester_name = EXCLUDED.tester_name,
       tag         = EXCLUDED.tag,
       device      = EXCLUDED.device,
       role        = EXCLUDED.role,
       wave        = EXCLUDED.wave,
       verdict     = EXCLUDED.verdict,
       severity    = EXCLUDED.severity,
       recording   = EXCLUDED.recording,
       notes       = EXCLUDED.notes,
       logged_at   = EXCLUDED.logged_at,
       received_at = NOW()`,
    [
      r.tester_key, r.tester, r.tag, r.device, r.role, r.wave || null, r.group,
      r.test_id, r.test, r.pass_condition || null, r.verdict, r.severity || null, !!r.recording,
      r.notes || null, r.logged_at ? new Date(r.logged_at) : null,
    ],
  );
}

export async function allResults() {
  const { rows } = await pool.query(
    `SELECT tester_name, tag, device, role, wave, group_name, test_id, test_text, pass_condition,
            verdict, severity, recording, notes, logged_at, received_at
       FROM results
      ORDER BY
        CASE WHEN wave IS NULL OR wave='' THEN 1 ELSE 0 END,
        wave,
        tag, tester_name, group_name, test_id`,
  );
  return rows;
}

export async function clearAllResults(): Promise<number> {
  const { rowCount } = await pool.query('DELETE FROM results');
  return rowCount || 0;
}

export async function clearTester(testerKey: string): Promise<number> {
  const { rowCount } = await pool.query('DELETE FROM results WHERE tester_key = $1', [testerKey]);
  const r2 = await pool.query('DELETE FROM issues WHERE tester_key = $1', [testerKey]);
  return (rowCount || 0) + (r2.rowCount || 0);
}

export interface IncomingIssue {
  issue_id: string;
  tester_key: string;
  tester: string;
  tag: string;
  device: string;
  role: string;
  wave?: string;
  category: string;
  note?: string;
  logged_at?: string;
}

export async function insertIssue(i: IncomingIssue) {
  await pool.query(
    `INSERT INTO issues
       (issue_id, tester_key, tester_name, tag, device, role, wave, category, note, logged_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (issue_id) DO NOTHING`,
    [i.issue_id, i.tester_key, i.tester, i.tag, i.device, i.role, i.wave || null,
     i.category, i.note || null, i.logged_at ? new Date(i.logged_at) : null],
  );
}

export async function allIssues() {
  const { rows } = await pool.query(
    `SELECT tester_name, tag, device, role, wave, category, note, logged_at, received_at
       FROM issues ORDER BY received_at DESC`,
  );
  return rows;
}

export async function testerIssues(
  testerKey: string,
  filter?: { wave?: string; device?: string; role?: string },
) {
  const clauses = ['tester_key = $1'];
  const params: any[] = [testerKey];
  if (filter?.wave !== undefined && filter.wave !== '') {
    params.push(filter.wave); clauses.push(`COALESCE(wave,'') = $${params.length}`);
  }
  if (filter?.device !== undefined && filter.device !== '') {
    params.push(filter.device); clauses.push(`COALESCE(device,'') = $${params.length}`);
  }
  if (filter?.role !== undefined && filter.role !== '') {
    params.push(filter.role); clauses.push(`COALESCE(role,'') = $${params.length}`);
  }
  const { rows } = await pool.query(
    `SELECT category, note, logged_at, received_at
       FROM issues WHERE ${clauses.join(' AND ')} ORDER BY received_at DESC`,
    params,
  );
  return rows;
}

export async function clearAllIssues(): Promise<number> {
  const { rowCount } = await pool.query('DELETE FROM issues');
  return rowCount || 0;
}

export async function testerResults(
  testerKey: string,
  filter?: { wave?: string; device?: string; role?: string },
) {
  // Base: all rows for this tester_key. Optional wave/device/role narrows to the
  // exact leaderboard row the user clicked (the leaderboard groups by those columns,
  // so one tester_key can map to several rows — e.g. Wave 1 and Wave 2).
  const clauses = ['tester_key = $1'];
  const params: any[] = [testerKey];
  if (filter?.wave !== undefined && filter.wave !== '') {
    params.push(filter.wave); clauses.push(`COALESCE(wave,'') = $${params.length}`);
  }
  if (filter?.device !== undefined && filter.device !== '') {
    params.push(filter.device); clauses.push(`COALESCE(device,'') = $${params.length}`);
  }
  if (filter?.role !== undefined && filter.role !== '') {
    params.push(filter.role); clauses.push(`COALESCE(role,'') = $${params.length}`);
  }
  const { rows } = await pool.query(
    `SELECT group_name, test_id, test_text, pass_condition, verdict, severity,
            recording, notes, logged_at, received_at
       FROM results
      WHERE ${clauses.join(' AND ')}
      ORDER BY
        CASE verdict WHEN 'fail' THEN 1 WHEN 'block' THEN 2 WHEN 'pass' THEN 3 ELSE 4 END,
        CASE severity WHEN 'S1' THEN 1 WHEN 'S2' THEN 2 WHEN 'S3' THEN 3 WHEN 'S4' THEN 4 ELSE 5 END,
        received_at DESC`,
    params,
  );
  return rows;
}

export async function summary() {
  const totals = await pool.query(
    `SELECT verdict, COUNT(*)::int AS n FROM results GROUP BY verdict`,
  );
  const bySeverity = await pool.query(
    `SELECT severity, COUNT(*)::int AS n
       FROM results WHERE verdict='fail' AND severity IS NOT NULL
      GROUP BY severity ORDER BY severity`,
  );
  const byTester = await pool.query(
    `SELECT tester_key, tester_name, tag, device, role, wave,
            COUNT(*)::int AS logged,
            COUNT(*) FILTER (WHERE verdict='pass')::int  AS pass,
            COUNT(*) FILTER (WHERE verdict='fail')::int  AS fail,
            COUNT(*) FILTER (WHERE verdict='block')::int AS blocked,
            (
              COUNT(*) FILTER (WHERE verdict='fail' AND severity='S1') * 10 +
              COUNT(*) FILTER (WHERE verdict='fail' AND severity='S2') * 5 +
              COUNT(*) FILTER (WHERE verdict='fail' AND severity='S3') * 2 +
              COUNT(*) FILTER (WHERE verdict='fail' AND severity='S4') * 1 +
              COUNT(*) FILTER (WHERE verdict='fail' AND severity IS NULL) * 2 +
              COUNT(*) FILTER (WHERE verdict='pass') * 1
            )::int AS score,
            MAX(received_at) AS last_seen
       FROM results
      GROUP BY tester_key, tester_name, tag, device, role, wave
      ORDER BY score DESC, fail DESC, logged DESC`,
  );
  const failures = await pool.query(
    `SELECT tester_name, tag, device, test_id, test_text, severity, recording, notes, received_at
       FROM results WHERE verdict IN ('fail','block')
      ORDER BY
        CASE severity WHEN 'S1' THEN 1 WHEN 'S2' THEN 2 WHEN 'S3' THEN 3 WHEN 'S4' THEN 4 ELSE 5 END,
        received_at DESC`,
  );
  const byGroup = await pool.query(
    `SELECT group_name,
            COUNT(*)::int AS logged,
            COUNT(*) FILTER (WHERE verdict='fail')::int AS fail
       FROM results GROUP BY group_name ORDER BY fail DESC, group_name`,
  );
  const issueByCat = await pool.query(
    `SELECT category, COUNT(*)::int AS n FROM issues GROUP BY category ORDER BY n DESC`,
  );
  const recentIssues = await pool.query(
    `SELECT tester_name, tag, device, category, note, received_at
       FROM issues ORDER BY received_at DESC LIMIT 100`,
  );
  const issueCount = await pool.query(`SELECT COUNT(*)::int AS n FROM issues`);
  // per-tester issue counts, to fold into byTester rows
  const issuePerTester = await pool.query(
    `SELECT tester_key, COUNT(*)::int AS issues FROM issues GROUP BY tester_key`,
  );
  const issueMap = {};
  issuePerTester.rows.forEach((r) => { issueMap[r.tester_key] = r.issues; });
  const byTesterWithIssues = byTester.rows.map((t) => ({ ...t, issues: issueMap[t.tester_key] || 0 }));

  return {
    totals: totals.rows,
    bySeverity: bySeverity.rows,
    byTester: byTesterWithIssues,
    failures: failures.rows,
    byGroup: byGroup.rows,
    issueByCat: issueByCat.rows,
    recentIssues: recentIssues.rows,
    issueCount: issueCount.rows[0] ? issueCount.rows[0].n : 0,
  };
}
