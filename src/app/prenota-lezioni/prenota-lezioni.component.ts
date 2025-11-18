import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { LezioniService, PrenotazioneLezione, ConflictResponse } from '../services/lezioni.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-prenota-lezioni',
  standalone: true,
  imports: [],
  templateUrl: './prenota-lezioni.component.html',
  styleUrl: './prenota-lezioni.component.scss'
})
type Slot = {
  dayISO: string;         // yyyy-MM-dd
  label: string;          // HH:mm
  start: string;          // HH:mm:ss
  end: string;            // HH:mm:ss
  busy: boolean;
  bookedBy?: PrenotazioneLezione; // se occupato
};

@Component({
  selector: 'app-prenota-lezioni',
  templateUrl: './prenota-lezioni.component.html',
  styleUrls: ['./prenota-lezioni.component.scss']
})
export class PrenotaLezioniComponent implements OnInit {

  // Config orari: Lun–Ven 18–21; Sabato 09–20 (UI comoda), Domenica esclusa
  readonly SLOT_MINUTES = 30;
  readonly WEEKDAY_RANGE = { start: '18:00:00', end: '21:00:00' };
  readonly SAT_RANGE = { start: '09:00:00', end: '20:00:00' };

  today = new Date();
  weekStart!: Date; // lunedì
  weekEnd!: Date;   // sabato
  daysISO: string[] = []; // yyyy-MM-dd, lun→sab
  grid: Slot[][] = [];    // [colonna giorno][riga slot]
  lezioni: PrenotazioneLezione[] = [];
  loading = false;
  errorMsg = '';

  // Modale e form
  modalOpen = false;
  isEdit = false;
  conflict?: ConflictResponse;

  form = this.fb.group({
    id: [null],
    nomeStudente: ['', Validators.required],
    materia: ['', Validators.required],
    livello: ['UNIVERSITA', Validators.required],
    note: [''],
    dataLezione: ['', Validators.required],   // yyyy-MM-dd
    orarioInizio: ['', Validators.required],  // HH:mm:ss
    orarioFine: ['', Validators.required],    // HH:mm:ss
    codiceModifica: [''] // richiesto in modifica
  });

  livelli = [
    { value: 'ELEMENTARE', label: 'Elementare' },
    { value: 'MEDIE',      label: 'Medie' },
    { value: 'SUPERIORI',  label: 'Superiori' },
    { value: 'UNIVERSITA', label: 'Università' }
  ];

  constructor(private fb: FormBuilder, private api: LezioniService) {}

  ngOnInit(): void {
    this.goToWeek(this.today);
  }

  goPrevWeek(): void {
    this.goToWeek(addDays(this.weekStart, -7));
  }

  goNextWeek(): void {
    this.goToWeek(addDays(this.weekStart, 7));
  }

