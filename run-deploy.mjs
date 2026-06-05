import { execSync } from 'child_process';
import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

const root = 'c:\\Users\\Gevorg\\resume-constructor';
const log = join(root, 'deploy-step.log');
const run = (label, cmd) => {
  appendFileSync(log, `\n========== ${label} ==========\n`);
  try {
    const out = execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    appendFileSync(log, out);
    appendFileSync(log, 'EXIT: 0\n');
    return 0;
  } catch (e) {
    appendFileSync(log, (e.stdout || '') + (e.stderr || '') + (e.message || ''));
    appendFileSync(log, `EXIT: ${e.status ?? 1}\n`);
    return e.status ?? 1;
  }
};

writeFileSync(log, 'Deploy run started\n');

run('git config hooks', 'git config core.hooksPath .githooks');
run('git add', 'git add .');
run('git reset env', 'git reset HEAD .env');
run('git status', 'git status --short');
run('git amend', 'git -c user.name=GEV44 -c user.email=gev220705@gmail.com commit --amend -m "docs: clean README for GitHub, author GEV44"');
run('git push', 'git push --force-with-lease origin main');
run('vercel prod', 'vercel --prod --yes');
run('verify', 'git log -1 --format=fuller && git log -1 --format=%B');

appendFileSync(log, '\nDONE\n');
console.log('Finished. See deploy-step.log');
