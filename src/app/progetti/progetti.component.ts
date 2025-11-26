import { Component, OnInit } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { StackService } from '../../Service/stack.service';
import { ProgettoDTO } from '../../DTO/ProgettoDTO';
import { MarkdownModule } from 'ngx-markdown';
import { ReadmeDTO } from '../../DTO/ReadmeDTO';

@Component({
  selector: 'app-progetti',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    MarkdownModule, // per <markdown>
  ],
  templateUrl: './progetti.component.html',
  styleUrls: ['./progetti.component.scss']
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

  trackByName = (_: number, repo: ProgettoDTO) =>
    repo.name ?? (repo as any)['name'] ?? _;

  toggleReadme(repoName: string): void {
    const isOpen = this.openedReadme[repoName] ?? false;

    // se è già aperto → chiudo e basta
    if (isOpen) {
      this.openedReadme[repoName] = false;
      return;
    }

    // opzionale: chiudi gli altri README aperti
    Object.keys(this.openedReadme).forEach(key => {
      this.openedReadme[key] = false;
    });

    this.openedReadme[repoName] = true;

    // se già in cache → non ricarico
    if (this.readmeContents[repoName]) {
      return;
    }

    this.loadingReadme[repoName] = true;
    this.errorReadme[repoName] = null;

    this.stackService.getReadme(repoName).subscribe({
      next: (dto: ReadmeDTO) => {
        const markdown = this.extractMarkdown(dto);
        this.readmeContents[repoName] = markdown;
        this.loadingReadme[repoName] = false;
      },
      error: (err) => {
        this.errorReadme[repoName] = 'Impossibile caricare il README.';
        this.loadingReadme[repoName] = false;
        console.error('Errore README', repoName, err);
      }
    });
  }

  /**
   * Converte il ReadmeDTO in markdown:
   * - se encoding = base64 → decode
   * - altrimenti prende content così com'è
   */
  private extractMarkdown(dto: ReadmeDTO): string {
    if (!dto?.content) {
      return '';
    }

    const encoding = dto.encoding?.toLowerCase();

    // caso GitHub "classico"
    if (encoding === 'base64') {
      try {
        const clean = dto.content.replace(/\s/g, '');
        // decodifica base64 → UTF-8
        const binary = atob(clean);
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        const markdown = new TextDecoder('utf-8').decode(bytes);
        return markdown;
      } catch (e) {
        console.error('Errore decodifica base64 README', e);
        return '';
      }
    }

    // caso in cui il backend ti abbia già mandato markdown puro
    return dto.content;
  }
}
