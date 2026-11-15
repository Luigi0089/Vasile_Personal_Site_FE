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

import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize, forkJoin } from 'rxjs';
import { format, isValid, parseISO } from 'date-fns';

import { AdminService } from '../../../Service/admin.service';
import { StackService } from '../../../Service/stack.service';
import { Skill, SkillRequest } from '../../../DTO/Skill';
import { CategoryDto } from '../../../DTO/CategoryDto';
import { KeywordDto } from '../../../DTO/KeywordDto';

export type SezioneContenuti = 'skills' | 'categories' | 'keywords';

interface ConfigSezione {
  titolo: string;
  descrizione: string;
  singolare: string;
  nuovo: string;
  icona: string;
}

const CONFIG: Record<SezioneContenuti, ConfigSezione> = {
  skills: {
    titolo: 'Competenze',
    descrizione: 'Crea, modifica ed elimina le skill mostrate sul sito, con le relative categorie e keyword.',
    singolare: 'competenza',
    nuovo: 'Nuova competenza',
    icona: '◆'
  },
  categories: {
    titolo: 'Categorie',
    descrizione: 'Gruppi usati per organizzare le competenze.',
    singolare: 'categoria',
    nuovo: 'Nuova categoria',
    icona: '▤'
  },
  keywords: {
    titolo: 'Keyword',
    descrizione: 'Parole chiave associate alle competenze.',
    singolare: 'keyword',
    nuovo: 'Nuova keyword',
    icona: '#'
  }
};

/** Elemento generico per le sezioni categorie / keyword. */
interface ElementoNome {
  id: number;
  valore: string;
}

