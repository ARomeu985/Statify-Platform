export type OnboardingExperience='statify-creator'|'sentinel-business'|'sentinel-personal';

export interface OnboardingField<T=string>{
  key:string;
  label:string;
  optional:true;
  value?:T;
}

export interface OnboardingProfile{
  experience:OnboardingExperience;
  fields:Record<string,unknown>;
  completedAt?:string;
}

export const statifyCreatorFields:OnboardingField[]=[
  {key:'name',label:'Name',optional:true},
  {key:'preferredName',label:'What should we call you?',optional:true},
  {key:'creatorNiche',label:'What do you create?',optional:true},
  {key:'mainPlatforms',label:'Which platforms matter most to you?',optional:true},
  {key:'creatorGoals',label:'What are you trying to accomplish?',optional:true},
  {key:'enjoysCreating',label:'What do you enjoy creating?',optional:true},
  {key:'statifyHelpGoals',label:'What would you like Statify to help with?',optional:true},
  {key:'audienceGoals',label:'What are your audience or community goals?',optional:true},
  {key:'outsideContent',label:'What do you enjoy outside of content creation?',optional:true},
  {key:'familyLife',label:'Anything about family or life you want Evan to know?',optional:true},
  {key:'hobbies',label:'Hobbies',optional:true},
  {key:'interests',label:'Interests',optional:true},
  {key:'preferences',label:'Personal preferences',optional:true},
  {key:'otherIncomeSource',label:'Do you have another job or source of income?',optional:true},
  {key:'anythingElse',label:'Anything else you want Statify or Evan to know?',optional:true}
];

export const sentinelBusinessFields:OnboardingField[]=[
  {key:'name',label:'Name',optional:true},
  {key:'preferredName',label:'What should we call you?',optional:true},
  {key:'businessName',label:'Business/company name',optional:true},
  {key:'industry',label:'Industry',optional:true},
  {key:'role',label:'Role',optional:true},
  {key:'website',label:'Website',optional:true},
  {key:'companyBackground',label:'Tell Sentinel about the business',optional:true},
  {key:'companySize',label:'Company size',optional:true},
  {key:'administrators',label:'Authorized administrators/users',optional:true},
  {key:'securityConcerns',label:'Security priorities or concerns',optional:true},
  {key:'protectedInfrastructure',label:'Infrastructure/services to protect',optional:true},
  {key:'businessPriorities',label:'Business priorities',optional:true},
  {key:'anythingElse',label:'Anything else Sentinel should know about the business?',optional:true}
];

export const sentinelPersonalFields:OnboardingField[]=[
  {key:'name',label:'Name',optional:true},
  {key:'preferredName',label:'What should we call you?',optional:true},
  {key:'household',label:'Family/household information you want to share',optional:true},
  {key:'children',label:'Number of children, if you want to share',optional:true},
  {key:'pets',label:'Pets',optional:true},
  {key:'hobbies',label:'Hobbies',optional:true},
  {key:'favoriteActivities',label:'Favorite activities',optional:true},
  {key:'passions',label:'Something you are passionate about',optional:true},
  {key:'secretTalent',label:'A secret hobby or hidden talent',optional:true},
  {key:'fun',label:'Things you enjoy doing for fun',optional:true},
  {key:'preferences',label:'Personal preferences',optional:true},
  {key:'anythingElse',label:'Anything else you want Sentinel to know?',optional:true}
];

export function fieldsFor(experience:OnboardingExperience):OnboardingField[]{
  switch(experience){
    case 'statify-creator': return statifyCreatorFields.map(field=>({...field}));
    case 'sentinel-business': return sentinelBusinessFields.map(field=>({...field}));
    case 'sentinel-personal': return sentinelPersonalFields.map(field=>({...field}));
  }
}
