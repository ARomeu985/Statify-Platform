export type SubscriptionState='paid'|'complimentary'|'discounted'|'refunded'|'cancelled';
export interface Entitlement{customerId:string;product:'statify'|'sentinel';state:SubscriptionState;startsAt:string;endsAt?:string;reason?:string;authorizedBy?:string;}
