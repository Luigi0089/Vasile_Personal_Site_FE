import { Component } from '@angular/core';
import {NgIf} from "@angular/common";
import {RouterLink, RouterLinkActive} from "@angular/router";
import {Router} from "@angular/router";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  dropdownOpen = false;

  constructor(private router: Router) {}

  goToStackSection(fragment: string) {
    this.dropdownOpen = false;

    // Vai a /stack prima
    this.router.navigate(['/Stack']).then(() => {
      // Dopo la navigazione, scrolla all'elemento
      const element = document.getElementById(fragment);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 50); // attesa per assicurarsi che il DOM sia pronto
      }
    });
  }


}