  goToWeek(anchor: Date): void {
    this.loading = true;
    this.errorMsg = '';
    this.weekStart = startOfWeek(anchor, { weekStartsOn: 1 }); // lun
    // prendi sabato come fine (non domenica)
    this.weekEnd = addDays(this.weekStart, 5); // lun + 5 = sab
    this.daysISO = Array.from({ length: 6 }, (_, i) =>
      format(addDays(this.weekStart, i), 'yyyy-MM-dd')
    );

    const queryDate = format(anchor, 'yyyy-MM-dd');
    this.api.getLezioniSettimana(queryDate)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (lez) => {
          this.lezioni = lez ?? [];
          this.buildGrid();
        },
        error: (err) => {
          this.errorMsg = 'Errore nel caricamento delle lezioni.';
          console.error(err);
        }
      });
  }

  private buildGrid(): void {
    // determina tutti gli slot della settimana
    const columns: Slot[][] = [];

    this.daysISO.forEach((dayISO, idx) => {
      const dateObj = addDays(this.weekStart, idx);
      const dow = dateObj.getDay(); // 0 dom, 6 sab
      if (dow === 0) { // non usato (domenica esclusa)
        columns.push([]);
        return;
      }

      const range = (dow >= 1 && dow <= 5) ? this.WEEKDAY_RANGE : this.SAT_RANGE;

      const slots: Slot[] = [];
      const [sH, sM] = range.start.split(':').map(Number);
      const [eH, eM] = range.end.split(':').map(Number);

      let cur = new Date(dateObj);
      cur.setHours(sH, sM, 0, 0);

      const end = new Date(dateObj);
      end.setHours(eH, eM, 0, 0);

      while (cur < end) {
        const next = new Date(cur.getTime() + this.SLOT_MINUTES * 60000);
        const startHH = format(cur, 'HH:mm:ss');
        const endHH = format(next, 'HH:mm:ss');
        const label = format(cur, 'HH:mm');

        // è occupato se esiste lezione con overlap non banale
        const busyLesson = this.findOverlappingLesson(dayISO, startHH, endHH);
        slots.push({
          dayISO,
          label,
          start: startHH,
          end: endHH,
          busy: !!busyLesson,
          bookedBy: busyLesson ?? undefined
        });

        cur = next;
      }
      columns.push(slots);
    });

    this.grid = columns;
  }

  private findOverlappingLesson(dayISO: string, slotStart: string, slotEnd: string): PrenotazioneLezione | null {
    // overlap se: existing.start < slotEnd && existing.end > slotStart
    return this.lezioni.find(l =>
      !l.annullata &&
      l.dataLezione === dayISO &&
      l.orarioInizio < slotEnd &&
      l.orarioFine > slotStart
    ) ?? null;
  }

  // UI helpers
  dayHeader(idx: number): string {
    const d = addDays(this.weekStart, idx);
    return format(d, 'EEE dd/MM', { locale: it });
  }

  // Click su slot LIBERO → apre form creazione
  onClickFree(slot: Slot): void {
    this.isEdit = false;
    this.conflict = undefined;
    this.form.reset({
      id: null,
      nomeStudente: '',
      materia: '',
      livello: 'UNIVERSITA',
      note: '',
      dataLezione: slot.dayISO,
      orarioInizio: slot.start,
      orarioFine: slot.end,
      codiceModifica: ''
    });
    this.modalOpen = true;
  }

  // Click su slot OCCUPATO → apre form modifica (precaricato)
  onClickBusy(slot: Slot): void {
    const l = slot.bookedBy!;
    this.isEdit = true;
    this.conflict = undefined;
    this.form.reset({
      id: l.id ?? null,
      nomeStudente: l.nomeStudente,
      materia: l.materia,
      livello: l.livello,
      note: l.note,
      dataLezione: l.dataLezione,
      orarioInizio: l.orarioInizio,
      orarioFine: l.orarioFine,
      codiceModifica: '' // l’utente lo inserirà
    });
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  submit(): void {
    this.errorMsg = '';
    this.conflict = undefined;

    const v = this.form.getRawValue();
    const body: PrenotazioneLezione = {
      id: v.id ?? undefined,
      nomeStudente: v.nomeStudente!,
      materia: v.materia!,
      livello: v.livello!,
      note: v.note ?? '',
      dataLezione: v.dataLezione!,
      orarioInizio: v.orarioInizio!,
      orarioFine: v.orarioFine!,
      codiceModifica: v.codiceModifica ?? undefined
    };

    const obs = this.isEdit && body.id != null
      ? this.api.modificaLezione(body.id, body as any) // include codiceModifica
      : this.api.creaLezione(body);

    this.loading = true;
    obs.pipe(finalize(() => this.loading = false)).subscribe({
      next: () => {
        this.closeModal();
        this.goToWeek(this.weekStart); // refresh
      },
      error: (err) => {
        // se 409, mostra suggerimenti di fasce disponibili
        if (err?.status === 409 && err?.error) {
          this.conflict = err.error as ConflictResponse;
        } else {
          this.errorMsg = 'Errore durante il salvataggio della lezione.';
        }
        console.error(err);
      }
    });
  }

  annulla(id?: number | string): void {
    if (!id) { return; }
    this.loading = true;
    this.api.annullaLezione(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.closeModal();
          this.goToWeek(this.weekStart);
        },
        error: (err) => {
          this.errorMsg = 'Errore durante l’annullamento.';
          console.error(err);
        }
      });
  }
}
