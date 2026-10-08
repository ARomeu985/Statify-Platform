export type ThreatSeverity='info'|'warning'|'high'|'critical';
export interface SentinelTelemetryEvent{id:string;tenantId:string;subjectId:string;category:'auth'|'device'|'network'|'account'|'payment'|'application';signal:string;severity:ThreatSeverity;occurredAt:string;source:string;}
export interface SentinelActionRequest{incidentId:string;tenantId:string;requestedBy:'policy-engine'|'ai-agent'|'human-admin';action:string;requiresHumanApproval:boolean;}
