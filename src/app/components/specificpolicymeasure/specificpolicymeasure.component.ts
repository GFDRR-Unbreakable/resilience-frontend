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
  public sortUISelectedLblChart11 = '';
  public sortUISelectedLblChart12 = '';
  public sortUISelectedLblChart21 = '';
  public sortUISelectedLblChart22 = '';
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
    let data = this.chartService.getMetricAllCountriesSinglePolicy(policyObj.id);
    const regionalPolicyObj = this.chartService.getRegionalPolicyData();
    const regionName = this.selectedRegionUIList.id;
    const selectedRegion = regionalPolicyObj[policyObj.id][regionName];
    const regionObj = {
      id: regionName,
      dKtot: selectedRegion['avg_dKtot'],
      dWtot_currency: selectedRegion['avg_dWtot_currency'],
      dK: selectedRegion['avg_dKtot'],
      dWpc_currency: ['avg_dWpc_currency']
    };
    const finalRegionObj = {};
    finalRegionObj[regionName] = regionObj;
    data = Object.assign({}, finalRegionObj, data);
    this.chartService.createPolicyListChart(data, 'policyMeasure0', {type: 'million', isNew: false});
    this.chartService.createPolicyListChart(data, 'policyMeasure1', {type: 'percentage', isNew: false});
    this.resetUISortLabels();
  }
  resetUISortLabels() {
    this.sortUISelectedLblChart11 = '';
    this.sortUISelectedLblChart12 = '';
    this.sortUISelectedLblChart21 = '';
    this.sortUISelectedLblChart22 = '';
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
      const globalGroupList = this.chartService.getCountryGroupData();
      const chartConf = this.chartService.getChartsConf();
      const regionalPolicyObj = this.chartService.getRegionalPolicyData();
      const policyIdList = chartConf.policyList;
      const policyMetricList = chartConf.policyMetrics;
      jQuery.each(globalGroupList, (key, region) => {
        this.regionUIList.push({
          id: region,
          label: region
        });
      });
      let policyData = this.chartService.getMetricAllCountriesSinglePolicy(this.selectedPolicyUIList.id);
      const selectedRegion = regionalPolicyObj[this.selectedPolicyUIList.id][this.selectedRegionUIList.id];
      const regionObj = {
        dKtot: selectedRegion['avg_dKtot'],
        dWtot_currency: selectedRegion['avg_dWtot_currency'],
        dK: selectedRegion['avg_dKtot'],
        dWpc_currency: ['avg_dWpc_currency']
      };
      console.log(regionalPolicyObj[this.selectedPolicyUIList.id]);
      console.log(selectedRegion);
      console.log(policyData);
      const regionName = this.selectedRegionUIList.id;
      const finalRegionObj = {};
      finalRegionObj[regionName] = regionObj;
      policyData = Object.assign({}, finalRegionObj, policyData);
      this.chartService.createPolicyListChart(policyData, 'policyMeasure0', {type: 'million', isNew: true});
      this.chartService.createPolicyListChart(policyData, 'policyMeasure1', {type: 'percentage', isNew: true});
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
    this.resetUISortLabels();
    this.sortUISelected++;
    const sortSel = this.sortUISelected;
    let data = this.chartService.getMetricAllCountriesSinglePolicy(this.selectedPolicyUIList.id);
    const regionalPolicyObj = this.chartService.getRegionalPolicyData();
    const regionName = this.selectedRegionUIList.id;
    const selectedRegion = regionalPolicyObj[this.selectedPolicyUIList.id][regionName];
    const regionObj = {
      id: regionName,
      dKtot: selectedRegion['avg_dKtot'],
      dWtot_currency: selectedRegion['avg_dWtot_currency'],
      dK: selectedRegion['avg_dKtot'],
      dWpc_currency: ['avg_dWpc_currency']
    };
    const finalRegionObj = {};
    finalRegionObj[regionName] = regionObj;
    data = Object.assign({}, finalRegionObj, data);
    let sortType;
    if (sortSel === 2) {
      sortType = 'DESC';
      this.chartService.createPolicyListChart(data, 'policyMeasure0', {
        type: 'million',
        barType: barType,
        sort: sortType,
        isNew: false
      });
      this.chartService.createPolicyListChart(data, 'policyMeasure1', {
        type: 'percentage',
        barType: barType,
        sort: sortType,
        isNew: false
      });
      this[chartLbl] = sortType;
      this.sortUISelected = -1;
    } else if (sortSel === 1) {
      sortType = 'ASC';
      this.chartService.createPolicyListChart(data, 'policyMeasure0', {
        type: 'million',
        barType: barType,
        sort: sortType,
        isNew: false
      });
      this.chartService.createPolicyListChart(data, 'policyMeasure1', {
        type: 'percentage',
        barType: barType,
        sort: sortType,
        isNew: false
      });
      this[chartLbl] = sortType;
    } else if (sortSel === 0) {
      sortType = 'NORMAL';
      this.chartService.createPolicyListChart(data, 'policyMeasure0', {
        type: 'million',
        barType: barType,
        sort: sortType,
        isNew: false
      });
      this.chartService.createPolicyListChart(data, 'policyMeasure1', {
        type: 'percentage',
        barType: barType,
        sort: sortType,
        isNew: false
      });
      this[chartLbl] = '';
    }
  }

}
