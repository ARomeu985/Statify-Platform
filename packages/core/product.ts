export type Product='statify'|'sentinel'|'statify-x'|'statify-fs';
export type CustomerKind='creator'|'sentinel-consumer'|'sentinel-business';
export interface CustomerProfile{id:string;kind:CustomerKind;preferredName?:string;createdAt:string;updatedAt:string;}
export interface BrandPersonalization{colors:string[];fontId?:string;helmetDisplayName?:string;logoAssetId?:string;}
export interface CreatorProfile extends CustomerProfile{kind:'creator';niches:string[];primaryPlatforms:string[];goals:string[];interests?:string[];hobbies?:string[];enjoysCreating?:string;statifyHelpGoals?:string[];otherIncomeSource?:boolean;voluntaryNotes?:string;}
export interface SentinelConsumerProfile extends CustomerProfile{kind:'sentinel-consumer';family?:{children?:number;pets?:string[]};hobbies?:string[];talents?:string[];interests?:string[];favoriteActivities?:string[];passions?:string[];voluntaryNotes?:string;}
export interface SentinelBusinessProfile extends CustomerProfile{kind:'sentinel-business';businessName:string;industry?:string;role?:string;website?:string;companyBackground?:string;companySize?:number;administrators:string[];securityConcerns?:string[];protectedInfrastructure?:string[];priorities?:string[];voluntaryNotes?:string;}
