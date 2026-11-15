/**
 * Vista pubblica di una lezione (GET /lezioni/settimana).
 * Niente dati personali: solo quanto serve al calendario.
 */
export interface LezionePubblicaDto {
  id: string;               // serve per modifica/annullamento con codice
  materia: string;
  livello: string;
  dataLezione: string;      // yyyy-MM-dd
  orarioInizio: string;     // HH:mm:ss
  orarioFine: string;       // HH:mm:ss
  stato?: string;           // "Confermata" | "In approvazione"
}
