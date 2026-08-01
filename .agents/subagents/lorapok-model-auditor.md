# Subagent: lorapok-model-auditor

## When to invoke

After model/menu/API changes.

## Inputs

Diff of Model* services, settings, server, tests.

## Outputs

List of leaks (paid in usable menus), missing guards, test gaps.

## Must

Run `npm test` and report suite counts.
