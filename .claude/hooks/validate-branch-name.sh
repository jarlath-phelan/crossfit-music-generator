#!/bin/bash
# Validates branch names follow convention: type-description
# Pattern: lowercase type, hyphen-separated words
# Examples: feat-photo-input, fix-bpm-parsing, refactor-music-sources

BRANCH_NAME="$1"

# Skip validation for main/master/develop
if [[ "$BRANCH_NAME" =~ ^(main|master|develop)$ ]]; then
  exit 0
fi

# Pattern: lowercase-type/lowercase-words or type-lowercase-words
PATTERN="^([a-z][a-z0-9]*)-[a-z0-9]+(-[a-z0-9]+)*$"

if [[ ! "$BRANCH_NAME" =~ $PATTERN ]]; then
  echo "ERROR: Branch name '$BRANCH_NAME' doesn't match pattern: $PATTERN"
  echo "Examples: feat-photo-input, fix-bpm-parsing, refactor-music-sources"
  exit 1
fi

exit 0
