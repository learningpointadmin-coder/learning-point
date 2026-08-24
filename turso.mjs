// scripts/turso.mjs — Turso (libSQL) HTTP pipeline executor
// Usage:
//   node scripts/turso.mjs <file.sql>     # run raw SQL statements (split on ";")
//   node scripts/turso.mjs -j <file.json> # run explicit pipeline {requests:[...]}
//   echo "SELECT ..." | node scripts/turso.mjs   # SQL from stdin
import fs from "node:fs";

const raw = process.env.TURSO_DATABASE_URL || "";
const url = raw.replace(/^libsql:\/\//, "https://") + "/v2/pipeline";
const token = process.env.TURSO_AUTH_TOKEN;

function sqlToRequests(sql) {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((sql) => ({ type: "execute", stmt: { sql } }));
}

async function run(requests) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("HTTP", res.status);
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }
  return data;
}

// Pretty-print a pipeline result: for each response, if it's a SELECT, print rows.
function printResults(data) {
  for (const r of data.results || []) {
    if (r.type === "error") {
      console.error("ERROR:", r.error.message);
      continue;
    }
    const res = r.response?.result;
    if (!res) continue;
    const cols = (res.cols || []).map((c) => c.name);
    const rows = res.rows || [];
    for (const row of rows) {
      const obj = {};
      cols.forEach((c, i) => {
        const cell = row[i];
        obj[c] = cell?.type === "null" ? null : cell?.value;
      });
      console.log(JSON.stringify(obj));
    }
    if (rows.length === 0) console.log("(no rows)");
  }
}

const arg = process.argv[2];
let input;
if (arg === "-j") {
  const json = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
  const data = await run(json.requests || json);
  printResults(data);
} else if (arg && fs.existsSync(arg)) {
  const sql = fs.readFileSync(arg, "utf8");
  const data = await run(sqlToRequests(sql));
  printResults(data);
} else {
  const sql = fs.readFileSync(0, "utf8");
  const data = await run(sqlToRequests(sql));
  printResults(data);
}
