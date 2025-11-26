import { Routes } from '@angular/router';
import {AppComponent} from "./app.component";
import {HomepageComponent} from "./homepage/homepage.component";
import {StackComponent} from "./stack/stack.component";
import {SkillComponent} from "./skill/skill.component";
import {PrenotaLezioniComponent} from "./prenota-lezioni/prenota-lezioni.component";
import {AccettazioneLezioneComponent} from "./accettazione-lezione/accettazione-lezione.component";
import {RifiutaLezioneComponent} from "./rifiuta-lezione/rifiuta-lezione.component";
import {PrivacyComponent} from "./privacy/privacy.component";

export const routes: Routes = [
  {path:'', component: HomepageComponent},
  {path:'Home', redirectTo:"", component: AppComponent},
  {path:'Stack', component: StackComponent},
  {path:'Skill', component: SkillComponent},
  {path:'Lezioni', component: PrenotaLezioniComponent},
  {path:'conferma', component: AccettazioneLezioneComponent},
  {path:'rifiuta', component: RifiutaLezioneComponent},
  {path:'privacy', component: PrivacyComponent},
];
