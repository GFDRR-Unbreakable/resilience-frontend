import {Component, OnInit, Input, OnChanges} from '@angular/core';

export interface DataRow {
  id: string;
  value: number;
}

const ROW_DEFAULT = {id: 'AVG', value: 0};

@Component({
  selector: 'app-gauge',
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.css']
})
export class GaugeComponent implements OnInit, OnChanges {
  activeRow  = ROW_DEFAULT;
  markerRow = ROW_DEFAULT;
  @Input() data: DataRow[];
  @Input() id = 'AVG';
  @Input() max = 1;
  @Input() formatter: Function = (x) => x;
  @Input() changeRow: DataRow | null;
  @Input() hasChange = false;

  constructor() { }

  ngOnInit() {

  }

  ngOnChanges() {
    this.markerRow = this.data.find(row => row.id === this.id) || ROW_DEFAULT;
    this.activeRow = !!this.changeRow ? this.changeRow : this.markerRow; //this.data.find(row => row.id === this.id) || ROW_DEFAULT;

  }

  barWidth() {
    const v = this.activeRow.value * 100 / this.max;
    return v < 0 ? 0 : v > 100 ? 100 : v;
  }

  markerPos() {
    const v = this.markerRow.value * 100 / this.max;
    return v < 0 ? 0 : v > 100 ? 100 : v;
  }
}
