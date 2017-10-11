import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import {ChartService} from '../../services/chart.service';
import {FileService} from '../../services/files.service';

@Component({
  selector: 'app-specificpolicymeasure',
  templateUrl: './specificpolicymeasure.component.html',
  styleUrls: ['./specificpolicymeasure.component.css']
})
export class SpecificpolicymeasureComponent implements OnInit, OnDestroy {
  /**
   * Public and private properties set to work with the component, these are
   * chart conf, UI events and observables.
   */
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
  /**
   * Component constructor which is first invoked when the app is rendering.
   * It has two custom injected services: ChartService and FileService.
   * @param {ChartService} chartService - Service which is required to create/modify SVG charts using D3.js library.
   * @param {FileService} fileService - Service which is required to perform the download CSV or PDF file process through a server.
   */
  constructor(private chartService: ChartService,
    private fileService: FileService) { }
  /**
   * This method gets called after the component has invoked its constructor.
   * Inits Scorecard-measure data configuration.
   */
  ngOnInit() {
    this.setChartsConfig();
  }
  /**
   * This methods gets called when the component gets removed from the UI (normally happens while changing to another page).
   * Unsubscribe all subscribed observables the component has.
   */
  ngOnDestroy() {
    this.getOutputDataSubs.unsubscribe();
    this.getScorecardDataSubs.unsubscribe();
  }
  /**
   * This method gets called in @event onScorecardPolicyChange and @event onScorecarRegionChange events
   * which gets updated data and plots mentioned data in plotted scorecard measure charts.
   */
  private _onChangeInputValuesEv() {
    const policyObj = this.selectedPolicyUIList;
    const data = this.chartService.getMetricAllCountriesSinglePolicy(policyObj.id);
    this.chartService.createPolicyListChart(data, 'policy-measure-1',
      {type: 'policyMeasure', chartType: 'absolute', isNew: false, region: this.selectedRegionUIList.id});
    this.chartService.createPolicyListChart(data, 'policy-measure-2',
      {type: 'policyMeasure', chartType: 'relative', isNew: false, region: this.selectedRegionUIList.id});
  }
  /**
   * This method builds data from ScorecardChart chart values to be
   * send as body-params to PDF-generation API endpoint.
   */
  private processForFileJSONData(): any {
    const outputData = this.chartService.getOutputData();
    const chartConf = this.chartService.getChartsConf();
    const data: any = {
      selectedPolicy: '',
      selectedRegion: '',
      charts: {
        absolute: '',
        relative: ''
      }
    };
    data.selectedPolicy = this.selectedPolicyUIList.label;
    data.selectedRegion = this.selectedRegionUIList.label;
    const chartObj = this.chartService.formatSVGChartBase64Strings('policy-measure', false);
    data.charts.absolute = chartObj.chart1;
    data.charts.relative = chartObj.chart2;
    data.page = 'policyMeasure';
    return data;
  }
  /**
   * Inits ScorecardMeasure data configuration through output-indicator model data. 
   */
  setChartsConfig() {
    this.chartService.initOutputChartConf();
    this.getOutputDataSubs = this.chartService.getOutputDataObs().subscribe(data => {
      this.setScorecardChartConf();
    });
  }
  /**
   * Sets scorecard-measure data configuration in order to plot its charts.
   * Also populates the region-dropdown list to be used in the page.
   */
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
      this.chartService.createPolicyListChart(policyData, 'policy-measure-1',
        {type: 'policyMeasure', chartType: 'absolute', isNew: true, region: this.selectedRegionUIList.id});
      this.chartService.createPolicyListChart(policyData, 'policy-measure-2',
        {type: 'policyMeasure', chartType: 'relative', region: this.selectedRegionUIList.id, isNew: true});
    });
  }
  /**
   * Plots scorecard measure chart with sorting data configuration passed as function params.
   * @param {Object} data - ScorecardMeasure data to be used to plot its chart.
   * @param {String} barType - Determines which bar chart type is (well-being | asset)
   * @param {String} chartType - Determines which chart will be updated (relative | absolute)
   * @param {String} sortType - Determines which sort type will be set (Ascending | Descending | None)
   * @param {String} chartId - Determines the chart id placed in UI.
   */
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
  /**
   * @event Click - This event is fired when the user clicks on the "PDF" button to download a PDF file
   * of the current scorecard-measure charts and values displayed on the page.
   */
  onDownloadPDFFileEvent() {
    this.chartService.switchScoreCardChartFont(true, true);
    const data = this.processForFileJSONData();
    this.fileService.getScorecardPDFFile(data).subscribe(pdfData => {
      this.chartService.switchScoreCardChartFont(true, false);
      this.fileService.setPDFDownloadProcess(pdfData, 'scorecardPolicyMeasure');
    });
  }
  /**
   * @event Change - This event is triggered when a scorecard policy is selected from its dropdown.
   * @param {Object} policyObj - Selected policy object.
   */
  onScorecardPolicyChange(policyObj) {
    this.selectedPolicyUIList = policyObj;
    this._onChangeInputValuesEv();
  }
  /**
   * @event Change - This event is triggered when a region is selected from its dropdown.
   * @param {Object} regionObj - Selected region object.
   */
  onScorecardRegionChange(regionObj) {
    this.selectedRegionUIList = regionObj;
    this._onChangeInputValuesEv();
  }
  /**
   * Sort scorecard-measure data either in ascending or descending order and update its charts
   * @param {String} barType - Determines which bar type will be sorted either well-being or assets bar chart data.
   * @param {String} chartLbl - Determines which chart will be updated.
   */
  onSortChartDataEvent(barType, chartLbl) {
    if (this.sortBtnPressedId !== chartLbl) {
      this.sortUISelected = 0;
    }
    this.sortBtnPressedId = chartLbl;
    this.sortUISelected++;
    const sortSel = this.sortUISelected;
    const data = this.chartService.getMetricAllCountriesSinglePolicy(this.selectedPolicyUIList.id);
    const chartType = chartLbl === 'chart1' ? 'absolute' : 'relative';
    const chartId = chartLbl === 'chart1' ? 'policy-measure-1' : 'policy-measure-2';
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
