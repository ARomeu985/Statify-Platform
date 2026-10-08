export type OwnerSocialPlatformId='youtube'|'tiktok'|'facebook'|'instagram'|'x'|'twitch'|'patreon'|'linkedin'|'pinterest'|'threads'|'discord'|'reddit'|'bluesky';
export type PublishKind='text'|'image'|'video'|'reel'|'short'|'link'|'article'|'announcement'|'pin'|'draft';
export type AccountStatus='disconnected'|'connecting'|'connected'|'reauth_required'|'error';
export interface OwnerSocialAccount{id:string;platform:OwnerSocialPlatformId;displayName:string;handle?:string;externalAccountId?:string;status:AccountStatus;connectedAt?:string;lastHealthCheckAt?:string;capabilities:PublishCapability[];}
export interface PublishCapability{kind:PublishKind;mode:'direct'|'draft'|'webhook';notes?:string;}
export interface SocialPostDraft{id:string;createdByOwnerId:string;body:string;mediaAssetIds:string[];linkUrl?:string;targetAccountIds:string[];scheduledFor?:string;requireApproval:boolean;}
export interface PublishResult{accountId:string;status:'queued'|'published'|'drafted'|'failed';externalPostId?:string;errorCode?:string;message?:string;}
export interface OwnerSocialConnector{platform:OwnerSocialPlatformId;beginAuthorization(input:{ownerId:string;redirectUri:string}):Promise<{state:string;authorizationUrl:string}>;completeAuthorization(input:{ownerId:string;code:string;state:string}):Promise<OwnerSocialAccount>;refresh(accountId:string):Promise<OwnerSocialAccount>;disconnect(accountId:string):Promise<void>;publish(accountId:string,draft:SocialPostDraft):Promise<PublishResult>;}
export const ownerSocialPlatforms=[
{id:'youtube',displayName:'YouTube',primaryUse:'Videos, Shorts, channel updates',needsOAuth:true},
{id:'tiktok',displayName:'TikTok',primaryUse:'Short-form video and photo publishing',needsOAuth:true},
{id:'instagram',displayName:'Instagram',primaryUse:'Photos, Reels and eligible Stories',needsOAuth:true},
{id:'facebook',displayName:'Facebook',primaryUse:'Page content and video publishing',needsOAuth:true},
{id:'x',displayName:'X',primaryUse:'Posts and supported media',needsOAuth:true},
{id:'twitch',displayName:'Twitch',primaryUse:'Channel/chat announcements',needsOAuth:true},
{id:'patreon',displayName:'Patreon',primaryUse:'Membership content where API permissions support it',needsOAuth:true},
{id:'linkedin',displayName:'LinkedIn',primaryUse:'Organization/member posts',needsOAuth:true},
{id:'threads',displayName:'Threads',primaryUse:'Threads posts and supported media',needsOAuth:true},
{id:'pinterest',displayName:'Pinterest',primaryUse:'Pins and boards',needsOAuth:true},
{id:'discord',displayName:'Discord',primaryUse:'Community announcements via bot/webhook',needsOAuth:false},
{id:'reddit',displayName:'Reddit',primaryUse:'Community posts',needsOAuth:true},
{id:'bluesky',displayName:'Bluesky',primaryUse:'Social posts',needsOAuth:true}
] as const;
export const ownerSocialSafetyContract={officialPlatformAuthOnly:true,noPlatformPasswords:true,secretTokensServerSideOnly:true,ownerOnlyByDefault:true,explicitTargetSelection:true,auditEveryWrite:true,previewBeforePublish:true,perAccountPermissionChecks:true,revokeDisconnectSupported:true,failClosedOnMissingPermission:true} as const;
