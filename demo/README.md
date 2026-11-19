# Residue Lens · standalone interactive archive

This folder builds a static, standalone Vite/React demo from the frozen 13 November 2026 portfolio snapshot. It preserves the food comparison, ten-food UK evidence sample, selected metrics, cohort switching and in-memory shortlist without deploying the retired Next.js backend.

```bash
cd demo
npm install
npm run build
npx playwright install chromium
npm run test:e2e
```

Source data and artwork were copied from the archived demo in `FLABDUL/personal-blog`. Source links and OGL attribution remain visible. There is no authentication, payment, database, feedback ingestion, or live data refresh. The original product case study remains at https://www.madebyhakim.com/projects/residue-lens/.

Publishing: GitHub Pages must be enabled under **Settings → Pages → Source: GitHub Actions** before deployment can succeed. Do not migrate DNS until the default Pages URL and custom domain have been tested. The demo emits relative assets so it runs under both `/residue-lens/` and a custom-domain root.
