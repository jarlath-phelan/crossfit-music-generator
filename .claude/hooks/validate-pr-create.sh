#!/bin/bash
# Validates PR titles follow conventional commits format
# Pattern: type(scope)?: description
# Examples: feat(api): add Claude Vision parsing, fix(web): image upload compression

PR_TITLE="$1"

PATTERN="^(feat|fix|refactor|test|docs|chore|perf)(\((api|web|shared|docs|infra)\))?!?: [a-z]"

if [[ ! "$PR_TITLE" =~ $PATTERN ]]; then
  echo "ERROR: PR title doesn't match conventional commits format"
  echo "Pattern: type(scope)?: lowercase description"
  echo "Types: feat, fix, refactor, test, docs, chore, perf"
  echo "Scopes: api, web, shared, docs, infra"
  echo "Examples:"
  echo "  feat(api): add Claude Vision parsing"
  echo "  fix(web): image upload compression"
  echo "  refactor: update music source architecture"
  exit 1
fi

exit 0
