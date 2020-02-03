import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap/modal/modal.module';
import { AboutComponent } from '../about/about.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  /**
   * Component constructor which is first invoked when the app is rendering.
   * It has injected a modal service which refers to Angular-bootstrap modal component.
   * @param modalService
   */

  @ViewChildren('menu-item') menuItems: QueryList<ElementRef>;
  menuOpen: boolean = false;

  constructor(private modalService: NgbModal) { }

  ngOnInit() { }
  /**
   * This method is triggered when the "About" tab-button is clicked.
   * Opens a custom modal component to display About info.
   */
  onOpenModalEvent() {
    this.modalService.open(AboutComponent, {
      size: 'lg'
    });
  }
  /**
   * @event Click - This event is triggered when the "About" tab-button is clicked.
   * It scroll down the page to about info when it is rendered in the "Viewer" route, otherwise
   * it opens a "About" info modal component.
   */
  onScrollAboutElEvent(event) {
    /*let el = jQuery('div#about');
    console.log(el.length)
    if (el.length) {
      el = el[0];
      jQuery('html, body').animate({
          scrollTop: (el.getBoundingClientRect().y - 10)
      }, 1000);
      return false;
    } else {*/
    this.onOpenModalEvent();
    //}

  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.menuItems.forEach((el) => {
      //set menu items to show or hide based on menuOpen state
      this.menuOpen ? el.nativeElement.className = 'show' : 'hide';
    });
  }
}
