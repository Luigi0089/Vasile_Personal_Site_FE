import {Component, OnInit} from '@angular/core';
import {RouterLink} from "@angular/router";
import {AdminService} from "../../Service/admin.service";

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss'
})
export class HomepageComponent implements OnInit {

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.wakeUp().subscribe({
      next: () => {
        // opzionale: console.log('Backend svegliato');
      },
      error: (err) => {
        // opzionale: ignora l’errore, non deve bloccare la pagina
        console.error('Errore nel ping iniziale', err);
      }
    });
  }

}
