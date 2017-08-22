import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import {ChartService} from '../../services/chart.service';

@Component({
  selector: 'app-specificpolicymeasure',
  templateUrl: './specificpolicymeasure.component.html',
  styleUrls: ['./specificpolicymeasure.component.css']
})
export class SpecificpolicymeasureComponent implements OnInit, OnDestroy {
  private getOutputDataSubs: Subscription;
  private getScorecardDataSubs: Subscription;
  private chartConf = this.chartService.getChartsConf();
  public policyGroupUIList = this.chartConf.policyList.map(val => {
    return {
      id: val.id,
      label: val.label
    };
  });
  public selectedPolicyUIList = this.policyGroupUIList[0];
  constructor(private chartService: ChartService) { }

  ngOnInit() {
    this.setChartsConfig();
  }
  ngOnDestroy() {
    this.getOutputDataSubs.unsubscribe();
    this.getScorecardDataSubs.unsubscribe();
  }
  setChartsConfig() {
    this.chartService.initOutputChartConf();
    this.getOutputDataSubs = this.chartService.getOutputDataObs().subscribe(data => {
      this.setScorecardChartConf();
    });
  }
  setScorecardChartConf() {
    this.chartService.initScorecardChartConf();
    this.getScorecardDataSubs = this.chartService.getScoreCardDataObs().subscribe(data => {
      data = JSON.parse(data);
      this.chartService.setPoliciesData(data);
      const policyData = this.chartService.getMetricAllCountriesSinglePolicy(this.selectedPolicyUIList.id);
      this.chartService.createPolicyListChart(policyData, 'policyMeasure', true);
    });
  }

  // EVENTS
  onScorecardPolicyChange(policyObj) {
    this.selectedPolicyUIList = policyObj;
    const data = this.chartService.getMetricAllCountriesSinglePolicy(policyObj.id);
    this.chartService.createPolicyListChart(data, 'policyMeasure', true);
  }

}
