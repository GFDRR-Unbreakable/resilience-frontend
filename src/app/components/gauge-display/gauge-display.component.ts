import {Component, OnInit, Input, OnChanges} from '@angular/core';
import * as d3 from 'd3/d3.js';

const PCT_FORMAT = d3.format('.2%');
const NOOP = (x) => x;
const YEAR_FORMAT = (x) => `${ x } Yrs`;
const MONEY_FORMAT = d3.format('$,.0f');
export interface DataRow {
  id: string;
  value: number;
}
@Component({
  selector: 'app-gauge-display',
  templateUrl: './gauge-display.component.html',
  styleUrls: ['./gauge-display.component.css']
})
export class GaugeDisplayComponent implements OnInit, OnChanges {
  countryList: {[k: string]: string}[];
  countryMap: {[i: string]: string} = {};
  maxValue = 1;
  formatter = NOOP;
  activeRow: DataRow;
  @Input() data: {id: string, value: number}[] = [];
  @Input() id = 'AVG';
  @Input() view = 'all';
  @Input() type: '%' | '$' | 'y' = '%';
  @Input() changeRow: DataRow | null = null;
  @Input() hasChange = false;

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

    this.activeRow = this.data.find(({id}) => id === this.id);
  }

}
