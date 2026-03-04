# Release Checklist

## Version Alignment

Confirm versions match across:

- `package.json`
- plugin header in `dewey.php`
- `Stable tag` in `readme.txt`
- `SECURITY.md` version header
- release URL in `blueprint.json`
- latest changelog section in `readme.txt` matches shipped features

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

## Post-Package Validation

- Open `releases/dewey-<version>.zip` and verify expected plugin root layout.
- Hit `/wp-json/dewey/v1/status` in an authenticated session and confirm:
  - `index_health` is present
  - `integrity` report is present
  - `telemetry` counters are present
- Validate action-intent safety:
  - `/execute-action` exists
  - destructive actions require token-confirmed execution
  - capability errors are returned when user lacks permissions
