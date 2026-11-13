import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { addDays, addMinutes, format, startOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { finalize } from 'rxjs/operators';

import { LezioniService } from '../../../Service/lezioni.service';
import { LezioneRequestDto } from '../../../DTO/LezioneRequestDto';
import { LezioneResponseDto } from '../../../DTO/LezioneResponseDto';
import { LezionePubblicaDto } from '../../../DTO/LezionePubblicaDto';
import { ConflictResponse } from '../../../DTO/ConflictResponse';

// ---- TIPI ----
type Slot = {
  dayISO: string;             // yyyy-MM-dd
  label: string;              // "18:00" (normale) | "18:00 – 19:00" (prova)
  start: string;              // HH:mm:ss
  end: string;                // HH:mm:ss
  busy: boolean;
  bookedBy?: LezionePubblicaDto; // se occupato
};

// Stato visivo dello slot: verde libero, giallo da confermare, rosso confermato
type StatoSlot = 'free' | 'pending' | 'confirmed';

// Orario di inizio selezionabile nel form della lezione di prova
type OpzioneInizioProva = {
  start: string;      // HH:mm:ss
  end: string;        // HH:mm:ss (start + 1h)
  label: string;      // "18:30"
  disponibile: boolean;
};

const STATO_CONFERMATA = 'Confermata';

/*
 * La pagina ha due modalità:
 * - normale (/Lezioni, arrivando dalla navigazione): slot da 30 minuti,
 *   prenotazione libera di orari e modifica/annullamento delle lezioni esistenti;
 * - prova (/Lezioni?prova=true, solo dal link dedicato): slot di esattamente
 *   un'ora, prenotabili solo se non si sovrappongono a nessuna lezione,
 *   e la prenotazione viene inviata con lezioneDiProva = true.
 */
@Component({
  selector: 'app-prenota-lezioni',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './prenota-lezioni.component.html',
  styleUrls: ['./prenota-lezioni.component.scss']
})
export class PrenotaLezioniComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Config orari: Lun–Sab 18–21, Domenica esclusa
  readonly SLOT_MINUTES = 30;
  readonly DURATA_PROVA_MINUTI = 60;
  readonly WEEKDAY_RANGE = { start: '18:00:00', end: '21:00:00' };
  readonly SAT_RANGE = { start: '18:00:00', end: '21:00:00' };

  /** true se l'utente è arrivato dal link della lezione di prova */
  isProva = false;

  today = new Date();
  weekStart!: Date; // lunedì
  weekEnd!: Date;   // sabato
  daysISO: string[] = []; // yyyy-MM-dd, lun→sab
  grid: Slot[][] = [];    // [colonna giorno][riga slot]
  lezioni: LezionePubblicaDto[] = [];
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

  timeOptions: string[] = [];

  /** Orari di inizio per la lezione di prova nel giorno selezionato */
  opzioniInizioProva: OpzioneInizioProva[] = [];

  privacyModalOpen = false;

  /** Form di creazione di una lezione di prova (orari vincolati a 1 ora) */
  get isProvaCreazione(): boolean {
    return this.isProva && !this.isEdit;
  }

  form = this.fb.group({
    id: [null as string | number | null],
    nomeStudente: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    materia: ['', Validators.required],
    livello: ['Universitario', Validators.required],
    note: [''],
    dataLezione: ['', Validators.required],
    orarioInizio: ['', Validators.required],
    orarioFine: ['', Validators.required],
    codiceModifica: ['']
  });

  livelli = [
    { value: 'Elementare', label: 'Elementare' },
    { value: 'Medie',      label: 'Medie' },
    { value: 'Superiori',  label: 'Superiori' },
    { value: 'Universitario', label: 'Universitario' }
  ];

  constructor(private fb: FormBuilder, private lezioniService: LezioniService) {}

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control &&
      control.invalid &&
      (control.touched || this.submitted);
  }

  ngOnInit(): void {
    const now = new Date();

    // salvo comunque "oggi" per i controlli sui past slot
    this.today = now;
    this.todayISO = format(now, 'yyyy-MM-dd');

    this.buildTimeOptions();

    // Se è domenica (0), parti dalla settimana successiva (lunedì dopo)
    const anchor = now.getDay() === 0 ? addDays(now, 1) : now;

    // la modalità dipende dal link di arrivo; se cambia (stessa rotta) ricostruisco la griglia
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.isProva = params.get('prova') === 'true';
        this.modalOpen = false;
        this.goToWeek(this.weekStart ?? anchor);
      });

    // lezione di prova: la fine segue sempre l'inizio scelto (+1h)
    this.form.controls.orarioInizio.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isProvaCreazione) {
          this.aggiornaFineProva();
        }
      });

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
    // normale: slot da 30' ; prova: slot da 60' che partono ogni 30'
    const durata = this.isProva ? this.DURATA_PROVA_MINUTI : this.SLOT_MINUTES;

    this.grid = this.daysISO.map((dayISO, idx) => {
      const dateObj = addDays(this.weekStart, idx);
      const dow = dateObj.getDay(); // 0 dom, 6 sab

      if (dow === 0) { // domenica esclusa (anche se qui non ci arrivi mai con daysISO)
        return [];
      }

      const range = (dow >= 1 && dow <= 5) ? this.WEEKDAY_RANGE : this.SAT_RANGE;
      const [sH, sM] = range.start.split(':').map(Number);
      const [eH, eM] = range.end.split(':').map(Number);

      let cur = new Date(dateObj);
      cur.setHours(sH, sM, 0, 0);

      const end = new Date(dateObj);
      end.setHours(eH, eM, 0, 0);

      const slots: Slot[] = [];

      // lo slot deve terminare entro la fine della fascia
      while (addMinutes(cur, durata) <= end) {
        const next = addMinutes(cur, durata);
        const startHH = format(cur, 'HH:mm:ss');
        const endHH = format(next, 'HH:mm:ss');

        const busyLesson = this.findOverlappingLesson(dayISO, startHH, endHH);

        slots.push({
          dayISO,
          label: this.isProva
            ? `${format(cur, 'HH:mm')} – ${format(next, 'HH:mm')}`
            : format(cur, 'HH:mm'),
          start: startHH,
          end: endHH,
          busy: !!busyLesson,
          bookedBy: busyLesson ?? undefined
        });

        cur = addMinutes(cur, this.SLOT_MINUTES);
      }

      return slots;
    });
  }

  /*
   * L'endpoint pubblico restituisce tutte le lezioni non annullate:
   * qualsiasi sovrapposizione (confermata, da confermare o di prova) occupa lo slot.
   */
  private findOverlappingLesson(
    dayISO: string,
    slotStart: string,
    slotEnd: string
  ): LezionePubblicaDto | null {
    // overlap se: existing.start < slotEnd && existing.end > slotStart
    return this.lezioni.find(l =>
      l.dataLezione === dayISO &&
      l.orarioInizio < slotEnd &&
      l.orarioFine > slotStart
    ) ?? null;
  }

  // UI helpers
  statoSlot(slot: Slot): StatoSlot {
    if (!slot.busy) {
      return 'free';
    }
    return slot.bookedBy?.stato === STATO_CONFERMATA ? 'confirmed' : 'pending';
  }

  dayHeader(idx: number): string {
    const d = addDays(this.weekStart, idx);
    return format(d, 'EEE dd/MM', { locale: it });
  }

  formattaData(dayISO: string): string {
    const [y, m, d] = dayISO.split('-').map(Number);
    return format(new Date(y, m - 1, d), 'EEEE d MMMM', { locale: it });
  }

  formattaOra(orario: string | null | undefined): string {
    return orario ? orario.slice(0, 5) : '';
  }

  onClickSlot(slot?: Slot): void {
    if (!slot || this.isPastSlot(slot)) {
      return;
    }

    if (!slot.busy) {
      this.onClickFree(slot);
    } else if (!this.isProva) {
      // in modalità prova gli slot occupati non sono selezionabili
      this.onClickBusy(slot);
    }
  }

  /*
   * Inizi possibili per la lezione di prova nel giorno indicato: ogni mezz'ora,
   * con fine un'ora dopo entro la fascia oraria. Un inizio è disponibile solo se
   * l'ora intera non si sovrappone a nessuna lezione (stesso controllo della griglia).
   */
  private calcolaOpzioniInizioProva(dayISO: string): OpzioneInizioProva[] {
    const [y, m, d] = dayISO.split('-').map(Number);
    const giorno = new Date(y, m - 1, d);
    const range = giorno.getDay() === 6 ? this.SAT_RANGE : this.WEEKDAY_RANGE;

    const [sH, sM] = range.start.split(':').map(Number);
    const [eH, eM] = range.end.split(':').map(Number);

    let cur = new Date(giorno);
    cur.setHours(sH, sM, 0, 0);

    const limite = new Date(giorno);
    limite.setHours(eH, eM, 0, 0);

    const opzioni: OpzioneInizioProva[] = [];

    while (addMinutes(cur, this.DURATA_PROVA_MINUTI) <= limite) {
      const start = format(cur, 'HH:mm:ss');
      const end = format(addMinutes(cur, this.DURATA_PROVA_MINUTI), 'HH:mm:ss');

      opzioni.push({
        start,
        end,
        label: format(cur, 'HH:mm'),
        disponibile: !this.findOverlappingLesson(dayISO, start, end)
      });

      cur = addMinutes(cur, this.SLOT_MINUTES);
    }

    return opzioni;
  }

  /* L'orario di fine della lezione di prova segue sempre l'inizio (+1h) */
  aggiornaFineProva(): void {
    const inizio = this.form.controls.orarioInizio.value;
    const opzione = this.opzioniInizioProva.find(o => o.start === inizio);

    this.form.controls.orarioFine.setValue(opzione ? opzione.end : '', { emitEvent: false });
  }

  // Click su slot LIBERO → apre form creazione
  onClickFree(slot: Slot): void {
    this.isEdit = false;
    this.conflict = undefined;
    this.submitted = false;

    this.clearCodiceModificaRequired();
    this.setDatiStudenteRequired(true);

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
      orarioFine: slot.end,      // es. "18:30:00" (o "19:00:00" se di prova)
      codiceModifica: ''
    });

    // in prova lo studente può spostare l'inizio sugli altri orari liberi del giorno
    this.opzioniInizioProva = this.isProva
      ? this.calcolaOpzioniInizioProva(slot.dayISO)
      : [];

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
    // nome, email e note non sono esposti pubblicamente: in modifica il BE usa quelli salvati
    this.setDatiStudenteRequired(false);

    this.form.reset({
      id: l.id,
      nomeStudente: '',
      email: '',
      materia: l.materia,
      livello: l.livello,
      note: '',
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

  private buildRequest(): LezioneRequestDto {
    const v = this.form.getRawValue();

    return {
      id: (v.id as string | null) ?? undefined,
      nomeStudente: this.isEdit ? null : v.nomeStudente,
      email: this.isEdit ? null : v.email,
      materia: v.materia!,
      livello: v.livello!,
      note: v.note || null,
      dataLezione: v.dataLezione!,
      orarioInizio: v.orarioInizio!,
      orarioFine: v.orarioFine!,
      codiceModifica: v.codiceModifica || undefined,
      // vale solo in creazione: il BE non cambia il flag di una lezione esistente
      lezioneDiProva: !this.isEdit && this.isProva
    };
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

    const request = this.buildRequest();

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

            // in modalità prova l'orario è stato preso nel frattempo: aggiorno griglia e opzioni
            if (this.isProvaCreazione) {
              this.ricaricaDisponibilitaProva();
            }
            return;
          }

          // 5) fallback generico
          this.errorMsg = 'Errore durante il salvataggio della lezione.';
          console.error(err);
        }
      });
  }


  /*
   * Dopo un 409 ricarico le lezioni della settimana (senza chiudere la modale)
   * e ricalcolo gli orari di inizio: quello scelto, ora occupato, viene deselezionato.
   */
  private ricaricaDisponibilitaProva(): void {
    const dayISO = this.form.controls.dataLezione.value;
    if (!dayISO) {
      return;
    }

    this.lezioniService.getLezioniSettimana(dayISO).subscribe({
      next: lez => {
        this.lezioni = lez ?? [];
        this.buildGrid();
        this.opzioniInizioProva = this.calcolaOpzioniInizioProva(dayISO);

        const scelta = this.opzioniInizioProva.find(o => o.start === this.form.controls.orarioInizio.value);
        if (!scelta?.disponibile) {
          this.form.controls.orarioInizio.setValue('');
          this.form.controls.orarioFine.setValue('');
        }
      },
      error: err => console.error(err)
    });
  }

  annulla(id?: string | number): void {
    if (!id) return;

    // per annullare basta il codice: valido solo quello prima di chiamare il BE
    if (this.form.controls.codiceModifica.invalid) {
      this.submitted = true;
      this.form.controls.codiceModifica.markAsTouched();
      return;
    }

    const body: LezioneRequestDto = {
      ...this.buildRequest(),
      id: id.toString()
    };

    this.loading = true;

    this.lezioniService.annullaLezione(body)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.closeModal();
          this.goToWeek(this.weekStart);
        },
        error: err => {
          const body: any = err?.error && typeof err.error === 'object' ? err.error : null;

          if (err?.status === 400 && !body?.code) {
            this.form.controls.codiceModifica.setErrors({ invalidCode: true });
            this.form.controls.codiceModifica.markAsTouched();
            return;
          }

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

  isPrenotabile(slot?: Slot): boolean {
    return !!slot && !slot.busy && !this.isPastSlot(slot);
  }


  private setCodiceModificaRequired(): void {
    const ctrl = this.form.controls.codiceModifica;
    ctrl.setValidators([Validators.required]);
    ctrl.updateValueAndValidity();
  }

  private clearCodiceModificaRequired(): void {
    const ctrl = this.form.controls.codiceModifica;
    ctrl.clearValidators();
    ctrl.updateValueAndValidity();
  }

  /* Nome ed email sono obbligatori solo in creazione */
  private setDatiStudenteRequired(required: boolean): void {
    const nome = this.form.controls.nomeStudente;
    const email = this.form.controls.email;

    nome.setValidators(required ? [Validators.required] : []);
    email.setValidators(required ? [Validators.required, Validators.email] : []);

    nome.updateValueAndValidity();
    email.updateValueAndValidity();
  }


  acceptPrivacy() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('privacy-lezioni-accepted', 'true');
    }
    this.privacyModalOpen = false;
  }
}
