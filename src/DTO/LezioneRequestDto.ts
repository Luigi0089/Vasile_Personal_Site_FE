export interface LezioneRequestDto {
  id?: string | null;
  // obbligatori solo in creazione: in modifica/annullamento il BE usa quelli salvati
  nomeStudente?: string | null;
  email?: string | null;
  materia: string;
  livello: string;
  note?: string | null;

  // LocalDate → "yyyy-MM-dd"
  dataLezione: string;

  // LocalTime → "HH:mm:ss"
  orarioInizio: string;
  orarioFine: string;

  codiceModifica?: string | null;

  lezioneDiProva: boolean;
}
