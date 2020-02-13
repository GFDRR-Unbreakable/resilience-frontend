import { Component, OnInit, Input } from '@angular/core';
import {ChartService} from '../../services/chart.service';

export const TABS = [
  {label: 'Social Protection', id: 'inputSoc'},
  {label: 'Economic', id: 'inputEco'},
  {label: 'Vulnerability', id: 'inputVul'},
  {label: 'Exposure', id: 'inputExp'},
];

const GAUGE_TYPE_MAP = {
  'macro_T_rebuild_K': 'y',
  'c_cat_info__poor': '$',
  'c_cat_info__nonpoor': '$'
};

@Component({
  selector: 'app-indicator-tabs',
  templateUrl: './indicator-tabs.component.html',
  styleUrls: ['./indicator-tabs.component.css']
})
export class IndicatorTabsComponent implements OnInit {
  inputGaugeData:any = {};
  chartConf:any = {};
  inputTypes = {
    inputSoc: [],
    inputEco: [],
    inputVul: [],
    inputExp: []
  };
  renderTable = false;
  tabs = TABS;


  @Input() viewerModel:any;
  @Input() viewerGroupModel: any;
  @Input() countryData: {[i:string]: any} = {};
  @Input() inputLabels: any = {};
  @Input() view: string;
  @Input() selectedCountry: string;

  constructor(private chartService:ChartService) { }

  ngOnInit() { }

  ngOnChanges() {
    this.renderTable = !!Object.keys(this.countryData).length
    && !!Object.keys(this.inputLabels).length;

    this.chartConf = this.chartService.getChartsConf();

    Object.keys(this.inputTypes).forEach(key => {
      this.inputTypes[key] = this.chartConf.inputTypes[key];
    });

    this.inputGaugeData = ['inputSoc', 'inputEco', 'inputVul', 'inputExp']
    .reduce((acc, input) => {
      const keys = this.chartService.getInputIdChartByType(input);
      acc[input] = keys.reduce((acc2, key) => {
        return this.mapGaugeRows(acc2, key, this.countryData);
      }, {} as any)
      return acc;
    }, {} as any);
  }

  gaugeType(key) {
    return GAUGE_TYPE_MAP[key] || '%';
  }

  private mapGaugeRows(acc, key, countryData) {
    const rows = Object.keys(countryData).map(id => {
      return {id, value: countryData[id][key]};
    });
    const avgRow = {
      id: 'AVG',
      value: rows.reduce((a, r) => a + r.value, 0) / rows.length
    };
    acc[key] = [...rows, avgRow];
    return acc;
  }

}
