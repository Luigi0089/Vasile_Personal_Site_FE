import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../Service/auth.service';
import { AdminService } from '../../../Service/admin.service';
import {DashboardStatsDto} from "../../../DTO/DashboardStatsDto";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  readonly username = signal(
    this.authService.getUsername() ?? 'Luigi'
  );

  readonly currentDate = format(
    new Date(),
    'd MMMM yyyy',
    {
      locale: it
    }
  );

  readonly statistics = signal<DashboardStatsDto>({
    skills: 0,
    categories: 0,
    keywords: 0,
    lezioniConfermate: 0,
    lezioniDaConfermare: 0
  });

  readonly loadingStatistics = signal(true);
  readonly statisticsError = signal(false);

  readonly backendStatus =
    signal<'checking' | 'online' | 'offline'>('checking');

  ngOnInit(): void {
    this.loadStatistics();
    this.checkBackendStatus();
  }

  logout(): void {
    this.authService.logout();

    void this.router.navigate([
      '/admin/login'
    ]);
  }



  private loadStatistics(): void {
    this.loadingStatistics.set(true);
    this.statisticsError.set(false);

    const now = new Date();
    this.adminService
      .getDashboardStatistics(format(now, 'yyyy-MM-dd'))
      .subscribe({
        next: statistics => {
          this.statistics.set(statistics);

          this.loadingStatistics.set(false);
        },

        error: error => {
          console.error(
            'Errore caricamento statistiche dashboard',
            error
          );

          this.statisticsError.set(true);
          this.loadingStatistics.set(false);
        }
      });
  }

  private checkBackendStatus(): void {
    this.backendStatus.set('checking');

    this.adminService.wakeUp().subscribe({
      next: () => {
        this.backendStatus.set('online');
      },

      error: error => {
        console.error(
          'Backend non raggiungibile',
          error
        );

        this.backendStatus.set('offline');
      }
    });
  }
}
