// Runs from npm's `version` lifecycle (see package.json): after `npm version`
// bumps package.json, copy the new version into app.json so the two can't
// drift, and stage it so it lands in the same commit as the tag.
//
//   npm version patch   # 1.0.0 -> 1.0.1, commits, tags v1.0.1
//   git push --follow-tags   # the tag starts .github/workflows/release.yml
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const appJson = JSON.parse(readFileSync('app.json', 'utf8'));

if (appJson.expo.version !== version) {
  appJson.expo.version = version;
  writeFileSync('app.json', `${JSON.stringify(appJson, null, 2)}\n`);
  console.log(`app.json version -> ${version}`);
}
