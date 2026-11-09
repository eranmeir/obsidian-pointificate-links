# Pointificate Links

A simple plugin for Obsidian (https://obsidian.md) that decodes URL encoded links and encloses them in pointy (angled) brackets, which are more readable and comply with the [CommonMark spec](https://spec.commonmark.org/).

With wikilinks turned off, Obsidian writes Markdown links with spaces encoded as `%20`:

```markdown
[My Note](My%20Note.md)
```

This plugin turns them into:

```markdown
[My Note](<My Note.md>)
```

## Behavior

### Automatic conversion

Whenever text containing an encoded Markdown link is inserted into the editor (link autocomplete, paste, drag-and-drop), the link is rewritten right away. The rewrite is part of the same undo step as the insertion, and the cursor stays where it was.

Only links whose destination contains a `%` and is not already in pointy brackets are touched.

### Manual command

`Pointificate Links: Decode links and enclose in pointy brackets` converts every encoded link in the currently open document. Use it to clean up existing notes, or links changed in ways the automatic mode can't see (see Limits).

## Settings

- **Automatically use pointy brackets** (default: on). Turns the automatic conversion on or off. The manual command works either way.

## Limits

- **Only edits made in the editor are converted automatically.** When you rename or move a file, Obsidian updates links in other notes directly on disk, without going through the editor. Those links are likely to be re-encoded as `%20` (not yet verified), and the plugin won't fix them automatically. Run the command on the affected notes.
- **Links are left alone when they can't be converted safely:**
  - the destination has a malformed `%` sequence (for example `%zz`);
  - the decoded destination contains `<`, `>` or a line break, which would break the pointy brackets.
- **The manual command replaces the whole document text**, so it may reset the cursor position and scroll position.
- Links already in pointy brackets, wikilinks and links without `%` are never modified.
