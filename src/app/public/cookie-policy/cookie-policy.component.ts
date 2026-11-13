import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LEGAL_CONFIG } from '../../../Constants/legal';

@Component({
  selector: 'app-cookie-policy',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cookie-policy.component.html',
  // riusa l'aspetto dell'informativa privacy, più gli stili della tabella
  styleUrls: [
    '../privacy/privacy.component.scss',
    './cookie-policy.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookiePolicyComponent {
  readonly legal = LEGAL_CONFIG;
}
