export type SignupClaim = {
  id: string;
  createdTime: string;
  personId: string | null;
  activityId: string | null;
  status: string;
};

export type EffectiveSignUps = {
  personIds: string[];
  slotsFilled: number;
};

export function buildClaimCreateFields(
  personId: string,
  activityId: string,
  claimedAt = new Date().toISOString()
) {
  return {
    "Linked Person": [personId],
    "Linked Activity": [activityId],
    Status: "Claimed" as const,
    "Claimed Date": claimedAt,
  };
}

export function isOccupyingClaim(claim: Pick<SignupClaim, "status">): boolean {
  const status = claim.status.trim().toLowerCase();
  return (
    status === "claimed" ||
    status === "in progress" ||
    status === "pending review" ||
    status === "completed"
  );
}

/**
 * Derive the effective signups for one Activity during the Claims migration.
 *
 * A physical Claim always governs its Person + Activity pair. This means an
 * all-cancelled pair suppresses its old Linked Sign Ups relationship. Claims
 * in an occupying workflow status appear newest-first, followed by legacy-only
 * People in the old linked-record order (reversed to preserve the existing
 * recent-signups presentation).
 */
export function deriveEffectiveSignUps(
  activityId: string,
  legacyPersonIds: string[],
  claims: SignupClaim[]
): EffectiveSignUps {
  const claimsByPerson = new Map<string, SignupClaim[]>();

  for (const claim of claims) {
    if (claim.activityId !== activityId || !claim.personId) continue;
    const personClaims = claimsByPerson.get(claim.personId) ?? [];
    personClaims.push(claim);
    claimsByPerson.set(claim.personId, personClaims);
  }

  const physicalSignUps: SignupClaim[] = [];
  for (const personClaims of claimsByPerson.values()) {
    const occupying = personClaims
      .filter(isOccupyingClaim)
      .sort((a, b) =>
        b.createdTime.localeCompare(a.createdTime) || b.id.localeCompare(a.id)
      )[0];
    if (occupying) physicalSignUps.push(occupying);
  }

  physicalSignUps.sort((a, b) =>
    b.createdTime.localeCompare(a.createdTime) || b.id.localeCompare(a.id)
  );

  const personIds = physicalSignUps.map((claim) => claim.personId as string);
  const seen = new Set(personIds);
  const legacyOnly = [...new Set(legacyPersonIds.filter(Boolean))].reverse();

  for (const personId of legacyOnly) {
    if (claimsByPerson.has(personId) || seen.has(personId)) continue;
    personIds.push(personId);
    seen.add(personId);
  }

  return { personIds, slotsFilled: personIds.length };
}
