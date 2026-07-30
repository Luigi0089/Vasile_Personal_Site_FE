import { Component } from '@angular/core';
import {ProgettiComponent} from "../progetti/progetti.component";

@Component({
  selector: 'app-stack',
  standalone: true,
  imports: [
    ProgettiComponent
  ],
  templateUrl: './stack.component.html',
  styleUrl: './stack.component.scss'
})
export class StackComponent {


}
