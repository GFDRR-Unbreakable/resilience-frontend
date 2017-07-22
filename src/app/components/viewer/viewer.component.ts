import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operator/map';
import {debounceTime} from 'rxjs/operator/debounceTime';
import {distinctUntilChanged} from 'rxjs/operator/distinctUntilChanged';
import {MapService} from '../../services/map.service';
// import {NgbSlideEvent} from '@ng-bootstrap/ng-bootstrap';
import {ChartService} from '../../services/chart.service';
import {Subscription} from 'rxjs/Subscription';

const states = ['a', 'b'];

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  public getOutputDataSubs: Subscription;
  public countryUIList: Array<any> = [];
  public model: any;
  public model1: any;

  constructor(
    private mapService: MapService,
    private chartService: ChartService) { }
  // LIFE-CYCLE METHODS
  ngOnInit() {
    this.mapService.createMap('map');
    this.getChartOutputData();
  }
  ngOnDestroy() {
    this.getOutputDataSubs.unsubscribe();
  }
  ngAfterViewInit() {
    this.mapService.addStylesOnMapLoading(() => {
      this.mapService.addBasemap();
    });
  }
  // METHODS
  getChartOutputData() {
    this.chartService.initOutputChartConf();
    this.getOutputDataSubs = this.chartService.getOutputDataObs().subscribe(data => {
      this.chartService.createOutputChart(data, 'outputs-1');
      this.chartService.createOutputChart(data, 'outputs-2');
      this.countryUIList = this.chartService.getOutputDataUIList();
    }, err => {
      console.log(err);
    });
  }
  search = (text$: Observable<string>) =>
    map.call(distinctUntilChanged.call(debounceTime.call(text$, 200)),
      term => term.length < 2 ? [] : states.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10));

  search1 = (text$: Observable<string>) =>
    map.call(distinctUntilChanged.call(debounceTime.call(text$, 200)),
      term => term.length < 2 ? [] : states.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10));
  // EVENTS
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
