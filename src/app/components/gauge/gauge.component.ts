import { Component, OnInit, Input } from '@angular/core';

const ROW_DEFAULT = {id: 'AVG', value: 0};

@Component({
  selector: 'app-gauge',
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.css']
})
export class GaugeComponent implements OnInit {
  activeRow  = ROW_DEFAULT;
  @Input() data: {id: string, value: number}[];
  @Input() id: string = 'AVG';
  @Input() max: number = 1;
  @Input() formatter: Function = (x) => x;

  constructor() { }

  ngOnInit() {

  }

  ngOnChanges() {
    this.activeRow = this.data.find(row => row.id === this.id) || ROW_DEFAULT;
  }

  barWidth() {
    return this.activeRow.value * 100 / this.max;
  }
}
