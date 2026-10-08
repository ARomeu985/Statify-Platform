export type ConversationActor='human'|'ai';
export type ConversationTurnKind='speech'|'text';
export type ConversationSessionState='idle'|'listening'|'thinking'|'speaking'|'interrupted'|'closed';

export interface ConversationTurn{
  id:string;
  sessionId:string;
  actor:ConversationActor;
  kind:ConversationTurnKind;
  text:string;
  occurredAt:string;
  sequence:number;
}

export interface ConversationSession{
  id:string;
  tenantId:string;
  subjectId:string;
  agentId:string;
  state:ConversationSessionState;
  startedAt:string;
  lastActivityAt:string;
  turns:ConversationTurn[];
}

export interface ConversationPolicy{
  allowBargeIn:true;
  retainActiveContext:true;
  requireAuthorizedTenant:true;
  persistLongTermMemorySeparately:true;
}

export const naturalConversationPolicy:ConversationPolicy={
  allowBargeIn:true,
  retainActiveContext:true,
  requireAuthorizedTenant:true,
  persistLongTermMemorySeparately:true
};

export class ConversationBoundaryError extends Error{}

export class InMemoryConversationEngine{
  private readonly sessions=new Map<string,ConversationSession>();

  startSession(input:{id:string;tenantId:string;subjectId:string;agentId:string;startedAt:string}):ConversationSession{
    const session:ConversationSession={
      id:input.id,
      tenantId:input.tenantId,
      subjectId:input.subjectId,
      agentId:input.agentId,
      state:'listening',
      startedAt:input.startedAt,
      lastActivityAt:input.startedAt,
      turns:[]
    };
    this.sessions.set(session.id,session);
    return this.copy(session);
  }

  getSession(sessionId:string,tenantId:string):ConversationSession{
    const session=this.sessions.get(sessionId);
    if(!session) throw new ConversationBoundaryError('conversation session not found');
    this.assertTenant(session,tenantId);
    return this.copy(session);
  }

  addHumanTurn(input:{sessionId:string;tenantId:string;text:string;occurredAt:string;kind?:ConversationTurnKind}):ConversationTurn{
    const session=this.getMutable(input.sessionId,input.tenantId);
    if(session.state==='closed') throw new ConversationBoundaryError('conversation session is closed');
    const turn=this.addTurn(session,{actor:'human',kind:input.kind??'speech',text:input.text,occurredAt:input.occurredAt});
    session.state='thinking';
    session.lastActivityAt=input.occurredAt;
    return {...turn};
  }

  addAiTurn(input:{sessionId:string;tenantId:string;text:string;occurredAt:string}):ConversationTurn{
    const session=this.getMutable(input.sessionId,input.tenantId);
    if(session.state==='closed') throw new ConversationBoundaryError('conversation session is closed');
    const turn=this.addTurn(session,{actor:'ai',kind:'speech',text:input.text,occurredAt:input.occurredAt});
    session.state='speaking';
    session.lastActivityAt=input.occurredAt;
    return {...turn};
  }

  interrupt(input:{sessionId:string;tenantId:string;occurredAt:string}):void{
    const session=this.getMutable(input.sessionId,input.tenantId);
    if(session.state!=='speaking' && session.state!=='thinking') return;
    session.state='interrupted';
    session.lastActivityAt=input.occurredAt;
  }

  resumeListening(input:{sessionId:string;tenantId:string;occurredAt:string}):void{
    const session=this.getMutable(input.sessionId,input.tenantId);
    if(session.state==='closed') throw new ConversationBoundaryError('conversation session is closed');
    session.state='listening';
    session.lastActivityAt=input.occurredAt;
  }

  closeSession(input:{sessionId:string;tenantId:string;occurredAt:string}):void{
    const session=this.getMutable(input.sessionId,input.tenantId);
    session.state='closed';
    session.lastActivityAt=input.occurredAt;
  }

  recentContext(input:{sessionId:string;tenantId:string;limit?:number}):ConversationTurn[]{
    const session=this.getMutable(input.sessionId,input.tenantId);
    const limit=Math.max(1,Math.min(input.limit??12,50));
    return session.turns.slice(-limit).map(turn=>({...turn}));
  }

  private getMutable(sessionId:string,tenantId:string):ConversationSession{
    const session=this.sessions.get(sessionId);
    if(!session) throw new ConversationBoundaryError('conversation session not found');
    this.assertTenant(session,tenantId);
    return session;
  }

  private assertTenant(session:ConversationSession,tenantId:string):void{
    if(naturalConversationPolicy.requireAuthorizedTenant && session.tenantId!==tenantId){
      throw new ConversationBoundaryError('conversation tenant boundary violation');
    }
  }

  private addTurn(session:ConversationSession,input:{actor:ConversationActor;kind:ConversationTurnKind;text:string;occurredAt:string}):ConversationTurn{
    const turn:ConversationTurn={
      id:`${session.id}:turn-${session.turns.length+1}`,
      sessionId:session.id,
      actor:input.actor,
      kind:input.kind,
      text:input.text,
      occurredAt:input.occurredAt,
      sequence:session.turns.length+1
    };
    session.turns.push(turn);
    return turn;
  }

  private copy(session:ConversationSession):ConversationSession{
    return {...session,turns:session.turns.map(turn=>({...turn}))};
  }
}
