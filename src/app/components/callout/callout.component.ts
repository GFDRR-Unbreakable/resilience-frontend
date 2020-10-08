import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-callout',
  templateUrl: './callout.component.html',
  styleUrls: ['./callout.component.css']
})
export class CalloutComponent implements OnInit {

  @Input() prefix = '';
  @Input() title = '';
  @Input() intro = '';
  @Input() route = '';
  @Input() isLanding = false;
  constructor() {}

  ngOnInit() {

  }

}
