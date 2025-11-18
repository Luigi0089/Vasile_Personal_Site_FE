import { Component, OnInit } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { StackService } from '../../Service/stack.service';
import { ProgettoDTO } from '../../DTO/ProgettoDTO';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-progetti',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    MarkdownModule, // per <markdown>
  ],
  templateUrl: './progetti.component.html',
  styleUrls: ['./progetti.component.scss'] // <-- corretto
})
export class ProgettiComponent implements OnInit {

  repos: ProgettoDTO[] = [];

  // cache README (markdown grezzo)
  readmeContents: Record<string, string> = {};
  // visibilità pannello README
  openedReadme: Record<string, boolean> = {};
  // stato caricamento/errore
  loadingReadme: Record<string, boolean> = {};
  errorReadme:   Record<string, string | null> = {};

  loadingRepos = true;

  constructor(private stackService: StackService) {}

  ngOnInit(): void {
    this.loadingRepos = true;
    this.stackService.getRepos().subscribe({
      next: (data) => {
        this.repos = data ?? [];
        this.loadingRepos = false;
      },
      error: (err) => {
        console.error('Errore caricamento progetti', err);
        this.loadingRepos = false;
      }
    });
  }

  get totalRepos(): number {
    return this.repos.length;
  }

  trackByName = (_: number, repo: ProgettoDTO) => repo.name ?? repo['name'] ?? _;

  toggleReadme(repoName: string): void {
    const isOpen = this.openedReadme[repoName] ?? false;
    this.openedReadme[repoName] = !isOpen;

    // Se lo stiamo aprendo e non è in cache, carico
    if (!isOpen && !this.readmeContents[repoName]) {
      this.loadingReadme[repoName] = true;
      this.errorReadme[repoName] = null;

      this.stackService.getReadme(repoName).subscribe({
        next: (content: string) => {
          this.readmeContents[repoName] = content ?? '';
          this.loadingReadme[repoName] = false;
        },
        error: (err) => {
          this.errorReadme[repoName] = 'Impossibile caricare il README.';
          this.loadingReadme[repoName] = false;
          console.error('Errore README', repoName, err);
        }
      });
    }
  }
}
