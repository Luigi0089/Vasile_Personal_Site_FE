import { Routes } from '@angular/router';
import {AppComponent} from "./app.component";
import {HomepageComponent} from "./homepage/homepage.component";
import {StackComponent} from "./stack/stack.component";
import {SkillComponent} from "./skill/skill.component";

export const routes: Routes = [
  {path:'', component: HomepageComponent},
  {path:'Home', redirectTo:"", component: AppComponent},
  {path:'Stack', component: StackComponent},
  {path:'Skill', component: SkillComponent},
];
