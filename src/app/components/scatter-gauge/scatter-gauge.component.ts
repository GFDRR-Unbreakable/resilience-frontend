import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-scatter-gauge',
  templateUrl: './scatter-gauge.component.html',
  styleUrls: ['./scatter-gauge.component.css']
})
export class ScatterGaugeComponent implements OnInit {
  @Input() data: {id: string, value: number}[];
  @Input() id: string = 'AVG';
  constructor() { }

  ngOnInit() {
  }

  ngOnChanges() {
  }

  pointPosition(row) {
    return row.value * 100;
  }
}
