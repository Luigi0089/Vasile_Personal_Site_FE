/**
 * Snapshot pubblico del calendario (file JSON su Google Drive, generato dal backend).
 * Fotografia NON autoritativa: appena il backend risponde, prevalgono i suoi dati.
 * Contiene solo intervalli occupati e stato: nessun dato personale.
 */
export interface CalendarioSnapshotDto {
  schemaVersion: number;
  generatedAt: string;      // ISO-8601 UTC
  timezone: string;         // "Europe/Rome"
  coperturaDal: string;     // yyyy-MM-dd (lunedì)
  coperturaAl: string;      // yyyy-MM-dd (sabato)
  occupati: CalendarioSnapshotOccupato[];
}

export interface CalendarioSnapshotOccupato {
  data: string;             // yyyy-MM-dd
  inizio: string;           // HH:mm:ss
  fine: string;             // HH:mm:ss
  stato: string;            // "Confermata" | "In approvazione"
}
