#!/usr/bin/env node
'use strict';
console.log(JSON.stringify({
  continue: true,
  message: 'Model/API files changed — run npm test and sync Docs/BRAIN if architecture shifted.'
}));
