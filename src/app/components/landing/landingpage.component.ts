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

  calloutTitle = 'Welcome to Unbreakable – The Resilience Indicator Toolbox';
  calloutBody = 'Is your country vulnerable to floods or windstorms, earthquakes or tsunamis? Find the optimal resilience-building solution in your country that also protects the most vulnerable. Use our three tools to estimate the benefits of investing in resilience. The tools are built on the Unbreakable Resilience Indicator. Since $1 in disaster loss does not mean the same thing to a rich person as it does to a poor person the indicator accounts for the impact of asset losses on income and well-being in a novel way. Interested in a country, a specific policy or want access to the advanced tool? Select an option below to start building resilience.';

  constructor() { }

  ngOnInit() {
  }

}
