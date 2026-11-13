import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { LEGAL_CONFIG } from '../../Constants/legal';

/*
 * Avviso informativo mostrato una sola volta (per versione delle informative).
 * Il sito usa solo strumenti tecnici: non serve il consenso, quindi non c'è "Rifiuta".
 * "Ho capito" memorizza soltanto la chiusura dell'avviso.
 */
@Component({
  selector: 'app-cookie-notice',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cookie-notice.component.html',
  styleUrl: './cookie-notice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookieNoticeComponent {

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly visible = signal(this.shouldShowNotice());

  acknowledge(): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(
          LEGAL_CONFIG.noticeStorageKey,
          LEGAL_CONFIG.policyVersion
        );
      } catch (error) {
        // storage bloccato (es. navigazione privata restrittiva): l'avviso si chiude comunque
        console.warn('Impossibile memorizzare la chiusura dell’avviso cookie.', error);
      }
    }

    this.visible.set(false);
  }

  private shouldShowNotice(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    try {
      return localStorage.getItem(LEGAL_CONFIG.noticeStorageKey) !== LEGAL_CONFIG.policyVersion;
    } catch (error) {
      console.warn('Impossibile leggere lo stato dell’avviso cookie.', error);
      return true;
    }
  }
}
