export const creatorLaunchPlatforms=[
{id:'youtube',displayName:'YouTube',type:'video',required:true},
{id:'tiktok',displayName:'TikTok',type:'short-video',required:true},
{id:'facebook',displayName:'Facebook',type:'social',required:true},
{id:'instagram',displayName:'Instagram',type:'social',required:true},
{id:'x',displayName:'X',type:'social',required:true},
{id:'twitch',displayName:'Twitch',type:'live-streaming',required:true},
{id:'patreon',displayName:'Patreon',type:'membership',required:true},
{id:'kick',displayName:'Kick',type:'live-streaming',required:true},
{id:'substack',displayName:'Substack',type:'newsletter',required:true},
{id:'spotify-for-creators',displayName:'Spotify for Creators',type:'podcasting',required:true}
] as const;
export const additionalPlatforms=[{id:'discord',displayName:'Discord',type:'community'}] as const;
export const launchPlatforms=[...creatorLaunchPlatforms,...additionalPlatforms] as const;
export type LaunchPlatformId=(typeof launchPlatforms)[number]['id'];
export const platformUxContract={passwordCollection:false,officialAuthorizationOnly:true,secureTokenStorage:true,reconnectable:true,disconnectable:true,syncStatusVisible:true,connectorPlugInArchitecture:true} as const;
