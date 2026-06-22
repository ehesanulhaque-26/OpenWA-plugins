# Changelog

All notable changes to the **FAQ / Auto-Reply Bot** plugin are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this plugin adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The version here always matches `manifest.json`'s `version`.

## [Unreleased]

## [0.1.0] — 2026-06-23

First release. Built against OpenWA v0.6.1.

### Added

- Auto-reply to inbound messages from operator-defined rules with per-rule matching:
  `contains` / `exact` (case-insensitive) and `regex` (compiled with the `i` flag). First matching
  rule wins; replies are sent as a quoted reply to the triggering message.
- Optional configurable fallback reply when no rule matches (empty = stay silent), throttled per chat
  by `fallbackCooldownSec`.
- `respondInGroups` toggle (default off — direct chats only).
- Invalid `regex` rules are skipped with a warning; a structurally invalid `rules` config fails fast.
