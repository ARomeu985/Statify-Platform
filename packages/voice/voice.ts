export type VoiceAgent='sammy'|'sandy'|'evan'|'sentinel';
export type VoiceTurnState='idle'|'listening'|'thinking'|'speaking'|'interrupted';
export interface VoiceProfile{agent:VoiceAgent;sourceKind:'approved-human-source'|'provider-native'|'future-source';sourceAssetId?:string;providerVoiceId?:string;locale:string;interactionMode:'natural-turn-taking';interruptible:true;persistentSessionContext:true;}
export const sammyCalvinVoiceProfile:VoiceProfile={agent:'sammy',sourceKind:'approved-human-source',sourceAssetId:'assets/voice/sammy-calvin-source/CALVIN_ONLY_MASTER_V3.wav',locale:'en-US',interactionMode:'natural-turn-taking',interruptible:true,persistentSessionContext:true};
export const sandyCalvinVoiceProfile:VoiceProfile={agent:'sandy',sourceKind:'approved-human-source',sourceAssetId:'assets/voice/sammy-calvin-source/CALVIN_ONLY_MASTER_V3.wav',locale:'en-US',interactionMode:'natural-turn-taking',interruptible:true,persistentSessionContext:true};
export interface VoiceSession{id:string;agent:VoiceAgent;state:VoiceTurnState;startedAt:string;lastUserTurnAt?:string;lastAgentTurnAt?:string;interruptedAt?:string;}
