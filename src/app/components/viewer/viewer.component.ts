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
  styleUrls: ['./viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  public getOutputDataSubs: Subscription;
  public countryUIList: Array<any> = [];
  public countryListComp: Array<any> = [];
  private _selectedCountryList: Array<any> = [];
  public viewerModel: Viewer = {
    firstCountry: '',
    secondCountry: ''
  };
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
    const self = this;
    this.mapService.addStylesOnMapLoading(() => {
      this.mapService.addBasemap();
      this.mapService.setClickFnMapEvent((ev) => {
        const features = self.mapService.getMap().queryRenderedFeatures(ev.point, {layers: [self.mapService.getViewerFillLayer()]});
        if (features.length) {
          console.log(features);
          const isoCode = features[0].properties['ISO_Codes'];
          self.changeCountryInputs(isoCode);
          self.mapService.setMapFilterByISOCode(isoCode);
        }
      });
    });
  }
  // METHODS
  private _changeCountryInput(isFirstInput) {
    const input = isFirstInput ? this.viewerModel.firstCountry : this.viewerModel.secondCountry;
    const fromList = this.countryListComp.filter(
      val => val.name.toLowerCase() === input.toLowerCase());
    console.log(this._selectedCountryList);
    const MAX_SELECTED_COUNTRIES = 2;
    if (this._selectedCountryList.length <= MAX_SELECTED_COUNTRIES) {
      if (isFirstInput) {
        if (fromList.length) {
          const filterExistence1 = this._selectedCountryList.filter(val => {
            return val.name === fromList[0].name;
          });
          if (!filterExistence1.length) {
            this._selectedCountryList.push({
              index: 0,
              name: fromList[0].name
            });
            this.mapService.setMapFilterByISOCode(fromList[0].code);
          }
        } else {
          const filterIndex1 = this._selectedCountryList.map((val, index) => {
            if (val.index === 0) {
              return index;
            }
          }).filter(isFinite);
          if (filterIndex1.length) {
            const filterIndexFromAll = this.countryListComp.filter(val => {
              return val.name === this._selectedCountryList[filterIndex1[0]].name;
            });
            if (filterIndex1.length > 0 && filterIndexFromAll.length > 0 &&
              this.viewerModel.firstCountry.toLowerCase() !== this._selectedCountryList[filterIndex1[0]].name.toLowerCase()) {
              this.mapService.setMapFilterByISOCode(filterIndexFromAll[0].code);
              this._selectedCountryList.splice(filterIndex1[0], 1);
            }
          }
        }
      } else {
        if (fromList.length) {
          const filterExistence1 = this._selectedCountryList.filter(val => {
            return val.name === fromList[0].name;
          });
          if (!filterExistence1.length) {
            this._selectedCountryList.push({
              index: 1,
              name: fromList[0].name
            });
            this.mapService.setMapFilterByISOCode(fromList[0].code);
          }
        } else {
          const filterIndex1 = this._selectedCountryList.map((val, index) => {
            if (val.index === 1) {
              return index;
            }
          }).filter(isFinite);
          if (filterIndex1.length > 0) {
            const filterIndexFromAll = this.countryListComp.filter(val => {
              return val.name === this._selectedCountryList[filterIndex1[0]].name;
            });
            if (filterIndex1.length > 0 && filterIndexFromAll.length > 0 &&
              this.viewerModel.firstCountry.toLowerCase() !== this._selectedCountryList[filterIndex1[0]].name.toLowerCase()) {
              this.mapService.setMapFilterByISOCode(filterIndexFromAll[0].code);
              this._selectedCountryList.splice(filterIndex1[0], 1);
            }
          }
        }
      }
    }
  }
  changeCountryInputs(isoCode) {
    const filteredName = this.countryListComp.filter(val => val.code === isoCode)[0].name;
    const selectedCountryIdx = this._selectedCountryList.map((val, index) => {
      if (val.name.toLowerCase() === filteredName.toLowerCase()) {
        return index;
      }
    }).filter(isFinite);
    if (selectedCountryIdx.length === 0) {
      let index = 0;
      if (!this.viewerModel.firstCountry) {
        this.viewerModel.firstCountry = filteredName;
      } else if (!this.viewerModel.secondCountry) {
        index += 1;
        this.viewerModel.secondCountry = filteredName;
      }
      this._selectedCountryList.push({
        index: index,
        name: filteredName
      });
    } else {
      const selectedC = this._selectedCountryList[selectedCountryIdx[0]].name;
      if (this.viewerModel.firstCountry.length && selectedC.indexOf(this.viewerModel.firstCountry) >= 0) {
        this.viewerModel.firstCountry = '';
      } else if (this.viewerModel.secondCountry.length && selectedC.indexOf(this.viewerModel.secondCountry) >= 0) {
        this.viewerModel.secondCountry = '';
      }
      this._selectedCountryList.splice(selectedCountryIdx[0], 1);
    }
  }
  getChartOutputData() {
    this.chartService.initOutputChartConf();
    this.getOutputDataSubs = this.chartService.getOutputDataObs().subscribe(data => {
      this.chartService.createOutputChart(data, 'outputs-1');
      this.chartService.createOutputChart(data, 'outputs-2');
      this.countryUIList = this.chartService.getOutputDataUIList();
      this.countryListComp = this.chartService.getOutputList();
    }, err => {
      console.log(err);
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
  }
}
