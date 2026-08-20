export type ConsultationCancelParty = {
  patientId?: string | null;
  practitionerId?: string | null;
  practitionerProfileId?: string | null;
};

const CANCELABLE_STATUSES = new Set([
  'scheduled',
  'in-progress',
  'in_progress',
  'pending',
  'confirmed',
]);

export function canCancelConsultation(status?: string | null) {
  const normalized = String(status || 'scheduled')
    .trim()
    .toLowerCase();
  return CANCELABLE_STATUSES.has(normalized);
}

export function participantIdsFor(
  userId: string | null | undefined,
  extraIds: Array<string | null | undefined> = []
) {
  return Array.from(
    new Set([userId, ...extraIds].map((id) => String(id || '').trim()).filter(Boolean))
  );
}

export function isConsultationParticipant(
  userId: string | null | undefined,
  consultation: ConsultationCancelParty,
  extraIds: Array<string | null | undefined> = []
) {
  const ids = participantIdsFor(userId, extraIds);
  return ids.some(
    (id) =>
      id === consultation.patientId ||
      id === consultation.practitionerId ||
      id === consultation.practitionerProfileId
  );
}

export function canUserCancelConsultation(
  userId: string | null | undefined,
  consultation: ConsultationCancelParty & { status?: string | null },
  extraIds: Array<string | null | undefined> = []
) {
  return isConsultationParticipant(userId, consultation, extraIds) && canCancelConsultation(consultation.status);
}

export function consultationCancelFields(cancelledBy: string) {
  return {
    status: 'cancelled' as const,
    cancelledBy,
  };
}
