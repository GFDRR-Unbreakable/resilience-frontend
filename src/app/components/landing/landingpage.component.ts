import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Input, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingPageComponent implements OnInit {

  //these variables are being declared to stop the build lint errors,
  //do not delete them
  hoverClass1: any;
  hoverClass2: any;
  hoverClass3: any;


  constructor() { }

  ngOnInit() {
  }

}
