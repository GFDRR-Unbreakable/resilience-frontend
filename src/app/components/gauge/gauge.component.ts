import { Component, OnInit, Input } from '@angular/core';

const ROW_DEFAULT = {id: 'AVG', value: 0};


export interface DataRow {
  id: string;
  value: number;
};

@Component({
  selector: 'app-gauge',
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.css']
})
export class GaugeComponent implements OnInit {
  activeRow  = ROW_DEFAULT;
  markerRow = ROW_DEFAULT;
  @Input() data: DataRow[];
  @Input() id: string = 'AVG';
  @Input() max: number = 1;
  @Input() formatter: Function = (x) => x;
  @Input() changeRow: DataRow | null;
  @Input() hasChange = false;

  constructor() { }

  ngOnInit() {

  }

  ngOnChanges() {
    console.log('changeRow', this.changeRow)
    this.markerRow = this.data.find(row => row.id === this.id) || ROW_DEFAULT;
    this.activeRow = !!this.changeRow ? this.changeRow : this.markerRow; //this.data.find(row => row.id === this.id) || ROW_DEFAULT;

  }

  barWidth() {
    return this.activeRow.value * 100 / this.max;
  }

  markerPos() {
    return this.markerRow.value * 100 / this.max;
  }
}
