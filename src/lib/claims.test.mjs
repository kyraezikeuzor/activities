import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClaimCreateFields,
  deriveEffectiveSignUps,
  isOccupyingClaim,
} from "./claims.ts";

const activityId = "recActivity";

function claim(id, personId, status, createdTime) {
  return { id, personId, activityId, status, createdTime };
}

test("new claims use the live Airtable field names and status", () => {
  assert.deepEqual(
    buildClaimCreateFields(
      "recPerson",
      "recActivity",
      "2026-09-13T12:00:00.000Z"
    ),
    {
      "Linked Person": ["recPerson"],
      "Linked Activity": ["recActivity"],
      Status: "Claimed",
      "Claimed Date": "2026-09-13T12:00:00.000Z",
    }
  );
});

test("every non-cancelled Claims workflow status occupies a spot", () => {
  for (const status of ["Claimed", "In Progress", "Pending Review", "Completed"]) {
    assert.equal(isOccupyingClaim({ status }), true, status);
  }
  assert.equal(isOccupyingClaim({ status: "Cancelled" }), false);
});

test("physical claimed and completed claims occupy one spot per person", () => {
  const result = deriveEffectiveSignUps(activityId, [], [
    claim("rec1", "person-a", "Claimed", "2026-01-01T00:00:00.000Z"),
    claim("rec2", "person-a", "Completed", "2026-02-01T00:00:00.000Z"),
    claim("rec3", "person-b", "In Progress", "2026-03-01T00:00:00.000Z"),
  ]);

  assert.deepEqual(result, {
    personIds: ["person-b", "person-a"],
    slotsFilled: 2,
  });
});

test("a cancelled physical claim suppresses its unchanged legacy link", () => {
  const result = deriveEffectiveSignUps(activityId, ["legacy", "cancelled"], [
    claim("rec1", "cancelled", "Cancelled", "2026-03-01T00:00:00.000Z"),
  ]);

  assert.deepEqual(result, { personIds: ["legacy"], slotsFilled: 1 });
});

test("physical signups are newest-first and legacy-only signups follow", () => {
  const result = deriveEffectiveSignUps(
    activityId,
    ["legacy-old", "physical", "legacy-new"],
    [
      claim("rec1", "physical", "Claimed", "2026-01-01T00:00:00.000Z"),
      claim("rec2", "newest", "Pending Review", "2026-04-01T00:00:00.000Z"),
      claim("rec3", "physical-newest", "In Progress", "2026-05-01T00:00:00.000Z"),
      {
        ...claim(
          "rec4",
          "other-activity",
          "Claimed",
          "2026-06-01T00:00:00.000Z"
        ),
        activityId: "recElsewhere",
      },
    ]
  );

  assert.deepEqual(result, {
    personIds: [
      "physical-newest",
      "newest",
      "physical",
      "legacy-new",
      "legacy-old",
    ],
    slotsFilled: 5,
  });
});
