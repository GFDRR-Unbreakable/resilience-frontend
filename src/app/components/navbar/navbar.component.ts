import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap/modal/modal.module';
import { AboutComponent } from '../about/about.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor(private modalService: NgbModal) {}

  ngOnInit() {}
  onOpenModalEvent() {
    this.modalService.open(AboutComponent,  {
      size: 'lg'
    });
  }
  onScrollAboutElEvent(event) {
    let el = jQuery("div#about");
    if (el.length) {
      el = el[0];
      jQuery('html, body').animate({
          scrollTop: (el.getBoundingClientRect().y - 10)
      }, 1000);
      return false;
    }
  }
}
