import fs from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "../build/lib/csv.mjs";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const readCsv = path => parseCsv(fs.readFileSync(join(repository, path), "utf8")).rows;
const baseNotices = ["COPYRIGHT.md", "THIRD_PARTY_NOTICES.md"];
const isFilePath = path => path && !/[*?\[\]{}:\\]/.test(path)
  && path.split("/").every(part => part && part !== "." && part !== "..");

function buildPolicy() {
  const licenseMap = readCsv("data/meta/license-map.csv");
  const sourceRights = new Map(readCsv("data/meta/source-rights.csv").map(row => [row.source_id, row.rights_class]));
  const policy = new Map();
  for (const rule of readCsv("data/meta/distribution-policy.csv")) {
    if (rule.distribution_status !== "public_bundle_with_notices") continue;
    const path = rule.path_pattern;
    const matches = licenseMap.filter(row => row.path_pattern.split("|").includes(path));
    if (!isFilePath(path) || !path.startsWith("data/") || policy.has(path) || matches.length !== 1) {
      throw new Error(`Invalid exact public bundle rule: ${path}`);
    }
    const [license] = matches;
    const notices = license.notice_file.split("|");
    if (license.notice_required !== "true" || !notices.every(isFilePath) ||
        license.source_ids.split("|").some(id => sourceRights.get(id) !== "embedded_open_license") ||
        !["permitted_with_notice", "derived_permitted_with_notice", "derived_permitted_with_notices"].includes(license.redistribution_status)) {
      throw new Error(`Public bundle rule lacks a compatible source and notice mapping: ${path}`);
    }
    policy.set(path, [...baseNotices, ...notices]);
  }
  return policy;
}

function verifyBundle(root) {
  const policy = buildPolicy();
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
    return policy.get(path);
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
  console.log(`Verified ${dataPaths.length} public bundle data files and ${required.size} notices.`);
}

const [bundleRoot] = process.argv.slice(2);
try {
  if (!bundleRoot || process.argv.length !== 3) throw new Error("Usage: npm run verify:public-data -- <bundle-root>");
  verifyBundle(resolve(bundleRoot));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
