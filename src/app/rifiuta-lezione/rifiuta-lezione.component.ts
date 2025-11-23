import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../Service/admin.service';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-rifiuta-lezione',
  standalone: true,
  imports: [
    NgIf,
    NgClass
  ],
  templateUrl: './rifiuta-lezione.component.html',
  styleUrl: './rifiuta-lezione.component.scss'
})
export class RifiutaLezioneComponent implements OnInit {

  id!: string | null;
  responseMessage: string | null = null;
  loading: boolean = true;

  isSuccess: boolean | null = null;

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {

    this.route.queryParamMap.subscribe(params => {
      this.id = params.get('id');

      if (!this.id) {
        this.responseMessage = "Nessun ID fornito. Impossibile accettare la lezione.";
        this.loading = false;
        this.isSuccess = false;
        return;
      }

      this.adminService.rifiutaLezione(this.id).subscribe({
        next: (res: string) => {
          this.responseMessage = res;
          this.loading = false;
          this.isSuccess = true;
        },
        error: (err) => {
          console.error("Errore rifiuto:", err);
          this.responseMessage = "Errore durante l'accettazione della lezione.";
          this.loading = false;
          this.isSuccess = false;
        }
      });

    });
  }
}

