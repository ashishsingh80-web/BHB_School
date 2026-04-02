# BHB International School ERP

Production-oriented school ERP for BHB International School, built with Next.js App Router, TypeScript, Prisma, PostgreSQL, and Clerk.

## Stack

- Next.js 16.2.2
- React 19
- TypeScript
- Prisma + PostgreSQL
- Clerk authentication
- Tailwind CSS

## Product Areas

- Admissions CRM, survey, and online leads
- Student lifecycle and certificates
- Academics, attendance, exams, and smart content
- Fees, accounts, payroll, and staff advances
- Transport, fuel, and compliance
- Communication, AI workspaces, reports, and portals

## Commands

```bash
npm run dev
npm run lint
npm test
npm run check
npm run db:generate
npm run db:push
npm run db:seed
```

## Prisma

- Schema: [`/Users/ashishsingh/Downloads/school-erp-whatsapp/prisma/schema.prisma`](/Users/ashishsingh/Downloads/school-erp-whatsapp/prisma/schema.prisma)
- Config: [`/Users/ashishsingh/Downloads/school-erp-whatsapp/prisma.config.ts`](/Users/ashishsingh/Downloads/school-erp-whatsapp/prisma.config.ts)
- Migrations: [`/Users/ashishsingh/Downloads/school-erp-whatsapp/prisma/migrations`](/Users/ashishsingh/Downloads/school-erp-whatsapp/prisma/migrations)

## Access Control

- Route and nav gating live in [`/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/access-control.ts`](/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/access-control.ts)
- Shared role groups live in [`/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/role-groups.ts`](/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/role-groups.ts)
- Server-side auth scopes live in [`/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/auth-scopes.ts`](/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/auth-scopes.ts)
- Action guards are exposed from [`/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/auth.ts`](/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/auth.ts)

## Workflow Rule Pattern

When a server action contains business rules that can be expressed without Prisma or Clerk, keep that logic in a small helper under [`/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib`](/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib) and let the action call it.

Current examples:

- Admissions: [`/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/admission-rules.ts`](/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/admission-rules.ts)
- Fees: [`/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/fee-rules.ts`](/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/fee-rules.ts)
- Fuel: [`/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/fuel-rules.ts`](/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/fuel-rules.ts)
- Online leads: [`/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/online-lead-rules.ts`](/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/online-lead-rules.ts)
- Payroll: [`/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/payroll-rules.ts`](/Users/ashishsingh/Downloads/school-erp-whatsapp/src/lib/payroll-rules.ts)

This keeps actions thinner and makes the important workflow decisions easy to test.

## Tests

Tests use the native Node test runner with `tsx`.

- Test entrypoint: `npm test`
- Full local validation: `npm run check`
- CI workflow: [`/Users/ashishsingh/Downloads/school-erp-whatsapp/.github/workflows/ci.yml`](/Users/ashishsingh/Downloads/school-erp-whatsapp/.github/workflows/ci.yml)
- Test files: [`/Users/ashishsingh/Downloads/school-erp-whatsapp/tests`](/Users/ashishsingh/Downloads/school-erp-whatsapp/tests)

Current coverage focuses on:

- access control and role scopes
- route title helpers
- admissions workflow blockers
- fees, payroll, and fuel business rules
- online lead conversion rules

## Notes

- Read local Next.js docs in `node_modules/next/dist/docs/` before making framework-level changes.
- Follow [`/Users/ashishsingh/Downloads/school-erp-whatsapp/AGENTS.md`](/Users/ashishsingh/Downloads/school-erp-whatsapp/AGENTS.md) for repo-specific instructions.
