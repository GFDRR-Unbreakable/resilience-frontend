import {Component, AfterViewInit, OnInit} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WelcomeModalComponent } from './components/welcome-modal/welcome-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';

  constructor(private modalService: NgbModal) {
    this.modalService.open(WelcomeModalComponent, {
      size: 'lg'
    });
  }

  onActivate(event) {
    window.scroll(0, 0);
  }
}
