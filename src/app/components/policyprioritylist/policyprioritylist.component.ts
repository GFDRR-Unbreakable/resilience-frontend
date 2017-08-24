import { OnDestroy, Component, OnInit } from '@angular/core';
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
  public getOutputDataSubs: Subscription;
  public getScorecardDataSubs: Subscription;
  public isSetUIGlobal: boolean = true;
  public policyList$: Observable<PolicyPriority>;
  public policySubs: Subscription;
  public policyModel: PolicyPriority = {
    firstCountry: '',
    secondCountry: ''
  };
  public sortUISelectedChart1 = 0;
  public sortUISelectedChart2 = 0;
  public sortUISelectedLblChart11 = '';
  public sortUISelectedLblChart12 = '';
  public sortUISelectedLblChart21 = '';
  public sortUISelectedLblChart22 = '';
  public sortBtnPressedIdCh1 = '';
  public sortBtnPressedIdCh2 = '';
  private _selectedCountryList: Array<any> = [];
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
        }
      }
    }
  }
  plotScorecardPolicyChart(code, chartId, chartExist) {
    const data = this.chartService.getMetricAllPoliciesSingleCountry(code);
    this.chartService.createPolicyListChart(data, chartId, {type: 'policyList', isNew: !chartExist});
  }
  resetUISortLabelsCh1() {
    this.sortUISelectedLblChart11 = '';
    this.sortUISelectedLblChart12 = '';
  }
  resetUISortLabelsCh2() {
    this.sortUISelectedLblChart21 = '';
    this.sortUISelectedLblChart22 = '';
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
  onSortChartDataEvent(barType, chartId, sortLabel) {
    const field = chartId === 'policy-list1' ? this.policyModel.firstCountry : this.policyModel.secondCountry;
    const selectedList = this._selectedCountryList.filter(val => val.name === field);
    const data = selectedList.length ? this.chartService.getMetricAllPoliciesSingleCountry(selectedList[0].code) : null;
    if (data) {
      if (chartId === 'policy-list1' && this.sortBtnPressedIdCh1 !== sortLabel) {
        this.sortUISelectedChart1 = 0;
      } else if (chartId === 'policy-list2' && this.sortBtnPressedIdCh2 !== sortLabel) {
        this.sortUISelectedChart2 = 0;
      }
      if (chartId === 'policy-list1') {
        this.resetUISortLabelsCh1();
        this.sortBtnPressedIdCh1 = sortLabel;
        this.sortUISelectedChart1++;
      } else {
        this.resetUISortLabelsCh2();
        this.sortUISelectedChart2++;
        this.sortBtnPressedIdCh2 = sortLabel;
      }
      const sortSel = chartId === 'policy-list1' ? this.sortUISelectedChart1 : this.sortUISelectedChart2;

      let sortType;
      if (sortSel === 2) {
        sortType = 'DESC';
        this.chartService.createPolicyListChart(data, chartId, {
          type: 'policyList',
          barType: barType,
          sort: sortType,
          isNew: false
        });
        this[sortLabel] = sortType;
        if (chartId === 'policy-list1') {
          this.sortUISelectedChart1 = -1;
        } else if (chartId === 'policy-list2'){
          this.sortUISelectedChart2 = -1;
        }
      } else if (sortSel === 1) {
        sortType = 'ASC';
        this.chartService.createPolicyListChart(data, chartId, {
          type: 'policyList',
          barType: barType,
          sort: sortType,
          isNew: false
        });
        this[sortLabel] = sortType;
      } else if (sortSel === 0) {
        sortType = 'NORMAL';
        this.chartService.createPolicyListChart(data, chartId, {
          type: 'policyList',
          barType: barType,
          sort: sortType,
          isNew: false
        });
        this[sortLabel] = '';
      }
    }
  }
}
