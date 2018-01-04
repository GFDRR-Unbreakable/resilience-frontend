import { listenToTriggers } from '@ng-bootstrap/ng-bootstrap/util/triggers';
import { search } from '@ngrx/router-store';
import { distinctUntilKeyChanged } from 'rxjs/operator/distinctUntilKeyChanged';
import { distinct } from 'rxjs/operator/distinct';
import { Viewer, ViewerModel } from '../../store/model/viewer.model';
import { ViewerAction } from '../../store/action/viewer.action';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {map} from 'rxjs/operator/map';
import {debounceTime} from 'rxjs/operator/debounceTime';
import {distinctUntilChanged} from 'rxjs/operator/distinctUntilChanged';
import {MapService} from '../../services/map.service';
import {FileService} from '../../services/files.service';
// import {NgbSlideEvent} from '@ng-bootstrap/ng-bootstrap';
import {ChartService} from '../../services/chart.service';
import {Subscription} from 'rxjs/Subscription';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store/default.store';
// import * as enablePassiveEvent from 'default-passive-events/default-passive-events.js';
import {MdSliderChange} from '@angular/material/';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css']
  // changeDetection: ChangeDetectionStrategy.Default
})
export class ViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  /**
   * Public and private properties set to work with the component, these are
   * map conf, chart conf, UI events, observables and viewer models.
   */
  public countryUIList: Array<any> = [];
  public countryListComp: Array<any> = [];
  public countryListIsoCodes: Array<any> = [];
  public getOutputDataSubs: Subscription;
  public global = true;
  public hazards = {
    hazard1: true,
    hazard2: true,
    hazard3: true,
    hazard4: true
  };
  public hoverCountry: string;
  public hoverValue: string;
  public hoverDisplayValue: string;
  public legends: Array<any> = [];
  public mapSlideUISelected = 'well';
  public MAX_COUNTRIES_SELECTED = 2;
  public optionsLabel = {
    well: 'Well-Being Losses (%)',
    asset: 'Asset Losses (%)',
    socio: 'Socio-Economic Capacity (%)',
  };
  public _selectedCountryList: Array<any> = [];
  public sliderValues1Default = {};
  public sliderValues2Default = {};
  public sliderValues1 = {};
  public sliderValues2 = {};
  public viewerDisplay: string = '';
  public viewerModel: Viewer = {
    firstCountry: '',
    secondCountry: ''
  };
  public viewerP1Default: any = {};
  public viewerP2Default: any = {};
  public viewerP1: ViewerModel = {
    name: '',
    macro_gdp_pc_pp: 0,
    macro_pop: 0,
    macro_urbanization_rate: 0,
    macro_prepare_scaleup: 0,
    macro_borrow_abi: 0,
    macro_avg_prod_k: 0,
    macro_T_rebuild_K: 0,
    macro_pi: 0,
    macro_income_elast: 0,
    macro_rho: 0,
    macro_shareable: 0,
    macro_max_increased_spending: 0,
    macro_fa_glofris: 0,
    macro_protection: 0,
    macro_tau_tax: 0,
    n_cat_info__nonpoor: 0,
    n_cat_info__poor: 0,
    c_cat_info__nonpoor: 0,
    c_cat_info__poor: 0,
    axfin_cat_info__nonpoor: 0,
    axfin_cat_info__poor: 0,
    gamma_SP_cat_info__nonpoor: 0,
    gamma_SP_cat_info__poor: 0,
    k_cat_info__nonpoor: 0,
    k_cat_info__poor: 0,
    fa_cat_info__nonpoor: 0,
    fa_cat_info__poor: 0,
    v_cat_info__nonpoor: 0,
    v_cat_info__poor: 0,
    shew_cat_info__nonpoor: 0,
    shew_cat_info__poor: 0,
    shew_for_hazard_ratio: 0,
    hazard_ratio_fa__earthquake: 0,
    hazard_ratio_fa__flood: 0,
    hazard_ratio_fa__surge: 0,
    hazard_ratio_fa__tsunami: 0,
    hazard_ratio_fa__wind: 0,
    hazard_ratio_flood_poor: 0,
    ratio_surge_flood: 0,
    risk: 0,
    resilience: 0,
    risk_to_assets: 0,
    id: '',
    group_name: ''
  };
  public viewerP2: ViewerModel = {
    name: '',
    macro_gdp_pc_pp: 0,
    macro_pop: 0,
    macro_urbanization_rate: 0,
    macro_prepare_scaleup: 0,
    macro_borrow_abi: 0,
    macro_avg_prod_k: 0,
    macro_T_rebuild_K: 0,
    macro_pi: 0,
    macro_income_elast: 0,
    macro_rho: 0,
    macro_shareable: 0,
    macro_max_increased_spending: 0,
    macro_fa_glofris: 0,
    macro_protection: 0,
    macro_tau_tax: 0,
    n_cat_info__nonpoor: 0,
    n_cat_info__poor: 0,
    c_cat_info__nonpoor: 0,
    c_cat_info__poor: 0,
    axfin_cat_info__nonpoor: 0,
    axfin_cat_info__poor: 0,
    gamma_SP_cat_info__nonpoor: 0,
    gamma_SP_cat_info__poor: 0,
    k_cat_info__nonpoor: 0,
    k_cat_info__poor: 0,
    fa_cat_info__nonpoor: 0,
    fa_cat_info__poor: 0,
    v_cat_info__nonpoor: 0,
    v_cat_info__poor: 0,
    shew_cat_info__nonpoor: 0,
    shew_cat_info__poor: 0,
    shew_for_hazard_ratio: 0,
    hazard_ratio_fa__earthquake: 0,
    hazard_ratio_fa__flood: 0,
    hazard_ratio_fa__surge: 0,
    hazard_ratio_fa__tsunami: 0,
    hazard_ratio_fa__wind: 0,
    hazard_ratio_flood_poor: 0,
    ratio_surge_flood: 0,
    risk: 0,
    resilience: 0,
    risk_to_assets: 0,
    id: '',
    group_name: ''
  };
  public viewer$: Observable<Viewer>;
  public viewerModel1$: Observable<ViewerModel>;
  public viewerModel2$: Observable<ViewerModel>;
  public viewerSubs: Subscription;
  public viewerModel1Subs: Subscription;
  public viewerModel2Subs: Subscription;
  private onPassEv = e => { e.preventDefault(); };
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
  public inputTypes = {
    inputSoc: [],
    inputEco: [],
    inputVul: [],
    inputExp: []
  };
  public hazardTypes = {
    hazardFlood: [],
    hazardEarthquake: [],
    hazardTsunami: [],
    hazardWindstorm: []
  };
  public hazardDisplay = {};
  public inputData = {};
  public inputLabels = {};
  /**
   * Component constructor which is first invoked when the app is rendering.
   * Inits accessing stored state-like data from the app root store data.
   * It has three custom injected services: MapService, ChartService and FileService
   * and a Store service from @ngrx library.
   * @param {MapService} mapService - Service which is required to get interaction with a geographic map chart using Mapbox library.
   * @param {ChartService} chartService - Service which is required to create/modify SVG charts using D3.js library.
   * @param {Store<AppStore>} store - Service which is required to create/modify state-like data of the root stored data of the app.
   * @param {FileService} fileService - Service which is required to perform the download CSV or PDF file process through a server.
   */
  constructor(
    private mapService: MapService,
    private chartService: ChartService,
    private store: Store<AppStore>,
    private fileService: FileService) {
      this.viewer$ = store.select('viewer');
      this.viewerModel1$ = store.select('viewerModel1');
      this.viewerModel2$ = store.select('viewerModel2');
    }
  // LIFE-CYCLE METHODS
  /**
   * This method gets called after the component has invoked its constructor.
   * Inits the map chart creation in the app and set its UI events.
   */
  ngOnInit() {
    this.mapService.createMap('map');
    this.setMapConf();
    // this.addElPassiveEvents();
    this.inputTypes.inputSoc = this.chartService.getChartsConf().inputTypes.inputSoc;
    this.inputTypes.inputEco = this.chartService.getChartsConf().inputTypes.inputEco;
    this.inputTypes.inputVul = this.chartService.getChartsConf().inputTypes.inputVul;
    this.inputTypes.inputExp = this.chartService.getChartsConf().inputTypes.inputExp;
    this.inputTypes.inputExp.forEach((inputType) => {
      this.hazardDisplay[inputType] = true;
    });
    this.hazardTypes = this.chartService.getChartsConf().hazardTypes;
  }
  /**
   * This methods gets called when the component gets removed from the UI (normally happens while changing to another page).
   * Unsubscribes all the remaining observables which have been subscribed during UI events through rxjs library.
   */
  ngOnDestroy() {
    this.getOutputDataSubs.unsubscribe();
    this.viewerSubs.unsubscribe();
    this.viewerModel1Subs.unsubscribe();
    this.viewerModel2Subs.unsubscribe();
    this.removeSelectedCountriesOnMap();
    // this.removeElPassiveEvents();
  }
  /**
   * This method gets called when the component has rendered all its view features.
   * Subscribes all the observables used in this component through UI events.
   */
  ngAfterViewInit() {
    this.setViewerObservableConf();
    this.setViewerModel1ObservableConf();
    this.setViewerModel2ObservableConf();
  }
  // METHODS
  /**
   * This method invokes the creation/modification/deletion of a country data in terms of drawing it in the map chart and
   * SVG charts or updating slider data in TechnicalMap view through a country input text field. Also updates the
   * viewer country text field in the root store app data using @ngrx library.
   * @param {Boolean} isFirstInput - Determines if the viewer input text field is from the first or the second one.
   */
  private _changeCountryInput(isFirstInput) {
    const input = isFirstInput ? this.viewerModel.firstCountry : this.viewerModel.secondCountry;
    const fromListFilter = this.countryListComp.filter(
      val => val.name.toLowerCase() === input.toLowerCase());
    const MAX_SELECTED_COUNTRIES = 2;
    if (this._selectedCountryList.length <= MAX_SELECTED_COUNTRIES) {
      if (isFirstInput) {
        this._filterCountryByInput(fromListFilter, 0, this.viewerModel.firstCountry);
      } else {
        this._filterCountryByInput(fromListFilter, 1, this.viewerModel.secondCountry);
      }
      this.store.dispatch({type: ViewerAction.EDIT_VIEWER, payload: this.viewerModel});
    }
  }
  /**
   * This method sends modified values from the slider component and the global modal object
   * to a Python Model endpoint which delivers new data to update Output chart and values
   * @param {String} key - Input indicator name which is used to modify the new slider component data.
   * @param {Boolean} isFirstInput - Checks if the first or second slider component has been modified.
   */
  private _changeSliderValue(key, isFirstInput, key2?, moveBothBrushes?) {
    const sliderObj = isFirstInput ? this.sliderValues1 : this.sliderValues2;
    const inputIdx = isFirstInput ? 0 : 1;
    const viewerMod = isFirstInput ? this.viewerP1 : this.viewerP2;
    const viewerActionStr = isFirstInput ? 'EDIT_VIEWER_MODEL_1' : 'EDIT_VIEWER_MODEL_2';
    const outputChartId = isFirstInput ? 'outputs-1' : 'outputs-2';
    const countryArr = this._selectedCountryList.filter(country => {
      return country.index === inputIdx;
    });
    if (countryArr.length) {
      const globalObj = this.chartService.getGlobalModelData();
      const selectedCtr = globalObj[countryArr[0].code];
      jQuery.each(selectedCtr, (idx, glob) => {
        if (viewerMod[idx] === 0 && glob > viewerMod[idx]) {
          viewerMod[idx] = glob;
        }
      });
      // Apply proper slider values from selected country
      jQuery.each(viewerMod, (viewKey, model) => {
        if (sliderObj.hasOwnProperty(viewKey)) {
          viewerMod[viewKey] = sliderObj[viewKey].value;
        }
      });
      viewerMod[key] = sliderObj[key].value;
      if (key2) {
        viewerMod[key2] = sliderObj[key2].value;
      }
      viewerMod['name'] = countryArr[0].name;
      viewerMod['id'] = countryArr[0].code;
      viewerMod['group_name'] = countryArr[0].group;
      this.chartService.getInputPModelData(viewerMod).subscribe(data => {
        const newObj = {};
        for (const dataK in data) {
          if (data.hasOwnProperty(dataK)) {
            newObj[dataK] = data[dataK][viewerMod['name']];
          }
        }
        this.chartService.updateOutputCharts(outputChartId, {model: newObj}, 'GLOBAL', moveBothBrushes, this.viewerDisplay === 'tech');
      });
      this.store.dispatch({type: ViewerAction[viewerActionStr], payload: viewerMod});
    }
  }
  /**
   * This private method is called by the @private _changeCountryInput method set it in this component
   * which creates/updates/removes selected countries data in a @public array called _selectedCountryList,
   * also modifies input & output chart and values, highlights/unhighlights a selected country on the map chart
   * and sets slider default values from the last selected country in order to be used again when user clicks on the
   * "Reset" button when the "Run Model" view is selected.
   * @param {Array} list - Array of country properties filtered-by-input-text value. 
   * @param {Number} selectedIdx - Determines which input field has been modified
   * @param {String} field - Input-text field model
   */
  private _filterCountryByInput(list, selectedIdx, field) {
    const inData = this.chartService.getInputData();
    const outData = this.chartService.getOutputData();
    const idOut = selectedIdx === 0 ? 'outputs-1' : 'outputs-2';
    const idInSoc = selectedIdx === 0 ? 'inputSoc-1' : 'inputSoc-2';
    const idInEco = selectedIdx === 0 ? 'inputEco-1' : 'inputEco-2';
    const idInVul = selectedIdx === 0 ? 'inputVul-1' : 'inputVul-2';
    const idInExp = selectedIdx === 0 ? 'inputExp-1' : 'inputExp-2';
    const sliderValues = selectedIdx === 0 ? this.sliderValues1 : this.sliderValues2;
    const viewerMod = selectedIdx === 0 ? this.viewerP1 : this.viewerP2;
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
        if (this.global) {
          this.chartService.updateOutputCharts(idOut, list[0].code, null, true, this.viewerDisplay === 'tech');
          this.chartService.updateInputCharts(idInSoc, sliderValues, list[0].code);
          this.chartService.updateInputCharts(idInEco, sliderValues, list[0].code);
          this.chartService.updateInputCharts(idInVul, sliderValues, list[0].code);
          this.chartService.updateInputCharts(idInExp, sliderValues, list[0].code);
        } else {
          this.chartService.createOutputChart(outData, idOut, list[0].group, false, list[0].code);
          this.chartService.createInputCharts(inData, idInSoc, sliderValues, list[0].group);
          this.chartService.createInputCharts(inData, idInEco, sliderValues, list[0].group);
          this.chartService.createInputCharts(inData, idInVul, sliderValues, list[0].group);
          this.chartService.createInputCharts(inData, idInExp, sliderValues, list[0].group);

        }
        this.setResetValues(sliderValues, viewerMod, selectedIdx === 0 ? 1 : 2, list[0].code);
        this.mapService.setMapFilterByISOCode(list[0].code);
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
          this.mapService.setMapFilterByISOCode(filterIndexFromAll[0].code);
          if (this.global) {
            this.chartService.updateOutputCharts(idOut, 'global', null, true, this.viewerDisplay === 'tech');
            this.chartService.updateInputCharts(idInSoc, sliderValues, 'global');
            this.chartService.updateInputCharts(idInEco, sliderValues, 'global');
            this.chartService.updateInputCharts(idInVul, sliderValues, 'global');
            this.chartService.updateInputCharts(idInExp, sliderValues, 'global');
          } else {
            this.chartService.createOutputChart(outData, idOut, 'GLOBAL');
            this.chartService.updateOutputCharts(idOut, 'global', null, true, this.viewerDisplay === 'tech');
            if (!this.global) {
              this.global = !this.global;
            }
            if (selectedIdx === 1 && this.viewerModel.firstCountry) {
              const filterCountryVal1 = this.countryListComp.filter(val =>
                val.name.toLowerCase() === this.viewerModel.firstCountry.toLowerCase());
              if (filterCountryVal1.length) {
                this.chartService.createOutputChart(outData, 'outputs-1', 'GLOBAL');
                this.chartService.updateOutputCharts('outputs-1', filterCountryVal1[0].code, null, true, this.viewerDisplay === 'tech');
              }
            }  else if (selectedIdx === 0 && this.viewerModel.secondCountry) {
              const filterCountryVal2 = this.countryListComp.filter(val =>
                val.name.toLowerCase() === this.viewerModel.secondCountry.toLowerCase());
              if (filterCountryVal2.length) {
                this.chartService.createOutputChart(outData, 'outputs-2', 'GLOBAL');
                this.chartService.updateOutputCharts('outputs-2', filterCountryVal2[0].code, null, true, this.viewerDisplay === 'tech');
              }
            }
            this.chartService.createInputCharts(inData, idInSoc, sliderValues, 'GLOBAL');
            this.chartService.createInputCharts(inData, idInEco, sliderValues, 'GLOBAL');
            this.chartService.createInputCharts(inData, idInVul, sliderValues, 'GLOBAL');
            this.chartService.createInputCharts(inData, idInExp, sliderValues, 'GLOBAL');
          }
          this.setResetValues(sliderValues, viewerMod, selectedIdx === 0 ? 1 : 2, 'GLOBAL');
          this._selectedCountryList.splice(filterIndex[0], 1);
        }
      }
    }
  }
  /**
   * Adds passive UI events in the component.
   */
  addElPassiveEvents() {
    const options: any = {passive: false};
    document.addEventListener('touchstart', this.onPassEv, options);
    document.addEventListener('touchmove', this.onPassEv, options);
    document.addEventListener('wheel', this.onPassEv, options);
    document.addEventListener('wheelmove', this.onPassEv, options);
  }
  /**
   * This method has similar functionality of @private methods called _filterCountryByInput and _changeCountryInput
   * when the input-text value has been modified the difference is the UI event is triggered by a mouse-click event.
   * @param {String} isoCode - Represents the country ISO code. 
   */
  changeCountryInputsByClick(isoCode) {
    const filterISOCode = this.countryListComp.filter(val => val.code === isoCode);
    if (filterISOCode.length > 0) {
      this.mapService.setMapFilterByISOCode(isoCode);
      const filteredName = filterISOCode[0].name;
      const filteredGroup = filterISOCode[0].group;
      const selectedCountryIdx = this._selectedCountryList.map((val, index) => {
        if (val.name.toLowerCase() === filteredName.toLowerCase()) {
          return index;
        }
      }).filter(isFinite);
      const MAX_SELECTED_COUNTRIES = 2;
      const inData = this.chartService.getInputData();
      const outData = this.chartService.getOutputData();
      if (selectedCountryIdx.length === 0) {
        let index = 0;
        if (this._selectedCountryList.length >= MAX_SELECTED_COUNTRIES) {
          this.viewerModel.firstCountry = this.viewerModel.secondCountry;
          this.viewerModel.secondCountry = filteredName;
        }
        const filterCountryVal1 = this.countryListComp.filter(val =>
          val.name.toLowerCase() === this.viewerModel.firstCountry.toLowerCase());
        const filterCountryVal2 = this.countryListComp.filter(val =>
          val.name.toLowerCase() === this.viewerModel.secondCountry.toLowerCase());
        if (!this.viewerModel.firstCountry || filterCountryVal1.length === 0) {
          this.viewerModel.firstCountry = filteredName;
          if (this.global) {
            this.chartService.updateOutputCharts('outputs-1', isoCode, null, true, this.viewerDisplay === 'tech');
            this.chartService.updateInputCharts('inputSoc-1', this.sliderValues1, isoCode);
            this.chartService.updateInputCharts('inputEco-1', this.sliderValues1, isoCode);
            this.chartService.updateInputCharts('inputVul-1', this.sliderValues1, isoCode);
            this.chartService.updateInputCharts('inputExp-1', this.sliderValues1, isoCode);
          } else {
            this.chartService.createOutputChart(outData, 'outputs-1', filteredGroup, false, isoCode);
            this.chartService.createInputCharts(inData, 'inputSoc-1', this.sliderValues1, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputEco-1', this.sliderValues1, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputVul-1', this.sliderValues1, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputExp-1', this.sliderValues1, filteredGroup);
          }
        } else if (!this.viewerModel.secondCountry.trim() || filterCountryVal2.length === 0) {
          index += 1;
          this.viewerModel.secondCountry = filteredName;
          if (this.global) {
            this.chartService.updateOutputCharts('outputs-2', isoCode, null, true, this.viewerDisplay === 'tech');
            this.chartService.updateInputCharts('inputSoc-2', this.sliderValues2, isoCode);
            this.chartService.updateInputCharts('inputEco-2', this.sliderValues2, isoCode);
            this.chartService.updateInputCharts('inputVul-2', this.sliderValues2, isoCode);
            this.chartService.updateInputCharts('inputExp-2', this.sliderValues2, isoCode);
          } else {
            this.chartService.createOutputChart(outData, 'outputs-2', filteredGroup, false, isoCode);
            this.chartService.createInputCharts(inData, 'inputSoc-2', this.sliderValues2, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputEco-2', this.sliderValues2, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputVul-2', this.sliderValues2, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputExp-2', this.sliderValues2, filteredGroup);
          }
        } else {
          index += 1;
          const isoCodeOld = this._selectedCountryList[1].code;
          this._selectedCountryList[1].index = 0;
        }
        let isThirdCountry = false;
        if (this._selectedCountryList.length >= MAX_SELECTED_COUNTRIES) {
          this._selectedCountryList.shift();
          isThirdCountry = true;
        }
        this._selectedCountryList.push({
          index: index,
          name: filteredName,
          code: isoCode,
          group: filteredGroup
        });
        if (isThirdCountry) {
          const isoCodeOld = this._selectedCountryList[0].code;
          if (this.global) {
            this.chartService.updateInputCharts('inputSoc-1', this.sliderValues1, isoCodeOld);
            this.chartService.updateInputCharts('inputEco-1', this.sliderValues1, isoCodeOld);
            this.chartService.updateInputCharts('inputVul-1', this.sliderValues1, isoCodeOld);
            this.chartService.updateInputCharts('inputExp-1', this.sliderValues1, isoCodeOld);
            this.chartService.updateOutputCharts('outputs-1', isoCodeOld, null, true, this.viewerDisplay === 'tech');
            this.chartService.updateInputCharts('inputSoc-2', this.sliderValues2, isoCode);
            this.chartService.updateInputCharts('inputEco-2', this.sliderValues2, isoCode);
            this.chartService.updateInputCharts('inputVul-2', this.sliderValues2, isoCode);
            this.chartService.updateInputCharts('inputExp-2', this.sliderValues2, isoCode);
            this.chartService.updateOutputCharts('outputs-2', isoCode, null, true, this.viewerDisplay === 'tech');
          } else {
            this.chartService.createOutputChart(outData, 'outputs-1', filteredGroup, false, isoCodeOld);
            this.chartService.createInputCharts(inData, 'inputSoc-1', this.sliderValues1, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputEco-1', this.sliderValues1, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputVul-1', this.sliderValues1, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputExp-1', this.sliderValues1, filteredGroup);
            this.chartService.createOutputChart(outData, 'outputs-2', filteredGroup, false, isoCode);
            this.chartService.createInputCharts(inData, 'inputSoc-2', this.sliderValues2, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputEco-2', this.sliderValues2, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputVul-2', this.sliderValues2, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputExp-2', this.sliderValues2, filteredGroup);
          }
          this.setResetValues(this.sliderValues1, this.viewerP1, 1, this._selectedCountryList[0].code);
          this.setResetValues(this.sliderValues2, this.viewerP2, 2, this._selectedCountryList[1].code);
        } else {
          const sliderV = index === 0 ? this.sliderValues1 : this.sliderValues2;
          const viewerP = index === 0 ? this.viewerP1 : this.viewerP2;
          const viewerType = index === 0 ? 1 : 2;
          this.setResetValues(sliderV, viewerP, viewerType, isoCode);
          this.onResetTechDataEvent();
        }
      } else {
        const selectedC = this._selectedCountryList[selectedCountryIdx[0]].name;
        if (this.viewerModel.firstCountry.length && selectedC.indexOf(this.viewerModel.firstCountry) >= 0) {
          this.viewerModel.firstCountry = '';
          if (this.global) {
            this.chartService.updateOutputCharts('outputs-1', 'global', null, true, this.viewerDisplay === 'tech');
            this.chartService.updateInputCharts('inputExp-1', this.sliderValues1, 'global');
            this.chartService.updateInputCharts('inputSoc-1', this.sliderValues1, 'global');
            this.chartService.updateInputCharts('inputEco-1', this.sliderValues1, 'global');
            this.chartService.updateInputCharts('inputVul-1', this.sliderValues1, 'global');
          } else {
            this.chartService.createOutputChart(outData, 'outputs-1', 'GLOBAL');
            this.chartService.updateOutputCharts('outputs-1', 'global', null, true, this.viewerDisplay === 'tech');
            if (!this.global) {
              this.global = !this.global;
            }
            if (this.viewerModel.secondCountry) {
              const filterCountryVal2 = this.countryListComp.filter(val =>
                val.name.toLowerCase() === this.viewerModel.secondCountry.toLowerCase())[0];
              this.chartService.createOutputChart(outData, 'outputs-2', 'GLOBAL');
              this.chartService.updateOutputCharts('outputs-2', filterCountryVal2.code, null, true, this.viewerDisplay === 'tech');
            }
            this.chartService.createInputCharts(inData, 'inputSoc-1', this.sliderValues1, 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputEco-1', this.sliderValues1, 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputVul-1', this.sliderValues1, 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputExp-1', this.sliderValues1, 'GLOBAL');
          }
          this.setResetValues(this.sliderValues1, this.viewerP1, 1, 'GLOBAL');
        } else if (this.viewerModel.secondCountry.length && selectedC.indexOf(this.viewerModel.secondCountry) >= 0) {
          this.viewerModel.secondCountry = '';
          if (this.global) {
            this.chartService.updateOutputCharts('outputs-2', 'global', null, true, this.viewerDisplay === 'tech');
            this.chartService.updateInputCharts('inputExp-2', this.sliderValues2, 'global');
            this.chartService.updateInputCharts('inputSoc-2', this.sliderValues2, 'global');
            this.chartService.updateInputCharts('inputEco-2', this.sliderValues2, 'global');
            this.chartService.updateInputCharts('inputVul-2', this.sliderValues2, 'global');
          } else {
            this.chartService.createOutputChart(outData, 'outputs-2', 'GLOBAL');
            this.chartService.updateOutputCharts('outputs-2', 'global', null, true, this.viewerDisplay === 'tech');
            if (!this.global) {
              this.global = !this.global;
            }
            if (this.viewerModel.firstCountry) {
              const filterCountryVal1 = this.countryListComp.filter(val =>
                val.name.toLowerCase() === this.viewerModel.firstCountry.toLowerCase())[0];
              this.chartService.createOutputChart(outData, 'outputs-1', 'GLOBAL');
              this.chartService.updateOutputCharts('outputs-1', filterCountryVal1.code, null, true, this.viewerDisplay === 'tech');
            }
            this.chartService.createInputCharts(inData, 'inputSoc-2', this.sliderValues2, 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputEco-2', this.sliderValues2, 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputVul-2', this.sliderValues2, 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputExp-2', this.sliderValues2, 'GLOBAL');
          }
          this.setResetValues(this.sliderValues2, this.viewerP2, 2, 'GLOBAL');
        }
        this._selectedCountryList.splice(selectedCountryIdx[0], 1);
        this.onResetTechDataEvent();
      }
      this.store.dispatch({type: ViewerAction.EDIT_VIEWER, payload: this.viewerModel});
    }
  }
  /**
   * Retrieves output-model and input-model data from the ChartService by then plot their output/input charts,
   * build slider default values and highlight/unhighlight indicator-layer a country on the map chart.
   */
  getChartOutputData() {
    this.chartService.initOutputChartConf();
    this.getOutputDataSubs = this.chartService.getOutputDataObs().subscribe(data => {
      this.chartService.setInputData(data._globalModelData).then((inputData) => {
        this.inputData = inputData;
        this.inputLabels = this.chartService.getInputLabels();
        this.chartService.createInputCharts(inputData, 'inputSoc-1', this.sliderValues1);
        this.chartService.createInputCharts(inputData, 'inputSoc-2', this.sliderValues2);
        this.chartService.createInputCharts(inputData, 'inputEco-1', this.sliderValues1);
        this.chartService.createInputCharts(inputData, 'inputEco-2', this.sliderValues2);
        this.chartService.createInputCharts(inputData, 'inputVul-1', this.sliderValues1);
        this.chartService.createInputCharts(inputData, 'inputVul-2', this.sliderValues2);
        this.chartService.createInputCharts(inputData, 'inputExp-1', this.sliderValues1);
        this.chartService.createInputCharts(inputData, 'inputExp-2', this.sliderValues2);
        this.setSliderConfValues(inputData);
      });
      this.chartService.createOutputChart(data._outputDomains, 'outputs-1');
      this.chartService.createOutputChart(data._outputDomains, 'outputs-2');
      this.countryUIList = this.chartService.getOutputDataUIList();
      this.countryListComp = this.chartService.getOutputList();
      this.countryListIsoCodes = this.countryListComp.map(val => val.code);
      this.mapService.setMapFilterByISOCodes(this.countryListIsoCodes);
    }, err => {
      console.log(err);
    });
  }
  /**
   * This method builds data from Output & Input, country input fields and chart default values to be
   * send as params to CSV or PDF-generation API endpoint.
   * @param {Boolean} isPDF - Verifies the reques data has to be generated for a PDF or CSV file.
   */
  private processForFileJSONData(isPDF?: boolean): any {
    const outputData = this.chartService.getOutputData();
    const chartConf = this.chartService.getChartsConf();
    const inputData = this.chartService.getInputData();
    const inputTypes = chartConf.inputTypes;
    const firstInput = this.viewerModel.firstCountry;
    const secondInput = this.viewerModel.secondCountry;
    const data: any = {
      country1: {
        name: '',
        outputs: {},
        inputs: {}
      },
      country2: {
        name: '',
        outputs: {},
        inputs: {}
      },
      selectedHazards: {
        hazard1: this.hazards.hazard1,
        hazard2: this.hazards.hazard2,
        hazard3: this.hazards.hazard3,
        hazard4: this.hazards.hazard4
      }
    };
    if (isPDF) {
      data.map = {
        chart: document.querySelector('canvas').toDataURL(),
        type: this.mapSlideUISelected
      };
    }
    data.page = this.viewerDisplay === 'viewer' ? 'viewer' : 'tech';
    const countryFInput = this._selectedCountryList.filter(val => {
      return val.name.toLowerCase() === firstInput.toLowerCase();
    });
    const countrySInput = this._selectedCountryList.filter(val => {
      return val.name.toLowerCase() === secondInput.toLowerCase();
    });
    data.country1.name = !firstInput || countryFInput.length === 0 ? 'Global' : firstInput;
    data.country2.name = !secondInput || countrySInput.length === 0 ? 'Global' : secondInput;
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
        data.country1.outputs[key]['value'].difference = out.chart['outputs-1'].difference;
        data.country1.outputs[key]['value'].newValue = out.chart['outputs-1'].newValue;
        data.country1.outputs[key]['value'].today = out.chart['outputs-1'].today;
        data.country2.outputs[key]['value'].dollarGDP = out.chart['outputs-2'].dollarGDP;
        data.country2.outputs[key]['value'].valueGDP = out.chart['outputs-2'].valueGDP;
        data.country2.outputs[key]['value'].difference = out.chart['outputs-2'].difference;
        data.country2.outputs[key]['value'].newValue = out.chart['outputs-2'].newValue;
        data.country2.outputs[key]['value'].today = out.chart['outputs-2'].today;
      } else {
        data.country1.outputs[key]['value'] = out.chart['outputs-1'];
        data.country2.outputs[key]['value'] = out.chart['outputs-2'];
      }
      data.country1.outputs[key]['label'] = out.descriptor;
      data.country2.outputs[key]['label'] = out.descriptor;
      if (isPDF) {
        const chObj = this.chartService.formatSVGChartBase64Strings('outputs', true, key);
        data.country1.outputs[key]['chart'] = chObj.chart1;
        data.country2.outputs[key]['chart'] = chObj.chart2;
      }
    });
    jQuery.each(inputTypes, (key, inputT) => {
      if (!data.country1.inputs[key]) {
        data.country1.inputs[key] = {};
      }
      if (!data.country2.inputs[key]) {
        data.country2.inputs[key] = {};
      }
      inputT.forEach(inpKey => {
        const label = inputData.filter(val => {
          return val.key === inpKey;
        })[0].descriptor;
        if (!data.country1.inputs[key][inpKey]) {
          data.country1.inputs[key][inpKey] = {};
        }
        if (!data.country2.inputs[key][inpKey]) {
          data.country2.inputs[key][inpKey] = {};
        }
        data.country1.inputs[key][inpKey]['label'] = label;
        data.country2.inputs[key][inpKey]['label'] = label;

        data.country1.inputs[key][inpKey]['value'] = {
          label: this.sliderValues1[inpKey + '_display_value'],
          value: this.sliderValues1[inpKey].value
        };
        data.country2.inputs[key][inpKey]['value'] = {
          label: this.sliderValues2[inpKey + '_display_value'],
          value: this.sliderValues2[inpKey].value
        };

        if (isPDF) {
          if (data.page === 'viewer') {
            const chObj = this.chartService.formatSVGChartBase64Strings(key, true, inpKey);
            data.country1.inputs[key][inpKey]['chart'] = chObj.chart1;
            data.country2.inputs[key][inpKey]['chart'] = chObj.chart2;
          } else {
            data.country1.inputs[key][inpKey]['min'] = this.sliderValues1[inpKey]['min'];
            data.country1.inputs[key][inpKey]['max'] = this.sliderValues1[inpKey]['max'];
            data.country2.inputs[key][inpKey]['min'] = this.sliderValues2[inpKey]['min'];
            data.country2.inputs[key][inpKey]['max'] = this.sliderValues2[inpKey]['max'];
          }
        }
      });
    });
    data['global'] = this.global ? 'Global' : 'Regional';
    return data;
  }
  /**
   * Removes passive UI events in this component.
   */
  private removeElPassiveEvents() {
    const options: any = {passive: false};
    document.removeEventListener('touchstart', this.onPassEv, options);
    document.removeEventListener('touchmove', this.onPassEv, options);
    document.removeEventListener('wheel', this.onPassEv, options);
    document.removeEventListener('wheelmove', this.onPassEv, options);
  }
  /**
   * Unhighlights selected countries on the map chart by using the @public array property _selectedCountryList.
   */
  removeSelectedCountriesOnMap() {
    const selCountriesArr = this._selectedCountryList;
    if (selCountriesArr.length) {
      selCountriesArr.forEach(country => {
        this.mapService.setMapFilterByISOCode(country.code);
      });
    }
  }
  /**
   * Sets default map configuration to be used when user has interaction with the map chart.
   * The default configuration set in this method are adding a base map layer, listen "click" and "mouseover" 
   * UIevent on the map.
   */
  setMapConf() {
    const self = this;
    this.mapService.addStylesOnMapLoading(() => {
      this.mapService.addBasemap();
      this.legends = this.mapService.getMapLegendConf('well');
      this.mapService.setMapFilterByISOCodes(this.countryListIsoCodes);
      this.getChartOutputData();
      this.mapService.setClickFnMapEvent((ev) => {
        const features = self.mapService.getMap().queryRenderedFeatures(ev.point, {layers: [self.mapService.getViewerFillLayer()]});
        if (features.length) {
          const isoCode = features[0].properties['ISO_Codes'];
          const isoCodeList = this.countryListIsoCodes.filter(val => val === isoCode);
          if (isoCodeList.length) {
            self.changeCountryInputsByClick(isoCode);
          }
        }
      });
      this.mapService.setHoverFnMapEvent((ev) => {
        const features = self.mapService.getMap().queryRenderedFeatures(ev.point, {layers: [self.mapService.getViewerFillLayer()]});
        if (features.length) {
          const isoCode = features[0].properties['ISO_Codes'];
          const names = features[0].properties['Names'];
          let value = '';
          if (this.mapSlideUISelected == 'asset') {
            value = features[0].properties['1_Assets'];
          } else if (this.mapSlideUISelected == 'socio') {
            value = features[0].properties['2_SocEcon'];
          } else if (this.mapSlideUISelected == 'well') {
            value = features[0].properties['3_WeBeing'];
          }
          this.hoverCountry = names;
          this.hoverValue = (parseFloat(value) * 100).toFixed(2);
          if (this.mapSlideUISelected === 'well' || this.mapSlideUISelected === 'asset') {
            const globalModelObj = this.chartService.getGlobalModelData();
            let model = globalModelObj[isoCode];
            let avg = Math.round((+model['macro_gdp_pc_pp']) * (+model['macro_pop']));
            const results = this.chartService.calculateRiskGDPValues(avg, this.hoverValue, true);
            this.hoverDisplayValue = results.text;
          } else {
            const percent = ' %';
            this.hoverDisplayValue = this.hoverValue + percent;
          }
        } else {
          this.hoverCountry = null;
          this.hoverValue = null;
          this.hoverDisplayValue = null;
        }
      });
    });
  }
  /**
   * Resets to default slider values whether a country has been selected or not.
   * @param {Object} sliderObj - Slider model values
   * @param {Object} viewerMod - Viewer model values
   * @param {Number} viewerType - Verifies if the first or second set of slider values have been modified
   * @param {String} isoCode - Country ISO code or 'Global' string. 
   */
  setResetValues(sliderObj, viewerMod, viewerType, isoCode) {
    const globalObj = this.chartService.getGlobalModelData();
    if (isoCode !== 'GLOBAL') {
      const filterCountry = this._selectedCountryList.filter(val => val.code === isoCode);
      const countryName = filterCountry[0].name;
      const groupName = filterCountry[0].group;
      const selectedCtr = globalObj[isoCode];
      jQuery.each(selectedCtr, (idx, glob) => {
        if (viewerMod[idx] === 0 && glob > viewerMod[idx]) {
          viewerMod[idx] = glob;
        }
      });
      jQuery.each(viewerMod, (viewKey, model) => {
        if (sliderObj.hasOwnProperty(viewKey)) {
          viewerMod[viewKey] = sliderObj[viewKey].value;
        }
      });
      viewerMod['name'] = countryName;
      viewerMod['id'] = isoCode;
      viewerMod['group_name'] = groupName;
    } else {
      jQuery.each(viewerMod, (viewKey, model) => {
        if (sliderObj.hasOwnProperty(viewKey)) {
          viewerMod[viewKey] = 0;
        }
      });
      viewerMod['name'] = 'GLOBAL';
      viewerMod['id'] = 'GLOBAL';
      viewerMod['group_name'] = 'GLOBAL';
    }
    const viewerPropDefault = viewerType === 1 ? 'viewerP1Default' : 'viewerP2Default';
    const sliderPropDefault = viewerType === 1 ? 'sliderValues1Default' : 'sliderValues2Default';
    this[viewerPropDefault] = Object.assign({}, viewerMod);
    this[sliderPropDefault] = Object.assign({}, sliderObj);
  }
  /**
   * Sets slider detailed values.
   * @param {Object} sliderObj - Slider model.
   * @param {String} key - Input indicator model name.
   * @param {Number} max - Max slider value
   * @param {Number} min - Min slider value
   * @param {Object} input - Input indicator model object.
   */
  setSingleSliderConfValue(sliderObj, key, max, min, input) {
    sliderObj[key + '_min'] = 0;
    /*if (key.indexOf('hazard') === 0 || key === 'macro_T_rebuild_K') {
      sliderObj[key + '_min'] = 1;
    }*/
    sliderObj[key + '_max'] = 100;
    sliderObj[key + '_step'] = 1;
    if (sliderObj[key + '_display_value'] != null) {
      // sliderObj[key + '_value'] = sliderObj[key + '_display_value'] / (max + min) * 100;
      sliderObj[key + '_value'] = 0;
      sliderObj[key + '_display_value'] =
        this.chartService.formatInputChartValues(0, input);
      // sliderObj[key + '_display_value'] =
        // this.chartService.formatInputChartValues(sliderObj[key + '_display_value'], input);
      sliderObj[key + '_original_value'] =
        parseFloat(sliderObj[key + '_display_value'].replace('$', '').replace(',', ''));
      sliderObj[key + '_baseline_value'] = sliderObj[key + '_display_value'];
      sliderObj[key + '_default_value'] = 0;
      sliderObj[key + '_difference_value'] = this.chartService.formatInputChartDifference(0, input);
    } else {
      // sliderObj[key + '_value'] = 50;
      sliderObj[key + '_value'] = 0;
      // sliderObj[key + '_original_value'] = 50;
      sliderObj[key + '_original_value'] = 0;
      sliderObj[key + '_display_value'] =
        this.chartService.formatInputChartValues(0, input);
      // sliderObj[key + '_display_value'] =
        // this.chartService.formatInputChartValues((max + min) / 2, input);
      sliderObj[key + '_baseline_value'] = sliderObj[key + '_display_value'];
      sliderObj[key + '_default_value'] = 0;
      sliderObj[key + '_difference_value'] = this.chartService.formatInputChartDifference(0, input);
    }
  }
  /**
   * Sets default slider values when input data has been requested.
   * @param {Object} inputData - Input-indicator model object.
   */
  setSliderConfValues(inputData) {
    for (const inputDataIndex in inputData) {
      if (inputData.hasOwnProperty(inputDataIndex)) {
        const key = inputData[inputDataIndex].key;
        let min = inputData[inputDataIndex].distribGroupArr[0].distribution;
        let max = inputData[inputDataIndex].distribGroupArr[0].distribution;
        for (let index = 1; index < inputData[inputDataIndex].distribGroupArr.length; index++) {
          const valueInput = inputData[inputDataIndex].distribGroupArr[index].distribution;
          if (valueInput > max) {
            max = valueInput;
          }
          if (valueInput < min) {
            min = valueInput;
          }
        }
        if (min === max) {
          min--;
          max++;
        }
        switch (key) {
          case 'gamma_SP_cat_info__poor':
          case 'macro_tau_tax':
          case 'macro_borrow_abi':
          case 'macro_prepare_scaleup':
          case 'axfin_cat_info__poor':
          case 'axfin_cat_info__nonpoor':
          case 'v_cat_info__poor':
          case 'v_cat_info__nonpoor':
          case 'shew_for_hazard_ratio':
            min = 0;
            max = 1;
            break;
          default: break;
        }
        this.setSingleSliderConfValue(this.sliderValues1, key, max, min, inputData[inputDataIndex]);
        this.setSingleSliderConfValue(this.sliderValues2, key, max, min, inputData[inputDataIndex]);
        this.viewerP1[key] =
          (key === 'macro_T_rebuild_K' || key === 'k_cat_info__poor' || key === 'k_cat_info__nonpoor' || key === 'c_cat_info__poor' || key === 'c_cat_info__nonpoor') ?
            this.sliderValues1[key + '_original_value'] : this.sliderValues1[key + '_original_value'] / 100;
        this.sliderValues1[key + '_default_value'] = this.viewerP1[key];
        this.viewerP2[key] =
          (key === 'macro_T_rebuild_K' || key === 'k_cat_info__poor' || key === 'k_cat_info__nonpoor' || key === 'c_cat_info__poor' || key === 'c_cat_info__nonpoor') ?
            this.sliderValues2[key + '_original_value'] : this.sliderValues2[key + '_original_value'] / 100;
        this.sliderValues2[key + '_default_value'] = this.viewerP2[key];
        this.sliderValues1[key] = {
          min: min,
          max: max,
          // value: this.sliderValues1[key + '_value']
          value: 0
        };
        this.sliderValues2[key] = {
          min: min,
          max: max,
          // value: this.sliderValues2[key + '_value']
          value: 0
        };
      }
    }
    this.sliderValues1['c_cat_info__poor'].min = this.sliderValues1['c_cat_info__nonpoor'].min;
    this.sliderValues1['c_cat_info__poor'].max = this.sliderValues1['c_cat_info__nonpoor'].max;
    this.sliderValues2['c_cat_info__poor'].min = this.sliderValues2['c_cat_info__nonpoor'].min;
    this.sliderValues2['c_cat_info__poor'].max = this.sliderValues2['c_cat_info__nonpoor'].max;
    this.viewerP1Default = Object.assign({}, this.viewerP1);
    this.viewerP2Default = Object.assign({}, this.viewerP2);
    this.sliderValues1Default = Object.assign({}, this.sliderValues1);
    this.sliderValues2Default = Object.assign({}, this.sliderValues2);
  }
  /**
   * Subscribes to viewer model observable and checks any changes its observer has to be set in its
   * corresponding viewer model object which has the country input-text values.
   */
  setViewerObservableConf() {
    this.viewerSubs = this.viewer$.subscribe(state => {
      if (state) {
        this.viewerModel = state;
      }
    });
  }
  /**
   * Subscribes to first input-viewer model observable and checks any changes its observer has to be set in its
   * corresponding viewer model object.
   */
  setViewerModel1ObservableConf() {
    this.viewerModel1Subs = this.viewerModel1$.subscribe(state => {
      if (state) {
        this.viewerP1 = state;
      }
    });
  }
  /**
   * Subscribes to second input-viewer model observable and checks any changes its observer has to be set in its
   * corresponding viewer model object.
   */
  setViewerModel2ObservableConf() {
    this.viewerModel2Subs = this.viewerModel2$.subscribe(state => {
      if (state) {
        this.viewerP2 = state;
      }
    });
  }
  // EVENTS
  /**
   * @event Click - This event is called when a map indicator-layer is changed to another one
   * and displays a new layer placed on this map.
   * @param {String} mapId - Map id which represents the map-layer the map chart has to change 
   */
  onChangeMapLayerEvent(mapId) {
    this.mapSlideUISelected = mapId;
    const layerPaintProp = 'fill-color';
    this.mapService.changeLayerStyle({
      property: layerPaintProp,
      type: mapId
    });
    const currentLegend = this.mapService.getMapPaintConf(mapId);
    this.legends = this.mapService.getMapLegendConf(mapId);
  }
  /**
   * @event Click - This event is called when the "View Indicator" or "Run Model" button is clicked
   * and automatically the page scrolls to UI-input data configuration or to the top of the page.
   * @param {String} viewType - Sets the view type wheter is to either view indicator or run model or
   * no one of them is selected. 
   */
  onChangeViewerIndViewEvent(viewType) {
    const bodyEl = jQuery('html, body');
    if (!this.viewerDisplay || this.viewerDisplay !== viewType) {
      this.viewerDisplay = viewType;
      const el = jQuery('div#viewIndCtn')[0];
      const body = jQuery('body')[0];
      const bodyDimension = body.getBoundingClientRect();
      const elDimension = el.getBoundingClientRect();
      let scrollMeasure;
      if (elDimension.y > bodyDimension.y) {
        scrollMeasure = elDimension.y - bodyDimension.y;
      }
      bodyEl.animate({
        scrollTop: (scrollMeasure - 10)
      }, 1000);
    } else if (this.viewerDisplay === viewType) {
      this.viewerDisplay = '';
      bodyEl.animate({
        scrollTop: 0
      }, 1000);
    }
    this.chartService.type1S = this.viewerDisplay;
    this.chartService.updateContents(this.viewerModel.firstCountry, this.viewerModel.secondCountry);
    this._selectedCountryList.forEach(country => {
      const chartIndex = country.index === 0 ? '1' : '2';
      this.chartService.updateOutputCharts(`outputs-${chartIndex}`, country.code, null, true, this.viewerDisplay === 'tech');
      this.onResetTechDataEvent();
    });
  return false;
  }
  /**
   * @event Click - This event is triggered when user selects on the dropdown to display output/inputs
   * charts as Global when the charts are displayed as Regional and the "Run model" is triggered.
   */
  onDisplayTechMapViewEvent() {
    if (!this.global) {
      this.global = !this.global;
      const outData = this.chartService.getOutputData();
      this._selectedCountryList.forEach(country => {
        const chartIndex = country.index === 0 ? '1' : '2';
        this.chartService.createOutputChart(outData, `outputs-${chartIndex}`, 'GLOBAL', false, country.code);
        this.chartService.updateOutputCharts(`outputs-${chartIndex}`, country.code, null, true, this.viewerDisplay === 'tech');
      });
    }
  }
  /**
   * @event Click - This event is fired when the user clicks on the "CSV" button to download a CSV file
   * of the current input-output values displayed on the page.
   */
  onDownloadCSVViewerReportEvent() {
    const data = this.processForFileJSONData();
    this.fileService.getViewerCSVFile(data).subscribe(csvData => {
      const blob = new Blob(['\ufeff', csvData]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fileName = (this.viewerDisplay === 'viewer' ? 'viewer' : 'technicalMap') + '_report.csv';
      a.setAttribute('href', url);
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    });
  }
  /**
   * @event Click - This event is triggered when the user click on the "PDF" button to download a PDF file
   * of the current input-output charts and values displayed on the page.
   */
  onDownloadPDFViewerReportEvent() {
    const data = this.processForFileJSONData(true);
    this.fileService.getViewerPDFFile(data).subscribe(pdfData => {
      this.fileService.setPDFDownloadProcess(pdfData, this.viewerDisplay);
    });
  }
  /**
   * @event Change - This event is called when the first country input field is being modified.
   */
  onFirstCountryInputChangeEvent() {
    this._changeCountryInput(true);
  }
  /**
   * @event Click - This event is called when the "Reset" button is clicked in order to reset default
   * slider values according to selected countries or not.
   */
  onResetTechDataEvent() {
    // Reset values
    this.hazards.hazard1 = true;
    this.hazards.hazard2 = true;
    this.hazards.hazard3 = true;
    this.hazards.hazard4 = true;
    this.onSwitchExposure(false, false, false, false);
    this.viewerP1 = Object.assign({}, this.viewerP1Default);
    this.viewerP2 = Object.assign({}, this.viewerP2Default);
    this.sliderValues1 = Object.assign({}, this.sliderValues1Default);
    this.sliderValues2 = Object.assign({}, this.sliderValues2Default);
    // Update states
    this.store.dispatch({type: ViewerAction.EDIT_VIEWER, payload: this.viewerModel});
    this.store.dispatch({type: ViewerAction.EDIT_VIEWER_MODEL_1, payload: this.viewerP1});
    this.store.dispatch({type: ViewerAction.EDIT_VIEWER_MODEL_2, payload: this.viewerP2});
    if (this._selectedCountryList.length) {
      this._selectedCountryList.forEach(val => {
        const viewerMod = val.index === 0 ? this.viewerP1 : this.viewerP2;
        const outputChartId = val.index === 0 ? 'outputs-1' : 'outputs-2';
        this.chartService.getInputPModelData(viewerMod).subscribe(data => {
          const newObj = {};
          for (const dataK in data) {
            if (data.hasOwnProperty(dataK)) {
              newObj[dataK] = data[dataK][viewerMod['name']];
            }
          }
          this.chartService.updateOutputCharts(outputChartId, {model: newObj}, 'GLOBAL', true, this.viewerDisplay === 'tech');
        });
      });
    } else {
      this.viewerModel.firstCountry = '';
      this.viewerModel.secondCountry = '';
    // Update charts
      this.chartService.updateOutputCharts('outputs-1', 'global', null, true, this.viewerDisplay === 'tech');
      this.chartService.updateOutputCharts('outputs-2', 'global', null, true, this.viewerDisplay === 'tech');
    // Update map data
      if (this._selectedCountryList.length) {
        this._selectedCountryList.forEach(val => {
          this.mapService.setMapFilterByISOCode(val.code);
        });
        this._selectedCountryList = [];
      }
    }
    // Update charts
    // this.chartService.updateOutputCharts('outputs-1', 'global');
    // this.chartService.updateOutputCharts('outputs-2', 'global');
    // Update map data
    // if (this._selectedCountryList.length) {
      // this._selectedCountryList.forEach(val => {
      //   this.mapService.setMapFilterByISOCode(val.code);
      // });
      // this._selectedCountryList = [];
    // }
  }
  /**
   * @event Change - This event is called when the second country input field is being modified.
   */
  onSecondCountryInputChangeEvent() {
    this._changeCountryInput(false);
  }
  /**
   * @event Click - This event is triggered when user selects on the dropdown to display output/inputs
   * charts as Global or Regional
   */
  onSwitchGlobal() {
    if (this._selectedCountryList.length === this.MAX_COUNTRIES_SELECTED) {
      this.global = !this.global;
      const inData = this.chartService.getInputData();
      const outData = this.chartService.getOutputData();
      this._selectedCountryList.forEach(country => {
        const group = this.global ? 'GLOBAL' : country.group;
        if (country.index === 0) {
          this.chartService.createOutputChart(outData, 'outputs-1', group, false, country.code);
          this.chartService.createInputCharts(inData, 'inputSoc-1', this.sliderValues1, group);
          this.chartService.createInputCharts(inData, 'inputEco-1', this.sliderValues1, group);
          this.chartService.createInputCharts(inData, 'inputVul-1', this.sliderValues1, group);
          this.chartService.createInputCharts(inData, 'inputExp-1', this.sliderValues1, group);
          this.chartService.updateInputCharts('inputExp-1', this.sliderValues1, country.code);
          this.chartService.updateInputCharts('inputSoc-1', this.sliderValues1, country.code);
          this.chartService.updateInputCharts('inputEco-1', this.sliderValues1, country.code);
          this.chartService.updateInputCharts('inputVul-1', this.sliderValues1, country.code);
          this.chartService.updateOutputCharts('outputs-1', country.code, null, true, this.viewerDisplay === 'tech');
        }
        if (country.index === 1) {
          this.chartService.createOutputChart(outData, 'outputs-2', group, false, country.code);
          this.chartService.createInputCharts(inData, 'inputSoc-2', this.sliderValues2, group);
          this.chartService.createInputCharts(inData, 'inputEco-2', this.sliderValues2, group);
          this.chartService.createInputCharts(inData, 'inputVul-2', this.sliderValues2, group);
          this.chartService.createInputCharts(inData, 'inputExp-2', this.sliderValues2, group);
          this.chartService.updateInputCharts('inputExp-2', this.sliderValues2, country.code);
          this.chartService.updateInputCharts('inputSoc-2', this.sliderValues2, country.code);
          this.chartService.updateInputCharts('inputEco-2', this.sliderValues2, country.code);
          this.chartService.updateInputCharts('inputVul-2', this.sliderValues2, country.code);
          this.chartService.updateOutputCharts('outputs-2', country.code, null, true, this.viewerDisplay === 'tech');
        }
      });
    }
  }
  setValueExposure(selected: boolean, key: string, key2?: string) {
    if (selected) {
      this.sliderValues1[key + '_value'] = this.sliderValues1Default[key + '_value'];
      this.sliderValues2[key + '_value'] = this.sliderValues2Default[key + '_value'];
    } else {
      this.sliderValues1[key + '_value'] = 0;
      this.sliderValues2[key + '_value'] = 0;
    }
    this.onSliderChangeEvent(this.sliderValues1, key);
    this.onSliderChangeEvent(this.sliderValues2, key);
    if (key2) {
      if (selected) {
        this.sliderValues1[key2 + '_value'] = this.sliderValues1Default[key2 + '_value'];
        this.sliderValues2[key2 + '_value'] = this.sliderValues2Default[key2 + '_value'];
      } else {
        this.sliderValues1[key2 + '_value'] = 0;
        this.sliderValues2[key2 + '_value'] = 0;
      }
      this.onSliderChangeEvent(this.sliderValues1, key2);
      this.onSliderChangeEvent(this.sliderValues2, key2);
      this._changeSliderValue(key, true, key2, true);
      this._changeSliderValue(key, false, key2, true);
    } else {
      this._changeSliderValue(key, true, true);
      this._changeSliderValue(key, false, true);
    }
  }
  onSwitchExposure(flood: boolean, earthquake: boolean, tsunami: boolean, windstorm: boolean) {
    let floodKey1 = null;
    let floodKey2 = null;
    this.hazardTypes.hazardFlood.forEach((hazardType) => {
      this.hazardDisplay[hazardType] = this.hazards.hazard1;
      if (flood) {
        if (floodKey1 == null) {
          floodKey1 = hazardType;
        } else if (floodKey2 == null) {
          floodKey2 = hazardType;
        }
      }
    });
    if (floodKey1 != null && floodKey2 != null) {
      this.setValueExposure(this.hazards.hazard1, floodKey1, floodKey2);
    }
    this.hazardTypes.hazardEarthquake.forEach((hazardType) => {
      this.hazardDisplay[hazardType] = this.hazards.hazard2;
      if (earthquake) {
        this.setValueExposure(this.hazards.hazard2, hazardType);
      }
    });
    this.hazardTypes.hazardTsunami.forEach((hazardType) => {
      this.hazardDisplay[hazardType] = this.hazards.hazard3;
      if (tsunami) {
        this.setValueExposure(this.hazards.hazard3, hazardType);
      }
    });
    this.hazardTypes.hazardWindstorm.forEach((hazardType) => {
      this.hazardDisplay[hazardType] = this.hazards.hazard4;
      if (windstorm) {
        this.setValueExposure(this.hazards.hazard4, hazardType);
      }
    });
  }
  /**
   * @event Click - This event is triggered when the first hazard button is selected/deselected on the "Run model" view
   */
  onSwitchExposure1() {
    this.hazards.hazard1 = !this.hazards.hazard1;
    this.onSwitchExposure(true, false, false ,false);
  }
  /**
   * @event Click - This event is triggered when the second hazard button is selected/deselected on the "Run model" view
   */
  onSwitchExposure2() {
    this.hazards.hazard2 = !this.hazards.hazard2;
    this.onSwitchExposure(false, true, false, false);
  }
  /**
   * @event Click - This event is triggered when the third hazard button is selected/deselected on the "Run model" view
   */
  onSwitchExposure3() {
    this.hazards.hazard3 = !this.hazards.hazard3;
    this.onSwitchExposure(false, false, true, false);
  }
  /**
   * @event Click - This event is triggered when the fourth hazard button is selected/deselected on the "Run model" view
   */
  onSwitchExposure4() {
    this.hazards.hazard4 = !this.hazards.hazard4;
    this.onSwitchExposure(false, false, false, true);
  }
  /**
   * This method works as a helper of the @event onSliderChangeEvent1 or @event onSliderChangeEvent1 
   * which modifies values of the selected slider.
   * @param {Object} sliderValues - Slider model object.
   * @param {String} key - Input-indicator model name.
   */
  onSliderChangeEvent(sliderValues, key) {
    const inputObj = this.chartService.getInputData();
    const input = inputObj.filter(val => val.key === key)[0];
    const newValue = (sliderValues[key].max + sliderValues[key].min) / 100 * sliderValues[key + '_value'];
    sliderValues[key + '_display_value'] = this.chartService.formatInputChartValues(newValue, input);
    sliderValues[key + '_original_value'] =
      parseFloat(('' + sliderValues[key + '_display_value']).replace('$', '').replace(',', ''));
    sliderValues[key + '_difference_value'] = this.chartService.formatInputChartDifference(newValue - sliderValues[key + '_default_value'], input);
    sliderValues[key].value = newValue;
  }
  /**
   * @event Change - This event is triggered when a slider component of the first country set of sliders has changed of value
   * @param {String} key - Input-indicator model name.
   */
  onSliderChangeEvent1(key) {
    this.onSliderChangeEvent(this.sliderValues1, key);
    this._changeSliderValue(key, true);
  }
  /**
   * @event Change - This event is triggered when a slider component of the second country set of sliders has changed of value
   * @param {String} key - Input-indicator model name.
   */
  onSliderChangeEvent2(key) {
    this.onSliderChangeEvent(this.sliderValues2, key);
    this._changeSliderValue(key, false);
  }
  onSliderInputEvent1(event: MdSliderChange, key) {
    this.sliderValues1[key + '_value'] = event.value;
    this.onSliderChangeEvent(this.sliderValues1, key);
  }
  onSliderInputEvent2(event: MdSliderChange, key) {
    this.sliderValues2[key + '_value'] = event.value;
    this.onSliderChangeEvent(this.sliderValues2, key);
  }
}
