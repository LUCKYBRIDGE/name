import {spawnSync} from "node:child_process";
const check=process.argv.includes("--check");
const scripts=["scripts/build/normalize-hanja.mjs","scripts/build/build-reading-index.mjs","scripts/build/build-meaning-senses.mjs","scripts/build/build-solar-term-boundary-vectors.mjs","scripts/audit/build-source-audit.mjs","scripts/audit/build-source-rights.mjs","scripts/build/build-integration-manifest.mjs"];
for (const script of scripts) {
  const args=[script]; if(check) args.push("--check");
  const result=spawnSync(process.execPath,args,{stdio:"inherit"});
  if(result.status!==0) process.exit(result.status??1);
}
