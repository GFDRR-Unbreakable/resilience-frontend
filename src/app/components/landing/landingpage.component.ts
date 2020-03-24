import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit } from '@angular/core';

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

  callout = {
    prefix: 'Welcome to Unbreakable',
    title: 'The Resilience Indicator Toolbox',
    intro: 'Is your country vulnerable to floods or windstorms, earthquakes or tsunamis? Find the optimal resilience-building solution in your country that also protects the most vulnerable. Use our three tools to estimate the benefits of investing in resilience.'
  };

  constructor() { }

  ngOnInit() {
  }

}
