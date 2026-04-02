import test from "node:test";
import assert from "node:assert/strict";

import { filterNavSectionsForRole, canAccessErpPath, defaultLandingPathForRole } from "@/lib/access-control";

test("accounts users can access finance routes but not academics routes", () => {
  assert.equal(canAccessErpPath("ACCOUNTS", "/fees/collect"), true);
  assert.equal(canAccessErpPath("ACCOUNTS", "/accounts/expenses"), true);
  assert.equal(canAccessErpPath("ACCOUNTS", "/academics/homework"), false);
});

test("parents are limited to portal routes", () => {
  assert.equal(canAccessErpPath("PARENT", "/portal/parent"), true);
  assert.equal(canAccessErpPath("PARENT", "/dashboard"), false);
  assert.equal(canAccessErpPath("PARENT", "/admissions/enquiry-list"), false);
});

test("student access includes hr-admin but excludes teachers", () => {
  assert.equal(canAccessErpPath("HR_ADMIN", "/students/list"), true);
  assert.equal(canAccessErpPath("TEACHER", "/students/list"), false);
});

test("role-filtered navigation only exposes allowed sections and links", () => {
  const parentNav = filterNavSectionsForRole("PARENT");
  assert.deepEqual(parentNav.map((section) => section.title), ["Portals"]);
  assert.ok(parentNav[0]?.items.every((item) => item.href.startsWith("/portal/")));

  const teacherNav = filterNavSectionsForRole("TEACHER");
  assert.ok(teacherNav.some((section) => section.title === "Academics"));
  assert.ok(teacherNav.some((section) => section.title === "Attendance"));
  assert.ok(!teacherNav.some((section) => section.title === "Fees & Accounts"));
});

test("default landing path points portal users to the student portal", () => {
  assert.equal(defaultLandingPathForRole("PARENT"), "/portal/student");
  assert.equal(defaultLandingPathForRole("STUDENT"), "/portal/student");
  assert.equal(defaultLandingPathForRole("OFFICE_ADMIN"), "/dashboard");
});
