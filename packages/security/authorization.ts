export type PrivilegedAction='billing.refund'|'billing.complimentaryAccess'|'owner.distribute'|'sentinel.respond'|'memory.modify'|'connector.manage';
export interface AuthorizationContext{actorId:string;tenantId:string;roles:string[];action:PrivilegedAction;targetId:string;}
export interface AuthorizationAuthority{authorize(context:AuthorizationContext):Promise<{allowed:boolean;reason:string}>;}
