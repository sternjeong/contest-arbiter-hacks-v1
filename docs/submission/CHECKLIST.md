# Arbiter Hacks V1: human submission checklist

Deadline: **2026-12-20, 9:00 pm PST** (= 2026-12-21 14:00 KST). Late entries are not judged. Aim to submit by 2026-12-19.

## Eligibility & registration
- [ ] **Confirm student eligibility.** The contest is open only to students aged 13+; companies and professional organizations are excluded. The team must be 1–4 people. Be ready to show proof of student status if asked.
- [ ] **Register on Devpost**, join https://arbiter-hacks-v1.devpost.com/, and add any teammates.
- [ ] **Read the official rules page yourself:** https://arbiter-hacks-v1.devpost.com/rules. It was not readable automatically (Cloudflare), and our summary is reconstructed from search snippets. Check in particular: the start-date rule for project work, Theme-track requirements, video length, and whether the organizer's own (Adaption/Deployxa) credits change anything.

## Repository & deployment
- [ ] Review the `feat/sortlocal` branch locally, then merge it into `main` (or open a PR and merge it).
- [ ] Push to GitHub: `git push origin main`. The remote is `sternjeong/contest-arbiter-hacks-v1`.
- [ ] **Make the repository public** (Settings → General → Danger zone → Change visibility).
- [ ] **Enable GitHub Pages**: Settings → Pages → Source: **GitHub Actions**. The workflow `.github/workflows/pages.yml` runs on push to `main`. Confirm the Actions run is green.
- [ ] Open https://sternjeong.github.io/contest-arbiter-hacks-v1/ in a private window. Check that the tour appears, the plastic-bag comparison loads, and the audit example works. If you renamed the repo, the workflow sets the base path automatically.
- [ ] Spot-check 3–4 rules against the live official pages. Rules were archived 2026-11-12; if a city changed something, update `app/rules-src/catalog.mjs`, run `npm run rules:build`, and commit.

## Video
- [ ] Record the 2–3 minute demo following `docs/submission/DEMO_SCRIPT.md`.
- [ ] Upload it to **YouTube or Vimeo** as Public or Unlisted (not Private) and check playback in a logged-out window.

## Devpost form
- [ ] Copy the sections from `docs/submission/DEVPOST.md` (Inspiration, What it does, How we built it, Challenges, Accomplishments, What we learned, What's next, Built with).
- [ ] Select the **Theme: Rethinking Waste** track (only one track allowed), and paste the required paragraph on the waste problem and how success is measured.
- [ ] Add the public repo URL, the live demo URL and the video URL.
- [ ] Add screenshots: Compare (plastic bag), Look up (cardboard box, greasy toggle), Bin audit (example bin + fixes), Rules & sources, and the mobile dark theme.
- [ ] Fill in the team member names and student status.
- [ ] **Submit** (not just save a draft) before **2026-12-20 9:00 pm PST**, then confirm the submission shows as submitted on your Devpost profile.

## Optional
- [ ] To demo the optional LLM rule compiler in the video, set `ANTHROPIC_API_KEY` locally and run `npm run rules:compile -- --help`. Never show the key on screen.
