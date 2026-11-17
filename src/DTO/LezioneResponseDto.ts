export interface LezioneResponseDto {
  id: string;
  nomeStudente: string;
  email: string;
  materia: string;
  livello: string;
  note?: string | null;

  dataLezione: string;      // yyyy-MM-dd
  orarioInizio: string;     // HH:mm:ss
  orarioFine: string;       // HH:mm:ss

  codiceModifica?: string;
  stato?: string;           // "Confermata" | "In approvazione" | "Annullata"

  lezioneDiProva?: boolean;

  linkMeet?: string | null; // link Google Meet, generato alla conferma
}
