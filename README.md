# Residue Lens

An archived Next.js/TypeScript product that turns official pesticide-residue monitoring into food comparisons with visible sources, sample sizes and limitations.

**[Try the interactive demo](https://www.madebyhakim.com/projects/residue-lens-demo/) · [Read the case study](https://www.madebyhakim.com/projects/residue-lens/)**

This public showcase is a source snapshot of the retired product. The original private development history, campaign correspondence, beta feedback and operational records are intentionally excluded. Active service operation ended in November 2026; data is frozen and is not current shopping or medical advice.

## What to explore

- `src/app` and `src/components`: comparison, evidence details and browser-only shortlists.
- `src/lib`: programme-aware metrics, local persistence, validation and optional service boundaries.
- `scripts`: Python imports and validation for UK, USDA and EFSA monitoring sources.
- `src/data`: aggregate monitoring results with provenance and reporting years.
- `database/schema.sql`: the former optional account/synchronisation schema; no user data.
- `tests`: data-import, metric, storage and browser journey checks.

The portfolio demo demonstrates food selection, metric/cohort changes, source inspection and a temporary shortlist using ten actual UK records. The source here preserves the larger original application.

## Run locally

Requires Node.js 22 or later and Python 3. Install the data-tool dependencies when running importers or Python checks.

```sh
npm ci
python -m pip install -r requirements-data.txt
npm run dev
```

Open http://localhost:3000. The core comparison and browser-only lists work without service credentials. `.env.example` contains empty placeholders for optional services; the retired production resources are gone. Account, feedback and payment paths require your own services and are not part of the hosted demo.

```sh
npm run data:validate
npm test
npm run lint
npm run typecheck
npm run build
```

The build fetches Google fonts. Data-refresh scripts access public upstream files; refresh deliberately and validate results before presenting them as current.

This historical snapshot retains its original dependency versions. A dependency audit on 13 November 2026 reported advisories, including a critical Next.js advisory. Review and update dependencies before deploying your own copy; this repository is not a production-ready starter. The hosted portfolio demo is a separate static implementation and does not run this Next.js application.

## Evidence and attribution

UK data comes from official pesticide-residue monitoring, USDA data from the Pesticide Data Program, and European data from EFSA official-control results. Each dataset retains source links and applicable licensing metadata. UK data contains public sector information licensed under the Open Government Licence v3.0. Upstream data rights and attribution requirements remain applicable.

A detected residue is not itself evidence of unsafe exposure. Regulatory exceedances are distinct from health-risk conclusions. Programmes, countries and years are not pooled into one safety score; targeted samples do not represent all food on sale.

## Project outcome

The project shipped, was tested and marketed, and was retired after public validation did not establish sufficient continuing demand. The case study records the architecture and stopping decision. This repository is preserved for code review and learning; it is not a maintained service.
