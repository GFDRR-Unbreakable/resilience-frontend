import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

//GFDRR / unbreakable / world bana
const LOGOS = [
  {
    id: 'gfdrr',
    title: 'GFDRR',
    image: '/assets/image/logo-GFD-2.png'
  },
  {
    id: 'unbreakable',
    title: 'Unbreakable',
    image: '/assets/image/logo-04.png'
  },
  {
    id: 'world-bank',
    title: 'World Bank',
    image: '/assets/image/logo-2.png'
  },
];

@Component({
  selector: 'app-welcome-modal',
  templateUrl: './welcome-modal.component.html',
  styleUrls: ['./welcome-modal.component.css']
})
export class WelcomeModalComponent implements OnInit {
  logos = LOGOS;
  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
  }

}
