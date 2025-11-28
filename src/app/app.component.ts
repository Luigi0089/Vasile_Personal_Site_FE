import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HomepageComponent} from "./homepage/homepage.component";
import {HeaderComponent} from "./header/header.component";
import {FooterComponent} from "./footer/footer.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HomepageComponent, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  title = 'vasile-personal-site';

  @ViewChild('appHeader') appHeader!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.updateHeaderHeight();

    // opzionale: se il layout cambia con il resize
    window.addEventListener('resize', () => this.updateHeaderHeight());
  }

  private updateHeaderHeight(): void {
    const h = this.appHeader?.nativeElement.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--header-height', `${h}px`);
  }
}
