import { Routes } from '@angular/router';

import { HomepageComponent } from './public/homepage/homepage.component';
import { StackComponent } from './public/stack/stack.component';
import { SkillComponent } from './public/skill/skill.component';
import { PrenotaLezioniComponent } from './public/prenota-lezioni/prenota-lezioni.component';
import { PrivacyComponent } from './public/privacy/privacy.component';
import { AccettazioneLezioneComponent} from './admin/accettazione-lezione/accettazione-lezione.component';
import {RifiutaLezioneComponent} from './admin/rifiuta-lezione/rifiuta-lezione.component';
import {LoginComponent} from './admin/login/login.component';
import { DashboardComponent} from './admin/dashboard/dashboard.component';
import { adminGuard } from '../guards/admin.guard';
import {GestioneLezioniComponent} from "./admin/gestione-lezioni/gestione-lezioni.component";
import { GestioneContenutiComponent } from './admin/gestione-contenuti/gestione-contenuti.component';
import { CookiePolicyComponent } from './public/cookie-policy/cookie-policy.component';

export const routes: Routes = [

  // ======================
  //       PUBBLICHE
  // ======================

  {
    path: '',
    component: HomepageComponent,
    pathMatch: 'full'
  },

  {
    path: 'Home',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },

  {
    path: 'Stack',
    component: StackComponent
  },
  {
    path: 'stack',
    redirectTo: 'Stack',
    pathMatch: 'full'
  },

  {
    path: 'Skill',
    component: SkillComponent
  },
  {
    path: 'skill',
    redirectTo: 'Skill',
    pathMatch: 'full'
  },

  {
    path: 'Lezioni',
    component: PrenotaLezioniComponent
  },
  {
    path: 'lezioni',
    redirectTo: 'Lezioni',
    pathMatch: 'full'
  },

  /*
   * Lezione di prova: stessa pagina di /Lezioni in modalità prova.
   * Link da condividere: /Lezioni?prova=true (oppure gli alias qui sotto).
   */
  {
    path: 'prima-lezione',
    redirectTo: '/Lezioni?prova=true',
    pathMatch: 'full'
  },
  {
    path: 'lezione-di-prova',
    redirectTo: '/Lezioni?prova=true',
    pathMatch: 'full'
  },

  {
    path: 'conferma',
    component: AccettazioneLezioneComponent
  },

  {
    path: 'rifiuta',
    component: RifiutaLezioneComponent
  },

  {
    path: 'privacy',
    component: PrivacyComponent
  },

  {
    path: 'cookie-policy',
    component: CookiePolicyComponent
  },

  // ======================
  //       ADMIN
  // ======================

  {
    path: 'admin/login',
    component: LoginComponent
  },

  {
    path: 'admin',
    component: DashboardComponent,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/lezioni',
    component: GestioneLezioniComponent,
    canActivate: [adminGuard]
  },

  {
    path: 'admin/skills',
    component: GestioneContenutiComponent,
    canActivate: [adminGuard],
    data: { sezione: 'skills' }
  },

  {
    path: 'admin/categories',
    component: GestioneContenutiComponent,
    canActivate: [adminGuard],
    data: { sezione: 'categories' }
  },

  {
    path: 'admin/keywords',
    component: GestioneContenutiComponent,
    canActivate: [adminGuard],
    data: { sezione: 'keywords' }
  },


  // ======================
  //       FALLBACK
  // ======================

  {
    path: '**',
    redirectTo: ''
  }
];
