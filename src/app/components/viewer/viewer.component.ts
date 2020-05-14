import {ActivatedRoute} from '@angular/router';
import {Viewer, ViewerGroup, ViewerModel} from '../../store/model/viewer.model';
import {ViewerAction} from '../../store/action/viewer.action';
import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operator/map';
import {debounceTime} from 'rxjs/operator/debounceTime';
import {distinctUntilChanged} from 'rxjs/operator/distinctUntilChanged';
import numeral from 'numeral';
import {MapService} from '../../services/map.service';
import {FileService} from '../../services/files.service';
import {ChartService} from '../../services/chart.service';
import {Subscription} from 'rxjs/Subscription';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store/default.store';
import {MdSliderChange} from '@angular/material/';
import {PrintComponent} from '../print/print.component';
import {NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";


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
  public mapComponentOpen = true;
  public hazards = {
    hazard1: true,
    hazard2: true,
    hazard3: true,
    hazard4: true
  };
  public url;
  public chartConf = {};
  public hoverCountry: string;
  public hoverValue: string;
  public hoverDisplayValue: string;
  public legends: Array<any> = [];
  public mapSlideUISelected = 'well';
  public MAX_COUNTRIES_SELECTED = 2;
  public optionsLabel = {
    well: 'Risk to Well-Being (% of GDP)',
    asset: 'Risk to Assets (% of GDP)',
    socio: 'Socioeconomic Resilience',
  };
  public _selectedCountryList: Array<any> = [{
    index: 0,
    name: "Malawi",
    code: "MWI",
    group: "Sub-Saharan Africa"
  }];
  public sliderValues1Default = {};
  public sliderValues2Default = {};
  public sliderValues1 = {};
  public sliderValues2 = {};
  public viewerDisplay: string = 'countrytool';
  public viewerModel: Viewer = {
    firstCountry: 'Malawi',
    secondCountry: ''
  };
  public viewerGroupModel: ViewerGroup = {
    firstCountryGroup: 'Sub-Saharan Africa',
    secondCountryGroup: ''
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
  private onPassEv = e => {
    e.preventDefault();
  };
  private globalModelDataHash: any = {};

  @ViewChild('instance') instance: NgbTypeahead;

  @ViewChild('print') print: PrintComponent;

  public onFocus = (e: Event) => {
    e.stopPropagation();
    setTimeout(() => {
      const inputEvent: Event = new Event('input');
      e.target.dispatchEvent(inputEvent);
    }, 0);
  }

  /**
   * Returns a list of matches as a result of a searched string when first or second input-text is being modified.
   */
  public searchCountryFn = (text$: Observable<string>) => {
    const debounceTimeFn = debounceTime.call(text$, 200);
    // const distinctUntilChangedFn = distinctUntilChanged.call(debounceTimeFn);
    const searchCb = term => {
      if (!term.length) {
        return this.countryUIList.slice(0, 10);
      } else {
        return this.countryUIList.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) === 0).slice(0, 10);
      }
    };
    return map.call(debounceTimeFn, searchCb);
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

  public gaugeData = {
    'risk_to_assets': [],
    'resilience': [],
    'risk': [],
  };
  public gaugeChangeData = {
    'risk_to_assets': null,
    'resilience': null,
    'risk': null,
  }

  selectedCountry = 'MWI';
  selectedCountryName = 'Malawi';

  inputGaugeData: any = {};
  countryData: ViewerModel[] = [];
  outputRegionData = {
    'gdp_pc': '$755',
    'pop': '16.3m' //hardcoding initial malawi stats because I don't know how to get the inital state
  };

  switchValue = 'focus';
  switchOptions = ['focus', 'all'];
  switchLabels = ['Focus', 'All'];

  switchPolicyValue = 'absolute';
  switchPolicyOptions = ['absolute', 'relative'];
  switchPolicyLabels = ['Absolute', 'Relative'];

  //these variables are being declared to stop the build lint errors,
  //do not delete them
  searchFailed: any;

  showPolicy = false;

  calloutTitle = 'Advanced tool';
  calloutBody = 'Use the advanced tool to explore the drivers of resilience, and to estimate the benefits of custom interventions. Create your own scenario by manipulating the sliders and see how these shifts contribute to resilience in your country.';

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
    private fileService: FileService,
    private router: ActivatedRoute) {

    this.viewer$ = store.select('countrytool');
    this.viewerModel1$ = store.select('viewerModel1');
    this.viewerModel2$ = store.select('viewerModel2');
    router.url.subscribe((url) => {
      this.url = url;
      this.viewerDisplay = url[0].path;
    });
  }

  // LIFE-CYCLE METHODS
  /**
   * This method gets called after the component has invoked its constructor.
   * Inits the map chart creation in the app and set its UI events.
   */
  ngOnInit() {
    // console.log('ngOnInit')
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

    this.chartConf = this.chartService.getChartsConf();

    this.hazardTypes = this.chartService.getChartsConf().hazardTypes;
    // this.calloutTitle = this.setCalloutTitle();
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
    const fromListFilter = this.countryListComp.filter(
      val => val.name.toLowerCase() === this.viewerModel.firstCountry.toLowerCase());
    if (this._selectedCountryList.length <= 2) {

      this._filterCountryByInput(fromListFilter, 0, this.viewerModel.firstCountry);

      this.store.dispatch({type: ViewerAction.EDIT_VIEWER, payload: this.viewerModel});
    }

    // if (this.url[0].path === 'countrytool') {
    // Set selected country for gagues.

    if (fromListFilter.length) {
      this.selectedCountryName = fromListFilter[0].name;
      this.selectedCountry = fromListFilter[0].code;
      this.outputRegionData = {
        gdp_pc: numeral(this.countryData[this.selectedCountry].macro_gdp_pc_pp).format('$0,0'),
        pop: numeral(this.countryData[this.selectedCountry].macro_pop).format('0.0a')
      };
    }
    // }

    // @TODO: Find cleaner way to trigger model run.
    if (fromListFilter.length > 0) {
      // this.onChangeViewerIndViewEvent();
      this.onResetTechDataEvent();
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
        const group = this.global ? 'GLOBAL' : viewerMod['group_name'];

        this.setGaugeChangeValues(newObj);
        this.chartService.updateOutputCharts(outputChartId, {model: newObj}, group, moveBothBrushes, this.viewerDisplay === 'tech');
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
    if (list.length >= 1) {
      if (!selectedIdx) {
        this.viewerGroupModel.firstCountryGroup = list[0].group;
      } else {
        this.viewerGroupModel.secondCountryGroup = list[0].group;
      }
    } else {
      if (!selectedIdx) {
        this.viewerGroupModel.firstCountryGroup = '';
      } else {
        this.viewerGroupModel.secondCountryGroup = '';
      }
    }
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
          this.chartService.updateOutputCharts(idOut, list[0].code, null, true, this.viewerDisplay === 'advancedtool');
          this.chartService.updateInputCharts(idInSoc, sliderValues, list[0].code);
          this.chartService.updateInputCharts(idInEco, sliderValues, list[0].code);
          this.chartService.updateInputCharts(idInVul, sliderValues, list[0].code);
          this.chartService.updateInputCharts(idInExp, sliderValues, list[0].code);
        } else {

          this.createMapPageOutputChartTable(outData, idOut, list[0].group, list[0].code);
          this.chartService.createInputCharts(inData, idInSoc, sliderValues, list[0].group);
          this.chartService.createInputCharts(inData, idInEco, sliderValues, list[0].group);
          this.chartService.createInputCharts(inData, idInVul, sliderValues, list[0].group);
          this.chartService.createInputCharts(inData, idInExp, sliderValues, list[0].group);
        }

        this.clearGaugeChangeValues();
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
            this.chartService.updateOutputCharts(idOut, 'global', null, true, this.viewerDisplay === 'advancedtool');
            this.chartService.updateInputCharts(idInSoc, sliderValues, 'global');
            this.chartService.updateInputCharts(idInEco, sliderValues, 'global');
            this.chartService.updateInputCharts(idInVul, sliderValues, 'global');
            this.chartService.updateInputCharts(idInExp, sliderValues, 'global');
          } else {
            this.createMapPageOutputChartTable(outData, idOut, 'GLOBAL');
            this.chartService.updateOutputCharts(idOut, 'global', null, true, this.viewerDisplay === 'tech');
            if (!this.global) {
              this.global = !this.global;
            }
            if (selectedIdx === 1 && this.viewerModel.firstCountry) {
              const filterCountryVal1 = this.countryListComp.filter(val =>
                val.name.toLowerCase() === this.viewerModel.firstCountry.toLowerCase());
              if (filterCountryVal1.length) {
                this.createMapPageOutputChartTable(outData, 'outputs-1', 'GLOBAL');
                this.chartService.updateOutputCharts('outputs-1', filterCountryVal1[0].code, null, true, this.viewerDisplay === 'tech');
              }
            } else if (selectedIdx === 0 && this.viewerModel.secondCountry) {
              const filterCountryVal2 = this.countryListComp.filter(val =>
                val.name.toLowerCase() === this.viewerModel.secondCountry.toLowerCase());
              if (filterCountryVal2.length) {
                this.createMapPageOutputChartTable(outData, 'outputs-2', 'GLOBAL');
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
   * Retrieves output-model and input-model data from the ChartService by then
   * plot their output/input charts, build slider default values and
   * highlight/unhighlight indicator-layer a country on the map chart.
   */
  getChartOutputData() {
    this.chartService.initOutputChartConf();
    this.getOutputDataSubs = this.chartService.getOutputDataObs().subscribe(data => {
      this.chartService.setInputData(data._globalModelData).then((inputData) => {
        this.inputData = inputData;
        this.inputLabels = this.chartService.getInputLabels();
        this.createInputCharts(1, inputData, this.sliderValues1);
        this.createInputCharts(2, inputData, this.sliderValues2);
        this.setSliderConfValues(inputData);

        this.initCountrySliderConfValues();

        this.setResetValues(this.sliderValues1, this.viewerP1, 1, this._selectedCountryList[0].code);
      });

      // Used to look up country data on hover.
      this.globalModelDataHash = data._globalModelData;

      this.createMapPageOutputChartTable(data._outputDomains, 'outputs-1', undefined, undefined, '## getChartOutputData ##', data);
      this.populateScatterGauges(data, 'outputs-1');
      this.createMapPageOutputChartTable(data._outputDomains, 'outputs-2');
      this.countryUIList = this.chartService.getOutputDataUIList();
      this.countryListComp = this.chartService.getOutputList();
      this.countryListIsoCodes = this.countryListComp.map(val => val.code);
      this.mapService.setMapFilterByISOCodes(this.countryListIsoCodes);

      // this.onFirstCountryInputChangeEvent();
      // this.onSwitchExposure(false, false, false, false)
    }, err => {
      console.log(err);
    });
  }

  initCountrySliderConfValues() {
    ['inputSoc-1', 'inputEco-1', 'inputVul-1', 'inputExp-1'].forEach(id => {
      this.chartService.updateInputCharts(id, this.sliderValues1, this.selectedCountry);
    });
  }

  createMapPageOutputChartTable(data: any, containerId: string, groupName: any = undefined, isoCode: any = undefined, origin: string = 'No origin', allData?: any): any {
    // console.log('createMapPageOutputChartTable', data, allData);

    this.chartService.createSingleOutputChart(data.risk_to_assets, 'risk_to_assets', 'output-risk_to_assets_1', groupName, isoCode);

    this.chartService.createSingleOutputChart(data.resilience, 'resilience', 'output-resilience_1', groupName, isoCode);
    this.chartService.createSingleOutputChart(data.risk, 'risk', 'output-risk_1', groupName, isoCode);


    this.chartService.createSingleOutputChart(data.risk_to_assets, 'risk_to_assets', 'output-risk_to_assets_2', groupName, isoCode);
    this.chartService.createSingleOutputChart(data.risk, 'risk', 'output-risk_2', groupName, isoCode);
    this.chartService.createSingleOutputChart(data.resilience, 'resilience', 'output-resilience_2', groupName, isoCode);

    // this.chartService.createOutputChart(data, containerId, groupName, false, isoCode);
  }

  populateScatterGauges(allData: any, containerId: string) {
    this.countryData = allData._globalModelData;
    ['risk_to_assets', 'resilience', 'risk'].reduce((acc, key) => {
      const rows = Object.keys(this.countryData).map(id => {
        return {id, value: this.countryData[id][key]};
      });
      const avgRow = {
        id: 'AVG',
        value: rows.reduce((a, r) => a + r.value, 0) / rows.length
      };
      acc[key] = [...rows, avgRow];
      return acc;
    }, this.gaugeData);

    this.inputGaugeData = ['inputSoc', 'inputEco', 'inputVul', 'inputExp']
      .reduce((acc, input) => {
        const keys = this.chartService.getInputIdChartByType(input);
        acc[input] = keys.reduce((acc2, key) => {
          return this.mapGaugeRows(acc2, key, this.countryData);
        }, {} as any)
        return acc;
      }, {} as any);
  }

  setGaugeChangeValues(changeObj) {
    ['risk_to_assets', 'resilience', 'risk'].reduce((acc, key) => {
      acc[key] = {value: changeObj[key], id: changeObj.id};
      return acc;
    }, this.gaugeChangeData);
  }

  clearGaugeChangeValues() {
    this.gaugeChangeData = {risk_to_assets: null, resilience: null, risk: null};
  }

  private mapGaugeRows(acc, key, countryData) {
    const rows = Object.keys(countryData).map(id => {
      return {id, value: countryData[id][key]};
    });
    const avgRow = {
      id: 'AVG',
      value: rows.reduce((a, r) => a + r.value, 0) / rows.length
    };
    acc[key] = [...rows, avgRow];
    return acc;
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

  //sets the callout title based on the route params
  /*setCalloutTitle() {
    if (this.url[0].path === 'countrytool') {
      return 'Country page label';
    } else if (this.url[0].path === 'advancedtool') {
      return 'Analytical tool label';
    } else if (this.url[0].path === 'policytool') {
      return 'Policy page label';
    } else {
      return 'Callout title undefined';
    }
  }*/

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

      this.mapService.setHoverFnMapEvent((ev) => {
        const features = self.mapService.getMap()
          .queryRenderedFeatures(ev.point, {layers: [self.mapService.getViewerFillLayer()]});
        if (features.length) {
          const isoCode = features[0].properties['ISO_Code'];
          const names = features[0].properties['Name'];
          const countryData = this.globalModelDataHash[isoCode];

          const value = this.mapSlideUISelected == 'asset' ? countryData.risk_to_assets
            : this.mapSlideUISelected == 'socio' ? countryData.resilience
              : this.mapSlideUISelected == 'well' ? countryData.risk : 0;

          this.hoverCountry = names;
          this.hoverValue = (parseFloat(value) * 100).toFixed(2);
          if (this.mapSlideUISelected === 'well' || this.mapSlideUISelected === 'asset') {
            const globalModelObj = this.chartService.getGlobalModelData();
            let model = globalModelObj[isoCode];
            if (model == null) {
              this.hoverDisplayValue = `${this.hoverValue} %`;
            } else {
              let avg = Math.round((+model['macro_gdp_pc_pp']) * (+model['macro_pop']));
              const results = this.chartService.calculateRiskGDPValues(avg, this.hoverValue, true);
              this.hoverDisplayValue = results.text;
            }
          } else {
            this.hoverDisplayValue = `${this.hoverValue} %`;
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

      // Currently this resets viewerMod everytime and causes api post to fail.
      // Need to appropriatly find to populate sliderObj so this resets.
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
          default:
            break;
        }
        this.setSingleSliderConfValue(this.sliderValues1, key, max, min, inputData[inputDataIndex]);
        // this.setSingleSliderConfValue(this.sliderValues2, key, max, min, inputData[inputDataIndex]);
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
  onChangeViewerIndViewEvent(showPolicy = false) {
    this.showPolicy = showPolicy;
    return false;
  }

  /**
   * @event Change - This event is called when the first country input field is
   * being modified.
   */
  onFirstCountryInputChangeEvent() {
    this._changeCountryInput(true);
  }

  /**
   * @event Click - This event is called when the "Reset" button is clicked in
   * order to reset default slider values according to selected countries or not.
   */
  onResetTechDataEvent(keepHazards?: boolean) {
    // Reset values
    if (!keepHazards) {
      this.hazards.hazard1 = true;
      this.hazards.hazard2 = true;
      this.hazards.hazard3 = true;
      this.hazards.hazard4 = true;
      this.onSwitchExposure(false, false, false, false);
    }

    this.viewerP1 = Object.assign({}, this.viewerP1Default);
    this.viewerP2 = Object.assign({}, this.viewerP2Default);
    this.sliderValues1 = Object.assign({}, this.sliderValues1Default);
    this.sliderValues2 = Object.assign({}, this.sliderValues2Default);
    // Update states
    this.store.dispatch({type: ViewerAction.EDIT_VIEWER, payload: this.viewerModel});
    this.store.dispatch({type: ViewerAction.EDIT_VIEWER_MODEL_1, payload: this.viewerP1});
    this.store.dispatch({type: ViewerAction.EDIT_VIEWER_MODEL_2, payload: this.viewerP2});
    if (!this._selectedCountryList.length) {
      this.viewerModel.firstCountry = '';
      this.viewerGroupModel.firstCountryGroup = '';
      this.viewerModel.secondCountry = '';
      this.viewerGroupModel.secondCountryGroup = '';
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

    // TODO - figure out how to clear gauge change values
    setTimeout(() => this.clearGaugeChangeValues(), 750)
  }

  onSwitchExposure(flood: boolean, earthquake: boolean, tsunami: boolean, windstorm: boolean) {

    const group1 = this.global ? 'GLOBAL'
      : (this._selectedCountryList.length > 0
        ? this._selectedCountryList[0].group : 'GLOBAL');

    let viewerHazardDefault1 = Object.assign({}, this.viewerP1Default);
    let viewerHazardDefault2 = Object.assign({}, this.viewerP2Default);
    if (!this.hazards.hazard1) {
      this.hazardTypes.hazardFlood.forEach((hazardType) => {
        viewerHazardDefault1[hazardType] = 0;
        viewerHazardDefault2[hazardType] = 0;
      });
    }
    if (!this.hazards.hazard2) {
      this.hazardTypes.hazardEarthquake.forEach((hazardType) => {
        viewerHazardDefault1[hazardType] = 0;
        viewerHazardDefault2[hazardType] = 0;
      });
    }
    if (!this.hazards.hazard3) {
      this.hazardTypes.hazardTsunami.forEach((hazardType) => {
        viewerHazardDefault1[hazardType] = 0;
        viewerHazardDefault2[hazardType] = 0;
      });
    }
    if (!this.hazards.hazard4) {
      this.hazardTypes.hazardWindstorm.forEach((hazardType) => {
        viewerHazardDefault1[hazardType] = 0;
        viewerHazardDefault2[hazardType] = 0;
      });
    }
    viewerHazardDefault1['name'] = this._selectedCountryList[0].name;
    viewerHazardDefault1['id'] = this._selectedCountryList[0].code;
    viewerHazardDefault1['group_name'] = this._selectedCountryList[0].group;
    this.chartService.getInputPModelData(viewerHazardDefault1).subscribe(data => {
      const newObj = {};
      for (const dataK in data) {
        if (data.hasOwnProperty(dataK)) {
          newObj[dataK] = data[dataK][viewerHazardDefault1['name']];
        }
      }
      this.setGaugeChangeValues(newObj);
      this.chartService.updateOutputCharts('outputs-1', {model: newObj}, group1, true, this.viewerDisplay === 'tech');
    });
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

  onSliderInputEventAlt({value, key}) {
    this.sliderValues1[key + '_value'] = value;
    this.onSliderChangeEvent(this.sliderValues1, key);
  }

  private createInputCharts(suffix, data, sliderVal, filteredGroup = undefined) {
    const inputChartKeys = ['inputSoc', 'inputEco', 'inputVul', 'inputExp'];
    inputChartKeys.forEach(key => {
      this.chartService.createInputCharts(data, `${key}-${suffix}`, sliderVal, filteredGroup);
    });
  }

  public toggleMapComponent() {
    this.mapComponentOpen = !this.mapComponentOpen;
  }
}
