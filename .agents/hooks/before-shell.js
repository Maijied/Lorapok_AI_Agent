#!/usr/bin/env node
'use strict';
let input = '';
process.stdin.on('data', c => input += c);
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = JSON.parse(input || '{}').command || ''; } catch (_) {}
  const dangerous = /git\s+reset\s+--hard|git\s+push\s+.*--force|rm\s+-rf\s+[\/]/i.test(cmd);
  if (dangerous) {
    console.log(JSON.stringify({
      permission: 'ask',
      message: 'Destructive command detected — confirm before running: ' + cmd
    }));
  } else {
    console.log(JSON.stringify({ permission: 'allow' }));
  }
});
