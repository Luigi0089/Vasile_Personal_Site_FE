export interface ConflictResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;

  dataLezione: string;
  richiestaInizio: string;
  richiestaFine: string;

  fasceDisponibili: {
    orarioInizio: string;
    orarioFine: string;
  }[];
}
