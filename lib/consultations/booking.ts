export function uniqueIds(...ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)));
}

export function resolvePractitionerBookingIds(profile: {
  id: string;
  userId?: string | null;
}) {
  const profileId = String(profile.id || '').trim();
  const accountId = String(profile.userId || '').trim();
  return {
    practitionerId: accountId || profileId,
    practitionerProfileId: profileId,
  };
}
