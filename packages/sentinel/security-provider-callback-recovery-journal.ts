import { webcrypto } from 'node:crypto';

export type RecoveryJournalState =
  | 'capability-consumed'
  | 'execution-claimed'
  | 'execution-result-recorded'
  | 'execution-failed'
  | 'execution-verified'
  | 'state-conflict';

export type RecoveryDisposition =
  | 'fresh-capability-required'
  | 'manual-review'
  | 'verification-required'
  | 'retry-with-new-execution'
  | 'already-verified';

export interface RecoveryProvenance {
  tenantId: string;
  resourceId: string;
  resourceRevision: number;
  workerId: string;
  providerId: string;
  quarantineId: string;
  deliveryId: string;
  protectedScope: string;
  action: 'execute-recovery';
  authorizationAuditId: string;
  recoveryClaimId: string;
  observationId: string;
  executionId: string;
  idempotencyKey: string;
  operation: string;
}

export interface CapabilityConsumptionEvidence extends RecoveryProvenance {
  capabilityId: string;
  capabilityTokenDigest: string;
  consumedAt: string;
}

export type ExecutionPhase = 'claimed' | 'completed' | 'failed';

export interface ExecutionObservation extends RecoveryProvenance {
  phase: ExecutionPhase;
  resultId?: string;
  observedAt: string;
  effectEvidenceIds?: string[];
}

export type VerificationOutcome = 'passed' | 'failed';

export interface VerificationObservation extends RecoveryProvenance {
  verificationId: string;
  outcome: VerificationOutcome;
  verifiedAt: string;
  evidenceIds: string[];
}

export interface RecoveryJournalEntry {
  id: string;
  state: RecoveryJournalState;
  disposition: RecoveryDisposition;
  provenance: RecoveryProvenance;
  capability: {
    capabilityId: string;
    capabilityTokenDigest: string;
    consumedAt: string;
  };
  execution?: {
    executionId: string;
    phase: ExecutionPhase;
    resultId?: string;
    observedAt: string;
    effectEvidenceIds: string[];
  };
  verification?: {
    verificationId: string;
    outcome: VerificationOutcome;
    verifiedAt: string;
    evidenceIds: string[];
  };
  reconciledAt: string;
  evidenceIds: string[];
  superseded?: boolean;
}

export interface RecoveryJournalSnapshot {
  schemaVersion: 1;
  revision: number;
  entries: RecoveryJournalEntry[];
  integritySha256: string;
}

export interface RecoveryJournalPersistence {
  load(): Promise<RecoveryJournalSnapshot | null>;
  compareAndSet(
    expectedRevision: number,
    nextSnapshot: RecoveryJournalSnapshot,
  ): Promise<boolean>;
}

export class InMemoryRecoveryJournalPersistence implements RecoveryJournalPersistence {
  private snapshot: RecoveryJournalSnapshot | null;

  constructor(initialSnapshot: RecoveryJournalSnapshot | null = null) {
    this.snapshot = cloneSnapshot(initialSnapshot);
  }

  async load(): Promise<RecoveryJournalSnapshot | null> {
    return cloneSnapshot(this.snapshot);
  }

  async compareAndSet(
    expectedRevision: number,
    nextSnapshot: RecoveryJournalSnapshot,
  ): Promise<boolean> {
    const currentRevision = this.snapshot?.revision ?? 0;
    if (currentRevision !== expectedRevision) return false;
    this.snapshot = cloneSnapshot(nextSnapshot);
    return true;
  }

