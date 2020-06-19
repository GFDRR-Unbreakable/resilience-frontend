import {Component, AfterViewInit, OnInit} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WelcomeModalComponent } from './components/welcome-modal/welcome-modal.component';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';
  modalOpened = false;

  constructor(private modalService: NgbModal, private router: Router, private activeRoute: ActivatedRoute) {
    router.events
    .filter(event => event instanceof NavigationEnd)
    .subscribe(({urlAfterRedirects}:NavigationEnd) => {
      if (urlAfterRedirects !== '/' && urlAfterRedirects !== '/privacy-notice' && !this.modalOpened) {
        this.modalOpened = true;
        this.modalService.open(WelcomeModalComponent, {
          size: 'lg'
        });
      }
    });
  }

  onActivate(event) {
    window.scroll(0, 0);
  }
}
