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
  public isSetUIGlobal: boolean = true;
  public policyList$: Observable<PolicyPriority>;
  public policySubs: Subscription;
  public policyModel: PolicyPriority = {
    firstCountry: '',
    secondCountry: ''
  };
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
    this.setOutputChartConf();
  }
  ngOnDestroy() {
    this.policySubs.unsubscribe();
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
  setOutputChartConf() {
    this.chartService.initOutputChartConf();
    this.getOutputDataSubs = this.chartService.getOutputDataObs().subscribe(data => {
      this.chartService.createOutputChart(data._outputDomains, 'outputs-1', 'GLOBAL', true);
      this.chartService.createOutputChart(data._outputDomains, 'outputs-2', 'GLOBAL', true);
      this.countryUIList = this.chartService.getOutputDataUIList();
      this.countryListComp = this.chartService.getOutputList();
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
}
