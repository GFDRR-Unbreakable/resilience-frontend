import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import {ChartService} from '../../services/chart.service';
import { TABS } from '../indicator-tabs/indicator-tabs.component';

@Component({
  selector: 'app-slider-tabs',
  templateUrl: './slider-tabs.component.html',
  styleUrls: ['./slider-tabs.component.css']
})
export class SliderTabsComponent implements OnInit, OnChanges {
  tabs = TABS;
  chartConf:any = {};
  inputTypes = {
    inputSoc: [],
    inputEco: [],
    inputVul: [],
    inputExp: []
  };
  sliderValuesPopulated = false;

  @Input() inputLabels: any = {};
  @Input() sliderValues: any = {};
  @Output() sliderChange = new EventEmitter<string>();
  @Output() sliderInputChange = new EventEmitter<any>();
  constructor(private chartService: ChartService) { }

  ngOnInit() {

  }

  ngOnChanges() {
    this.sliderValuesPopulated = !!Object.keys(this.sliderValues).length;
    this.chartConf = this.chartService.getChartsConf();

    Object.keys(this.inputTypes).forEach(key => {
      this.inputTypes[key] = this.chartConf.inputTypes[key];
    });
  }

  onSliderChange(key) {
    console.log('onSliderChange', key);
    this.sliderChange.emit(key)
  }

  onSliderInputEvent({value}, key) {
    //console.log('onSliderInputEvent', event, key);
    // this.sliderValues[key + '_value'] = value;
    // const eEvent = {sliderValues: this.sliderValues, key};
    this.sliderInputChange.emit({value, key});
    // this.onSliderChangeEvent(this.sliderValues, key);
  }
}
