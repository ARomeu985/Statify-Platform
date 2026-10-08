import {launchPlatforms,creatorLaunchPlatforms,additionalPlatforms,platformUxContract} from '../packages/connectors/platforms';
import {sammyCalvinVoiceProfile,sandyCalvinVoiceProfile} from '../packages/voice/voice';
import {isCurrentlyValid,MemoryRecord} from '../packages/memory/memory';
import {temporalMemoryWorkflows,temporalSentinelWorkflows} from '../packages/memory/temporal';
import {personalityMode} from '../packages/sentinel/state';
import {buildOwnerSocialDashboard} from '../apps/mobile/src/owner/owner-social-dashboard';
import {ownerSocialSafetyContract} from '../packages/owner-social/social';
import {customerFacingAgents,evanPersona,sammyPersona,sandyPersona,justinPersona} from '../packages/ai/personas';
import {fieldsFor} from '../packages/onboarding/onboarding';
import {InMemoryConversationEngine,ConversationBoundaryError} from '../packages/conversation/conversation';
import {buildAssistantContext} from '../packages/ai/assistant';

function expect(condition:boolean,message:string){if(!condition)throw new Error(message);}
function record(overrides:Partial<MemoryRecord>={}):MemoryRecord{return{id:'m1',tenantId:'t1',subjectId:'u1',kind:'preference',statement:'Prefers YouTube analytics',source:'user',confidence:.99,importance:.8,createdAt:'2026-10-01T00:00:00.000Z',updatedAt:'2026-10-01T00:00:00.000Z',...overrides};}

export function runFoundationTests(){
  expect(creatorLaunchPlatforms.length===10,'expected exactly 10 creator launch platforms');
  expect(additionalPlatforms.length===1,'expected one additional creator/community platform');
  expect(launchPlatforms.length===11,'expected 10 creator platforms plus Discord');
  expect(creatorLaunchPlatforms.map(p=>p.id).join(',')==='youtube,tiktok,facebook,instagram,x,twitch,patreon,kick,substack,spotify-for-creators','creator launch platform IDs do not match locked monetization set');
  expect(platformUxContract.passwordCollection===false,'platform password collection must be disabled');
  expect(platformUxContract.officialAuthorizationOnly===true,'official authorization must be required');

  expect(sammyCalvinVoiceProfile.sourceAssetId===sandyCalvinVoiceProfile.sourceAssetId,'Sammy and Sandy must share the approved Calvin source asset');
  expect(sammyCalvinVoiceProfile.interruptible===true,'voice must be interruptible');
  expect(sammyCalvinVoiceProfile.interactionMode==='natural-turn-taking','voice must use natural turn-taking');
  expect(evanPersona.naturalConversation===true,'Evan must ship with natural conversation architecture');
  expect(sammyPersona.naturalConversation===true,'Sammy must ship with natural conversation architecture');
  expect(sandyPersona.naturalConversation===true,'Sandy must ship with natural conversation architecture');
  expect(justinPersona.naturalConversation===true,'FS AI must use natural conversation when shipped');
  expect(customerFacingAgents.length===4,'expected four defined customer-facing AI agents');

  expect(fieldsFor('statify-creator').some(field=>field.key==='creatorNiche'),'Statify creator onboarding must be creator-focused');
  expect(fieldsFor('sentinel-business').some(field=>field.key==='businessName'),'Sentinel business onboarding must include business identity');
  expect(fieldsFor('sentinel-personal').some(field=>field.key==='secretTalent'),'Sentinel personal onboarding must be personal/family-focused');

  const engine=new InMemoryConversationEngine();
  const start=engine.startSession({id:'s1',tenantId:'t1',subjectId:'u1',agentId:'evan',startedAt:'2026-10-07T00:00:00.000Z'});
  expect(start.state==='listening','new conversation should listen immediately');
  engine.addHumanTurn({sessionId:'s1',tenantId:'t1',text:'What happened with that customer?',occurredAt:'2026-10-07T00:00:01.000Z'});
  engine.addAiTurn({sessionId:'s1',tenantId:'t1',text:'They replied this morning.',occurredAt:'2026-10-07T00:00:02.000Z'});
  engine.interrupt({sessionId:'s1',tenantId:'t1',occurredAt:'2026-10-07T00:00:02.500Z'});
  expect(engine.getSession('s1','t1').state==='interrupted','AI must stop into interrupted state when owner barges in');
  engine.resumeListening({sessionId:'s1',tenantId:'t1',occurredAt:'2026-10-07T00:00:02.600Z'});
  expect(engine.recentContext({sessionId:'s1',tenantId:'t1'}).length===2,'active conversation context must retain recent turns');
  let blocked=false;
  try{engine.getSession('s1','other-tenant');}catch(error){blocked=error instanceof ConversationBoundaryError;}
  expect(blocked,'conversation context must fail closed across tenant boundaries');

  const session=engine.getSession('s1','t1');
  const context=buildAssistantContext({tenantId:'t1',subjectId:'u1',persona:evanPersona,session,recentTurns:['What happened with that customer?','They replied this morning.']});
  expect(context.authorization.agentId==='evan','assistant context must bind to the requested AI persona');
  let mismatched=false;
  try{buildAssistantContext({tenantId:'t1',subjectId:'u1',persona:sammyPersona,session,recentTurns:[]});}catch(error){mismatched=true;}
  expect(mismatched,'AI context must reject persona/session mismatch');

  expect(isCurrentlyValid(record(),'2026-10-07T00:00:00.000Z')===true,'active memory should be valid');
  expect(isCurrentlyValid(record({validTo:'2026-10-05T00:00:00.000Z'}),'2026-10-07T00:00:00.000Z')===false,'expired temporal validity should be false');
  expect(isCurrentlyValid(record({supersededBy:'m2'}),'2026-10-07T00:00:00.000Z')===false,'superseded memory should be false');
  expect(temporalMemoryWorkflows.consolidate==='memory.consolidate','memory consolidation workflow missing');
  expect(temporalMemoryWorkflows.resolveContradiction==='memory.resolveContradiction','memory contradiction workflow missing');
  expect(temporalSentinelWorkflows.threatInvestigation==='sentinel.threatInvestigation','Sentinel investigation workflow missing');
  expect(personalityMode({state:'incident',severity:'critical',occurredAt:'2026-10-07T00:00:00.000Z'})==='focused','critical incident must force focused mode');

  const dashboard=buildOwnerSocialDashboard();
  expect(dashboard.connectedAccounts.length===0,'owner social dashboard should start empty');
  expect(dashboard.availablePlatforms.length===13,'owner social marketing catalog should be separate');
  expect(dashboard.availablePlatforms.map(p=>p.id).slice(0,5).join(',')==='youtube,tiktok,instagram,facebook,x','owner social catalog order incorrect');
  expect(ownerSocialSafetyContract.officialPlatformAuthOnly===true,'owner social must use official auth');
  expect(ownerSocialSafetyContract.noPlatformPasswords===true,'owner social must never collect passwords');
  expect(ownerSocialSafetyContract.auditEveryWrite===true,'owner social writes must be audited');
  expect(ownerSocialSafetyContract.failClosedOnMissingPermission===true,'owner social must fail closed');
}
