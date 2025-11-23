export interface LezioneRequestDto {
  id?: string | null;
  nomeStudente: string;
  email: string;
  materia: string;
  livello: string;
  note?: string | null;

  // LocalDate → "yyyy-MM-dd"
  dataLezione: string;

  // LocalTime → "HH:mm:ss"
  orarioInizio: string;
  orarioFine: string;

  codiceModifica?: string | null;
}
