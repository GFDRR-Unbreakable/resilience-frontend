import { Component, OnInit, Input } from '@angular/core';
import { ChartService } from '../../services/chart.service';

@Component({
  selector: 'app-scatter-gauge',
  templateUrl: './scatter-gauge.component.html',
  styleUrls: ['./scatter-gauge.component.css']
})
export class ScatterGaugeComponent implements OnInit {
  countryList: {[k: string]: string}[];
  countryMap: {[i: string]: string} = {};
  hoverRow: {id: string, value: number} | null;
  activeRow: {id: string, value: number};

  @Input() data: {id: string, value: number}[];
  @Input() id: string = 'AVG';
  @Input() max: number = 1;
  @Input() formatter: Function = (x) => x;

  constructor(private chartService: ChartService) {
    this.countryList = this.chartService.getOutputList();

    this.countryMap = this.countryList.reduce((acc, row) => {
      acc[row.code] = row.name;
      return acc;
    }, {AVG: 'Average'});
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this.activeRow = this.data.find(r => r.id === this.id);
  }

  mouseEnter(row) {
    this.hoverRow = row;
  }

  mouseLeave() {
    this.hoverRow = null;
  }

  pointPosition(row) {

    return row.value * 100 / this.max;
  }
}
