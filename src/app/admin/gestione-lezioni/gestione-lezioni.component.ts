import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  debounceTime,
  finalize
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  addWeeks,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfWeek
} from 'date-fns';

import { it } from 'date-fns/locale';

import { AdminService } from '../../../Service/admin.service';
import { LezioneResponseDto } from '../../../DTO/LezioneResponseDto';

type VistaLezioni =
  | 'confermate'
  | 'da-confermare';

type CampoOrdinamento =
  | 'nomeStudente'
  | 'materia'
  | 'livello'
  | 'dataLezione'
  | 'orarioInizio';

type DirezioneOrdinamento =
  | 'asc'
  | 'desc';

type TipoAzioneLezione =
  | 'conferma'
  | 'annulla';

interface PropostaModificaLezione {
  idLezione: string;
  nomeStudente: string;
  email: string;
  materia: string;
  livello: string;
  note: string | null;
  dataLezione: string;
  orarioInizio: string;
  orarioFine: string;
  motivazione: string;
}

interface FiltriLezioni {
  nomeStudente: string;
  materia: string;
  livello: string;
  dataLezione: string;
  orarioInizio: string;
  ordinamento: CampoOrdinamento;
  direzione: DirezioneOrdinamento;
}

@Component({
  selector: 'app-gestione-lezioni',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './gestione-lezioni.component.html',
  styleUrl: './gestione-lezioni.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestioneLezioniComponent implements OnInit {

  private readonly adminService =
    inject(AdminService);

  private readonly activatedRoute =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly destroyRef =
    inject(DestroyRef);

  private richiestaCorrente = 0;

  readonly vista =
    signal<VistaLezioni>('da-confermare');

  readonly dataRiferimento =
    signal(format(new Date(), 'yyyy-MM-dd'));

  readonly lezioni =
    signal<LezioneResponseDto[]>([]);

  readonly loading =
    signal(false);

  readonly errore =
    signal<string | null>(null);

  readonly messaggioOperazione =
    signal<string | null>(null);

  readonly erroreOperazione =
    signal<string | null>(null);

  readonly azioneInCorso = signal<{
    id: string;
    tipo: TipoAzioneLezione;
  } | null>(null);

  readonly lezioneInModifica =
    signal<LezioneResponseDto | null>(null);

  readonly erroreModifica =
    signal<string | null>(null);

  readonly formPropostaModifica = new FormGroup({
    nomeStudente: new FormControl('', {
      nonNullable: true
    }),

    email: new FormControl('', {
      nonNullable: true
    }),

    materia: new FormControl('', {
      nonNullable: true
    }),

    livello: new FormControl('', {
      nonNullable: true
    }),

    note: new FormControl('', {
      nonNullable: true
    }),

    dataLezione: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    orarioInizio: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    orarioFine: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    motivazione: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(1000)
      ]
    })
  });

  readonly formFiltri = new FormGroup({
    nomeStudente: new FormControl('', {
      nonNullable: true
    }),

    materia: new FormControl('', {
      nonNullable: true
    }),

    livello: new FormControl('', {
      nonNullable: true
    }),

    dataLezione: new FormControl('', {
      nonNullable: true
    }),

    orarioInizio: new FormControl('', {
      nonNullable: true
    }),

    ordinamento: new FormControl<CampoOrdinamento>(
      'dataLezione',
      {
        nonNullable: true
      }
    ),

    direzione: new FormControl<DirezioneOrdinamento>(
      'asc',
      {
        nonNullable: true
      }
    )
  });

  private readonly filtri =
    signal<FiltriLezioni>(
      this.formFiltri.getRawValue()
    );

  readonly campiOrdinamento: ReadonlyArray<{
    value: CampoOrdinamento;
    label: string;
  }> = [
    {
      value: 'dataLezione',
      label: 'Data della lezione'
    },
    {
      value: 'orarioInizio',
      label: 'Orario di inizio'
    },
    {
      value: 'nomeStudente',
      label: 'Nome studente'
    },
    {
      value: 'materia',
      label: 'Materia'
    },
    {
      value: 'livello',
      label: 'Livello'
    }
  ];

  readonly mostraConfermate = computed(
    () => this.vista() === 'confermate'
  );

  readonly titoloPagina = computed(
    () =>
      this.mostraConfermate()
        ? 'Lezioni confermate'
        : 'Lezioni da confermare'
  );

  readonly descrizionePagina = computed(
    () =>
      this.mostraConfermate()
        ? 'Consulta e organizza le lezioni già confermate.'
        : 'Controlla le richieste ricevute che devono ancora essere confermate.'
  );

  readonly etichettaSettimana = computed(() => {
    const data =
      parseISO(this.dataRiferimento());

    const lunedi = startOfWeek(data, {
      weekStartsOn: 1
    });

    const domenica = endOfWeek(data, {
      weekStartsOn: 1
    });

    return [
      format(lunedi, 'd MMMM', {
        locale: it
      }),
      format(domenica, 'd MMMM yyyy', {
        locale: it
      })
    ].join(' – ');
  });

  readonly studentiDisponibili = computed(
    () =>
      this.valoriUniciOrdinati(
        this.lezioni().map(
          lezione => lezione.nomeStudente
        )
      )
  );

  readonly materieDisponibili = computed(
    () =>
      this.valoriUniciOrdinati(
        this.lezioni().map(
          lezione => lezione.materia
        )
      )
  );

  readonly livelliDisponibili = computed(
    () =>
      this.valoriUniciOrdinati(
        this.lezioni().map(
          lezione => lezione.livello
        )
      )
  );

  readonly dateDisponibili = computed(
    () =>
      [
        ...new Set(
          this.lezioni()
            .map(
              lezione => lezione.dataLezione
            )
            .filter(Boolean)
        )
      ].sort(
        (prima, seconda) =>
          prima.localeCompare(seconda)
      )
  );

  readonly orariDisponibili = computed(
    () =>
      [
        ...new Set(
          this.lezioni()
            .map(
              lezione => lezione.orarioInizio
            )
            .filter(Boolean)
        )
      ].sort(
        (prima, seconda) =>
          prima.localeCompare(seconda)
      )
  );

  readonly filtriAttivi = computed(() => {
    const filtri = this.filtri();

    return Boolean(
      filtri.nomeStudente ||
      filtri.materia ||
      filtri.livello ||
      filtri.dataLezione ||
      filtri.orarioInizio ||
      filtri.ordinamento !== 'dataLezione' ||
      filtri.direzione !== 'asc'
    );
  });

  readonly lezioniFiltrate = computed(() => {
    const filtri = this.filtri();

    const nomeStudente =
      filtri.nomeStudente
        .trim()
        .toLocaleLowerCase('it-IT');

    const risultato =
      this.lezioni().filter(lezione => {
        const studente =
          lezione.nomeStudente
            ?.toLocaleLowerCase('it-IT') ?? '';

        const corrispondeStudente =
          !nomeStudente ||
          studente.includes(nomeStudente);

        const corrispondeMateria =
          !filtri.materia ||
          lezione.materia === filtri.materia;

        const corrispondeLivello =
          !filtri.livello ||
          lezione.livello === filtri.livello;

        const corrispondeData =
          !filtri.dataLezione ||
          lezione.dataLezione ===
          filtri.dataLezione;

        const corrispondeOrario =
          !filtri.orarioInizio ||
          lezione.orarioInizio ===
          filtri.orarioInizio;

        return (
          corrispondeStudente &&
          corrispondeMateria &&
          corrispondeLivello &&
          corrispondeData &&
          corrispondeOrario
        );
      });

    return [...risultato].sort(
      (prima, seconda) => {
        const confronto =
          this.confrontaCampo(
            prima,
            seconda,
            filtri.ordinamento
          );

        if (confronto !== 0) {
          return filtri.direzione === 'asc'
            ? confronto
            : -confronto;
        }

        const confrontoData =
          prima.dataLezione.localeCompare(
            seconda.dataLezione
          );

        if (confrontoData !== 0) {
          return confrontoData;
        }

        const confrontoOra =
          prima.orarioInizio.localeCompare(
            seconda.orarioInizio
          );

        if (confrontoOra !== 0) {
          return confrontoOra;
        }

        return prima.nomeStudente.localeCompare(
          seconda.nomeStudente,
          'it',
          {
            sensitivity: 'base'
          }
        );
      }
    );
  });

  ngOnInit(): void {
    this.ascoltaFiltri();
    this.ascoltaParametriUrl();
  }

  cambiaVista(
    vista: VistaLezioni
  ): void {
    if (vista === this.vista()) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        vista,
        data: this.dataRiferimento()
      },
      queryParamsHandling: 'merge'
    });
  }

  cambiaData(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const data = input.value;

    if (
      !this.isIsoDate(data) ||
      data === this.dataRiferimento()
    ) {
      return;
    }

    this.aggiornaDataUrl(data);
  }

  settimanaPrecedente(): void {
    this.spostaSettimana(-1);
  }

  settimanaSuccessiva(): void {
    this.spostaSettimana(1);
  }

  vaiAllaSettimanaCorrente(): void {
    const oggi =
      format(new Date(), 'yyyy-MM-dd');

    if (oggi === this.dataRiferimento()) {
      return;
    }

    this.aggiornaDataUrl(oggi);
  }

  resetFiltri(): void {
    const filtriIniziali: FiltriLezioni = {
      nomeStudente: '',
      materia: '',
      livello: '',
      dataLezione: '',
      orarioInizio: '',
      ordinamento: 'dataLezione',
      direzione: 'asc'
    };

    this.formFiltri.reset(
      filtriIniziali,
      {
        emitEvent: false
      }
    );

    this.filtri.set(filtriIniziali);
  }

  ricarica(): void {
    this.caricaLezioni();
  }

  apriPopupModifica(
    lezione: LezioneResponseDto
  ): void {
    this.erroreModifica.set(null);
    this.lezioneInModifica.set(lezione);

    this.formPropostaModifica.reset(
      {
        nomeStudente:
          lezione.nomeStudente ?? '',
        email:
          lezione.email ?? '',
        materia:
          lezione.materia ?? '',
        livello:
          lezione.livello ?? '',
        note:
          lezione.note ?? '',
        dataLezione:
          lezione.dataLezione ?? '',
        orarioInizio:
          this.formattaOraInput(
            lezione.orarioInizio
          ),
        orarioFine:
          this.formattaOraInput(
            lezione.orarioFine
          ),
        motivazione: ''
      },
      {
        emitEvent: false
      }
    );
  }

  chiudiPopupModifica(): void {
    this.lezioneInModifica.set(null);
    this.erroreModifica.set(null);

    this.formPropostaModifica.reset(
      {
        nomeStudente: '',
        email: '',
        materia: '',
        livello: '',
        note: '',
        dataLezione: '',
        orarioInizio: '',
        orarioFine: '',
        motivazione: ''
      },
      {
        emitEvent: false
      }
    );
  }

  preparaPropostaModifica(): void {
    const lezione =
      this.lezioneInModifica();

    if (!lezione) {
      return;
    }

    if (this.formPropostaModifica.invalid) {
      this.formPropostaModifica
        .markAllAsTouched();

      this.erroreModifica.set(
        'Compila data, orari e motivazione.'
      );

      return;
    }

    const valori =
      this.formPropostaModifica
        .getRawValue();

    const proposta:
      PropostaModificaLezione = {
      idLezione: lezione.id,
      nomeStudente:
      valori.nomeStudente,
      email:
      valori.email,
      materia:
      valori.materia,
      livello:
      valori.livello,
      note:
        valori.note || null,
      dataLezione:
      valori.dataLezione,
      orarioInizio:
        this.normalizzaOraBackend(
          valori.orarioInizio
        ),
      orarioFine:
        this.normalizzaOraBackend(
          valori.orarioFine
        ),
      motivazione:
        valori.motivazione.trim()
    };

    const dataModificata =
      proposta.dataLezione !==
      lezione.dataLezione;

    const inizioModificato =
      proposta.orarioInizio !==
      this.normalizzaOraBackend(
        lezione.orarioInizio
      );

    const fineModificata =
      proposta.orarioFine !==
      this.normalizzaOraBackend(
        lezione.orarioFine
      );

    if (
      !dataModificata &&
      !inizioModificato &&
      !fineModificata
    ) {
      this.erroreModifica.set(
        'Modifica almeno la data oppure uno degli orari.'
      );

      return;
    }

    /*
     * TODO: collegare qui la chiamata al backend.
     * Il payload è già pronto e tipizzato.
     */
    console.log(
      'Proposta modifica lezione pronta',
      proposta
    );

    this.messaggioOperazione.set(
      'Proposta di modifica compilata correttamente. La chiamata al backend verrà collegata successivamente.'
    );

    this.erroreOperazione.set(null);
    this.chiudiPopupModifica();
  }

  confermaLezione(
    lezione: LezioneResponseDto
  ): void {
    if (this.isRigaBloccata(lezione.id)) {
      return;
    }

    this.messaggioOperazione.set(null);
    this.erroreOperazione.set(null);

    this.azioneInCorso.set({
      id: lezione.id,
      tipo: 'conferma'
    });

    this.adminService
      .accettaLezione(lezione.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.azioneInCorso.set(null);
        })
      )
      .subscribe({
        next: () => {
          this.messaggioOperazione.set(
            `La lezione di ${lezione.nomeStudente} è stata confermata.`
          );

          this.caricaLezioni();
        },

        error: error => {
          console.error(
            'Errore conferma lezione',
            error
          );

          this.erroreOperazione.set(
            'Non è stato possibile confermare la lezione.'
          );
        }
      });
  }

  annullaLezione(
    lezione: LezioneResponseDto
  ): void {
    if (this.isRigaBloccata(lezione.id)) {
      return;
    }

    this.messaggioOperazione.set(null);
    this.erroreOperazione.set(null);

    this.azioneInCorso.set({
      id: lezione.id,
      tipo: 'annulla'
    });

    this.adminService
      .rifiutaLezione(lezione.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.azioneInCorso.set(null);
        })
      )
      .subscribe({
        next: () => {
          this.messaggioOperazione.set(
            `La lezione di ${lezione.nomeStudente} è stata annullata.`
          );

          this.caricaLezioni();
        },

        error: error => {
          console.error(
            'Errore annullamento lezione',
            error
          );

          this.erroreOperazione.set(
            'Non è stato possibile annullare la lezione.'
          );
        }
      });
  }

  isRigaBloccata(id: string): boolean {
    return this.azioneInCorso()?.id === id;
  }

  isAzioneInCorso(
    id: string,
    tipo: TipoAzioneLezione
  ): boolean {
    const azione =
      this.azioneInCorso();

    return (
      azione?.id === id &&
      azione.tipo === tipo
    );
  }

  formattaData(dataIso: string): string {
    if (!this.isIsoDate(dataIso)) {
      return dataIso;
    }

    return format(
      parseISO(dataIso),
      'dd/MM/yyyy',
      {
        locale: it
      }
    );
  }

  formattaDataFiltro(
    dataIso: string
  ): string {
    if (!this.isIsoDate(dataIso)) {
      return dataIso;
    }

    return format(
      parseISO(dataIso),
      'EEEE d MMMM',
      {
        locale: it
      }
    );
  }

  formattaOra(orario: string): string {
    if (!orario) {
      return '—';
    }

    const [ore, minuti] =
      orario.split(':');

    if (!ore || !minuti) {
      return orario;
    }

    return `${ore}:${minuti}`;
  }

  trackById(
    _index: number,
    lezione: LezioneResponseDto
  ): string {
    return lezione.id;
  }


  private formattaOraInput(
    orario: string
  ): string {
    if (!orario) {
      return '';
    }

    const [ore, minuti] =
      orario.split(':');

    if (!ore || !minuti) {
      return '';
    }

    return `${ore}:${minuti}`;
  }

  private normalizzaOraBackend(
    orario: string
  ): string {
    if (!orario) {
      return '';
    }

    const parti = orario.split(':');

    return parti.length === 2
      ? `${parti[0]}:${parti[1]}:00`
      : orario;
  }

  private ascoltaFiltri(): void {
    this.formFiltri.valueChanges
      .pipe(
        debounceTime(150),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.filtri.set(
          this.formFiltri.getRawValue()
        );
      });
  }

  private ascoltaParametriUrl(): void {
    this.activatedRoute.queryParamMap
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(params => {
        const vistaParam =
          params.get('vista');

        const dataParam =
          params.get('data');

        const vistaNormalizzata =
          this.normalizzaVista(vistaParam);

        const dataNormalizzata =
          this.isIsoDate(dataParam)
            ? dataParam!
            : format(new Date(), 'yyyy-MM-dd');

        if (
          vistaParam !== vistaNormalizzata ||
          dataParam !== dataNormalizzata
        ) {
          void this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: {
              vista: vistaNormalizzata,
              data: dataNormalizzata
            },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });

          return;
        }

        this.vista.set(vistaNormalizzata);
        this.dataRiferimento.set(
          dataNormalizzata
        );

        this.caricaLezioni();
      });
  }

  private caricaLezioni(): void {
    const numeroRichiesta =
      ++this.richiestaCorrente;

    this.loading.set(true);
    this.errore.set(null);

    const richiesta$ =
      this.mostraConfermate()
        ? this.adminService
          .getLezioniConfermate(
            this.dataRiferimento()
          )
        : this.adminService
          .getLezioniDaConfermare(
            this.dataRiferimento()
          );

    richiesta$
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          if (
            numeroRichiesta ===
            this.richiestaCorrente
          ) {
            this.loading.set(false);
          }
        })
      )
      .subscribe({
        next: lezioni => {
          if (
            numeroRichiesta !==
            this.richiestaCorrente
          ) {
            return;
          }

          this.lezioni.set(lezioni ?? []);

          this.normalizzaFiltriDinamici();
        },

        error: error => {
          if (
            numeroRichiesta !==
            this.richiestaCorrente
          ) {
            return;
          }

          console.error(
            'Errore caricamento lezioni',
            error
          );

          this.lezioni.set([]);

          this.errore.set(
            this.mostraConfermate()
              ? 'Non è stato possibile caricare le lezioni confermate.'
              : 'Non è stato possibile caricare le lezioni da confermare.'
          );
        }
      });
  }

  private normalizzaFiltriDinamici(): void {
    const filtri =
      this.formFiltri.getRawValue();

    const filtriNormalizzati: FiltriLezioni = {
      ...filtri,

      materia:
        !filtri.materia ||
        this.materieDisponibili()
          .includes(filtri.materia)
          ? filtri.materia
          : '',

      livello:
        !filtri.livello ||
        this.livelliDisponibili()
          .includes(filtri.livello)
          ? filtri.livello
          : '',

      dataLezione:
        !filtri.dataLezione ||
        this.dateDisponibili()
          .includes(filtri.dataLezione)
          ? filtri.dataLezione
          : '',

      orarioInizio:
        !filtri.orarioInizio ||
        this.orariDisponibili()
          .includes(filtri.orarioInizio)
          ? filtri.orarioInizio
          : ''
    };

    this.formFiltri.patchValue(
      filtriNormalizzati,
      {
        emitEvent: false
      }
    );

    this.filtri.set(filtriNormalizzati);
  }

  private confrontaCampo(
    prima: LezioneResponseDto,
    seconda: LezioneResponseDto,
    campo: CampoOrdinamento
  ): number {
    const valorePrima =
      this.getValoreOrdinamento(
        prima,
        campo
      );

    const valoreSeconda =
      this.getValoreOrdinamento(
        seconda,
        campo
      );

    return valorePrima.localeCompare(
      valoreSeconda,
      'it',
      {
        numeric: true,
        sensitivity: 'base'
      }
    );
  }

  private getValoreOrdinamento(
    lezione: LezioneResponseDto,
    campo: CampoOrdinamento
  ): string {
    switch (campo) {
      case 'nomeStudente':
        return lezione.nomeStudente ?? '';

      case 'materia':
        return lezione.materia ?? '';

      case 'livello':
        return lezione.livello ?? '';

      case 'dataLezione':
        return lezione.dataLezione ?? '';

      case 'orarioInizio':
        return lezione.orarioInizio ?? '';
    }
  }

  private valoriUniciOrdinati(
    valori: Array<
      string |
      null |
      undefined
    >
  ): string[] {
    return [
      ...new Set(
        valori
          .map(
            valore => valore?.trim()
          )
          .filter(
            (
              valore
            ): valore is string =>
              Boolean(valore)
          )
      )
    ].sort(
      (prima, seconda) =>
        prima.localeCompare(
          seconda,
          'it',
          {
            sensitivity: 'base'
          }
        )
    );
  }

  private aggiornaDataUrl(
    data: string
  ): void {
    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        vista: this.vista(),
        data
      },
      queryParamsHandling: 'merge'
    });
  }

  private spostaSettimana(
    settimane: number
  ): void {
    const nuovaData = addWeeks(
      parseISO(this.dataRiferimento()),
      settimane
    );

    this.aggiornaDataUrl(
      format(nuovaData, 'yyyy-MM-dd')
    );
  }

  private normalizzaVista(
    vista: string | null
  ): VistaLezioni {
    return vista === 'confermate'
      ? 'confermate'
      : 'da-confermare';
  }

  private isIsoDate(
    valore: string | null
  ): boolean {
    if (
      !valore ||
      !/^\d{4}-\d{2}-\d{2}$/.test(valore)
    ) {
      return false;
    }

    const data = parseISO(valore);

    return (
      isValid(data) &&
      format(data, 'yyyy-MM-dd') === valore
    );
  }
}
