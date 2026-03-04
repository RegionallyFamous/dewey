# Release Checklist

## Version Alignment

Confirm versions match across:

- `package.json`
- plugin header in `dewey.php`
- `Stable tag` in `readme.txt`

## Preflight

```bash
npm run lint
npm run test:js
npm run test:php
npm run check
npm run i18n:pot
```

## Package

```bash
npm run release -- <version>
```

Dry run:

```bash
npm run release:dry-run -- <version> --skip-build
```

Release zips are written to `releases/`.
