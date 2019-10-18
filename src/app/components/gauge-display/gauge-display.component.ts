import { Component, OnInit, Input } from '@angular/core';
import * as d3 from 'd3/d3.js';

const PCT_FORMAT = d3.format('.2%');
const NOOP = (x) => x;
const YEAR_FORMAT = (x) => `${ x } Yrs`;
const MONEY_FORMAT = d3.format('$,.0f');

@Component({
  selector: 'app-gauge-display',
  templateUrl: './gauge-display.component.html',
  styleUrls: ['./gauge-display.component.css']
})
export class GaugeDisplayComponent implements OnInit {
  countryList: {[k: string]: string}[];
  countryMap: {[i: string]: string} = {};
  maxValue: number = 1;
  formatter = NOOP;

  @Input() data: {id: string, value: number}[] = [];
  @Input() id: string = 'AVG';
  @Input() view: string = 'all';
  @Input() type: '%' | '$' | 'y' = '%';

  constructor() { }

  ngOnInit() {

  }

  ngOnChanges() {
    const dMax = this.data.reduce((max, {value}) => {
      return value > max ? value : max;
    }, 0);

    this.maxValue = dMax < 0.1 ? 0.1
    : dMax < 0.25 ? 0.25
    : dMax < 0.5 ? 0.5
    : dMax < 1 ? 1
    : dMax < 1.5 ? 1.5
    : dMax < 6 ? 6
    : dMax < 25000 ? 25000
    : dMax < 75000 ? 75000 : 100000;

    this.formatter = this.type === '%' ? PCT_FORMAT
    : this.type === 'y' ? YEAR_FORMAT
    : this.type === '$' ? MONEY_FORMAT
    : NOOP;
  }

}