  setForTest(snapshot: RecoveryJournalSnapshot | null): void {
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export class SentinelSecurityProviderCallbackRecoveryJournal {
  private snapshot: RecoveryJournalSnapshot;

  constructor(private readonly persistence: RecoveryJournalPersistence) {
    this.snapshot = emptySnapshot();
  }

  async restore(): Promise<void> {
    const persisted = await this.persistence.load();
    if (!persisted) return;
    await assertSnapshotIntegrity(persisted);
    this.snapshot = cloneSnapshot(persisted)!;
  }

  getSnapshot(): RecoveryJournalSnapshot {
    return cloneSnapshot(this.snapshot)!;
  }

  async reconcile(
    capability: CapabilityConsumptionEvidence,
    execution?: ExecutionObservation,
    verification?: VerificationObservation,
  ): Promise<RecoveryJournalEntry> {
    validateDigest(capability.capabilityTokenDigest);
    const existing = this.snapshot.entries.find(
      (entry) => entry.capability.capabilityId === capability.capabilityId,
    );

    const candidate = buildEntry(capability, execution, verification);

    if (existing) {
      if (!sameIdentity(existing.provenance, candidate.provenance)) {
        return this.commit({
          ...candidate,
          id: existing.id,
          state: 'state-conflict',
          disposition: 'manual-review',
          evidenceIds: unique([
            ...existing.evidenceIds,
            ...candidate.evidenceIds,
          ]),
          reconciledAt: new Date().toISOString(),
        });
      }

      if (confidence(candidate.state) < confidence(existing.state)) {
        return this.commit({
          ...existing,
          state: 'state-conflict',
          disposition: 'manual-review',
          evidenceIds: unique([
            ...existing.evidenceIds,
            ...candidate.evidenceIds,
          ]),
          reconciledAt: new Date().toISOString(),
        });
      }

      if (candidate.state === existing.state && sameEvidence(existing, candidate)) {
        return cloneEntry(existing);
      }
    }

    const entry = {
      ...candidate,
      id: existing?.id ?? journalEntryId(capability),
      reconciledAt: new Date().toISOString(),
    };

    return this.commit(entry);
  }

  async reconcileFromAuthoritativeExecution(
    capability: CapabilityConsumptionEvidence,
    execution: ExecutionObservation | undefined,
    verification: VerificationObservation | undefined,
  ): Promise<RecoveryJournalEntry> {
    return this.reconcile(capability, execution, verification);
  }

  private async commit(entry: RecoveryJournalEntry): Promise<RecoveryJournalEntry> {
    const previous = this.snapshot;
    const entries = previous.entries.filter((existing) => existing.id !== entry.id);
    entries.push(entry);
    entries.sort((a, b) => a.id.localeCompare(b.id));

    const next: RecoveryJournalSnapshot = {
      schemaVersion: 1,
      revision: previous.revision + 1,
      entries,
      integritySha256: '',
    };
    next.integritySha256 = await snapshotDigest(next);

    const persisted = await this.persistence.compareAndSet(previous.revision, next);
    if (!persisted) {
      this.snapshot = previous;
      throw new Error('RECOVERY_JOURNAL_PERSISTENCE_CONFLICT');
    }

    this.snapshot = next;
    return cloneEntry(entry);
  }
}

function buildEntry(
  capability: CapabilityConsumptionEvidence,
  execution?: ExecutionObservation,
  verification?: VerificationObservation,
): Omit<RecoveryJournalEntry, 'id' | 'reconciledAt'> {
  const evidenceIds = unique([
    capability.authorizationAuditId,
    capability.observationId,
    capability.executionId,
    ...(execution?.effectEvidenceIds ?? []),
    ...(verification?.evidenceIds ?? []),
  ]);

  if (!execution) {
    return {
      state: 'capability-consumed',
      disposition: 'fresh-capability-required',
      provenance: provenanceWithoutVolatile(capability),
      capability: {
        capabilityId: capability.capabilityId,
        capabilityTokenDigest: capability.capabilityTokenDigest,
        consumedAt: capability.consumedAt,
      },
      evidenceIds,
    };
  }

  if (!sameIdentity(capability, execution)) {
    return {
      state: 'state-conflict',
      disposition: 'manual-review',
      provenance: provenanceWithoutVolatile(capability),
      capability: {
        capabilityId: capability.capabilityId,
        capabilityTokenDigest: capability.capabilityTokenDigest,
        consumedAt: capability.consumedAt,
      },
      execution: executionSummary(execution),
      evidenceIds,
    };
  }

  if (execution.phase === 'claimed') {
    return {
      state: 'execution-claimed',
      disposition: 'manual-review',
      provenance: provenanceWithoutVolatile(capability),
      capability: {
        capabilityId: capability.capabilityId,
        capabilityTokenDigest: capability.capabilityTokenDigest,
        consumedAt: capability.consumedAt,
      },
      execution: executionSummary(execution),
      evidenceIds,
    };
  }

  if (execution.phase === 'failed') {
    return {
      state: 'execution-failed',
      disposition: 'retry-with-new-execution',
      provenance: provenanceWithoutVolatile(capability),
      capability: {
        capabilityId: capability.capabilityId,
        capabilityTokenDigest: capability.capabilityTokenDigest,
        consumedAt: capability.consumedAt,
      },
      execution: executionSummary(execution),
      evidenceIds,
    };
  }

  if (!verification) {
    return {
      state: 'execution-result-recorded',
      disposition: 'verification-required',
      provenance: provenanceWithoutVolatile(capability),
      capability: {
        capabilityId: capability.capabilityId,
        capabilityTokenDigest: capability.capabilityTokenDigest,
        consumedAt: capability.consumedAt,
      },
      execution: executionSummary(execution),
      evidenceIds,
    };
  }

  if (!sameIdentity(capability, verification)) {
    return {
      state: 'state-conflict',
      disposition: 'manual-review',
      provenance: provenanceWithoutVolatile(capability),
      capability: {
        capabilityId: capability.capabilityId,
        capabilityTokenDigest: capability.capabilityTokenDigest,
        consumedAt: capability.consumedAt,
      },
      execution: executionSummary(execution),
      verification: verificationSummary(verification),
      evidenceIds,
    };
  }

  if (verification.outcome !== 'passed') {
    return {
      state: 'state-conflict',
      disposition: 'manual-review',
      provenance: provenanceWithoutVolatile(capability),
      capability: {
        capabilityId: capability.capabilityId,
        capabilityTokenDigest: capability.capabilityTokenDigest,
        consumedAt: capability.consumedAt,
      },
      execution: executionSummary(execution),
      verification: verificationSummary(verification),
      evidenceIds,
    };
  }

  return {
    state: 'execution-verified',
    disposition: 'already-verified',
    provenance: provenanceWithoutVolatile(capability),
    capability: {
      capabilityId: capability.capabilityId,
      capabilityTokenDigest: capability.capabilityTokenDigest,
      consumedAt: capability.consumedAt,
    },
    execution: executionSummary(execution),
    verification: verificationSummary(verification),
    evidenceIds,
  };
}

function provenanceWithoutVolatile(input: RecoveryProvenance): RecoveryProvenance {
  return {
    tenantId: input.tenantId,
    resourceId: input.resourceId,
    resourceRevision: input.resourceRevision,
    workerId: input.workerId,
    providerId: input.providerId,
    quarantineId: input.quarantineId,
    deliveryId: input.deliveryId,
    protectedScope: input.protectedScope,
    action: input.action,
    authorizationAuditId: input.authorizationAuditId,
    recoveryClaimId: input.recoveryClaimId,
    observationId: input.observationId,
    executionId: input.executionId,
    idempotencyKey: input.idempotencyKey,
    operation: input.operation,
  };
}

function sameIdentity(
  left: RecoveryProvenance,
  right: RecoveryProvenance,
): boolean {
  return (
    left.tenantId === right.tenantId &&
    left.resourceId === right.resourceId &&
    left.resourceRevision === right.resourceRevision &&
    left.workerId === right.workerId &&
    left.providerId === right.providerId &&
    left.quarantineId === right.quarantineId &&
    left.deliveryId === right.deliveryId &&
    left.protectedScope === right.protectedScope &&
    left.action === right.action &&
    left.authorizationAuditId === right.authorizationAuditId &&
    left.recoveryClaimId === right.recoveryClaimId &&
    left.observationId === right.observationId &&
    left.executionId === right.executionId &&
    left.idempotencyKey === right.idempotencyKey &&
    left.operation === right.operation
  );
}

function sameEvidence(
  left: RecoveryJournalEntry,
  right: RecoveryJournalEntry,
): boolean {
  return JSON.stringify(left.evidenceIds) === JSON.stringify(right.evidenceIds);
}

function executionSummary(
  execution: ExecutionObservation,
): RecoveryJournalEntry['execution'] {
  return {
    executionId: execution.executionId,
    phase: execution.phase,
    resultId: execution.resultId,
    observedAt: execution.observedAt,
    effectEvidenceIds: [...(execution.effectEvidenceIds ?? [])],
  };
}

function verificationSummary(
  verification: VerificationObservation,
): RecoveryJournalEntry['verification'] {
  return {
    verificationId: verification.verificationId,
    outcome: verification.outcome,
    verifiedAt: verification.verifiedAt,
    evidenceIds: [...verification.evidenceIds],
  };
}

function confidence(state: RecoveryJournalState): number {
  return {
    'capability-consumed': 1,
    'execution-claimed': 2,
    'execution-result-recorded': 3,
    'execution-failed': 4,
    'execution-verified': 5,
    'state-conflict': 6,
  }[state];
}

function journalEntryId(capability: CapabilityConsumptionEvidence): string {
  return `recovery:${capability.capabilityId}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function cloneEntry(entry: RecoveryJournalEntry): RecoveryJournalEntry {
  return JSON.parse(JSON.stringify(entry)) as RecoveryJournalEntry;
}

function cloneSnapshot(
  snapshot: RecoveryJournalSnapshot | null,
): RecoveryJournalSnapshot | null {
  return snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
}

function emptySnapshot(): RecoveryJournalSnapshot {
  return {
    schemaVersion: 1,
    revision: 0,
    entries: [],
    integritySha256: '',
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, child]) => child !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function digestPayload(
  snapshot: Omit<RecoveryJournalSnapshot, 'integritySha256'>,
): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(canonicalize(snapshot)));
}

async function snapshotDigest(
  snapshot: RecoveryJournalSnapshot,
): Promise<string> {
  const unsigned = {
    schemaVersion: snapshot.schemaVersion,
    revision: snapshot.revision,
    entries: snapshot.entries,
  };
  const bytes = await webcrypto.subtle.digest('SHA-256', digestPayload(unsigned));
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function assertSnapshotIntegrity(
  snapshot: RecoveryJournalSnapshot,
): Promise<void> {
  const expected = await snapshotDigest(snapshot);
  if (expected !== snapshot.integritySha256) {
    throw new Error('RECOVERY_JOURNAL_INTEGRITY_FAILURE');
  }
}

function validateDigest(digest: string): void {
  if (!/^[0-9a-f]{64}$/i.test(digest)) {
    throw new Error('RECOVERY_JOURNAL_INVALID_CAPABILITY_DIGEST');
  }
}
