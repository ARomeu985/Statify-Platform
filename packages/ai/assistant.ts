import {AgentId,AgentPersona} from './personas';
import {ConversationSession} from '../conversation/conversation';

export interface AssistantAuthorization{
  allowed:true;
  tenantId:string;
  subjectId:string;
  agentId:AgentId;
}

export interface AssistantContext{
  authorization:AssistantAuthorization;
  session:ConversationSession;
  recentTurns:string[];
}

export function canActWithContext(input:{tenantId:string;subjectId:string;persona:AgentPersona;session:ConversationSession}):boolean{
  return input.session.tenantId===input.tenantId
    && input.session.subjectId===input.subjectId
    && input.session.agentId===input.persona.id;
}

export function buildAssistantContext(input:{tenantId:string;subjectId:string;persona:AgentPersona;session:ConversationSession;recentTurns:string[]}):AssistantContext{
  if(!canActWithContext(input)) throw new Error('assistant context authorization mismatch');
  return {
    authorization:{allowed:true,tenantId:input.tenantId,subjectId:input.subjectId,agentId:input.persona.id},
    session:input.session,
    recentTurns:[...input.recentTurns]
  };
}
