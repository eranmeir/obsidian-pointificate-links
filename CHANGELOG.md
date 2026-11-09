# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-09

### Added

- Command "Decode links and enclose in pointy brackets", which converts every URL-encoded Markdown link in the current note, e.g. `[My Note](My%20Note.md)` becomes `[My Note](<My Note.md>)`.
- Automatic conversion of encoded links as they are inserted into the editor (link autocomplete, paste, drag-and-drop), in the same undo step as the insertion.
- Setting "Automatically use pointy brackets" to turn the automatic conversion on or off (on by default).

[Unreleased]: https://github.com/eranmeir/obsidian-pointificate-links/compare/1.0.0...HEAD
[1.0.0]: https://github.com/eranmeir/obsidian-pointificate-links/releases/tag/1.0.0
