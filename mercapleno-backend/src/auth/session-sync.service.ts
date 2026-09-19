import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface SessionSyncPayload {
  userId: number;
  type: 'ROLE_CHANGED' | 'USER_DELETED';
  newRole?: number;
  roleName?: string;
  message?: string;
  timestamp: string;
}

@Injectable()
export class SessionSyncService {
  private readonly events$ = new Subject<SessionSyncPayload>();

  emitRoleChange(userId: number, newRole: number, roleName?: string) {
    this.events$.next({
      userId,
      type: 'ROLE_CHANGED',
      newRole,
      roleName,
      message: 'Tus permisos han sido actualizados',
      timestamp: new Date().toISOString(),
    });
  }

  emitUserDeleted(userId: number) {
    this.events$.next({
      userId,
      type: 'USER_DELETED',
      message: 'Tu cuenta ha sido eliminada o desactivada',
      timestamp: new Date().toISOString(),
    });
  }

  getEventsForUser(userId: number): Observable<MessageEvent> {
    return this.events$.asObservable().pipe(
      filter((event) => event.userId === userId),
      map((event) => ({
        data: event,
      } as MessageEvent)),
    );
  }
}
