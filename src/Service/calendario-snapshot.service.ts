import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, timeout } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { CalendarioSnapshotDto } from '../DTO/CalendarioSnapshotDto';
import { LezionePubblicaDto } from '../DTO/LezionePubblicaDto';

/** Versione del formato che questo frontend sa interpretare. */
const SCHEMA_SUPPORTATO = 1;

/** Settimana ricostruita dallo snapshot, nello stesso formato dell'API ufficiale. */
export interface SettimanaDaSnapshot {
  lezioni: LezionePubblicaDto[];
  generatedAt: string;
}

/**
 * Legge lo snapshot pubblico del calendario da Google Drive (API v3, files.get con alt=media
 * e API key pubblica limitata). Nessun login Google, nessun token del backend.
 *
 * - Usa un HttpClient costruito su HttpBackend: salta gli interceptor (niente header
 *   Authorization verso Google, nessun redirect al login su errore).
 * - Il download avviene UNA sola volta per sessione (shareReplay) e copre più settimane.
 * - Qualsiasi errore (file assente, CORS, quota, JSON non valido) → null: il chiamante
 *   prosegue con il solo backend, come prima.
 */
@Injectable({ providedIn: 'root' })
export class CalendarioSnapshotService {

  private readonly http: HttpClient;
  private snapshot$?: Observable<CalendarioSnapshotDto | null>;

  constructor(httpBackend: HttpBackend) {
    this.http = new HttpClient(httpBackend);
  }

  get abilitato(): boolean {
    const cfg = environment.calendarioSnapshot;
    return !!cfg?.driveFileId && !!cfg?.apiKey && typeof window !== 'undefined';
  }

  /** Snapshot completo (cache in memoria per tutta la sessione), oppure null. */
  snapshot(): Observable<CalendarioSnapshotDto | null> {
    if (!this.abilitato) {
      return of(null);
    }
    if (!this.snapshot$) {
      const cfg = environment.calendarioSnapshot;
      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(cfg.driveFileId)}`;
      const params = new HttpParams().set('alt', 'media').set('key', cfg.apiKey);

      this.snapshot$ = this.http.get<CalendarioSnapshotDto>(url, { params }).pipe(
        timeout(cfg.timeoutMs),
        map(s => this.valido(s) ? s : null),
        catchError(err => {
          console.warn('Snapshot calendario non disponibile, uso solo il backend', err?.status ?? err?.name);
          return of(null);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.snapshot$;
  }

  /**
   * Lezioni della settimana (lun–sab) che contiene `lunediISO`, ricostruite dallo snapshot.
   * Restituisce null se la settimana NON è interamente coperta: una settimana assente dallo
   * snapshot non va mai mostrata come "tutta libera".
   */
  settimana(lunediISO: string, sabatoISO: string): Observable<SettimanaDaSnapshot | null> {
    return this.snapshot().pipe(
      map(s => {
        if (!s || lunediISO < s.coperturaDal || sabatoISO > s.coperturaAl) {
          return null;
        }
        const lezioni: LezionePubblicaDto[] = s.occupati
          .filter(o => o.data >= lunediISO && o.data <= sabatoISO)
          .map((o, i) => ({
            // id sintetico: lo snapshot non espone id reali; vedi isSnapshotLezione()
            id: `${SNAPSHOT_ID_PREFIX}${o.data}-${o.inizio}-${i}`,
            materia: '',
            livello: '',
            dataLezione: o.data,
            orarioInizio: o.inizio,
            orarioFine: o.fine,
            stato: o.stato
          }));
        return { lezioni, generatedAt: s.generatedAt };
      })
    );
  }

  private valido(s: CalendarioSnapshotDto | null | undefined): s is CalendarioSnapshotDto {
    return !!s
      && s.schemaVersion === SCHEMA_SUPPORTATO
      && typeof s.coperturaDal === 'string'
      && typeof s.coperturaAl === 'string'
      && Array.isArray(s.occupati);
  }
}

export const SNAPSHOT_ID_PREFIX = 'snapshot:';

/** true se la lezione proviene dallo snapshot (non modificabile finché non arrivano i dati ufficiali). */
export function isSnapshotLezione(l: LezionePubblicaDto | undefined | null): boolean {
  return !!l && typeof l.id === 'string' && l.id.startsWith(SNAPSHOT_ID_PREFIX);
}
