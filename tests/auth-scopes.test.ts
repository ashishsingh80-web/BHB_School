import test from "node:test";
import assert from "node:assert/strict";

import { AUTH_SCOPE_ROLES, canAccessAuthScope } from "@/lib/auth-scopes";

test("admissions scope allows office roles and blocks accounts-only access", () => {
  assert.equal(canAccessAuthScope("RECEPTION", "admissions"), true);
  assert.equal(canAccessAuthScope("ADMISSION_DESK", "admissions"), true);
  assert.equal(canAccessAuthScope("ACCOUNTS", "admissions"), false);
});

test("accounts scope is narrower than notices scope", () => {
  assert.equal(canAccessAuthScope("ACCOUNTS", "accounts"), true);
  assert.equal(canAccessAuthScope("ACCOUNTS", "notices"), true);
  assert.equal(canAccessAuthScope("TEACHER", "accounts"), false);
  assert.equal(canAccessAuthScope("TEACHER", "notices"), true);
});

test("student scope includes hr admin but excludes teachers", () => {
  assert.equal(canAccessAuthScope("HR_ADMIN", "students"), true);
  assert.equal(canAccessAuthScope("TEACHER", "students"), false);
});

test("auth scope registry stays aligned with expected scope families", () => {
  assert.deepEqual(Object.keys(AUTH_SCOPE_ROLES).sort(), [
    "academics",
    "accounts",
    "admissions",
    "complaints",
    "hr",
    "inventory",
    "master",
    "notices",
    "students",
    "transport",
  ]);
});
