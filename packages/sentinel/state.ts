export type SentinelState='idle'|'patrolling'|'scanning'|'investigating'|'threat-detected'|'responding'|'incident'|'all-clear';
export interface SentinelEvent{state:SentinelState;severity:'info'|'warning'|'critical';occurredAt:string;incidentId?:string;}
export function personalityMode(event:SentinelEvent):'playful'|'focused'{return event.severity==='critical'||event.state==='incident'?'focused':'playful';}
