import { Component, OnInit, Input, OnChanges } from '@angular/core';
import {ChartService} from '../../services/chart.service';
import { Subscription } from 'rxjs';

const TEXT = {
  title: {
    absolute: 'Absolute terms',
    relative: 'Relative term'
  },
  subTitle: {
    absolute: 'US$, millions per year',
    relative: '% of current losses'
  }
};

@Component({
  selector: 'app-specific-policy-list-chart',
  templateUrl: './specific-policy-list-chart.component.html',
  styleUrls: ['./specific-policy-list-chart.component.css']
})
export class SpecificPolicyListChartComponent implements OnInit, OnChanges {
  private chartCreated: boolean = false;
  private getScorecardDataSubs: Subscription;
  private chartConf = this.chartService.getChartsConf();
  public text = TEXT;
  public regionUIList = [{ id: 'GLOBAL', label: 'Global'}];

  chartId = `specific-policy-list-chart-${ (Math.random() + '').replace('.', '') }`;

  @Input() type: 'absolute' | 'relative' = 'absolute';
  @Input() forPrint = false;
  @Input() selectedPolicyUIList: any;
  @Input() selectedRegionUIList: any;

  constructor(private chartService: ChartService) { }

  ngOnInit() {
    this.createChart();

  }

  ngOnChanges() {
    if (this.chartCreated) {
      this.updateChart();
    }
  }

  createChart() {
    this.chartService.initScorecardChartConf();
    this.getScorecardDataSubs = this.chartService.getScoreCardDataObs().subscribe(data => {
      this.chartService.setPoliciesData(data);
      const policyData = this.chartService.getMetricAllCountriesSinglePolicy(this.selectedPolicyUIList.id);
      const chartConfig = {
        type: 'policyMeasure',
        chartType: this.type,
        isNew: true,
        region: this.selectedRegionUIList.id,
        forPrint: this.forPrint
      };
      this.chartCreated = true;
      this.chartService.createPolicyListChart(policyData, this.chartId,
      chartConfig, this.selectedPolicyUIList.hideAvoidedAssetLosses);
    });
  }

  updateChart() {
    const policyObj = this.selectedPolicyUIList;
    const data = this.chartService.getMetricAllCountriesSinglePolicy(policyObj.id);
    const chartConfig = {
      type: 'policyMeasure',
      chartType: this.type,
      isNew: false,
      region: this.selectedRegionUIList.id,
      forPrint: this.forPrint
    };
    this.chartService.createPolicyListChart(data, this.chartId,
    chartConfig, policyObj.hideAvoidedAssetLosses);
  }
}
