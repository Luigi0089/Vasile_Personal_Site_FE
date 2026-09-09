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


  // ======================
  //       FALLBACK
  // ======================

  {
    path: '**',
    redirectTo: ''
  }
];
