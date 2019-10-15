import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-gauge-display',
  templateUrl: './gauge-display.component.html',
  styleUrls: ['./gauge-display.component.css']
})
export class GaugeDisplayComponent implements OnInit {

  @Input() data: {id: string, value: number}[] = [];
  @Input() id: string = 'AVG';
  @Input() view: string = 'all';
  constructor() { }

  ngOnInit() {
  }

}
