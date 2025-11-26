import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

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

  @ViewChild('navbarCollapse') navbarCollapse!: ElementRef<HTMLElement>;
  @ViewChild('navbarToggler') navbarToggler!: ElementRef<HTMLButtonElement>;

  dropdownOpen = false;

  constructor(private router: Router) {}

  /**
   * Chiude il menù a scomparsa (burger) sui dispositivi piccoli
   */
  closeNavbar(): void {
    // navbar-expand-lg → sotto i 992px è collapsabile
    if (window.innerWidth < 992 && this.navbarCollapse) {
      const collapseEl = this.navbarCollapse.nativeElement;

      // se per qualche motivo è aperta, la chiudo
      if (collapseEl.classList.contains('show')) {
        collapseEl.classList.remove('show');
      }
    }
  }

  goToStackSection(fragment: string) {
    this.dropdownOpen = false;
    this.closeNavbar();   // chiudo il menù dopo la scelta

    // Vai a /Stack prima
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
