# Phase 1 — Natural Conversation + Differentiated Onboarding

This change starts implementation against the reconciled Statify master requirements.

## What is implemented

### Natural conversation core
- Stateful multi-turn conversation sessions
- Human and AI turns retained in active-session context
- Listening → thinking → speaking → interrupted → listening flow
- AI interruption/barge-in support
- Tenant-bound session access with fail-closed boundary checks
- AI context bound to the authorized tenant, subject, and persona
- Natural-conversation capability marked on the defined AI lineup

### Customer onboarding
Three separate onboarding experiences are implemented as distinct field definitions:
- Statify creator
- Sentinel business
- Sentinel personal/family

The older generic Statify business questionnaire is not used.

### Voice foundation
The shared voice contract continues to require natural turn-taking, interruption, and persistent session context. Sammy and Sandy retain the approved Calvin V3 source asset.

## Reconciliation rule

The recovered large first plan is treated as a completeness source. Later explicit user corrections and locks supersede older wording. This implementation therefore preserves later decisions rather than copying older requirements backward.

## Next build targets

Continue from this branch by wiring these contracts into the actual customer-facing application and backend session lifecycle, then add persistence, real voice transport/recognition/synthesis adapters, onboarding persistence, and production integrations while preserving the security boundaries.