@Component({
  selector: 'app-gestione-contenuti',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './gestione-contenuti.component.html',
  styleUrls: [
    '../gestione-lezioni/gestione-lezioni.component.scss',
    './gestione-contenuti.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestioneContenutiComponent implements OnInit {

  private readonly adminService = inject(AdminService);
  private readonly stackService = inject(StackService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly sezioni: ReadonlyArray<{ value: SezioneContenuti; config: ConfigSezione }> =
    (Object.keys(CONFIG) as SezioneContenuti[]).map(value => ({ value, config: CONFIG[value] }));

  readonly sezione = signal<SezioneContenuti>('skills');
  readonly config = computed(() => CONFIG[this.sezione()]);

  readonly skills = signal<Skill[]>([]);
  readonly categorie = signal<CategoryDto[]>([]);
  readonly keywords = signal<KeywordDto[]>([]);

  readonly loading = signal(false);
  readonly salvataggio = signal(false);
  readonly errore = signal<string | null>(null);
  readonly messaggio = signal<string | null>(null);
  readonly erroreForm = signal<string | null>(null);

  readonly formAperto = signal(false);
  readonly idInModifica = signal<number | null>(null);
  readonly idDaEliminare = signal<number | null>(null);
  readonly idInEliminazione = signal<number | null>(null);

  readonly filtroKeyword = signal('');

  readonly livelli = [
    { value: 1, label: '1 · Base' },
    { value: 2, label: '2 · Intermedio-' },
    { value: 3, label: '3 · Intermedio+' },
    { value: 4, label: '4 · Avanzato' },
    { value: 5, label: '5 · Esperto' }
  ];

  readonly formSkill = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)]
    }),
    level: new FormControl(3, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(5)]
    }),
    acquired: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)]
    }),
    categories: new FormControl<string[]>([], { nonNullable: true }),
    keywords: new FormControl<string[]>([], { nonNullable: true })
  });

  /* Form a campo singolo condiviso da categorie e keyword */
  readonly formNome = new FormGroup({
    valore: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  /* Categorie e keyword normalizzate nello stesso formato */
  readonly elementiNome = computed<ElementoNome[]>(() =>
    this.sezione() === 'categories'
      ? this.categorie().map(c => ({ id: c.id!, valore: c.name }))
      : this.keywords().map(k => ({ id: k.id!, valore: k.value }))
  );

  readonly totale = computed(() =>
    this.sezione() === 'skills' ? this.skills().length : this.elementiNome().length
  );

  /* Quante skill usano ciascuna categoria / keyword (chiave in minuscolo) */
  private readonly utilizzoCategorie = computed(() =>
    this.contaUtilizzi(this.skills().flatMap(s => s.categories ?? []))
  );

  private readonly utilizzoKeyword = computed(() =>
    this.contaUtilizzi(this.skills().flatMap(s => s.keywords ?? []))
  );

  readonly keywordFiltrate = computed(() => {
    const filtro = this.filtroKeyword().trim().toLocaleLowerCase('it-IT');
    return filtro
      ? this.keywords().filter(k => k.value.toLocaleLowerCase('it-IT').includes(filtro))
      : this.keywords();
  });

  ngOnInit(): void {
    const sezione = this.route.snapshot.data['sezione'] as SezioneContenuti | undefined;
    this.sezione.set(sezione && sezione in CONFIG ? sezione : 'skills');

    // stessi limiti delle colonne a DB (Category.name 100, Keyword.value 150)
    this.formNome.controls.valore.setValidators([
      Validators.required,
      Validators.maxLength(this.sezione() === 'categories' ? 100 : 150)
    ]);

    this.caricaDati();

    // dalla dashboard "Nuova ..." arriva con ?nuovo=true
    if (this.route.snapshot.queryParamMap.get('nuovo') === 'true') {
      this.apriCreazione();
    }
  }

  // ======================
  //   CARICAMENTO
  // ======================

  caricaDati(): void {
    this.loading.set(true);
    this.errore.set(null);

    forkJoin({
      skills: this.stackService.getSkills(),
      categorie: this.stackService.getCategories(),
      keywords: this.stackService.getSkillKeywords()
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: ({ skills, categorie, keywords }) => {
          this.skills.set(skills ?? []);
          this.categorie.set(categorie ?? []);
          this.keywords.set(keywords ?? []);
        },
        error: err => {
          console.error('Errore caricamento contenuti', err);
          this.errore.set('Non è stato possibile caricare i dati. Riprova.');
        }
      });
  }

  // ======================
  //   FORM
  // ======================

  apriCreazione(): void {
    this.idInModifica.set(null);
    this.erroreForm.set(null);
    this.messaggio.set(null);
    this.filtroKeyword.set('');

    this.formSkill.reset({
      name: '',
      level: 3,
      acquired: '',
      notes: '',
      categories: [],
      keywords: []
    });

    this.formNome.reset({ valore: '' });
    this.formAperto.set(true);
  }

  apriModificaSkill(skill: Skill): void {
    this.idInModifica.set(skill.id);
    this.erroreForm.set(null);
    this.messaggio.set(null);
    this.filtroKeyword.set('');

    this.formSkill.reset({
      name: skill.name ?? '',
      level: skill.level ?? 3,
      acquired: skill.acquired ?? '',
      notes: skill.notes ?? '',
      categories: [...(skill.categories ?? [])],
      keywords: [...(skill.keywords ?? [])]
    });

    this.formAperto.set(true);
  }

  apriModificaNome(elemento: ElementoNome): void {
    this.idInModifica.set(elemento.id);
    this.erroreForm.set(null);
    this.messaggio.set(null);

    this.formNome.reset({ valore: elemento.valore });
    this.formAperto.set(true);
  }

  /* Riferimenti legati al componente, passati al template di riga condiviso */
  readonly modificaSkill = (skill: Skill) => this.apriModificaSkill(skill);
  readonly modificaNome = (elemento: ElementoNome) => this.apriModificaNome(elemento);

  chiudiForm(): void {
    this.formAperto.set(false);
    this.idInModifica.set(null);
    this.erroreForm.set(null);
  }

  isSelezionato(campo: 'categories' | 'keywords', nome: string): boolean {
    return this.formSkill.controls[campo].value.includes(nome);
  }

  toggleSelezione(campo: 'categories' | 'keywords', nome: string): void {
    const ctrl = this.formSkill.controls[campo];
    const valori = ctrl.value;

    ctrl.setValue(
      valori.includes(nome)
        ? valori.filter(v => v !== nome)
        : [...valori, nome]
    );
    ctrl.markAsDirty();
  }

  aggiornaFiltroKeyword(event: Event): void {
    this.filtroKeyword.set((event.target as HTMLInputElement).value);
  }

  salva(): void {
    if (this.salvataggio()) {
      return;
    }

    if (this.sezione() === 'skills') {
      this.salvaSkill();
    } else {
      this.salvaNome();
    }
  }

  private salvaSkill(): void {
    if (this.formSkill.invalid) {
      this.formSkill.markAllAsTouched();
      this.erroreForm.set('Compila almeno nome e livello.');
      return;
    }

    const v = this.formSkill.getRawValue();

    const body: SkillRequest = {
      name: v.name.trim(),
      level: Number(v.level),
      acquired: v.acquired || null,
      notes: v.notes.trim() || null,
      categories: v.categories,
      keywords: v.keywords
    };

    const id = this.idInModifica();

    this.esegui(
      id == null
        ? this.adminService.createSkill(body)
        : this.adminService.updateSkill(id, body),
      id == null
        ? `Competenza "${body.name}" creata.`
        : `Competenza "${body.name}" aggiornata.`
    );
  }

  private salvaNome(): void {
    if (this.formNome.invalid) {
      this.formNome.markAllAsTouched();
      this.erroreForm.set(
        this.formNome.controls.valore.hasError('maxlength')
          ? 'Il valore inserito è troppo lungo.'
          : 'Il campo è obbligatorio.'
      );
      return;
    }

    const valore = this.formNome.getRawValue().valore.trim();
    const id = this.idInModifica();
    const singolare = this.config().singolare;

    /*
     * Il BE in creazione restituisce l'elemento esistente senza errore,
     * quindi il duplicato lo segnaliamo qui.
     */
    const duplicato = this.elementiNome().some(e =>
      e.id !== id &&
      e.valore.toLocaleLowerCase('it-IT') === valore.toLocaleLowerCase('it-IT')
    );

    if (duplicato) {
      this.erroreForm.set(`Esiste già una ${singolare} "${valore}".`);
      return;
    }

    const richiesta$: Observable<unknown> =
      this.sezione() === 'categories'
        ? (id == null
          ? this.adminService.createCategory(valore)
          : this.adminService.updateCategory(id, valore))
        : (id == null
          ? this.adminService.createKeyword(valore)
          : this.adminService.updateKeyword(id, valore));

    this.esegui(
      richiesta$,
      id == null
        ? `${this.capitalizza(singolare)} "${valore}" creata.`
        : `${this.capitalizza(singolare)} "${valore}" aggiornata.`
    );
  }

  private esegui(richiesta$: Observable<unknown>, messaggioOk: string): void {
    this.salvataggio.set(true);
    this.erroreForm.set(null);

    richiesta$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.salvataggio.set(false))
      )
      .subscribe({
        next: () => {
          this.messaggio.set(messaggioOk);
          this.chiudiForm();
          this.caricaDati();
        },
        error: err => {
          console.error('Errore salvataggio', err);
          this.erroreForm.set(this.messaggioErrore(err, 'Salvataggio non riuscito.'));
        }
      });
  }

  // ======================
  //   ELIMINAZIONE
  // ======================

  chiediEliminazione(id: number): void {
    this.idDaEliminare.set(id);
    this.messaggio.set(null);
    this.errore.set(null);
  }

  annullaEliminazione(): void {
    this.idDaEliminare.set(null);
  }

  confermaEliminazione(id: number, nome: string): void {
    if (this.idInEliminazione() != null) {
      return;
    }

    const richiesta$: Observable<void> =
      this.sezione() === 'skills'
        ? this.adminService.deleteSkill(id)
        : this.sezione() === 'categories'
          ? this.adminService.deleteCategory(id)
          : this.adminService.deleteKeyword(id);

    this.idInEliminazione.set(id);

    richiesta$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.idInEliminazione.set(null);
          this.idDaEliminare.set(null);
        })
      )
      .subscribe({
        next: () => {
          this.messaggio.set(`${this.capitalizza(this.config().singolare)} "${nome}" eliminata.`);

          if (this.idInModifica() === id) {
            this.chiudiForm();
          }

          this.caricaDati();
        },
        error: err => {
          console.error('Errore eliminazione', err);
          this.errore.set(this.messaggioErrore(err, 'Eliminazione non riuscita.'));
        }
      });
  }

  // ======================
  //   HELPER TEMPLATE
  // ======================

  /* Numero di skill che usano la categoria / keyword */
  utilizzi(valore: string): number {
    const mappa = this.sezione() === 'categories'
      ? this.utilizzoCategorie()
      : this.utilizzoKeyword();

    return mappa.get(valore.toLocaleLowerCase('it-IT')) ?? 0;
  }

  etichettaLivello(livello: number): string {
    return this.livelli.find(l => l.value === livello)?.label ?? String(livello);
  }

  formattaData(dataIso: string | null | undefined): string {
    if (!dataIso) {
      return '—';
    }
    const data = parseISO(dataIso);
    return isValid(data) ? format(data, 'dd/MM/yyyy') : dataIso;
  }

  campoNonValido(form: FormGroup, nome: string): boolean {
    const ctrl = form.get(nome);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  private contaUtilizzi(nomi: string[]): Map<string, number> {
    const mappa = new Map<string, number>();
    for (const nome of nomi) {
      const chiave = nome.toLocaleLowerCase('it-IT');
      mappa.set(chiave, (mappa.get(chiave) ?? 0) + 1);
    }
    return mappa;
  }

  /*
   * Mostra il messaggio del BE solo per gli errori "attesi" (4xx);
   * per il resto usa un messaggio generico.
   */
  private messaggioErrore(err: any, fallback: string): string {
    const status = err?.status;
    const messaggio = err?.error?.message;

    if (status >= 400 && status < 500 && typeof messaggio === 'string' && messaggio) {
      return messaggio;
    }

    return fallback;
  }

  private capitalizza(testo: string): string {
    return testo.charAt(0).toUpperCase() + testo.slice(1);
  }
}
