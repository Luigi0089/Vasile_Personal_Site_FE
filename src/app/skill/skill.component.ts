import {Component, OnInit} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {DatePipe, NgForOf, NgIf} from "@angular/common";


type Category =
  | 'Linguaggi'
  | 'Frontend'
  | 'Backend'
  | 'Database'
  | 'Testing'
  | 'Tooling'
  | 'Soft Skills';

export interface Skill {
  name: string;
  level: 1|2|3|4|5;
  acquired: string;
  years?: number;
  category: Category[];
  keywords?: string[];
  notes?: string;
}

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
export class SkillComponent  implements OnInit {
  skills: Skill[] = [

//BE
    { name: 'Java', level: 5, acquired: '2024-06-01', category: ['Linguaggi','Backend'], keywords: ['Java 8+', 'Stream API', 'Concurrency', 'OOP', 'JVM'] },
    { name: 'Spring Boot', level: 5, acquired: '2024-06-01', category: ['Backend'], keywords: ['REST API', 'Spring Security', 'Spring Data JPA', 'Profiling', 'Dependency Injection'] },
    { name: 'Hibernate', level: 5, acquired: '2024-06-01', category: ['Backend'], keywords: ['ORM', 'JPA', 'Entity Mapping', 'Lazy Loading', 'Caching'] },
    { name: 'Maven', level: 5, acquired: '2024-06-01', category: ['Backend'], keywords: ['Build Automation', 'Dependency Management', 'Plugins', 'Lifecycle'] },
    { name: 'C', level: 5, acquired: '2019-01-01', category: ['Linguaggi'], keywords: ['Pointers', 'Memory Management', 'Procedural Programming', 'Low-level'] },

// BD
    { name: 'SQL', level: 4, acquired: '2024-06-01', category: ['Linguaggi','Database'], keywords: ['Queries', 'Joins', 'Indexes', 'Stored Procedures'] },

// FE
    { name: 'HTML', level: 4, acquired: '2024-06-01', category: ['Linguaggi','Frontend'], keywords: ['HTML5', 'Semantic', 'Forms', 'Accessibility'] },
    { name: 'CSS', level: 4, acquired: '2024-06-01', category: ['Linguaggi','Frontend'], keywords: ['Flexbox', 'Grid', 'Responsive Design', 'Animations', 'SCSS'] },
    { name: 'JavaScript', level: 4, acquired: '2024-06-01', category: ['Linguaggi','Frontend'], keywords: ['ES6+', 'DOM Manipulation', 'Async/Await', 'Fetch API', 'Events'] },
    { name: 'Angular', level: 4, acquired: '2024-06-01', category: ['Frontend'], keywords: ['RxJS', 'Routing', 'SCSS', 'Components', 'Services'] },

// TOOL
    { name: 'MySQL', level: 5, acquired: '2024-06-01', category: ['Tooling'], keywords: ['Relational DB', 'SQL', 'Indexes', 'Optimization', 'Stored Procedures'] },
    { name: 'IntelliJ', level: 4, acquired: '2024-06-01', category: ['Tooling'], keywords: ['IDE', 'Java', 'Refactoring', 'Debugging', 'Plugins'] },
    { name: 'Eclipse', level: 5, acquired: '2024-06-01', category: ['Tooling'], keywords: ['IDE', 'Java', 'Debugging', 'Plugins', 'Maven Integration'] },
    { name: 'WebStorm', level: 4, acquired: '2024-06-01', category: ['Tooling'], keywords: ['IDE', 'JavaScript', 'TypeScript', 'Refactoring', 'Debugging'] },
    { name: 'JBoss Application Server', level: 5, acquired: '2024-06-01', category: ['Backend'], keywords: ['Java EE', 'Deployment', 'Configuration', 'WildFly'] },
    { name: 'GitHub', level: 5, acquired: '2024-06-01', category: ['Tooling'], keywords: ['Version Control', 'Git', 'Pull Requests', 'Actions', 'Repositories'] },
    { name: 'GitLab', level: 5, acquired: '2024-06-01', category: ['Tooling'], keywords: ['Version Control', 'Git', 'Merge Requests', 'CI/CD', 'Repositories'] },
    { name: 'Git', level: 5, acquired: '2024-06-01', category: ['Tooling'], keywords: ['Version Control', 'Branching', 'Merging', 'Rebase', 'Tagging'] },

// TEST
    { name: 'JMeter', level: 4, acquired: '2024-06-01', category: ['Testing','Tooling'], keywords: ['Load Testing', 'Performance Testing', 'HTTP Requests', 'Assertions'] },
    { name: 'Postman', level: 5, acquired: '2024-06-01', category: ['Testing','Tooling'], keywords: ['API Testing', 'Collections', 'Environments', 'Automation'] },

// SOFT
    { name: 'Teamwork', level: 5, acquired: '2018-01-01', category: ['Soft Skills'], keywords: ['Collaboration', 'Communication', 'Group Work'] },
    { name: 'Problem Solving', level: 5, acquired: '2018-01-01', category: ['Soft Skills'], keywords: ['Critical Thinking', 'Analytical', 'Creative Solutions'] },
    { name: 'Time Management', level: 5, acquired: '2018-01-01', category: ['Soft Skills'], keywords: ['Deadlines', 'Prioritization', 'Productivity'] },
    { name: 'Adaptability', level: 5, acquired: '2018-01-01', category: ['Soft Skills'], keywords: ['Flexibility', 'Resilience', 'Change Management'] },
    { name: 'Leadership', level: 5, acquired: '2020-01-01', category: ['Soft Skills'], keywords: ['Mentoring', 'Decision Making', 'Inspiration'] },


  ];

  categories: Category[] = [
    'Linguaggi', 'Frontend', 'Backend', 'Database', 'Testing', 'Tooling', "Soft Skills"
  ];

  activeCategory: 'all' | Category = 'all';
  query = '';
  onlyStrong = false;
  filteredSkills: (Skill & { years: number })[] = [];
  dots = Array.from({ length: 5 });

  ngOnInit(): void {

    this.skills.forEach(s => s.years = this.getYears(s.acquired));

    this.applyFilters();
  }

  /** Calcola anni di esperienza dalla data di acquisizione */
  getYears(acquired: string): number {
    const start = new Date(acquired);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    const monthDiff = now.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) {
      years--;
    }
    return Math.max(years, 0);
  }

  setCategory(cat: 'all' | Category) {
    this.activeCategory = cat;
    this.applyFilters();
  }

  private asArray<T>(v: T | T[] | undefined | null): T[] {
    return Array.isArray(v) ? v : (v != null ? [v] : []);
  }

  private catMatch(cats: Category[] | Category, selected: 'all' | Category): boolean {
    if (selected === 'all') return true;
    return this.asArray(cats).includes(selected);
  }


  applyFilters() {
    const q = this.query.trim().toLowerCase();

    this.filteredSkills = this.skills
      // normalizzo e calcolo years
      .map(s => ({
        ...s,
        years: this.getYears(s.acquired),
        category: this.asArray<Category>(s.category)
      }))
      .filter(s => {
        const byCat   = this.catMatch(s.category, this.activeCategory);
        const byLevel = !this.onlyStrong || s.level >= 4;

        // preparo haystack per la ricerca testuale includendo TUTTE le categorie
        const hay = [
          s.name,
          ...s.category,            // array di Category
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
