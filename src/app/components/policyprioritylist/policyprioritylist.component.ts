import { OnDestroy, Component, OnInit } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {Store} from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import { distinctUntilKeyChanged } from 'rxjs/operator/distinctUntilKeyChanged';
import { distinct } from 'rxjs/operator/distinct';
import { map } from 'rxjs/operator/map';
import { debounceTime } from 'rxjs/operator/debounceTime';
import { distinctUntilChanged } from 'rxjs/operator/distinctUntilChanged';

import { PolicyPriority } from '../../store/model/policy.model';
import { PolicyAction } from '../../store/action/policy.action';
import {AppStore} from '../../store/default.store';
import {ChartService} from '../../services/chart.service';
import {FileService} from '../../services/files.service';


@Component({
  selector: 'app-policyprioritylist',
  templateUrl: './policyprioritylist.component.html',
  styleUrls: ['./policyprioritylist.component.css']
})
export class PolicyprioritylistComponent implements OnInit, OnDestroy {
  /**
   * Public and private properties set to work with the component, these are
   * chart conf, UI events, observables and policyList models.
   */
  public countryListComp: Array<any> = [];
  public countryUIList: Array<any> = [];
  public firstCountryGDP: string = '0';
  public firstCountryPopulation: string = '0';
  public getOutputDataSubs: Subscription;
  public getScorecardDataSubs: Subscription;
  public isSetUIGlobal: boolean = true;
  public policyList$: Observable<PolicyPriority>;
  public policySubs: Subscription;
  public policyModel: PolicyPriority = {
    firstCountry: '',
    secondCountry: ''
  };
  public secondCountryGDP: string = '0';
  public secondCountryPopulation: string = '0';
  public _selectedCountryList: Array<any> = [];
  public sortBtnPressedIdCh1 = '';
  public sortBtnPressedIdCh2 = '';
  public sortUISelected1 = 0;
  public sortUISelected2 = 0;
  public sortUISelectedLbl1 = '';
  public sortUISelectedLbl2 = '';
  public switchUICmpVal = false;
  /**
   * Returns a list of matches as a result of a searched string when first or second input-text is being modified.
  */
  public searchCountryFn = (text$: Observable<string>) => {
    const debounceTimeFn = debounceTime.call(text$, 200);
    const distinctUntilChangedFn = distinctUntilChanged.call(debounceTimeFn);
    const searchCb = term => {
      if (!term.length) {
        return [];
      } else {
        return this.countryUIList.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10);
      }
    };
    return map.call(distinctUntilChangedFn, searchCb);
  }
  /**
   * Component constructor which is first invoked when the app is rendering.
   * Inits accessing stored state-like data from the app root store data to be used in this component.
   * It has three custom injected services: MapService, ChartService and FileService
   * and a Store service from @ngrx library.
   * @param {FileService} fileService - Service which is required to perform the download CSV or PDF file process through a server.
   * @param {Store<AppStore>} store - Service which is required to create/modify state-like data of the root stored data of the app.
   * @param {ChartService} chartService - Service which is required to create/modify SVG charts using D3.js library.
   */
  constructor(
    private fileService: FileService,
    private store: Store<AppStore>,
    private chartService: ChartService) {
      this.policyList$ = store.select('policyPriority');
  }
  // LIFE-CYCLE METHODS
  /**
   * This method gets called after the component has invoked its constructor.
   * Inits PolicyList observable subscription and charts configuration.
   */
  ngOnInit() {
    this.setPolicyPriorityObservableConf();
    this.setChartsConf();
  }
  /**
   * This methods gets called when the component gets removed from the UI (normally happens while changing to another page).
   * Unsubscribe all subscribed observables the component has.
   */
  ngOnDestroy() {
    this.policySubs.unsubscribe();
    this.getOutputDataSubs.unsubscribe();
    this.getScorecardDataSubs.unsubscribe();
  }
  // METHODS
  /**
   * This method invokes the creation/modification/deletion of a country data in terms of drawing its output
   * SVG charts through a country input text field. Also updates the
   * policyList country text field in the root store app data using @ngrx library.
   * @param {Boolean} isFirstInput - Determines if the viewer input text field is from the first or the second one.
   */
  private _changeCountryInput(isFirstInput) {
    const input = isFirstInput ? this.policyModel.firstCountry : this.policyModel.secondCountry;
    const fromListFilter = this.countryListComp.filter(
      val => val.name.toLowerCase() === input.toLowerCase());
    const MAX_SELECTED_COUNTRIES = 2;
    if (this._selectedCountryList.length <= MAX_SELECTED_COUNTRIES) {
      if (isFirstInput) {
        this._filterCountryByInput(fromListFilter, 0, this.policyModel.firstCountry);
      } else {
        this._filterCountryByInput(fromListFilter, 1, this.policyModel.secondCountry);
      }
      this.store.dispatch({type: PolicyAction.EDIT_POLICY_FIELDS, payload: this.policyModel});
    }
  }
  /**
   * This private method is called by the @private _changeCountryInput method set it in this component
   * which creates/updates/removes selected countries data in a @public array called _selectedCountryList,
   * also modifies output chart and values.
   * @param {Array} list - Array of country properties filtered-by-input-text value. 
   * @param {Number} selectedIdx - Determines which input field has been modified
   * @param {String} field - Input-text field model
   */
  private _filterCountryByInput(list, selectedIdx, field) {
    const inData = this.chartService.getInputData();
    const outData = this.chartService.getOutputData();
    const idOut = selectedIdx === 0 ? 'outputs-1' : 'outputs-2';
    const idScList = selectedIdx === 0 ? 'policy-list-1' : 'policy-list-2';
    if (list.length) {
      const filterExistence = this._selectedCountryList.filter(val => {
        return val.name === list[0].name;
      });
      if (!filterExistence.length) {
        this._selectedCountryList.push({
          index: selectedIdx,
          chartId: idScList,
          name: list[0].name,
          code: list[0].code,
          group: list[0].group
        });
        if (this.isSetUIGlobal) {
          this.chartService.updateOutputCharts(idOut, list[0].code);
        } else {
          this.chartService.createOutputChart(outData, idOut, list[0].group, true);
        }
        const globalModelObj = this.chartService.getGlobalModelData();
        const countryGDP = globalModelObj[list[0].code]['macro_gdp_pc_pp'];
        let countryPopulation = globalModelObj[list[0].code]['macro_pop'];
        let totalGDP: any = countryGDP * countryPopulation;
        this._selectedCountryList.forEach(val => {
          if (val.chartId === idScList) {
            val.totalGDP = totalGDP;
          }
        });
        const aBillion = 1000000000;
        const aMillion = 1000000;
        const aThousand = 1000;
        let extraBInfo = '';
        let extraMInfo = '';
        if (totalGDP >= aBillion) {
          totalGDP = Math.round(totalGDP / aBillion);
          if (totalGDP >= aThousand) {
            totalGDP = totalGDP / aThousand;
            totalGDP = totalGDP.toFixed(3).split('.').join(',');
          }
          extraBInfo = 'Billion';
        }
        if (countryPopulation >= aMillion) {
          countryPopulation = Math.round(countryPopulation / aMillion);
          if (countryPopulation >= aThousand) {
            countryPopulation = countryPopulation / aThousand;
            countryPopulation = countryPopulation.toFixed(3).split('.').join(',');
          }
          extraMInfo = 'Million';
        }
        if (selectedIdx === 0) {
          this.firstCountryGDP = `${totalGDP} ${extraBInfo}`;
          this.firstCountryPopulation = `${countryPopulation} ${extraMInfo}`;
        } else {
          this.secondCountryGDP = `${totalGDP} ${extraBInfo}`;
          this.secondCountryPopulation = `${countryPopulation} ${extraMInfo}`;
        }
        const chartChild = document.querySelector(`#${idScList}`).childNodes;
        this.plotScorecardPolicyChart(list[0].name, idScList, chartChild.length > 0);
      }
    } else {
      const filterIndex = this._selectedCountryList.map((val, index) => {
        if (val.index === selectedIdx) {
          return index;
        }
      }).filter(isFinite);
      if (filterIndex.length) {
        const filterIndexFromAll = this.countryListComp.filter(val => {
          return val.name === this._selectedCountryList[filterIndex[0]].name;
        });
        if (filterIndex.length > 0 && filterIndexFromAll.length > 0 &&
          field.toLowerCase() !== this._selectedCountryList[filterIndex[0]].name.toLowerCase()) {
          if (this.isSetUIGlobal) {
            this.chartService.updateOutputCharts(idOut, 'global');
          } else {
            this.chartService.createOutputChart(outData, idOut, 'GLOBAL', true);
          }
          this._selectedCountryList.splice(filterIndex[0], 1);
          if (selectedIdx === 0) {
            this.firstCountryGDP = '0';
            this.firstCountryPopulation = '0';
          } else {
            this.secondCountryGDP = '0';
            this.secondCountryPopulation = '0';
          }
        }
      }
    }
  }
  /**
   * Plots ScoreCardPriorityList chart in the page with some chart configurations needed.
   * @param {String} name - Country name persisted from the input-text field. 
   * @param {String} chartId - Chart UI element id. 
   * @param {Boolean} chartExist - Determines wheter the chart has already plotted in the page or not.
   */
  plotScorecardPolicyChart(name, chartId, chartExist) {
    let data = this.chartService.getMetricAllPoliciesSingleCountry(name);
    let extraOpts: any = null;
    if (this.sortUISelected1 >= -1 && this.sortUISelected1 !== 0) {
      extraOpts = {};
      extraOpts.barType = '1';
      if (this.sortUISelected1 === 1) {
        extraOpts.sort = 'Ascending';
      } else if (this.sortUISelected1 === -1) {
        extraOpts.sort = 'Descending';
      }
    } else if (this.sortUISelected2 > 0 && this.sortUISelected2 !== 0) {
      extraOpts = {};
      extraOpts.barType = '2';
      if (this.sortUISelected2 === 1) {
        extraOpts.sort = 'Ascending';
      } else if (this.sortUISelected2 === -1) {
        extraOpts.sort = 'Descending';
      }
    }
    if (this.switchUICmpVal) {
      const totalGDP = this._selectedCountryList.filter(val => val.chartId === chartId)[0].totalGDP;
      if (extraOpts) {
        extraOpts = Object.assign({}, extraOpts, {totalGDP});
      } else {
        extraOpts = {totalGDP};
      }
    }
    const defaultOpts = {type: 'policyList', isNew: !chartExist, chartType: this.switchUICmpVal ? 'relative' : 'absolute' };
    const opts = extraOpts ? Object.assign({}, defaultOpts, extraOpts) : defaultOpts;
    this.chartService.createPolicyListChart(data, chartId, opts);
    // Comparing countries min and max values to change their x coordinates range values 
    // const MAX_SELECTED_COUNTRIES = 2;
    // if (this.chartService.countPolicyListCharts() === MAX_SELECTED_COUNTRIES) {
    //   const chart1 = 'policy-list-1';
    //   const chart2 = 'policy-list-2';
    //   const filterChart1 = this._selectedCountryList.filter(val => {
    //     return val.chartId === chart1;
    //   });
    //   const filterChart2 = this._selectedCountryList.filter(val => {
    //     return val.chartId === chart2;
    //   });
    //   if (filterChart1.length) {
    //     data = this.chartService.getMetricAllPoliciesSingleCountry(filterChart1[0].name);
    //     this.chartService.createPolicyListChart(data, chart1, Object.assign({}, opts, {isNew: false}));
    //   }
    //   if (filterChart2.length) {
    //     data = this.chartService.getMetricAllPoliciesSingleCountry(filterChart2[0].name);
    //     this.chartService.createPolicyListChart(data, chart2, Object.assign({}, opts, {isNew: false}));
    //   }
    // }
  }
  /**
   * This method builds data from Output chart, country input fields and chart default values to be
   * send as params to PDF-generation API endpoint.
   */
  private processForFileJSONData(): any {
    const outputData = this.chartService.getOutputData();
    const chartConf = this.chartService.getChartsConf();
    const firstInput = this.policyModel.firstCountry;
    const secondInput = this.policyModel.secondCountry;
    const data: any = {
      country1: {
        name: '',
        outputs: {},
        scorecard: {}
      },
      country2: {
        name: '',
        outputs: {},
        scorecard: {}
      },
    };
    const countryFInput = this._selectedCountryList.filter(val => {
      return val.name.toLowerCase() === firstInput.toLowerCase();
    });
    const countrySInput = this._selectedCountryList.filter(val => {
      return val.name.toLowerCase() === secondInput.toLowerCase();
    });
    data.country1.name = !firstInput || countryFInput.length === 0 ? 'Global' : firstInput;
    data.country2.name = !secondInput || countrySInput.length === 0 ? 'Global' : secondInput;
    data.country1.gdp = this.firstCountryGDP;
    data.country1.population = this.firstCountryPopulation;
    data.country2.gdp = this.secondCountryGDP;
    data.country2.population = this.secondCountryPopulation;
    jQuery.each(outputData, (key, out) => {
      if (!data.country1.outputs[key]) {
        data.country1.outputs[key] = {};
      }
      if (!data.country2.outputs[key]) {
        data.country2.outputs[key] = {};
      }
      if (key.indexOf('risk') >= 0) {
        if (!data.country1.outputs[key]['value']) {
          data.country1.outputs[key]['value'] = {};
        }
        if (!data.country2.outputs[key]['value']) {
          data.country2.outputs[key]['value'] = {};
        }
        data.country1.outputs[key]['value'].dollarGDP = out.chart['outputs-1'].dollarGDP;
        data.country1.outputs[key]['value'].valueGDP = out.chart['outputs-1'].valueGDP;
        data.country2.outputs[key]['value'].dollarGDP = out.chart['outputs-2'].dollarGDP;
        data.country2.outputs[key]['value'].valueGDP = out.chart['outputs-2'].valueGDP;
      } else {
        data.country1.outputs[key]['value'] = out.chart['outputs-1'];
        data.country2.outputs[key]['value'] = out.chart['outputs-2'];
      }
      data.country1.outputs[key]['label'] = out.descriptor;
      data.country2.outputs[key]['label'] = out.descriptor;

      const chObj = this.chartService.formatSVGChartBase64Strings('outputs', true, key);
      data.country1.outputs[key]['chart'] = chObj.chart1;
      data.country2.outputs[key]['chart'] = chObj.chart2;

    });
    const MAX_SELECTED_COUNTRIES = 2;
    if (this._selectedCountryList.length === MAX_SELECTED_COUNTRIES) {
      const chObj = this.chartService.formatSVGChartBase64Strings('policy-list', false);
      data.country1.scorecard.chart = chObj.chart1;
      data.country2.scorecard.chart = chObj.chart2;
    }
    data.page = 'policyList';
    return data;
  }
  /**
   * Reset UI sort label for the first selected country
   */
  resetUISortLabel1() {
    this.sortUISelectedLbl1 = '';
  }
  /**
   * Reset UI sort label for the second selected country
   */
  resetUISortLabel2() {
    this.sortUISelectedLbl2 = '';
  }
  /**
   * Inits default Scorecard Priority list and Output data to be manipulated and plotted as charts.
   */
  setChartsConf() {
    this.chartService.initOutputChartConf();
    this.getOutputDataSubs = this.chartService.getOutputDataObs().subscribe(data => {
      this.chartService.createOutputChart(data._outputDomains, 'outputs-1', 'GLOBAL', true);
      this.chartService.createOutputChart(data._outputDomains, 'outputs-2', 'GLOBAL', true);
      this.countryUIList = this.chartService.getOutputDataUIList();
      this.countryListComp = this.chartService.getOutputList();
      this.setScorecardChartConf();
    });
  }
  /**
   * Inits default Scorecard Priority list data
   */
  setScorecardChartConf() {
    this.chartService.initScorecardChartConf();
    this.getScorecardDataSubs = this.chartService.getScoreCardDataObs().subscribe(data => {
      this.chartService.setPoliciesData(data);
    });
  }
  /**
   * Subscribes to policy-priority-list observable to check if its observer has any changes
   * to modify in the policy model object.
   */
  setPolicyPriorityObservableConf() {
    this.policySubs = this.policyList$.subscribe(state => {
      if (state) {
        this.policyModel = state;
      }
    });
  }
  // EVENTS
  /**
   * @event Change - This event gets triggered when the displayed charts will change their data from "Absolute" to "Relative" values
   * displayed on their respective charts.
   */
  onChangeChartTypeEvent() {
    this.switchUICmpVal = !this.switchUICmpVal;
    if (this._selectedCountryList.length) {
      if (this._selectedCountryList.length === 2) {
        const dKtotArr = [];
        const dWtotCurrencyArr = [];
        this._selectedCountryList.forEach(val => {
          const name = val.name;
          const data = this.chartService.getMetricAllPoliciesSingleCountry(name);
          const switchVal = this.switchUICmpVal ? 'relative' : 'absolute';
          const chartId = val.chartId;
          jQuery.each(data, (key, poli) => {
            const dKtot =  switchVal === 'relative' ? +poli['rel_num_asset_losses_label'] : +poli['num_asset_losses_label'];
            const dWtot_currency = switchVal === 'relative' ?
              +poli['rel_num_wellbeing_losses_label'] : +poli['num_wellbeing_losses_label'];
            dKtotArr.push({chartId, dKtot});
            dWtotCurrencyArr.push({chartId, dWtot_currency});
          });
        });
        dKtotArr.sort((a, b) => {
          return b.dKtot - a.dKtot;
        });
        dWtotCurrencyArr.sort((a, b) => {
          return b.dWtot_currency - a.dWtot_currency;
        });
        const mergedData = dKtotArr.slice(0, 1).concat(dWtotCurrencyArr.slice(0, 1));
        mergedData.sort((a, b) => {
          return b['dWtot_currency'] - a['dKtot'];
        });
        this._selectedCountryList.forEach(val => {
          if (mergedData[0].chartId === val.chartId) {
            val.order = mergedData[0].hasOwnProperty('dWtot_currency') ? mergedData[0]['dWtot_currency'] : mergedData[0]['dKtot'];
          } else {
            val.order = -10000;
          }
        });
        this._selectedCountryList.sort((a, b) => {
          return (b.order > a.order) ? 1 : (a.order > b.order) ? -1 : 0;
        });
        this._selectedCountryList.forEach(val => {
          const name = val.name;
          const data = this.chartService.getMetricAllPoliciesSingleCountry(name);
          const switchVal = this.switchUICmpVal ? 'relative' : 'absolute';
          const defaultOpts = {type: 'policyList', isNew: false, chartType: this.switchUICmpVal ? 'relative' : 'absolute'};
          this.chartService.createPolicyListChart(data, val.chartId, defaultOpts);
        });
      } else {
        const val = this._selectedCountryList[0];
        const name = val.name;
        const data = this.chartService.getMetricAllPoliciesSingleCountry(name);
        const switchVal = this.switchUICmpVal ? 'relative' : 'absolute';
        const defaultOpts = {type: 'policyList', isNew: false, chartType: this.switchUICmpVal ? 'relative' : 'absolute'};
        this.chartService.createPolicyListChart(data, val.chartId, defaultOpts);
      }
    }
  }
  /**
   * @event Click - This event is fired when the user clicks on the "PDF" button to download a PDF file
   * of the current output-scorecard-priority-list charts and values displayed on the page.
   */
  onDownloadPDFFileEvent() {
    this.chartService.switchScoreCardChartFont(true, true);
    const data = this.processForFileJSONData();
    this.fileService.getScorecardPDFFile(data).subscribe(pdfData => {
      this.chartService.switchScoreCardChartFont(true, false);
      this.fileService.setPDFDownloadProcess(pdfData, 'scorecardPolicyList');
    });
  }
  /**
   * @event Change - This event is called when the first country input field is being modified.
   */
  onFirstCountryInputChangeEvent() {
    this._changeCountryInput(true);
  }
  /**
   * @event Change - This event is called when the second country input field is being modified.
   */
  onSecondCountryInputChangeEvent() {
    this._changeCountryInput(false);
  }
  /**
   * @event Click - This event is fired when the sort buttons (up & down arrows) are clicked on the page.
   * It sorts Scorcard data according of which button has been clicked either sorting by well-being or assets data and
   * displays its chart with sorted data.
   * @param {String} barT - Determines which bar type will be sorted either well-being or assets bar chart data. 
   */
  onSortChartDataEvent(barT) {
    const barType = barT;
    const chartIds = ['policy-list-1', 'policy-list-2'];
    const field1 = this.policyModel.firstCountry;
    const field2 = this.policyModel.secondCountry;
    const selectedList1 = this._selectedCountryList.filter(val => val.name === field1);
    const selectedList2 = this._selectedCountryList.filter(val => val.name === field2);
    const data1 = selectedList1.length ? this.chartService.getMetricAllPoliciesSingleCountry(selectedList1[0].name) : null;
    const data2 = selectedList2.length ? this.chartService.getMetricAllPoliciesSingleCountry(selectedList2[0].name) : null;
    const chartType = this.switchUICmpVal ? 'relative' : 'absolute';
    if (data1 || data2) {
      if (barType === '1' && this.sortUISelected2 >= -1) {
        this.resetUISortLabel2();
        this.sortUISelected2 = 0;
      } else if (barType === '2' && this.sortUISelected1 >= -1) {
        this.resetUISortLabel1();
        this.sortUISelected1 = 0;
      }
      if (barType === '1') {
        this.sortUISelected1++;
      } else if (barType === '2') {
        this.sortUISelected2++;
      }
      const sortSel = barType === '1' ? this.sortUISelected1 : this.sortUISelected2;
      const sortLabel = barType === '1' ? 'sortUISelectedLbl1' : 'sortUISelectedLbl2';
      let sortType;
      if (sortSel === 2) {
        sortType = 'Descending';
        if (data1) {
          this.chartService.createPolicyListChart(data1, chartIds[0], {
            type: 'policyList',
            barType: barType,
            sort: sortType,
            chartType,
            isNew: false
          });
        }
        if (data2) {
          this.chartService.createPolicyListChart(data2, chartIds[1], {
            type: 'policyList',
            barType: barType,
            sort: sortType,
            chartType,
            isNew: false
          });
        }
        this[sortLabel] = sortType;
        if (barType === '1') {
          this.sortUISelected1 = -1;
        } else {
          this.sortUISelected2 = -1;
        }
      } else if (sortSel === 1) {
        sortType = 'Ascending';
        if (data1) {
          this.chartService.createPolicyListChart(data1, chartIds[0], {
            type: 'policyList',
            barType: barType,
            sort: sortType,
            chartType,
            isNew: false
          });
        }
        if (data2) {
          this.chartService.createPolicyListChart(data2, chartIds[1], {
            type: 'policyList',
            barType: barType,
            sort: sortType,
            chartType,
            isNew: false
          });
        }
        this[sortLabel] = sortType;
      } else if (sortSel === 0) {
        sortType = 'NORMAL';
        if (data1) {
          this.chartService.createPolicyListChart(data1, chartIds[0], {
            type: 'policyList',
            barType: barType,
            sort: sortType,
            chartType,
            isNew: false
          });
        }
        if (data2) {
          this.chartService.createPolicyListChart(data2, chartIds[1], {
            type: 'policyList',
            barType: barType,
            sort: sortType,
            chartType,
            isNew: false
          });
        }
        this[sortLabel] = '';
      }
    }
  }
}
