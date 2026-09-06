import {execFile} from 'child_process';

export interface RunningProcess {
  pid: number;
  name: string;
}

const MAX_BUFFER = 10 * 1024 * 1024;

async function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, {maxBuffer: MAX_BUFFER, windowsHide: true}, (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(String(stdout));
    });
  });
}

// Windows: `tasklist` ships with every supported Windows version, so no helper binary
// has to be bundled and relocated by webpack (which is what broke ps-list >= 8).
async function findWindows(name: string): Promise<RunningProcess[]> {
  const stdout = await run('tasklist', ['/FI', `IMAGENAME eq ${name}`, '/FO', 'CSV', '/NH']);
  const result: RunningProcess[] = [];
  stdout.split(/\r?\n/).forEach((line) => {
    // "SNAP.exe","24428","Console","1","1 234 567 K"
    const match = /^"([^"]+)","(\d+)"/.exec(line.trim());
    if (match && match[1].toLowerCase() === name.toLowerCase()) {
      result.push({name: match[1], pid: Number(match[2])});
    }
  });
  return result;
}

async function findPosix(name: string): Promise<RunningProcess[]> {
  const stdout = await run('ps', ['-axo', 'pid=,comm=']);
  const result: RunningProcess[] = [];
  stdout.split('\n').forEach((line) => {
    const match = /^\s*(\d+)\s+(.*)$/.exec(line);
    if (!match) {
      return;
    }
    const comm = match[2].trim();
    const base = comm.substring(comm.lastIndexOf('/') + 1);
    if (base === name) {
      result.push({name: base, pid: Number(match[1])});
    }
  });
  return result;
}

export async function findProcessByName(name: string): Promise<RunningProcess[]> {
  return process.platform === 'win32' ? findWindows(name) : findPosix(name);
}
