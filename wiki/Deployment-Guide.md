# Deployment Guide

## Platform

The project is linked to Vercel.

Known project metadata from `.vercel/project.json`:

```json
{
  "projectName": "kwibuka-spatial-intelligence"
}
```

The README lists the production URL:

```text
https://kwibuka-spatial-intelligence-sable.vercel.app
```

## Local Production Build

Run before deploying:

```bash
npm.cmd run build
```

Expected output:

- `dist/index.html`
- bundled CSS in `dist/assets/`
- bundled JS in `dist/assets/`

## Preview Deployment

Use a preview deployment when you need a different Vercel address without moving production.

```bash
npx.cmd vercel deploy --yes
```

The command returns a preview URL similar to:

```text
https://kwibuka-spatial-intelligence-<hash>-elysemukamisha.vercel.app
```

## Production Deployment

Use only when the preview has been checked:

```bash
npx.cmd vercel deploy --prod --yes
```

## Deployment Checklist

Before deploying:

- Run `npm.cmd run build`.
- If route data changed, run route validation.
- Start or use a local dev server and inspect the target feature.
- Confirm static assets referenced from JSON exist in `public/`.
- Confirm the app still loads without external topology by relying on the fallback border.

After deploying:

- Open the preview/production URL.
- Confirm page loads.
- Check primary controls: timeline, RPF toggle, memorial toggle, display modes, info cards.
- Click at least one event, one memorial, and one RPF marker.
- Confirm no route visually leaves Rwanda.

## Deployment History

Use `DEPLOYMENTS.md` for detailed deployment history and recently shipped changes.

## Notes On Vercel CLI

The local global `vercel` binary may not be installed. `npx.cmd vercel` works with the project dependency/download path.

If PowerShell blocks scripts, prefer `.cmd` invocations:

```bash
npm.cmd run build
npx.cmd vercel deploy --yes
```

