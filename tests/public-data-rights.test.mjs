import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = join(root, "scripts/validate/verify-public-data.mjs");
const technicalTable = "data/methods/kangxi-radical-stroke-ranges.csv";
const unicodeNotice = "LICENSES/Unicode-3.0.txt";

function stageBundle(t, dataPaths) {
  const directory = fs.mkdtempSync(join(os.tmpdir(), "name-public-data-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  for (const path of [...dataPaths, "COPYRIGHT.md", "THIRD_PARTY_NOTICES.md", unicodeNotice]) {
    const destination = join(directory, path);
    fs.mkdirSync(dirname(destination), { recursive: true });
    fs.copyFileSync(join(root, path), destination);
  }
  return directory;
}

function verify(directory, script = cli) {
  return spawnSync(process.execPath, [script, directory], { encoding: "utf8" });
}

test("public bundle accepts the reviewed technical table with all notices", t => {
  const result = verify(stageBundle(t, [technicalTable]));
  assert.equal(result.status, 0, result.stderr);
});

test("public bundle rejects data pending review even when approved files are present", t => {
  for (const path of [
    "data/hanja/normalized/reading-index.json",
    "data/hanja/enriched/unihan-radical-strokes-provisional.csv",
    "data/hanja/enriched/hanja-master-enriched.csv",
    "data/surnames/clans-core-2015.csv",
    "data/surnames/surnames.csv",
    "data/surnames/representative-clans-2015.csv",
  ]) {
    const result = verify(stageBundle(t, [technicalTable, path]));
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes(`Public bundle review required: ${path}`), result.stderr);
  }
});

test("public bundle rejects missing or modified license notices", t => {
  const directory = stageBundle(t, [technicalTable]);
  const notice = join(directory, unicodeNotice);
  fs.unlinkSync(notice);
  const missing = verify(directory);
  assert.equal(missing.status, 1);
  assert.ok(missing.stderr.includes(`Missing required notice: ${unicodeNotice}`), missing.stderr);

  fs.writeFileSync(notice, "modified notice");
  const modified = verify(directory);
  assert.equal(modified.status, 1);
  assert.ok(modified.stderr.includes(`Bundle file differs from the pinned checkout: ${unicodeNotice}`), modified.stderr);
});

test("public bundle rejects extra files outside the reviewed layout", t => {
  const directory = stageBundle(t, [technicalTable]);
  fs.writeFileSync(join(directory, "knowledge-base.json"), "{}");
  const result = verify(directory);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unexpected bundle file: knowledge-base\.json/);
});

test("public bundle rejects modified data under a reviewed path", t => {
  const directory = stageBundle(t, [technicalTable]);
  fs.appendFileSync(join(directory, technicalTable), "\n");
  const result = verify(directory);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes(`Bundle file differs from the pinned checkout: ${technicalTable}`), result.stderr);
});

function stagePolicyCheckout(t) {
  const directory = stageBundle(t, [technicalTable]);
  for (const file of [
    "data/meta/license-map.csv",
    "data/meta/source-rights.csv",
    "data/meta/distribution-policy.csv",
    "scripts/build/lib/csv.mjs",
    "scripts/validate/verify-public-data.mjs",
  ]) {
    const destination = join(directory, file);
    fs.mkdirSync(dirname(destination), { recursive: true });
    fs.copyFileSync(join(root, file), destination);
  }
  return directory;
}

for (const file of [technicalTable, unicodeNotice]) {
  test(`public bundle rejects simultaneous changes in the checkout and stage for ${file}`, t => {
    const checkout = stagePolicyCheckout(t);
    const stage = stageBundle(t, [technicalTable]);
    for (const directory of [checkout, stage]) fs.appendFileSync(join(directory, file), "\n");

    const result = verify(stage, join(checkout, "scripts/validate/verify-public-data.mjs"));
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes(`Public bundle fingerprint requires review: ${technicalTable}`), result.stderr);
  });
}

for (const pattern of [technicalTable, "data/methods/**"]) {
  test(`public bundle rejects an approval covered by a review rule for ${pattern}`, t => {
    const checkout = stagePolicyCheckout(t);
    const stage = stageBundle(t, [technicalTable]);
    fs.appendFileSync(join(checkout, "data/meta/distribution-policy.csv"),
      `${pattern},review_before_broad_public_release,Manual review,medium,Regression fixture,\n`);

    const result = verify(stage, join(checkout, "scripts/validate/verify-public-data.mjs"));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Public bundle rule conflicts with review_before_broad_public_release/);
  });
}

test("policy validation rejects a stale fingerprint before a bundle exists", t => {
  const checkout = stagePolicyCheckout(t);
  fs.appendFileSync(join(checkout, unicodeNotice), "\n");
  const result = verify("--check-policy", join(checkout, "scripts/validate/verify-public-data.mjs"));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Public bundle fingerprint requires review/);
});
