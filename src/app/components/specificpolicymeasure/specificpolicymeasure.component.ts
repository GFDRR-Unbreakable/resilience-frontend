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
  public regionUIList = [{
    id: 'GLOBAL',
    label: 'Region'
  }];
  public sortUISelected = 0;
  public sortBtnPressedId = '';
  public policyGroupUIList = this.chartConf.policyList.map(val => {
    return {
      id: val.id,
      label: val.label
    };
  });
  public selectedPolicyUIList = this.policyGroupUIList[0];
  public selectedRegionUIList = this.regionUIList[0];
  constructor(private chartService: ChartService) { }

  ngOnInit() {
    this.setChartsConfig();
  }
  ngOnDestroy() {
    this.getOutputDataSubs.unsubscribe();
    this.getScorecardDataSubs.unsubscribe();
  }
  private _onChangeInputValuesEv() {
    const policyObj = this.selectedPolicyUIList;
    const data = this.chartService.getMetricAllCountriesSinglePolicy(policyObj.id);
    this.chartService.createPolicyListChart(data, 'policyMeasure0',
      {type: 'policyMeasure', chartType: 'absolute', isNew: false, region: this.selectedRegionUIList.id});
    this.chartService.createPolicyListChart(data, 'policyMeasure1',
      {type: 'policyMeasure', chartType: 'relative', isNew: false, region: this.selectedRegionUIList.id});
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
      this.chartService.setPoliciesData(data);
      const globalGroupList = this.chartService.getCountryGroupData();
      jQuery.each(globalGroupList, (key, region) => {
        this.regionUIList.push({
          id: region,
          label: region
        });
      });
      const policyData = this.chartService.getMetricAllCountriesSinglePolicy(this.selectedPolicyUIList.id);
      this.chartService.createPolicyListChart(policyData, 'policyMeasure0',
        {type: 'policyMeasure', chartType: 'absolute', isNew: true, region: this.selectedRegionUIList.id});
      this.chartService.createPolicyListChart(policyData, 'policyMeasure1',
        {type: 'policyMeasure', chartType: 'relative', region: this.selectedRegionUIList.id, isNew: true});
    });
  }
  private _sortPolicyMeasureChartData(data, barType, chartType, sortType, chartId) {
    this.chartService.createPolicyListChart(data, chartId, {
      type: 'policyMeasure',
      chartType: chartType,
      barType: barType,
      sort: sortType,
      isNew: false,
      region: this.selectedRegionUIList.id
    });
  }

  // EVENTS
  onScorecardPolicyChange(policyObj) {
    this.selectedPolicyUIList = policyObj;
    this._onChangeInputValuesEv();
  }
  onScorecardRegionChange(regionObj) {
    this.selectedRegionUIList = regionObj;
    this._onChangeInputValuesEv();
  }
  onSortChartDataEvent(barType, chartLbl) {
    if (this.sortBtnPressedId !== chartLbl) {
      this.sortUISelected = 0;
    }
    this.sortBtnPressedId = chartLbl;
    this.sortUISelected++;
    const sortSel = this.sortUISelected;
    const data = this.chartService.getMetricAllCountriesSinglePolicy(this.selectedPolicyUIList.id);
    const chartType = chartLbl === 'chart1' ? 'absolute' : 'relative';
    const chartId = chartLbl === 'chart1' ? 'policyMeasure0' : 'policyMeasure1';
    let sortType;
    if (sortSel === 1) {
      sortType = 'Ascending';
      this._sortPolicyMeasureChartData(data, barType, chartType, sortType, chartId);
      this.sortUISelected = -1;
    } else if (sortSel === 0) {
      sortType = 'Descending';
      this._sortPolicyMeasureChartData(data, barType, chartType, sortType, chartId);
    }
  }
}
