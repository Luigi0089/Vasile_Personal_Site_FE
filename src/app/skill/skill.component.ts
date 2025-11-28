import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgForOf, NgIf } from '@angular/common';
import { StackService } from '../../Service/stack.service';
import { Skill } from '../../DTO/Skill';
import { CategoryDto } from '../../DTO/CategoryDto';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-skill',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    DatePipe
  ],
  templateUrl: './skill.component.html',
  styleUrl: './skill.component.scss'
})
export class SkillComponent implements OnInit {

  // dati grezzi dal BE
  skills: Skill[] = [];
  categories: CategoryDto[] = [];

  // per la UI
  filteredSkills: Skill[] = [];
  categoryNames: string[] = [];      // solo i nomi per i chip

  activeCategory: 'all' | string = 'all';
  query = '';
  onlyStrong = false;

  dots = Array.from({ length: 5 });

  loading = false;
  errorMsg = '';

  constructor(private stackService: StackService) {}

  ngOnInit(): void {
    this.loading = true;
    this.errorMsg = '';

    // carico skills + categories in parallelo
    forkJoin({
      skills: this.stackService.getSkills(),
      categories: this.stackService.getCategories()
    }).subscribe({
      next: ({ skills, categories }) => {
        this.skills = skills ?? [];
        this.categories = categories ?? [];

        // popolo i nomi per i filtri (TUTTE le categorie del DB, incluso "test")
        this.categoryNames = this.categories
          .map(c => c.name)
          .filter((v, i, arr) => arr.indexOf(v) === i)  // unique
          .sort((a, b) => a.localeCompare(b));

        this.applyFilters();
        this.loading = false;
      },
      error: err => {
        console.error('Errore caricamento skill/categorie', err);
        this.errorMsg = 'Impossibile caricare le competenze in questo momento.';
        this.loading = false;
      }
    });
    console.log(this.categories)
  }

  setCategory(cat: 'all' | string) {
    this.activeCategory = cat;
    this.applyFilters();
  }

  private catMatch(
    cats: string[] | undefined,
    selected: 'all' | string
  ): boolean {
    if (selected === 'all') return true;
    if (!cats?.length) return false;
    return cats.includes(selected);
  }

  applyFilters() {
    const q = this.query.trim().toLowerCase();

    this.filteredSkills = (this.skills ?? []).filter(s => {
      const byCat   = this.catMatch(s.categories, this.activeCategory);
      const byLevel = !this.onlyStrong || s.level >= 4;

      const hay = [
        s.name,
        ...(s.categories || []),
        ...(s.keywords || [])
      ].join(' ').toLowerCase();

      const byQuery = !q || hay.includes(q);
      return byCat && byLevel && byQuery;
    });
  }

  levelLabel(n: number): string {
    switch (n) {
      case 1: return 'Base';
      case 2: return 'Intermedio-';
      case 3: return 'Intermedio+';
      case 4: return 'Avanzato';
      case 5: return 'Esperto';
      default: return '';
    }
  }

  trackByName = (_: number, s: Skill) => s.name;
}
