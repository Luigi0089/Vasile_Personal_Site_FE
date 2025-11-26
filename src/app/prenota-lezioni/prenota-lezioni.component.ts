import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { addDays, format, startOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { finalize } from 'rxjs/operators';

import { LezioniService } from '../../Service/lezioni.service';
import { LezioneRequestDto } from '../../DTO/LezioneRequestDto';
import { LezioneResponseDto } from '../../DTO/LezioneResponseDto';
import { ConflictResponse } from '../../DTO/ConflictResponse';
import {RouterLink} from "@angular/router";

// ---- TIPI ----
type Slot = {
  dayISO: string;             // yyyy-MM-dd
  label: string;              // HH:mm
  start: string;              // HH:mm:ss
  end: string;                // HH:mm:ss
  busy: boolean;
  bookedBy?: LezioneResponseDto; // se occupato
};

@Component({
  selector: 'app-prenota-lezioni',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './prenota-lezioni.component.html',
  styleUrls: ['./prenota-lezioni.component.scss']
})
export class PrenotaLezioniComponent implements OnInit {

  // Config orari: Lun–Ven 18–21; Sabato 09–20, Domenica esclusa
  readonly SLOT_MINUTES = 30;
  readonly WEEKDAY_RANGE = { start: '18:00:00', end: '21:00:00' };
  readonly SAT_RANGE = { start: '18:00:00', end: '21:00:00' };

  today = new Date();
  weekStart!: Date; // lunedì
  weekEnd!: Date;   // sabato
  daysISO: string[] = []; // yyyy-MM-dd, lun→sab
  grid: Slot[][] = [];    // [colonna giorno][riga slot]
  lezioni: LezioneResponseDto[] = [];
  loading = false;
  errorMsg = '';

  // Modale e form
  modalOpen = false;
  isEdit = false;
  conflict?: ConflictResponse;

  successModalOpen = false;
  lastBooking?: LezioneResponseDto;

  todayISO!: string;

  submitted = false;

  isLoading = false;

  timeOptions: string[] = [];

  privacyModalOpen = false;


  form = this.fb.group({
    id: [null as string | number | null],
    nomeStudente: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    materia: ['', Validators.required],
    livello: ['UNIVERSITA', Validators.required],
    note: [''],
    dataLezione: ['', Validators.required],
    orarioInizio: ['', Validators.required],
    orarioFine: ['', Validators.required],
    codiceModifica: ['']
  });


  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control &&
      control.invalid &&
      (control.touched || this.submitted);
  }


  livelli = [
    { value: 'Elementare', label: 'Elementare' },
    { value: 'Medie',      label: 'Medie' },
    { value: 'Superiori',  label: 'Superiori' },
    { value: 'Universitario', label: 'Universitario' }
  ];

  constructor(private fb: FormBuilder, private lezioniService: LezioniService) {}

  ngOnInit(): void {
    const now = new Date();

    // salvo comunque "oggi" per i controlli sui past slot
    this.today = now;
    this.todayISO = format(now, 'yyyy-MM-dd');

    this.buildTimeOptions();

    // Se è domenica (0), parti dalla settimana successiva (lunedì dopo)
    const anchor = now.getDay() === 0
      ? addDays(now, 1)   // lunedì successivo
      : now;              // giorno corrente

    this.goToWeek(anchor);

    // Mostra privacy SOLO lato browser
    if (typeof window !== 'undefined') {
      const accepted = localStorage.getItem('privacy-lezioni-accepted');
      // se NON ha ancora accettato -> apri la modale
      this.privacyModalOpen = !accepted;
    }
  }

  private buildTimeOptions(): void {
    const startHour = 18;
    const endHour = 21;
    const stepMinutes = 30;

    const opts: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += stepMinutes) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        opts.push(`${hh}:${mm}`); // es. "18:00"
      }
    }
    this.timeOptions = opts;
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

    this.lezioniService.getLezioniSettimana(queryDate)
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
    const columns: Slot[][] = [];

    this.daysISO.forEach((dayISO, idx) => {
      const dateObj = addDays(this.weekStart, idx);
      const dow = dateObj.getDay(); // 0 dom, 6 sab

      if (dow === 0) { // domenica esclusa (anche se qui non ci arrivi mai con daysISO)
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

  private findOverlappingLesson(
    dayISO: string,
    slotStart: string,
    slotEnd: string
  ): LezioneResponseDto | null {
    // overlap se: existing.start < slotEnd && existing.end > slotStart
    return this.lezioni.find(l =>
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
    this.submitted = false;

    this.clearCodiceModificaRequired();

    // Valorizzo in modo sincrono il form
    this.form.reset({
      id: null,
      nomeStudente: '',
      email: '',
      materia: '',
      livello: 'Universitario',
      note: '',
      dataLezione: slot.dayISO,
      orarioInizio: slot.start,  // es. "18:00:00"
      orarioFine: slot.end,      // es. "18:30:00"
      codiceModifica: ''
    });

    // Apro la modale SOLO dopo aver sistemato il form
    this.modalOpen = true;
  }


  // Click su slot OCCUPATO → apre form modifica (precaricato)
  onClickBusy(slot: Slot): void {
    const l = slot.bookedBy!;
    this.isEdit = true;
    this.conflict = undefined;
    this.submitted = false;

    this.setCodiceModificaRequired();

    this.form.reset({
      id: l.id,
      nomeStudente: l.nomeStudente,
      email: l.email ?? '',
      materia: l.materia,
      livello: l.livello,
      note: l.note ?? '',
      dataLezione: l.dataLezione,
      orarioInizio: l.orarioInizio,   // deve combaciare con le <option> del select
      orarioFine: l.orarioFine,
      codiceModifica: ''             // lo inserisce l’utente
    });

    this.modalOpen = true;
  }


  closeModal(): void {
    this.submitted = false;
    this.modalOpen = false;
    this.errorMsg = "";
  }

  submit(): void {
    // reset errori precedenti
    this.errorMsg = '';
    this.conflict = undefined;

    if (this.loading) {
      return;
    }

    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    const request: LezioneRequestDto = {
      id: (v.id as string | null) ?? undefined,
      nomeStudente: v.nomeStudente!,
      email: v.email!,
      materia: v.materia!,
      livello: v.livello!,
      note: v.note ?? null,
      dataLezione: v.dataLezione!,
      orarioInizio: v.orarioInizio!,
      orarioFine: v.orarioFine!,
      codiceModifica: v.codiceModifica ?? undefined
    };

    const obs = this.isEdit && request.id
      ? this.lezioniService.modificaLezione(request.id, request)
      : this.lezioniService.creaLezione(request);

    this.loading = true;

    obs
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.closeModal();
          this.openSuccessModal(res);
          this.goToWeek(this.weekStart);
          this.submitted = false;
        },
        error: (err) => {
          const body: any = err?.error && typeof err.error === 'object' ? err.error : null;

          // 1) Caso speciale: parolacce (PROFANITY_DETECTED)
          if (body?.code === 'PROFANITY_DETECTED') {
            const fieldName: string | undefined = body.field;

            if (fieldName) {
              const ctrl = this.form.get(fieldName);
              if (ctrl) {
                ctrl.setErrors({
                  ...(ctrl.errors || {}),
                  profanity: true
                });
                ctrl.markAsTouched();
              }
            }

            // messaggio globale in alto (sintetico)
            this.errorMsg = body.message || 'Il testo inserito contiene termini non appropriati.';
            console.error('Profanity error', body);
            return;
          }

          // 2) Altri errori di validazione (VALIDATION_ERROR)
          if (body?.code === 'VALIDATION_ERROR' && Array.isArray(body.errors)) {
            body.errors.forEach((fe: any) => {
              if (!fe?.field) { return; }
              const ctrl = this.form.get(fe.field);
              if (ctrl) {
                ctrl.setErrors({
                  ...(ctrl.errors || {}),
                  server: true   // flag generico; il messaggio lo mostriamo con errorMsg
                });
                ctrl.markAsTouched();
              }
            });

            this.errorMsg = body.message || 'Alcuni campi non sono validi. Verifica e riprova.';
            console.error('Validation errors', body);
            return;
          }

          // 3) Codice modifica errato (solo edit, 400 senza code specifico)
          if (this.isEdit && err?.status === 400 && !body?.code) {
            const codiceCtrl = this.form.get('codiceModifica');
            if (codiceCtrl) {
              codiceCtrl.setErrors({
                ...(codiceCtrl.errors || {}),
                invalidCode: true
              });
              codiceCtrl.markAsTouched();
            }
            // niente messaggio generico, niente conflitto
            console.error('Invalid edit code', err);
            return;
          }

          // 4) Conflitto 409 con suggerimenti
          if (err?.status === 409 && body) {
            this.conflict = body as ConflictResponse;
            console.error('Conflict response', body);
            return;
          }

          // 5) fallback generico
          this.errorMsg = 'Errore durante il salvataggio della lezione.';
          console.error(err);
        }
      });
  }




  annulla(id?: string | number): void {
    if (!id) return;

    const v = this.form.getRawValue();

    const body: LezioneRequestDto = {
      id: id.toString(),
      nomeStudente: v.nomeStudente!,
      email: v.email!,
      materia: v.materia!,
      livello: v.livello!,
      note: v.note ?? null,
      dataLezione: v.dataLezione!,
      orarioInizio: v.orarioInizio!,
      orarioFine: v.orarioFine!,
      codiceModifica: v.codiceModifica ?? undefined
    };

    this.loading = true;

    this.lezioniService.annullaLezione( body)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.closeModal();
          this.goToWeek(this.weekStart);
        },
        error: err => {
          this.errorMsg = 'Errore durante l’annullamento.';
          console.error(err);
        }
      });
  }

  openSuccessModal(lezione: LezioneResponseDto): void {
    this.lastBooking = lezione;
    this.successModalOpen = true;
  }

  closeSuccessModal(): void {
    this.successModalOpen = false;
  }

  isPastSlot(slot?: Slot): boolean {
    if (!slot) { return false; }
    // confronto stringhe nel formato yyyy-MM-dd → funziona lessicograficamente
    return slot.dayISO < this.todayISO;
  }


  private setCodiceModificaRequired(): void {
    const ctrl = this.form.get('codiceModifica');
    if (!ctrl) return;
  ctrl.setValidators([Validators.required]);
  ctrl.updateValueAndValidity();
  }

  private clearCodiceModificaRequired(): void {
    const ctrl = this.form.get('codiceModifica');
    if (!ctrl) return;
  ctrl.clearValidators();
  ctrl.updateValueAndValidity();
  }


  acceptPrivacy() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('privacy-lezioni-accepted', 'true');
    }
    this.privacyModalOpen = false;
  }



}
