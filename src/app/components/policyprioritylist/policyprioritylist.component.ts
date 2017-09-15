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


@Component({
  selector: 'app-policyprioritylist',
  templateUrl: './policyprioritylist.component.html',
  styleUrls: ['./policyprioritylist.component.css']
})
export class PolicyprioritylistComponent implements OnInit, OnDestroy {
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
  private _selectedCountryList: Array<any> = [];
  public sortBtnPressedIdCh1 = '';
  public sortBtnPressedIdCh2 = '';
  public sortUISelected1 = 0;
  public sortUISelected2 = 0;
  public sortUISelectedLbl1 = '';
  public sortUISelectedLbl2 = '';

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
  constructor(
    private store: Store<AppStore>,
    private chartService: ChartService) {
      this.policyList$ = store.select('policyPriority');
  }

  ngOnInit() {
    this.setPolicyPriorityObservableConf();
    this.setChartsConf();
  }
  ngOnDestroy() {
    this.policySubs.unsubscribe();
    this.getOutputDataSubs.unsubscribe();
    this.getScorecardDataSubs.unsubscribe();
  }
  // METHODS
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
  private _filterCountryByInput(list, selectedIdx, field) {
    const inData = this.chartService.getInputData();
    const outData = this.chartService.getOutputData();
    const idOut = selectedIdx === 0 ? 'outputs-1' : 'outputs-2';
    const idScList = selectedIdx === 0 ? 'policy-list1' : 'policy-list2';
    if (list.length) {
      const filterExistence = this._selectedCountryList.filter(val => {
        return val.name === list[0].name;
      });
      if (!filterExistence.length) {
        this._selectedCountryList.push({
          index: selectedIdx,
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
        const aBillion = 1000000000;
        const aMillion = 1000000;
        const aThousand = 1000;
        let extraBInfo = '';
        let extraMInfo = '';
        if (totalGDP >= aBillion) {
          totalGDP = Math.round(totalGDP / aBillion);
          if (totalGDP >= aThousand) {
            totalGDP = totalGDP / aThousand;
            if (totalGDP % aThousand === 0) {
              totalGDP += '.000';
            }
            totalGDP = totalGDP.toString().split('.').join(',');
            totalGDP = totalGDP.split(',')[1].length === 2 ? totalGDP + '0' : totalGDP;
          }
          extraBInfo = 'Billion';
        }
        if (countryPopulation >= aMillion) {
          countryPopulation = Math.round(countryPopulation / aMillion);
          if (countryPopulation >= aThousand) {
            countryPopulation = countryPopulation / aThousand;
            if (countryPopulation % aThousand === 0) {
              countryPopulation += '.000';
            }
            countryPopulation = countryPopulation.toString().split('.').join(',');
            countryPopulation = countryPopulation.split(',')[1].length === 2 ? countryPopulation + '0' : countryPopulation;
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
        this.plotScorecardPolicyChart(list[0].code, idScList, chartChild.length > 0);
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
  plotScorecardPolicyChart(code, chartId, chartExist) {
    const data = this.chartService.getMetricAllPoliciesSingleCountry(code);
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
    const defaultOpts = {type: 'policyList', isNew: !chartExist };
    const opts = extraOpts ? Object.assign({}, defaultOpts, extraOpts) : defaultOpts;
    this.chartService.createPolicyListChart(data, chartId, opts);
  }
  resetUISortLabel1() {
    this.sortUISelectedLbl1 = '';
  }
  resetUISortLabel2() {
    this.sortUISelectedLbl2 = '';
  }
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
  setScorecardChartConf() {
    this.chartService.initScorecardChartConf();
    this.getScorecardDataSubs = this.chartService.getScoreCardDataObs().subscribe(data => {
      data = JSON.parse(data);
      this.chartService.setPoliciesData(data);
    });
  }
  setPolicyPriorityObservableConf() {
    this.policySubs = this.policyList$.subscribe(state => {
      if (state) {
        this.policyModel = state;
      }
    });
  }
  // EVENTS
  onFirstCountryInputChangeEvent() {
    this._changeCountryInput(true);
  }
  onSecondCountryInputChangeEvent() {
    this._changeCountryInput(false);
  }
  onSortChartDataEvent(params: any) {
    const {barType} = params;
    const chartIds = params.charts;
    const field1 = this.policyModel.firstCountry;
    const field2 = this.policyModel.secondCountry;
    const selectedList1 = this._selectedCountryList.filter(val => val.name === field1);
    const selectedList2 = this._selectedCountryList.filter(val => val.name === field2);
    const data1 = selectedList1.length ? this.chartService.getMetricAllPoliciesSingleCountry(selectedList1[0].code) : null;
    const data2 = selectedList2.length ? this.chartService.getMetricAllPoliciesSingleCountry(selectedList2[0].code) : null;
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
            isNew: false
          });
        }
        if (data2) {
          this.chartService.createPolicyListChart(data2, chartIds[1], {
            type: 'policyList',
            barType: barType,
            sort: sortType,
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
            isNew: false
          });
        }
        if (data2) {
          this.chartService.createPolicyListChart(data2, chartIds[1], {
            type: 'policyList',
            barType: barType,
            sort: sortType,
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
            isNew: false
          });
        }
        if (data2) {
          this.chartService.createPolicyListChart(data2, chartIds[1], {
            type: 'policyList',
            barType: barType,
            sort: sortType,
            isNew: false
          });
        }
        this[sortLabel] = '';
      }
    }
  }
}
