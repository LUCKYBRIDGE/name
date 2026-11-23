import { createHash } from "node:crypto";
import fs from "node:fs";
import { join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "../build/lib/csv.mjs";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const readCsv = path => parseCsv(fs.readFileSync(join(repository, path), "utf8")).rows;
const baseNotices = ["COPYRIGHT.md", "THIRD_PARTY_NOTICES.md"];
const isFilePath = path => path && !/[*?\[\]{}:\\\x00-\x1f]/.test(path)
  && path.split("/").every(part => part && part !== "." && part !== "..");
const reviewRequiredStatuses = new Set([
  "review_before_broad_public_release",
  "row_level_source_check_required",
  "first_party_all_rights_reserved",
  "reference_metadata_only",
  "allowed_with_kasi_attribution_if_scope_verified",
]);

function fingerprint(root, paths) {
  const hash = createHash("sha256");
  for (const path of [...paths].sort()) {
    const bytes = fs.readFileSync(join(root, path));
    const digest = createHash("sha256").update(bytes).digest("hex");
    hash.update(`${path}\0${digest}\n`);
  }
  return hash.digest("hex");
}

function buildPolicy() {
  const licenseMap = readCsv("data/meta/license-map.csv");
  const sourceRights = new Map(readCsv("data/meta/source-rights.csv").map(row => [row.source_id, row.rights_class]));
  const policy = new Map();
  const rules = readCsv("data/meta/distribution-policy.csv");
  const restricted = rules.filter(rule => reviewRequiredStatuses.has(rule.distribution_status));
  for (const rule of rules) {
    if (rule.distribution_status !== "public_bundle_with_notices") continue;
    const path = rule.path_pattern;
    const matches = licenseMap.filter(row => row.path_pattern.split("|").includes(path));
    if (!isFilePath(path) || !path.startsWith("data/") || policy.has(path) || matches.length !== 1) {
      throw new Error(`Invalid exact public bundle rule: ${path}`);
    }
    const conflictingRule = restricted.find(entry =>
      entry.path_pattern.split("|").some(pattern => posix.matchesGlob(path, pattern)));
    if (conflictingRule) {
      throw new Error(`Public bundle rule conflicts with ${conflictingRule.distribution_status}: ${path}`);
    }
    const [license] = matches;
    const notices = license.notice_file.split("|");
    if (license.notice_required !== "true" || !notices.every(isFilePath) ||
        license.source_ids.split("|").some(id => sourceRights.get(id) !== "embedded_open_license") ||
        !["permitted_with_notice", "derived_permitted_with_notice", "derived_permitted_with_notices"].includes(license.redistribution_status)) {
      throw new Error(`Public bundle rule lacks a compatible source and notice mapping: ${path}`);
    }
    policy.set(path, { notices: new Set([...baseNotices, ...notices]), reviewedSha256: rule.reviewed_sha256 });
  }
  return policy;
}

function verifyFingerprint(root, path, { notices, reviewedSha256 }) {
  if (fingerprint(root, [path, ...notices]) !== reviewedSha256) {
    throw new Error(`Public bundle fingerprint requires review: ${path}`);
  }
}

function verifyBundle(root, policy) {
  const paths = [];
  for (const entry of fs.readdirSync(root, { recursive: true, withFileTypes: true })) {
    const path = relative(root, join(entry.parentPath, entry.name)).split(sep).join("/");
    if (!entry.isFile() && !entry.isDirectory()) throw new Error(`Unsupported bundle entry: ${path}`);
    if (entry.isFile()) paths.push(path);
  }
  const dataPaths = paths.filter(path => path.startsWith("data/"));
  if (!dataPaths.length) throw new Error("Bundle contains no data files");

  const required = new Set(dataPaths.flatMap(path => {
    if (!policy.has(path)) throw new Error(`Public bundle review required: ${path}`);
    return [...policy.get(path).notices];
  }));
  const present = new Set(paths);
  for (const notice of required) {
    if (!present.has(notice)) throw new Error(`Missing required notice: ${notice}`);
  }

  for (const path of paths) {
    if (!policy.has(path) && !required.has(path)) throw new Error(`Unexpected bundle file: ${path}`);
    const reference = fs.readFileSync(join(repository, path));
    if (!reference.equals(fs.readFileSync(join(root, path)))) {
      throw new Error(`Bundle file differs from the pinned checkout: ${path}`);
    }
  }
  for (const path of dataPaths) verifyFingerprint(root, path, policy.get(path));
  console.log(`Verified ${dataPaths.length} public bundle data files and ${required.size} notices.`);
}

const [argument, path] = process.argv.slice(2);
try {
  const policy = buildPolicy();
  if (argument === "--fingerprint" && path && process.argv.length === 4) {
    if (!policy.has(path)) throw new Error(`Public bundle review required: ${path}`);
    console.log(fingerprint(repository, [path, ...policy.get(path).notices]));
  } else if (argument === "--check-policy" && process.argv.length === 3) {
    for (const [file, rule] of policy) verifyFingerprint(repository, file, rule);
    console.log(`Verified review fingerprints for ${policy.size} public data paths.`);
  } else if (argument && process.argv.length === 3) {
    verifyBundle(resolve(argument), policy);
  } else {
    throw new Error("Usage: npm run verify:public-data -- <bundle-root> or --fingerprint <data/path> or --check-policy");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
