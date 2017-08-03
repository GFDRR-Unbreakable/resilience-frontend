import { listenToTriggers } from '@ng-bootstrap/ng-bootstrap/util/triggers';
import { search } from '@ngrx/router-store';
import { distinctUntilKeyChanged } from 'rxjs/operator/distinctUntilKeyChanged';
import { distinct } from 'rxjs/operator/distinct';
import { Viewer } from '../../store/model/viewer.model';
import { ViewerAction } from '../../store/action/viewer.action';
import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {map} from 'rxjs/operator/map';
import {debounceTime} from 'rxjs/operator/debounceTime';
import {distinctUntilChanged} from 'rxjs/operator/distinctUntilChanged';
import {MapService} from '../../services/map.service';
// import {NgbSlideEvent} from '@ng-bootstrap/ng-bootstrap';
import {ChartService} from '../../services/chart.service';
import {Subscription} from 'rxjs/Subscription';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store/default.store';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css']
  // changeDetection: ChangeDetectionStrategy.Default
})
export class ViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  public getOutputDataSubs: Subscription;
  public countryUIList: Array<any> = [];
  public countryListComp: Array<any> = [];
  public countryListIsoCodes: Array<any> = [];
  private _selectedCountryList: Array<any> = [];
  public viewerModel: Viewer = {
    firstCountry: '',
    secondCountry: ''
  };
  public hazards = {
    hazard1: true,
    hazard2: true,
    hazard3: true,
    hazard4: true
  };
  public sliderValues1 = {};
  public sliderValues2 = {};
  public viewerDisplay: boolean = true;
  public global = true;
  public legends: Array<any> = [];
  public viewer$: Observable<Viewer>;
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
    private mapService: MapService,
    private chartService: ChartService,
    private store: Store<AppStore>) {
      this.viewer$ = store.select('viewer');
    }
  // LIFE-CYCLE METHODS
  ngOnInit() {
    this.mapService.createMap('map');
    this.getChartOutputData();
  }
  ngOnDestroy() {
    this.getOutputDataSubs.unsubscribe();
  }
  ngAfterViewInit() {
    this.setMapConf();
  }
  // METHODS
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
    }
  }
  private _filterCountryByInput(list, selectedIdx, field) {
    const inData = this.chartService.getInputData();
    const outData = this.chartService.getOutputData();
    const idOut = selectedIdx === 0 ? 'outputs-1' : 'outputs-2';
    const idInSoc = selectedIdx === 0 ? 'inputSoc-1' : 'inputSoc-2';
    const idInEco = selectedIdx === 0 ? 'inputEco-1' : 'inputEco-2';
    const idInExp = selectedIdx === 0 ? 'inputExp-1' : 'inputExp-2';
    let sliderValues = selectedIdx === 0 ? this.sliderValues1 : this.sliderValues2;
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
          this.chartService.updateOutputCharts(idOut, list[0].code);
          this.chartService.updateInputCharts(idInSoc, sliderValues, list[0].code);
          this.chartService.updateInputCharts(idInEco, sliderValues, list[0].code);
          this.chartService.updateInputCharts(idInExp, sliderValues, list[0].code);
        } else {
          this.chartService.createOutputChart(outData, idOut, list[0].group);
          this.chartService.createInputCharts(inData, idInSoc, sliderValues, list[0].group);
          this.chartService.createInputCharts(inData, idInEco, sliderValues, list[0].group);
          this.chartService.createInputCharts(inData, idInExp, sliderValues, list[0].group);
          // this.chartService.updateOutputCharts(idOut, list[0].code, list[0].group);
          // this.chartService.updateInputCharts(idInSoc, list[0].code, list[0].group);
          // this.chartService.updateInputCharts(idInEco, list[0].code, list[0].group);
          // this.chartService.updateInputCharts(idInExp, list[0].code, list[0].group);

        }
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
            this.chartService.updateOutputCharts(idOut, 'global');
            this.chartService.updateInputCharts(idInSoc, sliderValues, 'global');
            this.chartService.updateInputCharts(idInEco, sliderValues, 'global');
            this.chartService.updateInputCharts(idInExp, sliderValues, 'global');
          } else {
            this.chartService.createOutputChart(outData, idOut, 'GLOBAL');
            this.chartService.createInputCharts(inData, idInSoc, sliderValues, 'GLOBAL');
            this.chartService.createInputCharts(inData, idInEco, sliderValues, 'GLOBAL');
            this.chartService.createInputCharts(inData, idInExp, sliderValues, 'GLOBAL');
          }
          this._selectedCountryList.splice(filterIndex[0], 1);
        }
      }
    }
  }
  changeCountryInputsByClick(isoCode) {
    const filterISOCode = this.countryListComp.filter(val => val.code === isoCode);
    if (filterISOCode.length > 0) {
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
        const filterCountryVal1 = this.countryListComp.filter(val =>
          val.name.toLowerCase() === this.viewerModel.firstCountry.toLowerCase());
        const filterCountryVal2 = this.countryListComp.filter(val =>
          val.name.toLowerCase() === this.viewerModel.secondCountry.toLowerCase());
        if (!this.viewerModel.firstCountry || filterCountryVal1.length === 0) {
          this.viewerModel.firstCountry = filteredName;
          if (this.global) {
            this.chartService.updateOutputCharts('outputs-1', isoCode);
            this.chartService.updateInputCharts('inputSoc-1', this.sliderValues1, isoCode);
            this.chartService.updateInputCharts('inputEco-1', this.sliderValues1, isoCode);
            this.chartService.updateInputCharts('inputExp-1', this.sliderValues1, isoCode);
          } else {
            this.chartService.createOutputChart(outData, 'outputs-1', filteredGroup);
            this.chartService.createInputCharts(inData, 'inputSoc-1', this.sliderValues1, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputEco-1', this.sliderValues1, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputExp-1', this.sliderValues1, filteredGroup);
          }
        } else if (!this.viewerModel.secondCountry.trim() || filterCountryVal2.length === 0) {
          index += 1;
          this.viewerModel.secondCountry = filteredName;
          if (this.global) {
            this.chartService.updateOutputCharts('outputs-2', isoCode);
            this.chartService.updateInputCharts('inputSoc-2', this.sliderValues2, isoCode);
            this.chartService.updateInputCharts('inputEco-2', this.sliderValues2, isoCode);
            this.chartService.updateInputCharts('inputExp-2', this.sliderValues2, isoCode);
          } else {
            this.chartService.createOutputChart(outData, 'outputs-2', filteredGroup);
            this.chartService.createInputCharts(inData, 'inputSoc-2', this.sliderValues2, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputEco-2', this.sliderValues2, filteredGroup);
            this.chartService.createInputCharts(inData, 'inputExp-2', this.sliderValues2, filteredGroup);
          }
        }
        if (this._selectedCountryList.length < MAX_SELECTED_COUNTRIES) {
          this._selectedCountryList.push({
            index: index,
            name: filteredName,
            code: isoCode,
            group: filteredGroup
          });
        }
      } else {
        const selectedC = this._selectedCountryList[selectedCountryIdx[0]].name;
        if (this.viewerModel.firstCountry.length && selectedC.indexOf(this.viewerModel.firstCountry) >= 0) {
          this.viewerModel.firstCountry = '';
          if (this.global) {
            this.chartService.updateOutputCharts('outputs-1', 'global');
            this.chartService.updateInputCharts('inputExp-1', this.sliderValues1, 'global');
            this.chartService.updateInputCharts('inputSoc-1', this.sliderValues1, 'global');
            this.chartService.updateInputCharts('inputEco-1', this.sliderValues1, 'global');
          } else {
            this.chartService.createOutputChart(outData, 'outputs-1', 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputSoc-1', this.sliderValues1, 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputEco-1', this.sliderValues1, 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputExp-1', this.sliderValues1, 'GLOBAL');
          }
        } else if (this.viewerModel.secondCountry.length && selectedC.indexOf(this.viewerModel.secondCountry) >= 0) {
          this.viewerModel.secondCountry = '';
          if (this.global) {
            this.chartService.updateOutputCharts('outputs-2', 'global');
            this.chartService.updateInputCharts('inputExp-2', this.sliderValues2, 'global');
            this.chartService.updateInputCharts('inputSoc-2', this.sliderValues2, 'global');
            this.chartService.updateInputCharts('inputEco-2', this.sliderValues2, 'global');
          } else {
            this.chartService.createOutputChart(outData, 'outputs-2', 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputSoc-2', this.sliderValues2, 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputEco-2', this.sliderValues2, 'GLOBAL');
            this.chartService.createInputCharts(inData, 'inputExp-2', this.sliderValues2, 'GLOBAL');
          }
        }
        this._selectedCountryList.splice(selectedCountryIdx[0], 1);
      }
    }
  }
  getChartOutputData() {
    this.chartService.initOutputChartConf();
    this.getOutputDataSubs = this.chartService.getOutputDataObs().subscribe(data => {
      console.log(data);
      this.chartService.setInputData(data._globalModelData).then((inputData) => {
        console.log(inputData);
        this.chartService.createInputCharts(inputData, 'inputSoc-1', this.sliderValues1);
        this.chartService.createInputCharts(inputData, 'inputSoc-2', this.sliderValues2);
        this.chartService.createInputCharts(inputData, 'inputEco-1', this.sliderValues1);
        this.chartService.createInputCharts(inputData, 'inputEco-2', this.sliderValues2);
        this.chartService.createInputCharts(inputData, 'inputExp-1', this.sliderValues1);
        this.chartService.createInputCharts(inputData, 'inputExp-2', this.sliderValues2);
        for (const inputDataIndex in inputData) {
          if (inputData.hasOwnProperty(inputDataIndex)) {
            const key = inputData[inputDataIndex].key;
            let min = inputData[inputDataIndex].distribGroupArr[0].distribution;
            let max = inputData[inputDataIndex].distribGroupArr[0].distribution;
            console.log(inputData[inputDataIndex]);
            for (let index = 1; index < inputData[inputDataIndex].distribGroupArr.length; index++) {
              let valueInput = inputData[inputDataIndex].distribGroupArr[index].distribution;
              if (valueInput > max) {
                max = valueInput;
              }
              if (valueInput < min) {
                min = valueInput;
              }
            }
            if (min == max) {
              min--;
              max++;
            }
            this.sliderValues1[key + '_min'] = 1;
            this.sliderValues1[key + '_max'] = 100;
            this.sliderValues1[key + '_step'] = 1;
            if (this.sliderValues1[key + '_display_value'] != null) {
              this.sliderValues1[key + '_value'] = this.sliderValues1[key + '_display_value'] / (max + min) * 100;
            } else {
              this.sliderValues1[key + '_value'] = 50;
              this.sliderValues1[key + '_display_value'] = (max + min) / 2;
            }
            this.sliderValues2[key + '_min'] = 1;
            this.sliderValues2[key + '_max'] = 100;
            this.sliderValues2[key + '_step'] = 1;
            if (this.sliderValues2[key + '_display_value'] != null) {
              this.sliderValues2[key + '_value'] = this.sliderValues2[key + '_display_value'] / (max + min) * 100;
            } else {
              this.sliderValues2[key + '_value'] = 50;
              this.sliderValues2[key + '_display_value'] = (max + min) / 2;
            }
            this.sliderValues1[key] = {
              min: min,
              max: max,
              value: this.sliderValues1[key + '_value']
            };
            this.sliderValues2[key] = {
              min: min,
              max: max,
              value: this.sliderValues2[key + '_value']
            };
          }
        }
      });
      this.chartService.createOutputChart(data._outputDomains, 'outputs-1');
      this.chartService.createOutputChart(data._outputDomains, 'outputs-2');
      this.countryUIList = this.chartService.getOutputDataUIList();
      this.countryListComp = this.chartService.getOutputList();
      this.countryListIsoCodes = this.countryListComp.map(val => val.code);
      this.mapService.setMapFilterByISOCodes(this.countryListIsoCodes);
      // this.mapService.addStylesOnMapLoading(() => {
      //   this.mapService.setMapFilterByISOCodes(this.countryListIsoCodes);
      // });
      // this.chartService.getInputDataObs().subscribe(inpData => {
      //   console.log(inpData);
      //   this.chartService.createInputCharts(inpData, 'inputs-1');
      // this.chartService.createInputCharts(inpData, 'inputs-2');
      // });
    }, err => {
      console.log(err);
    });
  }
  setMapConf() {
    const self = this;
    this.mapService.addStylesOnMapLoading(() => {
      this.mapService.addBasemap();
      this.legends = this.mapService.getMapLegendConf('socio');
      this.mapService.setMapFilterByISOCodes(this.countryListIsoCodes);
      this.mapService.setClickFnMapEvent((ev) => {
        const features = self.mapService.getMap().queryRenderedFeatures(ev.point, {layers: [self.mapService.getViewerFillLayer()]});
        if (features.length) {
          const isoCode = features[0].properties['ISO_Code'];
          if (this.countryListIsoCodes.filter(val => val === isoCode).length) {
            self.changeCountryInputsByClick(isoCode);
            self.mapService.setMapFilterByISOCode(isoCode);
          }
        }
      });
    });
  }
  // EVENTS
  onFirstCountryInputChangeEvent() {
    this._changeCountryInput(true);
  }
  onSecondCountryInputChangeEvent() {
    this._changeCountryInput(false);
  }
  onSlideChangeEvent($event) {
    let currentSlideId = $event.current;
    currentSlideId = currentSlideId.split('-')[0];
    const layerPaintProp = 'fill-color';
    this.mapService.changeLayerStyle({
      property: layerPaintProp,
      type: currentSlideId
    });
    const currentLegend = this.mapService.getMapPaintConf(currentSlideId);
    this.legends = this.mapService.getMapLegendConf(currentSlideId);
  }
  onSwitchGlobal() {
    this.global = !this.global;
    this._selectedCountryList.forEach(country => {
      const inData = this.chartService.getInputData();
      const outData = this.chartService.getOutputData();
      const group = this.global ? 'GLOBAL' : country.group;
      if (country.index === 0) {
        this.chartService.createOutputChart(outData, 'outputs-1', group);
        this.chartService.createInputCharts(inData, 'inputSoc-1', this.sliderValues1, group);
        this.chartService.createInputCharts(inData, 'inputEco-1', this.sliderValues1, group);
        this.chartService.createInputCharts(inData, 'inputExp-1', this.sliderValues1, group);
        if (this.global) {
          this.chartService.updateOutputCharts('outputs-1', country.code);
          setTimeout(() => {
            this.chartService.updateInputCharts('inputExp-1', this.sliderValues1, country.code);
            this.chartService.updateInputCharts('inputSoc-1', this.sliderValues1, country.code);
            this.chartService.updateInputCharts('inputEco-1', this.sliderValues1, country.code);
          }, 3000);
        }
      }
      if (country.index === 1) {
        this.chartService.createOutputChart(outData, 'outputs-2', group);
        this.chartService.createInputCharts(inData, 'inputSoc-2', this.sliderValues2, group);
        this.chartService.createInputCharts(inData, 'inputEco-2', this.sliderValues2, group);
        this.chartService.createInputCharts(inData, 'inputExp-2', this.sliderValues2, group);
        if (this.global) {
          this.chartService.updateOutputCharts('outputs-2', country.code);
          setTimeout(() => {
            this.chartService.updateInputCharts('inputExp-2', this.sliderValues2, country.code);
            this.chartService.updateInputCharts('inputSoc-2', this.sliderValues2, country.code);
            this.chartService.updateInputCharts('inputEco-2', this.sliderValues2, country.code);
          }, 3000);
        }
      }
    });
  }
  onSwitchExposure() {
  }
  onSwitchExposure1() {
    this.hazards.hazard1 = !this.hazards.hazard1;
    this.onSwitchExposure();
  }
  onSwitchExposure2() {
    this.hazards.hazard2 = !this.hazards.hazard2;
    this.onSwitchExposure();
  }
  onSwitchExposure3() {
    this.hazards.hazard3 = !this.hazards.hazard3;
    this.onSwitchExposure();
  }
  onSwitchExposure4() {
    this.hazards.hazard4 = !this.hazards.hazard4;
    this.onSwitchExposure();
  }
  onSliderChangeEvent(sliderValues, key) {
    let newValue = (sliderValues[key].max + sliderValues[key].min) / 100 * sliderValues[key + '_value'];
    sliderValues[key + '_display_value'] = newValue;
    sliderValues[key].value = newValue;
  }
  onSliderChangeEvent1(key) {
    this.onSliderChangeEvent(this.sliderValues1, key);
  }
  onSliderChangeEvent2(key) {
    this.onSliderChangeEvent(this.sliderValues2, key);
  }
}
