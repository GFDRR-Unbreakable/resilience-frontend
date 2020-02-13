import { Component, OnInit, Input } from '@angular/core';
import { ChartService } from '../../services/chart.service';
import { DataRow } from '../gauge/gauge.component';
import { createEmptyStateSnapshot } from '@angular/router/src/router_state';

const ROW_DEFAULT = {id: 'AVG', value: 0};
@Component({
  selector: 'app-scatter-gauge',
  templateUrl: './scatter-gauge.component.html',
  styleUrls: ['./scatter-gauge.component.css']
})
export class ScatterGaugeComponent implements OnInit {
  countryList: {[k: string]: string}[];
  countryMap: {[i: string]: string} = {};
  hoverRow: DataRow | null;
  activeRow: DataRow = ROW_DEFAULT;
  changeDisplayRow: DataRow = ROW_DEFAULT;
  @Input() data: DataRow[];
  @Input() id: string = 'AVG';
  @Input() max: number = 1;
  @Input() formatter: Function = (x) => x;
  @Input() changeRow: DataRow | null;
  @Input() hasChange = false;

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
    this.changeDisplayRow = !!this.changeRow ? this.changeRow : this.activeRow;
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
