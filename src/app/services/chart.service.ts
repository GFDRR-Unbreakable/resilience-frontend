import { Injectable, Output, Input } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromPromise';
import * as d3 from 'd3/d3.js';
import * as science from 'science/index.js';
import * as d3Q from 'd3-queue/index.js';
import { SERVER } from './server.conf';
import { WebService } from '../services/web.service';
import { ViewerModel } from '../store/model/viewer.model';
import { URLSearchParams } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as html2canvas from 'html2canvas';

@Injectable()
export class ChartService {
  /**
   * Public and private properties to be used in this service. Some of them are:
   * observables, primitive data, reusable data.
   */
  private firstCountry: string;
  private secondCountry: string;
  private chart1Data: any = {
    rta: '',
    res: '',
    risk: ''
  };
  private chart2Data: any = {
    rta: '',
    res: '',
    risk: ''
  };
  private type: string;
  private _outputDataProm$: Observable<any>;
  private _inputDataProm$: Observable<any>;
  private _baseURL = SERVER.URL.BASE;
  private _maxGDPNum = 0;
  private _minGDPNum = 0;
  private _maxMinCountryXValues: Array<any> = [];
  private _outputDataURL = SERVER.URL.OUTPUT_DATA;
  private _inputInfoURL = SERVER.URL.INPUTS_INFO;
  private _inputDomains: any;
  private _inputLabels: any;
  private _inputFilterObj: any = null;
  private _inputConfig: any = {};
  private _outputDomains: any = {};
  private _globalExtentData: any = null;
  private _globalModelData: any = {};
  private _countryGroupData: any = {};
  private _policyInfoObj: any = null;
  private _newPolicyGroupedByCountryObj: any = {};
  private _newPolicyGroupedByPolicyObj: any = {};
  private _regionalPoliciesInfoObj: any = {};
  private _outputFilterObj: any = null;
  private _outputDataSubs: Subscription;
  public _outputUIList: Array<any> = [];
  public _outputList: Array<any> = [];
  private _outRelative: any = null;
  private _scoreCardDataObs$: Observable<any>;
  /**
   * Injects web service when this service is initialized by a component
   * @param {WebService} webService - Service which has a custom functionality
   * regarding the HTTP method calls. It uses default
   * @angular/http API configuration for it.
   */
  public type1S$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  set type1S(value: string) {
    // console.log('emit: ' + value);
    this.type1S$.next(value);
  }
  constructor(private webService: WebService) {
  }
  /**
   * DEPRECATED. This method returns calculations regarding the summatory,
   * average and counting policy-related data.
   * @param {String} policy - Scorecard policy name.
   */
  private _calculateRegionalAvgSinglePolicy(policy) {
    const chartConf = this.getChartsConf();
    const outputMetric = chartConf.policyMetrics;
    const outputMetricAvgInfo = {};
    const countryGr = jQuery.extend({}, this._countryGroupData);
    countryGr['GLOBAL'] = 'GLOBAL';
    jQuery.each(countryGr, (key, group) => {
      outputMetricAvgInfo[key] = {};
      outputMetric.forEach((val, idx) => {
        outputMetricAvgInfo[key][`sum_${val}`] = 0.0;
        outputMetricAvgInfo[key][`avg_${val}`] = 0.0;
        outputMetricAvgInfo[key][`count_${val}`] = 0.0;
      });
    });
    const policyList = chartConf.policyList;
    const selectedPol = policyList.map((val, idx) => {
      if (val.id === policy) {
        return idx;
      }
    }).filter(isFinite)[0];
    const policyObj = this._policyInfoObj.data[selectedPol];
    jQuery.each(countryGr, (key, group) => {
      jQuery.each(policyObj['group_name'], (k, pol) => {
        if (pol === group || key === 'GLOBAL') {
          outputMetric.forEach((val) => {
            outputMetricAvgInfo[key][`sum_${val}`] += policyObj[val][k];
            outputMetricAvgInfo[key][`count_${val}`]++;
          });
        }
      });
      outputMetric.forEach((val) => {
        outputMetricAvgInfo[group][`avg_${val}`] = outputMetricAvgInfo[group][`sum_${val}`]
          / outputMetricAvgInfo[group][`count_${val}`];
      });
    });
    return outputMetricAvgInfo;
  }
  /**
   * Returns rounded or average of GDP value from a selected country or globally.
   * @param {String} idx - Determines which output-indicator is being set.
   * @param {String} groupName - Country group-name.
   * @param {String} isoCode - Country iso code.
   */
  public calculateAVGGDPValue(idx, groupName?, isoCode?) {
    const globalObj = this.getGlobalModelData();
    let sumGDP = 0;
    let sumPop = 0;
    let count = 0;
    let avgGDP = 0;
    let avgDoll = 0;
    let avgPop = 0;
    if (idx === 'risk' || idx === 'risk_to_assets') {
      if (isoCode) {
        avgGDP = globalObj[isoCode]['macro_gdp_pc_pp'];
        avgPop = globalObj[isoCode]['macro_pop'];
        avgDoll = Math.round(avgGDP * avgPop);
      } else {
        jQuery.each(globalObj, (key, global) => {
          sumGDP += (+global['macro_gdp_pc_pp']);
          sumPop += (+global['macro_pop']);
          count++;
        });
        avgGDP = sumGDP / count;
        avgPop = sumPop / count;
        avgDoll = Math.round(avgGDP * avgPop);
      }
    }
    return avgDoll;
  }
  /**
   * Formats and calculates GDP values for Well-being and Risk-to-assets indicators.
   * @param {Number} gdpDollars - GDP value represented as monetary cost (in dollars).
   * @param {String} percentage - GDP percentage value.
   * @param {Boolean} isSetBillion - Checks whether the GDP value is beyond a billion number.
   */
  public calculateRiskGDPValues = (gdpDollars, percentageValue, isSetBillion?, withoutPercent?, onlyPercent?) => {
    let dollarLossGDP = (gdpDollars * (+percentageValue)) / 100;
    const aThousand = 1000;
    const aMillion = 1000000;
    const aBillion = 1000000000;
    let asString;
    let extraInfo;
    let aValue;
    let negative = dollarLossGDP < 0;
    const sign = negative ? '-' : '';
    let dollarLossGDPPositive = negative ? -dollarLossGDP : dollarLossGDP;
    if (isSetBillion) {
      if (dollarLossGDPPositive >= aBillion) {
        dollarLossGDPPositive = Math.round(dollarLossGDPPositive / aBillion);
        asString = dollarLossGDPPositive;
        if (dollarLossGDPPositive >= aThousand) {
          asString = dollarLossGDPPositive / aThousand;
          asString = asString.toFixed(0).split('.').join(',');
        }
        extraInfo = 'B';
        aValue = `US$ ${sign}${asString}${extraInfo} (${percentageValue}% of GDP)`;
        if (withoutPercent) {
          aValue = `US$ ${sign}${asString}${extraInfo}`;
        }
        if (onlyPercent) {
          aValue = `(${percentageValue}% of GDP)`;
        }
      } else if (dollarLossGDPPositive >= aMillion) {
        dollarLossGDPPositive /= aMillion;
        dollarLossGDPPositive = Math.round(dollarLossGDPPositive);
        asString = dollarLossGDPPositive;
        if (dollarLossGDPPositive >= aThousand) {
          asString = dollarLossGDPPositive / aThousand;
          asString = asString.toFixed(0).split('.').join(',');
        }
        extraInfo = 'M';
        aValue = `US$ ${sign}${asString}${extraInfo} (${percentageValue}% of GDP)`;
        if (withoutPercent) {
          aValue = `US$ ${sign}${asString}${extraInfo}`;
        }
        if (onlyPercent) {
          aValue = `(${percentageValue}% of GDP)`;
        }
      } else {
        dollarLossGDPPositive = Math.round(dollarLossGDPPositive);
        asString = dollarLossGDPPositive;
        if (dollarLossGDPPositive >= aThousand) {
          asString = dollarLossGDPPositive / aThousand;
          asString = asString.toFixed(0).split('.').join(',');
        }
        aValue = `US$ ${sign}${asString} (${percentageValue}% of GDP)`;
        if (withoutPercent) {
          aValue = `US$ ${sign}${asString}`;
        }
        if (onlyPercent) {
          aValue = `(${percentageValue}% of GDP)`;
        }
      }
    } else if (dollarLossGDPPositive >= aMillion) {
      dollarLossGDPPositive /= aMillion;
      dollarLossGDPPositive = Math.round(dollarLossGDPPositive);
      asString = dollarLossGDPPositive;
      if (dollarLossGDPPositive >= aThousand) {
        asString = dollarLossGDPPositive / aThousand;
        asString = asString.toFixed(0).split('.').join(',');
      }
      extraInfo = 'M';
      aValue = `US$ ${sign}${asString}${extraInfo} (${percentageValue}% of GDP)`;
      if (withoutPercent) {
        aValue = `US$ ${sign}${asString}${extraInfo}`;
      }
      if (onlyPercent) {
        aValue = `(${percentageValue}% of GDP)`;
      }
    } else {
      dollarLossGDPPositive = Math.round(dollarLossGDPPositive);
      asString = dollarLossGDPPositive;
      if (dollarLossGDPPositive >= aThousand) {
        asString = dollarLossGDPPositive / aThousand;
        asString = asString.toFixed(0).split('.').join(',');
      }
      aValue = `US$ ${sign}${asString} (${percentageValue}% of GDP)`;
      if (withoutPercent) {
        aValue = `US$ ${sign}${asString}`;
      }
      if (onlyPercent) {
        aValue = `(${percentageValue}% of GDP)`;
      }
    }
    return {
      dollarGDP: dollarLossGDP,
      text: aValue
    };
  }
  /**
   * Calculates and formats main GDP values for output indicators.
   * Its calculated values are stored in @public outputDomain property for every output chart.
   * @param containerId
   * @param key
   * @param numericValue
   * @param gdpDollars
   */
  subscription() {
    this.type1S$.subscribe(val => {
      //  console.log('subscribe');
      this.type = val;
      // console.log('type ', this.type);
    });
  }
  private calculateGDPValues(containerId, key, numericValue, gdpDollars, precision, oldValue?) {

    this.subscription();
    let percent;
    let value;
    let moreValues;
    let defaultValue = numericValue;
    if (oldValue != null) {
      defaultValue = oldValue;
    }
    let differenceValue = numericValue - defaultValue;
    let sign = differenceValue < 0 ? '-' : (differenceValue > 0 ? '+' : '');
    differenceValue = differenceValue < 0 ? -differenceValue : differenceValue;
    if (key === 'risk' || key === 'risk_to_assets') {
      moreValues = this.calculateRiskGDPValues(gdpDollars, numericValue, true, false, true);
      let newValues = this.calculateRiskGDPValues(gdpDollars, numericValue, true, true);
      let defaultValues = this.calculateRiskGDPValues(gdpDollars, defaultValue, true, true);
      let differenceValues = this.calculateRiskGDPValues(gdpDollars, differenceValue, true, true);
      let differenceText = (this.type !== 'tech') ? '' : (sign + differenceValues.text + '<br />');
      value = differenceText + 'Today: ' + defaultValues.text;
      if (defaultValues.text != newValues.text) {
        value = value + '<br />';
        value = value + 'New value: ' + newValues.text;
      }
      value = value + '<br />' + moreValues.text;

      this._outputDomains[key]['chart'][containerId] = {
        dollarGDP: moreValues.dollarGDP,
        valueGDP: numericValue,
        difference: sign + differenceValues.text,
        newValue: newValues.text,
        today: defaultValues.text
      };
    } else {
      percent = '%';
      value = differenceValue.toFixed(precision) + percent;
      let newValue = parseFloat(numericValue).toFixed(precision);
      let differenceSignText = sign + value;
      let differenceText = (this.type !== 'tech') ? '' : (differenceSignText + '<br />');
      value = differenceText + 'Today: ' + defaultValue + percent;
      if (defaultValue != newValue) {
        value = value + '<br />New value: ' + newValue + percent;
      }

      this._outputDomains[key]['chart'][containerId] = {
        value: numericValue,
        difference: differenceSignText,
        newValue: newValue + percent,
        today: defaultValue + percent
      };
    }
    return value;
  }
  /**
   * Returns the number of svg elements created in Scorecard-Priority List page.
   */
  countPolicyListCharts() {
    const svgEls = jQuery.find('div.scorecard-prioritylist svg');
    if (svgEls.length) {
      return svgEls.length;
    }
    return 0;
  }
  /**
   * Creates/removes input-indicator SVG charts. These charts are displayed on Viewer page.
   * @param {Object} inputData - Input-indicator data to be used to plot the chart
   * @param {String} containerId - Input-indicator HTML element id.
   * @param {Object} sliderValues - Slider model to modify its data.
   * @param {String} groupName - Group name a country pertains.
   */
  createInputCharts(inputData: any, containerId: string, sliderValues: any, groupName?: string) {
    jQuery(`div#${containerId}`).empty();
    const filteredInputData = this.filterInputDataByGroup(inputData, groupName);
    const inputTypeTxt = containerId.split('-')[0];
    const inputTypes = this.getInputIdChartByType(inputTypeTxt);
    const filterInputType = filteredInputData.filter(val => {
      if (inputTypes == null) {
        console.log(val);
      }
      return inputTypes.filter(type => {
        return val.key === type;
      })[0];
    });

    /*if (containerId === 'inputSoc-1') {
      console.log('######################')
      console.log('createInputCharts', containerId, inputData)
      console.log('inputTypeTxt', inputTypeTxt)
      console.log('inputTypes', inputTypes)
      console.log('filterInputType', filterInputType)
    }*/

    // Reorder input properties
    jQuery.each(filterInputType, (key, val) => {
      val.propInd = inputTypes.indexOf(val.key);
    });
    filterInputType.sort((a, b) => {
      return a.propInd - b.propInd;
    });
    jQuery.each(filterInputType, (idx, input) => {
      const dataArr = [];
      for (let k = 0; k < input.distribGroupArr.length; k++) {
        dataArr.push(input.distribGroupArr[k]['distribution']);
      }
      const data = Object.assign([], dataArr);

      const dataMean = d3.mean(data);
      if (sliderValues[input.key]) {
        if (groupName === 'GLOBAL') {
          sliderValues[input.key + '_display_value'] = 0;
          sliderValues[input.key + '_baseline_value'] = 0;
          sliderValues[input.key + '_difference_value'] = 0;
          sliderValues[input.key + '_default_value'] = 0;
          sliderValues[input.key].value = 0;
          sliderValues[input.key + '_value'] = 0;
        } else {
          sliderValues[input.key + '_display_value'] = dataMean;
          sliderValues[input.key + '_baseline_value'] = dataMean;
          sliderValues[input.key + '_difference_value'] = dataMean;
          sliderValues[input.key + '_default_value'] = dataMean;
          sliderValues[input.key].value = dataMean;
          sliderValues[input.key + '_value'] = dataMean / (sliderValues[input.key].max + sliderValues[input.key].min) * 100;
        }
      }

      // add a margin of 0.1 m,M
      if (data.length > 0) {
        const m1 = data[0] - (data[0] * 0.1);
        const m2 = data[data.length - 1] + (data[data.length - 1] * 0.1);
        data.unshift(m1);
        data.push(m2);
      } else {
        data.push(-0.1);
        data.push(0.1);
      }

      const bounds = d3.extent(data);
      const margin = {
        top: 5,
        right: 1,
        bottom: 0,
        left: 1
      };
      const width = 115 - margin.left - margin.right;
      const height = 40 - margin.top - margin.bottom;

      const kde = science.stats.kde().sample(data);
      const bw = kde.bandwidth(science.stats.bandwidth.nrd0)(data);

      const x = d3.scale.linear()
        .domain(bounds)
        .range([0, width]);

      const y = d3.scale.linear()
        .domain([0, d3.max(bw, (d) => {
          return d[1];
        })])
        .range([height, 0]);

      // gaussian curve
      const l = d3.svg.line()
        .x((d) => {
          return x(d[0]);
        })
        .y((d) => {
          return y(d[1]);
        })
        .interpolate('basis');

      // area under gaussian curve
      const a = d3.svg.area()
        .x((d) => {
          return x(d[0]);
        })
        .y0(height)
        .y1((d) => {
          return y(d[1]);
        });

      // bisect data array at brush selection point
      const b = d3.bisector((d) => {
        return d;
      }).left;

      const div = d3.select(`div#${containerId}`)
        .append('div')
        .attr('class', 'input-row');
      // .attr('class', 'box-tab-text');

      const table = div.append('table')
        .attr('width', '100%')
        .attr('class', 'table table-responsive chart-table')
        .attr('id', 'table-' + input.key)
        .style('pointer-events', 'none')
        .style('overflow-x', 'hidden');

      const tr = table.append('tr')
        .style('pointer-events', 'none');

      const td = tr.append('td')
        .attr('width', '50%')
        .style('padding-left', '5px')
        .style('pointer-events', 'none');

      tr.append('td')
        .attr('width', '50%')
        .style('padding', '0')
        .style('vertical-align', 'middle')
        .append('span')
        .attr('class', 'value')
        .style('pointer-events', 'none')
        .text(' ');

      const svg = td.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('id', input.key)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .style('pointer-events', 'none')
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // add gaussian curve
      const gaus = svg.append('g')
        .attr('id', input.key)
        .attr('class', 'gaussian');

      gaus.selectAll('#' + containerId + ' g#' + input.key + '.gaussian')
        // Multivariant Density Estimation
        // http://bit.ly/1Y3jEcD
        .data([science.stats.bandwidth.nrd0])
        .enter()
        .append('path')
        .attr('d', (d) => {
          return l(kde.bandwidth(d)(data));
        });

      gaus.selectAll('path')
        // .style('stroke', '#000')
        .style('stroke', '#7D8F8F')
        .style('stroke-width', '3px')
        .style('fill', 'none')
        .style('shape-rendering', 'auto');

      // add gaussian curve
      const area = svg.append('g')
        .attr('id', 'area-' + input.key)
        .attr('class', 'area');

      area.selectAll('#' + containerId + ' g#area-' + input.key + '.area')
        .data([science.stats.bandwidth.nrd0])
        .enter()
        .append('path')
        .attr('d', (d) => {
          const dd = kde.bandwidth(d)(data);
          return a(dd);
        });
      area.selectAll('path')
        // .style('fill', '#E6E8EF');
        .style('fill', '#e4e4e4');

      const mask = svg.append('g')
        .attr('id', 'mask-' + input.key)
        .attr('class', 'mask');

      // add placeholder for initial model value
      const initial = svg.append('g')
        .attr('id', 'initial-' + input.key)
        .attr('class', 'initial')
        .append('line');
      // add the brush to the input config so
      // we can access it later
      input.forUpdate = {
        b,
        a,
        distribData: data,
        kde
      };
      input.x = x;
      input.width = width;
      input.height = height;
      if (!this._inputConfig[input.key]) {
        this._inputConfig[input.key] = {};
      }
      const inputId = containerId.indexOf('1') >= 0 ? 'input1' : 'input2';
      if (!this._inputConfig[input.key][inputId]) {
        this._inputConfig[input.key][inputId] = Object.assign({}, input);
      } else {
        this._inputConfig[input.key][inputId] = Object.assign(this._inputConfig[input.key][inputId], input);
      }

      const brush = d3.svg.brush()
        .x(x)
        .on('brushstart', brushstart)
        .on('brushend', brushend);
      const me = this;
      if (groupName === 'GLOBAL' || !groupName) {
        this._inputConfig[input.key][inputId].brush = brush;
      }
      brush.extent([0, this._inputConfig[input.key][inputId].brush.extent()[1]]);
      brush.on('brush', me._inputBrushMoveEv.call(me, containerId, input));

      const line = d3.svg.line()
        .x((d) => {
          return brush.extent()[1];
        })
        .y((d) => {
          return height;
        });

      const brushg = svg.append('g')
        .attr('class', 'brush')
        .call(brush);

      brushg.call(brush.event)
        .transition()
        .duration(750)
        .call(brush.extent([0, d3.mean(data)]))
        .call(brush.event);

      brushg.selectAll('#' + containerId + ' g.resize.w').remove();

      brushg.select('#' + containerId + ' #' + input.key + ' g.resize.e').append('path')
        .attr('d', line)
        .style('fill', '#666')
        .style('fill-opacity', '0.8')
        .style('stroke-width', '4px')
        // .style('stroke', '#7D8F8F')
        // .style('stroke', '#50c4cf')
        .style('stroke', '#BDBDBD')
        .style('pointer-events', 'none');

      brushg.selectAll('#' + containerId + ' rect')
        .attr('height', height);

      brushg.select('rect.extent')
        .style('fill-opacity', '0')
        .style('shape-rendering', 'crispEdges');

      brushg.style('pointer-events', 'none');
      const brushEl = brushg[0][0];
      // brushEl.removeAllListeners();

      const self = this;
      function brushstart() {
        svg.classed('selecting-input', true);
      }
      function brushend() {
        svg.classed('selecting-input', !d3.event.target.empty());
      }
      function _redrawInputPlot(id) {
        const config = this._inputConfig;
        const inputD = config[id];
      }
    });
  }
  /**
   * Creates/removes output-indicator SVG charts. These charts are displayed on Viewer and Scorecard Priority List pages.
   * @param {Object} outputData - Output-indicator data to be used to plot the chart.
   * @param {String} containerId - Output-indicator HTML element id.
   * @param {String} groupName - Group name a country pertains.
   * @param {Boolean} isScoreCardPage - Determines if the displayed page is Viewer or Scorecard
   * in order to display differently the UI design of output-charts.
   * @param {String} isoCode - Country iso code.
   */
  createOutputChart(outputData: any, containerId: string, groupName?: string, isScoreCardPage?: boolean, isoCode?: string) {
    jQuery(`div#${containerId}`).empty();
    const finalOutput = this.filterOutputDataByGroup(outputData, groupName);

    const me = this;
    jQuery.each(finalOutput, (idx, output) => {
      const s1 = output.gradient[0];
      const s2 = output.gradient[1];
      if (!this._outputDomains[idx]['chart']) {
        this._outputDomains[idx]['chart'] = {};
      }
      if (!this._outputDomains[idx]['chart'][containerId]) {
        this._outputDomains[idx]['chart'][containerId] = '';
      }
      // sort the distribution
      const data: Array<number> = output.domain.sort((a, b) => {
        return a - b;
      });
      if (!this._globalExtentData) {
        this._globalExtentData = {};
      }
      if ((groupName === 'GLOBAL' || !groupName) && !this._globalExtentData[idx]) {
        this._globalExtentData[idx] = d3.mean(data);
      }
      const avgDoll = me.calculateAVGGDPValue(idx, groupName, isoCode);
      const bounds = d3.extent(data);
      const margin = {
        top: 5,
        right: 2,
        bottom: 0,
        left: 2
      };
      const width = (isScoreCardPage ? 140 : 110) - margin.left - margin.right;
      const height = (isScoreCardPage ? 50 : 40) - margin.top - margin.bottom;

      const kde = science['stats'].kde().sample(data);
      const bw = kde.bandwidth(science['stats'].bandwidth.nrd0)(data);
      const x = d3.scale.linear()
        .domain(bounds)
        .range([0, width])
        .clamp(true);
      const d1Y = d3.max(bw, (d) => {
        return d[1];
      });
      const y = d3.scale.linear()
        .domain([0, d1Y])
        .range([height, 0]);
      // gaussian curve
      const l = d3.svg.line()
        .x((d) => {
          return x(d[0]);
        })
        .y((d) => {
          return y(d[1]);
        });
      // area under gaussian curve
      const a = d3.svg.area()
        .x((d) => {
          return x(d[0]);
        })
        .y0(height)
        .y1((d) => {
          return y(d[1]);
        });
      // bisect data array at brush selection point
      const b = d3.bisector((d) => {
        return d;
      }).left;

      const div = d3.select(`#${containerId}`)
        .append('div')
        .attr('id', idx)
        .attr('class', 'col-sm-12')
        .attr('data-output', idx)
        .attr('data-output-title', output.descriptor)
        .style('pointer-events', 'all');
      if (isScoreCardPage) {
        div.attr('class', 'col-sm-4');
      }
      if (!isScoreCardPage && (idx === 'risk_to_assets' || idx === 'resilience')) {
        div.style('border-bottom', '1px solid #dbdbdb');
      }

      const createPlot = (tdElement) => {
        if (!isScoreCardPage) {
          tdElement.attr('width', '3%');
          if (containerId.indexOf('1') > 0) {
            tdElement.attr('width', '6%');
          }
          tdElement.style('padding', '0.75rem 0');
        }
        const svg = tdElement.append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .attr('id', idx)
          .append('g')
          .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')')
          .style('pointer-events', 'none')
          .style('border-bottom', '1px solid lightgrey');
        // add gaussian curve
        const gaus = svg.append('g')
          .attr('id', idx)
          .attr('class', 'gaussian');
        gaus.selectAll('#' + containerId + ' g#' + idx + ' .gaussian')
          // Multivariant Density Estimation
          // http://bit.ly/1Y3jEcD
          .data([science['stats'].bandwidth.nrd0])
          .enter()
          .append('path')
          .attr('d', (d) => {
            return l(kde.bandwidth(d)(data));
          });
        // Add manually chart styles to be integrated when converting to base64 string
        gaus.selectAll('path')
          // .style('stroke', '#000')
          .style('stroke', '#7D8F8F')
          .style('stroke-width', '3px')
          .style('fill', 'none')
          .style('shape-rendering', 'auto');
        // add gaussian curve
        const area = svg.append('g')
          .attr('id', 'area-' + idx)
          .attr('class', 'area');
        area.selectAll('#' + containerId + ' g#area-' + idx + ' .area')
          .data([science['stats'].bandwidth.nrd0])
          .enter()
          .append('path')
          .attr('d', (d) => {
            return a(kde.bandwidth(d)(data));
          });
        // Add manually chart styles to be integrated when converting to base64 string
        area.selectAll('path')
          // .style('fill', '#5E6A6A');
          .style('fill', '#e4e4e4');
        // add placeholder for initial model value
        const initial = svg.append('g')
          .attr('id', 'initial-' + idx)
          .attr('class', 'initial')
          .append('line');
        // Add manually chart styles to be integrated when converting to base64 string
        svg.selectAll('g.initial line')
          .style('fill', 'none')
          // .style('stroke', '#2f4f4f')
          .style('stroke', 'transparent')
          .style('stroke-width', '2px')
          .style('opacity', '0.8');

        let infoEl;
        if (!isScoreCardPage) {
          // infoEl = tr.append('td')
          //   .attr('width', '100%');
          // infoEl.append('p')
          //   .attr('class', 'text-results')
          //   .text(output.descriptor.toUpperCase());
        } else {
          const table = d3.select(tdElement.node().parentElement.parentElement.parentElement);
          infoEl = table.append('tr');
          const tdEl = infoEl.append('td')
            .attr('width', '100%');
          const divData = tdEl.append('div')
            .attr('class', 'box-text-results text-center');
          divData.append('p')
            .attr('class', 'scorecard-title-result')
            .text(output.descriptor);
        }

        const brushstart = () => {
          svg.classed('selecting-output', true);
        };
        const brushmove = () => {
          d3.select('#' + containerId + ' #' + idx + ' g.resize.e path')
            .attr('d', 'M 0, 0 ' + ' L 0 ' + height);
        };
        const brushend = () => {
          svg.classed('selecting', !d3.event.target.empty());
        };
        const brush = d3.svg.brush()
          .x(x);
        // keep a reference to the brush for the output domain
        output.x = x;
        output.height = height;
        const outputId = containerId.indexOf('1') >= 0 ? 'output1' : 'output2';
        if (!this._outputDomains[idx][outputId]) {
          this._outputDomains[idx][outputId] = Object.assign({}, output);
        }
        if ((groupName === 'GLOBAL' || !groupName) && !this._outputDomains[idx][outputId].brush) {
          this._outputDomains[idx][outputId].brush = brush;
          if (this._globalExtentData[idx]) {
            brush.extent([0, this._globalExtentData[idx]]);
          }
        } else {
          if (this._globalExtentData[idx]) {
            brush.extent([0, this._globalExtentData[idx]]);
          }
        }
        this._outputDomains[idx][outputId].default = this._globalExtentData[idx];
        brush.extent([0, this._outputDomains[idx][outputId].brush.extent()[1]]);
        brush.on('brush', brushmove);

        const textFn = () => {
          const precision = +output.precision;
          const brushVal = this._outputDomains[idx][outputId].brush.extent()[1];
          const numericValue = (brushVal * 100).toFixed(precision);
          const value = me.calculateGDPValues(containerId, idx, numericValue, avgDoll, precision);
          return value;
        };

        if (!isScoreCardPage) {
          infoEl = d3.select(tdElement.node().parentElement);
          const td = infoEl.append('td');
          td.style('padding', '0.75rem 0')
            .attr('width', '15%');
          td.append('p')
            .attr('class', 'text-results')
            .append('span')
            .attr('class', 'text-number')
            .html(textFn);
        } else {
          infoEl.select('div.box-text-results')
            .append('p')
            .attr('class', 'scorecard-text-result')
            .append('span')
            .attr('class', 'text-number')
            .html(textFn);
        }

        const line = d3.svg.line()
          .x((d) => {
            return d3.mean(data);
          })
          .y((d) => {
            return height;
          });

        const brushg = svg.append('g')
          .attr('class', 'brush')
          .style('pointer-events', 'none')
          .call(brush);

        brushg.call(brush.event)
          .transition()
          .duration(750)
          .call(brush.extent([0, d3.mean(data)]))
          .call(brush.event);

        brushg.selectAll('#' + containerId + ' g.resize.w').remove();
        // Add manually chart styles to be integrated when converting to base64 string
        brushg.select('#' + containerId + ' #' + idx + ' g.resize.e').append('path')
          .attr('d', line)
          .style('visibility', 'hidden')
          .style('fill', '#666')
          .style('fill-opacity', '0.8')
          .style('stroke-width', '4px')
          // .style('stroke', '#C3D700')
          .style('stroke', '#50c4cf')
          .style('pointer-events', 'none');
        // Add manually chart styles to be integrated when converting to base64 string
        brushg.select('rect.extent')
          .style('fill-opacity', '0')
          .style('shape-rendering', 'crispEdges');

        brushg.selectAll('#' + containerId + ' rect')
          .attr('height', height)
          .style('pointer-events', 'none');

        const line2 = d3.svg.line()
          .x((d) => {
            return d3.mean(data);
          })
          .y((d) => {
            return height;
          });

        const brushg2 = svg.append('g')
          .attr('class', 'brush2')
          .style('pointer-events', 'none')
          .call(brush);

        brushg2.call(brush.event)
          .transition()
          .duration(750)
          .call(brush.extent([0, d3.mean(data)]))
          .call(brush.event);

        brushg2.selectAll('#' + containerId + ' g.resize.w').remove();
        // Add manually chart styles to be integrated when converting to base64 string
        brushg2.select('#' + containerId + ' #' + idx + ' g.resize.e').append('path')
          .attr('d', line2)
          .style('fill', '#666')
          .style('fill-opacity', '0.8')
          .style('stroke-width', '4px')
          // .style('stroke', '#C3D700')
          .style('stroke', '#000000')
          .style('pointer-events', 'none');
        // Add manually chart styles to be integrated when converting to base64 string
        brushg2.select('rect.extent')
          .style('fill-opacity', '0')
          .style('shape-rendering', 'crispEdges');

        brushg2.selectAll('#' + containerId + ' rect')
          .attr('height', height)
          .style('pointer-events', 'none');
        let brushg2El = brushg2.select('#' + containerId + ' #' + idx + ' g.resize.e rect')[0][0];
        brushg2El.style.visibility = "visible";
        brushg2El.style['fill-opacity'] = 0.2;
        brushg2El.width.baseVal.value = 3;
      };

      if (!isScoreCardPage) {
        let table;
        let tr;
        let td;
        if (containerId.indexOf('1') > 0) {
          // div.attr('class', 'col-sm-8');
          table = div.append('table');
          table.attr('width', '100%')
            .attr('class', 'table table-responsive')
            .attr('id', 'table-' + idx);
          const tr1 = table.append('tr');
          const td11 = tr1.append('td');
          const td12 = tr1.append('td');
          td11.attr('width', '40%');
          td11.append('p')
            .attr('class', 'text-results')
            .text(output.descriptor.toUpperCase());
          createPlot(td12);
        } else {
          // div.attr('class', 'col-sm-4');
          table = div.append('table');
          table.attr('width', '100%')
            .attr('class', 'table table-responsive')
            .attr('id', 'table-' + idx);
          tr = table.append('tr');
          td = tr.append('td');
          createPlot(td);
        }
      } else {
        const table = div.append('table')
          .attr('width', '100%')
          .attr('class', 'table table-responsive')
          .attr('id', 'table-' + idx);
        const tr = table.append('tr');
        const td = tr.append('td')
          .attr('width', '100%');
        createPlot(td);
      }
    });
  }

  createSingleOutputChart(outputData, idx, containerId, groupName, isoCode) {
    jQuery(`div#${containerId}`).empty();

    const output = outputData; // @TODO: Refactor.

    const s1 = output.gradient[0];
    const s2 = output.gradient[1];

    if (!this._outputDomains[idx]['chart']) {
      this._outputDomains[idx]['chart'] = {};
    }
    if (!this._outputDomains[idx]['chart'][containerId]) {
      this._outputDomains[idx]['chart'][containerId] = '';
    }

    // sort the distribution
    const data: Array<number> = output.domain.sort((a, b) => {
      return a - b;
    });
    if (!this._globalExtentData) {
      this._globalExtentData = {};
    }

    if ((groupName === 'GLOBAL' || !groupName) && !this._globalExtentData[idx]) {
      this._globalExtentData[idx] = d3.mean(data);
    }

    const avgDoll = this.calculateAVGGDPValue(idx, groupName, isoCode);
    const bounds = d3.extent(data);
    const margin = {
      top: 5,
      right: 2,
      bottom: 0,
      left: 2
    };

    const width = 110 - margin.left - margin.right;
    const height = 40 - margin.top - margin.bottom;

    const kde = science['stats'].kde().sample(data);
    const bw = kde.bandwidth(science['stats'].bandwidth.nrd0)(data);
    const x = d3.scale.linear()
      .domain(bounds)
      .range([0, width])
      .clamp(true);
    const d1Y = d3.max(bw, (d) => {
      return d[1];
    });

    const y = d3.scale.linear()
      .domain([0, d1Y])
      .range([height, 0]);
    // gaussian curve
    const l = d3.svg.line()
      .x((d) => {
        return x(d[0]);
      })
      .y((d) => {
        return y(d[1]);
      });
    // area under gaussian curve
    const a = d3.svg.area()
      .x((d) => {
        return x(d[0]);
      })
      .y0(height)
      .y1((d) => {
        return y(d[1]);
      });
    // bisect data array at brush selection point
    const b = d3.bisector((d) => {
      return d;
    }).left;

    /*
    const div = d3.select(`#${containerId}`)
      .append('div')
      .attr('id', idx)
      .attr('class', 'col-sm-8')
      .attr('data-output', idx)
      .attr('data-output-title', output.descriptor)
      .style('pointer-events', 'all');

    // Old start of createPlot
    let tdElement = div;

    const svg = tdElement.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('id', idx)
      .append('g')
      .attr('transform',
        'translate(' + margin.left + ',' + margin.top + ')')
      .style('pointer-events', 'none')
      .style('border-bottom', '1px solid lightgrey');

    const gaus = svg.append('g')
      .attr('id', idx)
      .attr('class', 'gaussian');
    gaus.selectAll('#' + containerId + ' g#' + idx + ' .gaussian')
      // Multivariant Density Estimation
      // http://bit.ly/1Y3jEcD
      .data([science['stats'].bandwidth.nrd0])
      .enter()
      .append('path')
      .attr('d', (d) => {
        return l(kde.bandwidth(d)(data));
      });
    // Add manually chart styles to be integrated when converting to base64 string
    gaus.selectAll('path')
      // .style('stroke', '#000')
      .style('stroke', '#7D8F8F')
      .style('stroke-width', '3px')
      .style('fill', 'none')
      .style('shape-rendering', 'auto');

    // add gaussian curve
    const area = svg.append('g')
      .attr('id', 'area-' + idx)
      .attr('class', 'area');
    area.selectAll('#' + containerId + ' g#area-' + idx + ' .area')
      .data([science['stats'].bandwidth.nrd0])
      .enter()
      .append('path')
      .attr('d', (d) => {
        return a(kde.bandwidth(d)(data));
      });
    // Add manually chart styles to be integrated when converting to base64 string
    area.selectAll('path')
      // .style('fill', '#5E6A6A');
      .style('fill', '#e4e4e4');

    // add placeholder for initial model value
    const initial = svg.append('g')
      .attr('id', 'initial-' + idx)
      .attr('class', 'initial')
      .append('line');
    // Add manually chart styles to be integrated when converting to base64 string
    svg.selectAll('g.initial line')
      .style('fill', 'none')
      // .style('stroke', '#2f4f4f')
      .style('stroke', 'transparent')
      .style('stroke-width', '2px')
      .style('opacity', '0.8');

    let infoEl;

    const brushstart = () => {
      svg.classed('selecting-output', true);
    };
    const brushmove = () => {
      d3.select('#' + containerId + ' #' + idx + ' g.resize.e path')
        .attr('d', 'M 0, 0 ' + ' L 0 ' + height);
    };
    const brushend = () => {
      svg.classed('selecting', !d3.event.target.empty());
    };*/
    const brush = d3.svg.brush()
      .x(x);

    // keep a reference to the brush for the output domain
    output.x = x;
    output.height = height;
    const outputId = containerId.indexOf('1') >= 0 ? 'output1' : 'output2';
    if (!this._outputDomains[idx][outputId]) {
      this._outputDomains[idx][outputId] = Object.assign({}, output);
    }
    if ((groupName === 'GLOBAL' || !groupName) && !this._outputDomains[idx][outputId].brush) {
      this._outputDomains[idx][outputId].brush = brush;
      if (this._globalExtentData[idx]) {
        brush.extent([0, this._globalExtentData[idx]]);
      }
    } else {
      if (this._globalExtentData[idx]) {
        brush.extent([0, this._globalExtentData[idx]]);
      }
    }
    this._outputDomains[idx][outputId].default = this._globalExtentData[idx];
    brush.extent([0, this._outputDomains[idx][outputId].brush.extent()[1]]);
    // brush.on('brush', brushmove);
    const line = d3.svg.line()
      .x((d) => {
        return d3.mean(data);
      })
      .y((d) => {
        return height;
      });

    /*
    const brushg = svg.append('g')
      .attr('class', 'brush')
      .style('pointer-events', 'none')
      .call(brush);

    brushg.call(brush.event)
      .transition()
      .duration(750)
      .call(brush.extent([0, d3.mean(data)]))
      .call(brush.event);

    brushg.selectAll('#' + containerId + ' g.resize.w').remove();
    // Add manually chart styles to be integrated when converting to base64 string
    brushg.select('#' + containerId + ' #' + idx + ' g.resize.e').append('path')
      .attr('d', line)
      .style('visibility', 'hidden')
      .style('fill', '#666')
      .style('fill-opacity', '0.8')
      .style('stroke-width', '4px')
      // .style('stroke', '#C3D700')
      .style('stroke', '#50c4cf')
      .style('pointer-events', 'none');
    // Add manually chart styles to be integrated when converting to base64 string
    brushg.select('rect.extent')
      .style('fill-opacity', '0')
      .style('shape-rendering', 'crispEdges');

    brushg.selectAll('#' + containerId + ' rect')
      .attr('height', height)
      .style('pointer-events', 'none');
    */
    const line2 = d3.svg.line()
      .x((d) => {
        return d3.mean(data);
      })
      .y((d) => {
        return height;
      });
    /*
    const brushg2 = svg.append('g')
      .attr('class', 'brush2')
      .style('pointer-events', 'none')
      .call(brush);

    brushg2.call(brush.event)
      .transition()
      .duration(750)
      .call(brush.extent([0, d3.mean(data)]))
      .call(brush.event);

    brushg2.selectAll('#' + containerId + ' g.resize.w').remove();
    // Add manually chart styles to be integrated when converting to base64 string
    brushg2.select('#' + containerId + ' #' + idx + ' g.resize.e').append('path')
      .attr('d', line2)
      .style('fill', '#666')
      .style('fill-opacity', '0.8')
      .style('stroke-width', '4px')
      // .style('stroke', '#C3D700')
      .style('stroke', '#000000')
      .style('pointer-events', 'none');
    // Add manually chart styles to be integrated when converting to base64 string
    brushg2.select('rect.extent')
      .style('fill-opacity', '0')
      .style('shape-rendering', 'crispEdges');

    brushg2.selectAll('#' + containerId + ' rect')
      .attr('height', height)
      .style('pointer-events', 'none');
    let brushg2El = brushg2.select('#' + containerId + ' #' + idx + ' g.resize.e rect')[0][0];
    brushg2El.style.visibility = "visible";
    brushg2El.style['fill-opacity'] = 0.2;
    brushg2El.width.baseVal.value = 3;

    const textFn = () => {
      const precision = +output.precision;
      const brushVal = this._outputDomains[idx][outputId].brush.extent()[1];
      const numericValue = (brushVal * 100).toFixed(precision);
      const value = this.calculateGDPValues(containerId, idx, numericValue, avgDoll, precision);
      return value;
    };

    infoEl = d3.select(tdElement.node().parentElement);
    const td = infoEl.append('div');
    td.style('padding', '0.75rem 0')
      .attr('class', 'col-sm-4');
    td.append('p')
      .attr('class', 'text-results')
      .append('span')
      .attr('class', 'text-number')
      .html(textFn);*/
  }

  /**
   * Creates/updates/removes scorecard SVG charts (priority-list or measure one). These charts are displayed in both Scorecard pages.
   * @param {Object} policyData - Scorecard data to be used to plot the chart.
   * @param {String} containerId - Scorecard HTML element id.
   * @param {Object} countryList - Scorecard custom properties to be set when plotting in this chart.
   */
  createPolicyListChart(policyData: any, containerId: string, countryList: any, hideAvoidedAssetLosses?: boolean) {
    let dkTotArr = [];
    let dWTotCurrencyArr = [];
    const dKTotPercentageArr = [];
    const dWTotPercentageArr = [];
    let allData = [];
    const isPolicyListObject = typeof countryList === 'object' && countryList['type'] === 'policyList';
    const isCountryListObject = typeof countryList === 'object' && countryList['type'] === 'policyMeasure';
    const isCountryListCurrencyBased = isCountryListObject && countryList['chartType'] === 'absolute';
    const isCountryListPercentageBased = isCountryListObject && countryList['chartType'] === 'relative';
    const forPrint = countryList.forPrint;

    jQuery.each(policyData, (idx, polData) => {
      const dKtot = countryList['chartType'] === 'absolute' ? +polData['num_asset_losses_label'] : +polData['rel_num_asset_losses_label'];
      const dWtot_currency = countryList['chartType'] === 'absolute' ?
        +polData['num_wellbeing_losses_label'] : +polData['rel_num_wellbeing_losses_label'];
      const dKtotLabel = countryList['chartType'] === 'absolute' ?
        polData['asset_losses_label'] : polData['rel_asset_losses_label'];
      const dWtot_currencyLabel = countryList['chartType'] === 'absolute' ?
        polData['wellbeing_losses_label'] : polData['rel_wellbeing_losses_label'];
      dkTotArr.push(dKtot);
      dWTotCurrencyArr.push(dWtot_currency);
      allData.push({
        id: idx,
        dKtot,
        dWtot_currency,
        dKtotLabel,
        dWtot_currencyLabel
      });
    });
    const aMillion = 1000000;
    let policyList;
    const globalObj = this.getGlobalModelData();
    if (isCountryListObject) {
      const regionSelected = countryList['region'];
      const allDataLength = allData.length;
      const allDataFiltered = [];
      const MAX_COUNTRIES_POLICY_MEASURE = 15;
      if (regionSelected !== 'GLOBAL') {
        jQuery.each(globalObj, (key, global) => {
          const countryName = global.name;
          const countryRegion = global['group_name'];
          if (countryRegion === regionSelected) {
            for (let i = 0; i < allDataLength; i += 1) {
              if (allData[i].id === countryName) {
                allDataFiltered.push(allData[i]);
                break;
              }
            }
          }
        });
        allData = Object.assign([], allDataFiltered);
      }
      let tempAllData = Object.assign([], allData);
      const tempDataLength = tempAllData.length;
      tempAllData.sort((a, b) => {
        return (+b.dWtot_currency) - (+a.dWtot_currency);
      });
      tempAllData = tempAllData.slice(0, MAX_COUNTRIES_POLICY_MEASURE);
      allData = tempAllData.filter(temp => {
        return allData.filter(val => {
          return val.id === temp.id;
        })[0];
      });
    } else {
      policyList = this.getChartsConf().policyList;
      policyList.forEach((val, idx) => {
        if (val.id === allData[idx].id) {
          allData[idx].label = val.label;
        }
      });
    }
    const allDataClone = Object.assign([], allData);
    const isNewChart = countryList.hasOwnProperty('isNew') && countryList['isNew'];

    const recalculateChartHeight = () => {
      const region = countryList['region'];
      if (region === 'East Asia & Pacific') {
        return 1300;
      } else if (region === 'South Asia') {
        return 500;
      } else if (region === 'North America') {
        return 220;
      } else if (region === 'Middle East & North Africa') {
        return 880;
      }
      return 1400;
    };

    let maxFirstBarValue = d3.max(allData, (d) => {
      return d.dWtot_currency;
    });
    let maxSecondBarValue = d3.max(allData, (d) => {
      return d.dKtot;
    });
    let minValues = [maxFirstBarValue, maxSecondBarValue];
    let min = d3.min(minValues);
    let maxValue = d3.max([maxFirstBarValue, maxSecondBarValue]);
    let w;
    if (forPrint) {
      w = isCountryListObject ? 635 : 675;
    } else if (isCountryListObject) {
      w = 670;
    } else if (isPolicyListObject) {
      w = 750;
    } else {
      w = 650;
    }

    let h = isCountryListObject ? recalculateChartHeight() : 1000;
    h = forPrint && h > 820 ? 820 : h;

    const margin = {
      left: isPolicyListObject ? 170 : 130,
      right: 70,
      bottom: 35,
      top: 35
    };
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;
    const spaceLblCh = 10;

    let xDomain = [];
    xDomain.push(-1, maxValue);

    const xLane = d3.scale.linear()
      .domain(xDomain).nice()
      .range([0, width - margin.left - spaceLblCh - margin.right]);
    let yDomainList = allData.map(val => isCountryListObject ? val.id : val.label);
    const yLane = d3.scale.ordinal()
      .domain(yDomainList)
      .rangeBands([0, height]);

    const formatAxis = (v) => {
      if (v >= 1000 || v <= -1000) {
        return Math.round(v / 1000) + 'M'
      }
      return v;
    };

    const xAxis = d3.svg.axis()
      .scale(xLane)
      .tickValues([])
      .outerTickSize(0)
      .orient('top');
    const xAxis2 = d3.svg.axis()
      .scale(xLane)
      .tickValues([])
      .outerTickSize(0)
      .orient('bottom');
    const yAxis = d3.svg.axis()
      .scale(yLane)
      .orient('left');
    const yRightAx = d3.svg.axis()
      .scale(yLane)
      .orient('right');

    const xGridLines = d3.svg.axis()
      .scale(xLane)
      .tickSize(-height + margin.top + margin.bottom - 30, 0, 0)
      .tickFormat('')
      .orient('top');
    // Add SVG element
    let laneChart;
    if (isNewChart) {
      laneChart = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height + margin.bottom);
    } else {
      laneChart = d3.select(`#${containerId} svg`);
      if (height !== laneChart.attr('height')) {
        laneChart.attr('height', height);
      }
    }

    // Label wrap text function
    const textWrap = (text, txtWidth) => {
      text.each(function () {
        const textEl = d3.select(this),
          words = textEl.text().split(/\s+/).reverse();
        let word,
          line = [],
          lineNumber = 0;
        const lineHeight = 1.1, // ems
          y = textEl.attr('y'),
          dy = parseFloat(textEl.attr('dy'));
        let tspan = textEl.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(' '));
          if (tspan.node().getComputedTextLength() > txtWidth) {
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            tspan = textEl.append('tspan').attr('x', 0).attr('y', y).attr('dy', (++lineNumber * lineHeight + dy) + 'em').text(word + ' ');
          }
        }
      });
    };
    // Sort data
    if (countryList.hasOwnProperty('barType') && countryList.hasOwnProperty('sort')) {
      if (countryList['barType'] === '1' && countryList['sort'] === 'Ascending') {
        allData.sort((a, b) => {
          return a.dWtot_currency - b.dWtot_currency;
        });
      } else if (countryList['barType'] === '2' && countryList['sort'] === 'Ascending') {
        allData.sort((a, b) => {
          return a.dKtot - b.dKtot;
        });
      }
      if (countryList['barType'] === '1' && countryList['sort'] === 'Descending') {
        allData.sort((a, b) => {
          return b.dWtot_currency - a.dWtot_currency;
        });
      } else if (countryList['barType'] === '2' && countryList['sort'] === 'Descending') {
        allData.sort((a, b) => {
          return b.dKtot - a.dKtot;
        });
      }
      if ((countryList['barType'] === '1' || countryList['barType'] === '2') && countryList['sort'] === 'NORMAL') {
        allData = allDataClone;
      }
    }

    const plotChartAxes = (params) => {
      const yLabelPos = isCountryListObject ? 15 : 5;
      const labelOffset = -20;
      const xLabelPosition = width / 3.5;
      if (isNewChart) {
        // Adding lane lines
        laneChart.append('g')
          .call(params.gridLines.x)
          .classed('lanes', true)
          .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ',' + (margin.top - 5) + ')');
        // Adding X axis
        laneChart.append('g')
          .classed('x-axis', true)
          .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', ' + (margin.top - 5) + ')')
          .call(params.axis.x);
        laneChart.append('g')
          .classed('x-axis2', true)
          .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', ' + (height - 5) + ')')
          .call(params.axis.x2);
        // Adding x axis descriptive label
        laneChart.select('.x-axis')
          .append('text')
          .classed('x-axis-lb', true)
          .attr('x', 0)
          .attr('y', 0)
          .style('text-anchor', 'middle')
          .attr('transform', 'translate(' + xLabelPosition + ', ' + labelOffset + ')')
        laneChart.select('.x-axis2')
          .append('text')
          .classed('x-axis-lb2', true)
          .attr('x', 0)
          .attr('y', 0)
          .style('text-anchor', 'middle')
          .attr('transform', 'translate(' + xLabelPosition + ', ' + (margin.bottom) + ')')
        // Adding y axis labels
        laneChart.append('g')
          .classed('y-axis', true)
          .attr('transform', 'translate(' + margin.left + ', ' + yLabelPos + ')')
          .call(params.axis.y);
        // Adding y left-axis labels
        laneChart.select('.y-axis')
          .selectAll('.tick text')
          .call(textWrap, margin.left);

        //MIN and MAX labels
        //--------------------

        //this function generates Min and Max labels for the x-axis of the lane chart
        const generateMinMaxLabel = (distanceFromLeftofChart: number, text: string) => {
          // how far from the left of the svg should the label be placed
          const translatefromLeft = 'translate(' + (margin.left + spaceLblCh + distanceFromLeftofChart) + ', ' + (margin.top - 5) + ')';

          //Selects both svgs and appends label
          d3.select(`#${containerId} svg`)
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', translatefromLeft)
            .attr('y', -5)
            .style('font-size', '12px')
            .attr('fill', 'var(--gray-dark)')
            .text(text);
        }

        if (countryList.isNew) {
          //Min Label
          generateMinMaxLabel(0, 'min');
          //Max label
          const maxOff = isCountryListObject ? 215 : 250;
          generateMinMaxLabel(width - maxOff, 'max');
        }

      } else {
        // Update lane lines
        laneChart.selectAll('g.lanes')
          .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ',' + margin.top + ')')
          .call(params.gridLines.x);
        // Update x-axis labels
        laneChart.selectAll('g.x-axis')
          .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', ' + margin.top + ')')
          .call(params.axis.x);
        // Update y-axis labels
        laneChart.selectAll('g.y-axis')
          .attr('transform', 'translate(' + margin.left + ', ' + yLabelPos + ')')
          .call(params.axis.y);
        laneChart.select('.y-axis')
          .selectAll('.tick text')
          .call(textWrap, margin.left);
        // Update x-axis descriptive label style
        laneChart.select('.x-axis-lb')
          .style('text-anchor', 'middle')
          .attr('transform', 'translate(' + xLabelPosition + ', ' + labelOffset + ')')
      }
      // Apply UI styles in vertical lines to get them in base64 conversion process.
      laneChart.selectAll('g.lanes path')
        .style('fill', 'none')
        .style('stroke', '#485050')
        .style('stroke-dasharray', '2')
        .style('shape-rendering', 'crispEdges');
      laneChart.selectAll('g.lanes line')
        .style('fill', 'none')
        .style('stroke', '#485050')
        .style('stroke-dasharray', '2')
        .style('shape-rendering', 'crispEdges');
      // Apply UI styles in x axis element to get it in base 64 conversion process.
      laneChart.selectAll('g.x-axis path')
        .style('fill', 'none')
        .style('stroke', '#626262')
        .style('shape-rendering', 'crispEdges');
      laneChart.selectAll('g.x-axis line')
        .style('fill', 'none')
        .style('stroke', '#626262')
        .style('shape-rendering', 'crispEdges');
      // Apply UI styles in y axis element to get it in base 64 conversion process.
      laneChart.selectAll('g.y-axis path')
        .style('fill', 'none')
        .style('stroke', 'transparent')
        .style('shape-rendering', 'crispEdges');
      laneChart.selectAll('g.y-axis path')
        .style('fill', 'none')
        .style('stroke', 'transparent')
        .style('shape-rendering', 'crispEdges');
      // Adding UI styles in other y and x axes elements to get them in base64 conversion process.
      laneChart.selectAll('g.x-axis text')
        .style('fill', '#666')
        .style('font-weight', 'bold');
      laneChart.selectAll('g.x-axis text.x-axis-lb')
        .style('fill', '#666')
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '13px');
      laneChart.selectAll('g.y-axis g.tick text')
        .style('fill', '#666')
        .style('font-size', '13px');
      laneChart.selectAll('g.x-axis g.tick text')
        .style('fill', '#666')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('text-anchor', 'start');
    };

    const plotChart = (params) => {
      // Update domains
      // X domain
      const minFirstBarValue = d3.min(params.data, (d) => {
        return d.dWtot_currency;
      });
      const minSecondBarValue = d3.min(params.data, (d) => {
        return d.dKtot;
      });
      maxFirstBarValue = d3.max(params.data, (d) => {
        return d.dWtot_currency;
      });
      maxSecondBarValue = d3.max(params.data, (d) => {
        return d.dKtot;
      });
      minValues = [minFirstBarValue, minSecondBarValue];
      // min = isPolicyListObject ? this._minGDPNum : d3.min(minValues);
      min = d3.min(minValues);
      // maxValue = isPolicyListObject ? this._maxGDPNum : d3.max([maxFirstBarValue, maxSecondBarValue]);
      maxValue = d3.max([maxFirstBarValue, maxSecondBarValue]);
      if (min < -1) {
        xDomain = [min, maxValue];
        xLane.domain(xDomain).nice();
      }
      // Y Domain
      yDomainList = params.data.map(val => isCountryListObject ? val.id : val.label);
      yLane.domain(yDomainList);
      // Draw axes
      plotChartAxes(params);
      // Draw bar charts
      let eBar;
      let dataBars;
      let barLabels;
      if (isNewChart) {
        // Add empty bar charts container
        eBar = laneChart.append('g')
          .classed('e-bar', true);

        // Add bars with data container
        dataBars = laneChart.append('g')
          .classed('bar-charts', true)
          .attr('transform', 'translate(0,' + margin.top + ')');
        // Add right y-position bar labels container
        barLabels = laneChart.append('g')
          .classed('bar-labels', true)
          .attr('transform', 'translate(-10,' + margin.top + ')');
      } else {
        eBar = laneChart.select('.e-bar');
        dataBars = laneChart.select('.bar-charts');
        barLabels = laneChart.select('.bar-labels');
      }
      const barHeight = 15;
      const spaceBars = 5;
      // Exit phase
      eBar
        .selectAll('.empty-bar1')
        .data(params.data)
        .exit()
        .remove();
      eBar
        .selectAll('.empty-bar2')
        .data(params.data)
        .exit()
        .remove();
      dataBars
        .selectAll('.bar-chart1')
        .data(params.data)
        .exit()
        .remove();
      dataBars
        .selectAll('.bar-chart2')
        .data(params.data)
        .exit()
        .remove();
      barLabels
        .selectAll('.labels1')
        .data(params.data)
        .exit()
        .remove();
      barLabels
        .selectAll('.labels2')
        .data(params.data)
        .exit()
        .remove();
      // Enter phase
      eBar
        .selectAll('.empty-bar1')
        .data(params.data)
        .enter()
        .append('rect')
        .classed('empty-bar1', true);
      eBar
        .selectAll('.empty-bar2')
        .data(params.data)
        .enter()
        .append('rect')
        .classed('empty-bar2', true);
      dataBars.selectAll('.bar-chart1')
        .data(params.data)
        .enter()
        .append('rect')
        .classed('bar-chart1', true);
      dataBars.selectAll('.bar-chart2')
        .data(params.data)
        .enter()
        .append('rect')
        .classed('bar-chart2', true);
      barLabels.selectAll('.labels1')
        .data(params.data)
        .enter()
        .append('text')
        .classed('labels1', true);
      barLabels.selectAll('.labels2')
        .data(params.data)
        .enter()
        .append('text')
        .classed('labels2', true);
      // Update phase
      const formatNumericData = (data) => {
        let value: any = Math.abs(Math.round(data));
        const aThousand = 1000;
        if (value >= aThousand) {
          if (value % aThousand !== 0) {
            value = (value / aThousand).toString().replace('.', ',');
          } else {
            value = (value / aThousand).toFixed(3).replace('.', ',');
          }
        }
        return value;
      };
      const duration = forPrint ? 0 : 500;
      eBar
        .selectAll('.empty-bar1')
        .transition()
        .duration(duration)
        .ease('bounce')
        .attr('x', (d, i) => {
          return 0;
        })
        .attr('y', (d, i) => {
          const yParam = isCountryListObject ? d.id : d.label;
          return yLane(yParam);
        })
        .attr('rx', 10)
        .attr('ry', 30)
        .attr('width', (d) => {
          return width - margin.left - spaceLblCh - margin.right;
        })
        .attr('height', (d, i) => {
          return barHeight;
        })
        .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', 0)')
        // .style('fill', '#485050');
        .style('fill', 'transparent');
      // .style('fill', '#ffffff');
      eBar
        .selectAll('.empty-bar2')
        .transition()
        .duration(duration)
        .ease('bounce')
        .attr('x', (d, i) => {
          return 0;
        })
        .attr('y', (d, i) => {
          const yParam = isCountryListObject ? d.id : d.label;
          return yLane(yParam) + barHeight + spaceBars;
        })
        .attr('rx', 10)
        .attr('ry', 30)
        .attr('width', (d) => {
          return width - margin.left - spaceLblCh - margin.right;
        })
        .attr('height', (d, i) => {
          return barHeight;
        })
        .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', 0)')
        // .style('fill', '#485050');
        .style('fill', 'transparent');
      // .style('fill', '#ffffff');
      dataBars
        .selectAll('.bar-chart1')
        .transition()
        .duration(duration)
        .ease('bounce')
        .attr('x', (d, i) => {
          const data = d.dWtot_currency;
          let from = data;
          if (data >= 0) {
            from = 0;
          }
          return xLane(Math.min(0, data));
        })
        .attr('y', (d, i) => {
          const yParam = isCountryListObject ? d.id : d.label;
          return yLane(yParam);
        })
        .attr('rx', 10)
        .attr('ry', 30)
        .attr('width', (d) => {
          const data = d.dWtot_currency;
          const total = xLane(data);
          let fromZero = 0;
          if (data >= 0) {
            fromZero = xLane(0);
          }
          return Math.abs(total - xLane(0));
        })
        .attr('height', (d, i) => {
          return barHeight;
        })
        .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', 0)')
        .style('fill', '#6DCCDC');
      // .style('fill', '#4b5455');
      dataBars
        .selectAll('.bar-chart2')
        .transition()
        .duration(duration)
        .ease('bounce')
        .attr('x', (d, i) => {
          if (hideAvoidedAssetLosses) {
            return 0;
          }
          const data = d.dKtot;
          let from = data;
          if (data >= 0) {
            from = 0;
          }
          return xLane(Math.min(0, data));
        })
        .attr('y', (d, i) => {
          const yParam = isCountryListObject ? d.id : d.label;
          return yLane(yParam) + barHeight + spaceBars;
        })
        .attr('rx', 10)
        .attr('ry', 30)
        .attr('width', (d) => {
          const data = d.dKtot;
          const total = xLane(data);
          let fromZero = data;
          if (data >= 0) {
            fromZero = xLane(0);
          }
          return Math.abs(total - xLane(0));
        })
        .attr('height', (d, i) => {
          return barHeight;
        })
        .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', 0)')
        //.classed('fill--gray-green', true);
        .style('fill', "#7d8f8f" /*'var(--gray-green)'*//*'#C3D700'*/);
      // .style('fill', '#f3a277');
      barLabels
        .selectAll('.labels1')
        .transition()
        .duration(duration)
        .ease('bounce')
        .attr('x', (d, i) => {
          return width - 50;
        })
        .attr('y', (d, i) => {
          const yParam = isCountryListObject ? d.id : d.label;
          return yLane(yParam) + barHeight - spaceBars;
        })
        // .style('fill', '#4b5455')
        // .style('font-weight', 'bold')
        .text((d) => {
          let data;
          if (countryList['chartType'] === 'absolute') {
            data = (d.dWtot_currency < 0 ?
              '-$' + formatNumericData(d.dWtot_currency) : '$' + formatNumericData(d.dWtot_currency));
          } else {
            data = (d.dWtot_currency).toFixed(1) + '%';
          }
          // }
          return data;
        })
        .style('fill', '#666');
      barLabels
        .selectAll('.labels2')
        .transition()
        .duration(duration)
        .ease('bounce')
        .attr('x', (d, i) => {
          return width - 50;
        })
        .attr('y', (d, i) => {
          const yParam = isCountryListObject ? d.id : d.label;
          return yLane(yParam) + (barHeight * 2) + spaceBars;
        })
        // .style('fill', '#f3a277')
        // .style('font-weight', 'bold')
        .text((d) => {
          let data;
          if (hideAvoidedAssetLosses) {
            return '';
          }
          if (countryList['chartType'] === 'absolute') {
            data = (d.dKtot < 0 ? '-$' + formatNumericData(d.dKtot) : '$' + formatNumericData(d.dKtot));
          } else {
            data = (d.dKtot).toFixed(1) + '%';
          }
          return data;
        })
        .style('fill', '#666');

      barLabels.selectAll('text')
        .style('fill', '#666')
        .style('font-size', '13px');
      laneChart.selectAll('text')
        .style('fill', '#666');
    };
    plotChart({
      data: allData,
      axis: {
        x: xAxis,
        x2: xAxis2,
        y: yAxis
      },
      gridLines: {
        x: xGridLines
      }
    });
  }
  /**
   * Filters and saves output-indicator data by group name which either pertains a country or is set as Global.
   * @param {Object} outputData - Output-indicator data.
   * @param {String} groupName - Either a group name a country pertains or Global label.
   */
  filterOutputDataByGroup(outputData, groupName: string) {
    if (groupName === 'GLOBAL' || !groupName) {
      return outputData;
    }
    this._outputFilterObj = this._outputFilterObj || jQuery.extend(true, {}, outputData);
    const filteredOutputDomains = this._outputFilterObj;
    for (const key in outputData as any) {
      if (outputData.hasOwnProperty(key)) {
        for (const key2 in outputData[key] as any) {
          if (outputData[key].hasOwnProperty(key2) && (key2 === 'domain' || key2 === 'group_name')) {
            filteredOutputDomains[key][key2] = [];
          }
        }
        for (let i = 0; i < outputData[key]['group_name'].length; i++) {
          if (groupName === outputData[key]['group_name'][i]) {
            filteredOutputDomains[key]['domain'].push(outputData[key]['domain'][i]);
            filteredOutputDomains[key]['group_name'].push(outputData[key]['group_name'][i]);
          }
        }
      }
    }
    return filteredOutputDomains;
  }
  /**
   * Filters and saves input-indicator data by group name which either pertains a country or is set as Global.
   * @param {Object} inputData - Input-indicator data.
   * @param {String} groupName - Either a group name a country pertains or Global label.
   */
  filterInputDataByGroup(inputData, groupName?: string) {
    if (groupName === 'GLOBAL' || !groupName) {
      return inputData;
    }
    this._inputFilterObj = this._inputFilterObj || jQuery.extend(true, [], inputData);
    const filteredInputDomains = this._inputFilterObj;

    for (const g in filteredInputDomains) {
      if (filteredInputDomains.hasOwnProperty(g)) {
        if (filteredInputDomains[g]) {
          filteredInputDomains[g]['distribGroupArr'] = [];
        }
      }
    }
    for (const g in inputData) {
      if (inputData.hasOwnProperty(g)) {
        if (inputData[g]) {
          for (let m = 0; m < inputData[g]['distribGroupArr'].length; m++) {
            if (inputData[g]['distribGroupArr'][m]['group'] === groupName) {
              filteredInputDomains[g]['distribGroupArr'].push(inputData[g]['distribGroupArr'][m]);
            }
          }
        }
      }
    }
    return filteredInputDomains;
  }
  /**
   * Changes absolute to relative GDP values for Scorecard formatting data.
   * @param {String} str - Absolute GDP value
   */
  private changeRelativeValue(str) {
    this._outRelative = [];
    const res = str.substring(str.indexOf('(') + 1, str.indexOf(')'));
    const foo = ' (' + str.substring(0, str.indexOf('(') - 1) + ')';
    this._outRelative[0] = res + foo;
    const percent = str.substring(str.indexOf('(') + 1, str.indexOf(')') - 1);
    this._outRelative[1] = percent;
    return this._outRelative;
  }
  /**
   * Return formatted input-data values to be displayed in its respective charts.
   * @param {String} data - The input data to format.
   * @param {Object} input - Input-indicator model object.
   * @param {d3.brush} persistedBrush - D3 brush object to get its current value.
   */
  formatInputChartValues(data, input, persistedBrush?) {
    let percent = input.number_type === ('percent' || 'small_percent') ? '%' : '';
    let value: any = (input.key.indexOf('hazard') === 0 || input.key === 'macro_T_rebuild_K') ? +data.toFixed(1) : Math.round(+data);
    percent = input.key === 'macro_T_rebuild_K' ? ' Yrs' : percent;
    percent = input.key.indexOf('hazard') === 0 ? '%' : percent;
    if (input.key === 'k_cat_info__poor' || input.key === 'k_cat_info__nonpoor' || input.key === 'c_cat_info__poor' || input.key === 'c_cat_info__nonpoor') {
      const aThousand = 1000;
      value = Math.round(+value);
      if (value >= aThousand) {
        value /= aThousand;
        value = value.toFixed(3).replace('.', ',');
      }
      value = '$' + value;
    } else if (percent) {
      data = input.key === 'macro_T_rebuild_K' ? data : (persistedBrush ? (+persistedBrush.extent()[1]) * 100 : data * 100);
      value = ((input.key.indexOf('hazard') === 0 || input.key === 'macro_T_rebuild_K') ? data.toFixed(1) : Math.round(+data)) + percent;
    }
    return value;
  }
  /**
   * Return formatted input-data values to be displayed in the sliders.
   * @param {String} data - The input data to format.
   * @param {Object} input - Input-indicator model object.
   * @param {d3.brush} persistedBrush - D3 brush object to get its current value.
   */
  formatInputChartDifference(data, input, persistedBrush?) {
    let sign = data < 0 ? '-' : '+';
    let value = data < 0 ? -data : data;
    let formattedValue = this.formatInputChartValues(value, input, persistedBrush);
    if (formattedValue == '0.0%' || formattedValue == '$0') {
      sign = '';
    }
    return sign + ' ' + formattedValue;
  }
  /**
   * Returns converted SVG charts to base64 string.
   * @param {String} chartId - Chart id which the chart belongs to.
   * @param {Boolean} isFromInOutChart - Determines whether the chart container comes from output or input charts.
   * @param {String} innerKey - If the chart container is from output or input chart then its inner chart ids
   * are used to filter matched SVG ids
   */
  formatSVGChartBase64Strings(chartId, isFromInOutChart, innerKey?) {
    const id1 = `${chartId}-1`;
    const id2 = `${chartId}-2`;
    const chartCtn1 = jQuery(`#${id1}`);
    const chartCtn2 = jQuery(`#${id2}`);
    const chart1 = chartCtn1.find('svg');
    const chart2 = chartCtn2.find('svg');
    let ch1;
    let ch2;
    if (isFromInOutChart) {
      const filterFn = (idx, svg) => {
        const id = innerKey;
        return svg.id === id;
      };
      ch1 = chart1.filter(filterFn)[0];
      ch2 = chart2.filter(filterFn)[0];
    } else {
      ch1 = chart1[0];
      ch2 = chart2[0];
    }
    const svgPrefixStr = 'data:image/svg+xml;base64,';
    const ch1XMLStr = new XMLSerializer().serializeToString(ch1);
    const ch1Fmt = window.btoa(ch1XMLStr);
    const ch1Str = svgPrefixStr + ch1Fmt;
    const ch2XMLStr = new XMLSerializer().serializeToString(ch2);
    const ch2Fmt = window.btoa(ch2XMLStr);
    const ch2Str = svgPrefixStr + ch2Fmt;
    return {
      chart1: <string>ch1Str,
      chart2: <string>ch2Str
    };
  }
  /**
   * Returns the globalModel object.
   */
  getGlobalModelData() {
    return this._globalModelData;
  }
  /**
   * Returns default chart configuration object used in all required components of the app and by this service itself.
   */
  getChartsConf() {
    return {
      'outputs': {
        'risk_to_assets': {
          'descriptor': 'Risk to assets',
          'info': '(% of GDP)',
          'gradient': ['#f0f9e8', '#08589e'],
          'number_type': 'percent',
          'precision': 2
        },
        'resilience': {
          'descriptor': 'Socio-economic resilience',
          'info': '',
          'gradient': ['#990000', '#fef0d9'],
          'number_type': 'percent',
          'precision': 2
        },
        'risk': {
          'descriptor': 'Risk to well-being',
          'info': '(% of GDP)',
          'gradient': ['#edf8fb', '#6e016b'],
          'number_type': 'percent',
          'precision': 2
        }
      },
      'inputs': ['macro_T_rebuild_K', 'macro_borrow_abi', 'macro_prepare_scaleup', 'macro_tau_tax',
        'axfin_cat_info__nonpoor', 'axfin_cat_info__poor', 'gamma_SP_cat_info__poor', 'c_cat_info__nonpoor',
        'c_cat_info__poor', 'v_cat_info__nonpoor', 'v_cat_info__poor', 'shew_for_hazard_ratio',
        'hazard_ratio_fa__earthquake', 'hazard_ratio_fa__flood', 'hazard_ratio_flood_poor',
        'hazard_ratio_fa__tsunami', 'hazard_ratio_fa__wind'
      ],
      'inputTypes': {
        'inputSoc': ['gamma_SP_cat_info__poor', 'macro_tau_tax', 'macro_borrow_abi', 'macro_prepare_scaleup', 'macro_T_rebuild_K'],
        'inputEco': ['axfin_cat_info__poor', 'axfin_cat_info__nonpoor', 'c_cat_info__poor', 'c_cat_info__nonpoor'],
        'inputVul': ['v_cat_info__poor', 'v_cat_info__nonpoor', 'shew_for_hazard_ratio'],
        'inputExp': ['hazard_ratio_flood_poor', 'hazard_ratio_fa__flood',
          'hazard_ratio_fa__earthquake', 'hazard_ratio_fa__tsunami', 'hazard_ratio_fa__wind']
      },
      'hazardTypes': {
        'hazardFlood': ['hazard_ratio_flood_poor', 'hazard_ratio_fa__flood'],
        'hazardEarthquake': ['hazard_ratio_fa__earthquake'],
        'hazardTsunami': ['hazard_ratio_fa__tsunami'],
        'hazardWindstorm': ['hazard_ratio_fa__wind']
      },
      'policyList': [
        {
          'id': 'axfin',
          'label': 'Universal access to finance',
          'mapping': 'axfin',
          'hideAvoidedAssetLosses': true
        }, {
          'id': 'fap',
          'label': 'Reduce exposure of the poor by 5% of total exposure',
          'mapping': 'v_cat_info__poor',
          'hideAvoidedAssetLosses': false
        }, {
          'id': 'far',
          'label': 'Reduce exposure of the nonpoor by 5% of total exposure',
          'mapping': 'v_cat_info__nonpoor',
          'hideAvoidedAssetLosses': false
        }, {
          'id': 'kp',
          'label': 'Increase income of the poor 10%',
          'mapping': 'k_cat_info__poor',
          'hideAvoidedAssetLosses': false
        }, {
          'id': 'pdspackage',
          'label': 'Postdisaster support package',
          'mapping': 'optionPDS',
          'hideAvoidedAssetLosses': true
        }, {
          'id': 'prop_nonpoor',
          'label': 'Develop market insurance (nonpoor people)',
          'mapping': 'optionFee',
          'hideAvoidedAssetLosses': true
        }, {
          'id': 'shew',
          'label': 'Universal access to early warnings',
          'mapping': 'shew_for_hazard_ratio',
          'hideAvoidedAssetLosses': false
        }, {
          'id': 'social_p',
          'label': 'Increase social transfers to poor people to at least 33%',
          'mapping': 'gamma_SP_cat_info__poor',
          'hideAvoidedAssetLosses': true
        }, {
          'id': 't_rebuild_k',
          'label': 'Accelerate reconstruction (by 33%)',
          'mapping': 'macro_T_rebuild_K',
          'hideAvoidedAssetLosses': true
        }, {
          'id': 'vp',
          'label': 'Reduce asset vulnerability (by 30%) of poor people (5% population)',
          'mapping': 'v_cat_info__poor',
          'hideAvoidedAssetLosses': false
        }, {
          'id': 'vr',
          'label': 'Reduce asset vulnerability (by 30%) of nonpoor people (5% population)',
          'mapping': 'v_cat_info__nonpoor',
          'hideAvoidedAssetLosses': false
        }
      ],
      'policyMetrics': ['dK', 'dKtot', 'dWpc_currency', 'dWtot_currency'],
      'inputs_info': 'inputs_info_wrapper.csv',
      'default_input': 'axfin_cat_info__poor',
      'default_output': 'resilience',
      'default_feature': 'AUS',
      'model_data': 'df_for_wrapper.csv',
      'model_scp_data': 'df_for_wrapper_scp.csv',
      'model_function': 'res_ind_lib.compute_resilience_from_packed_inputs',
      'policy_model_fn': 'res_ind_lib_big.compute_resilience_from_adjusted_inputs_for_pol',
      'pop': 'macro_pop',
      'gdp': 'macro_gdp_pc_pp',
      'map': {
        'width': 500,
        'height': 350
      }
    };
  }
  /**
   * Returns country group data object.
   */
  getCountryGroupData() {
    return this._countryGroupData;
  }
  /**
   * Returns input-indicator model data object.
   */
  getInputDataObj() {
    return this._inputConfig;
  }
  /**
   * Returns default input data object.
   */
  getInputData() {
    return this._inputDomains;
  }
  getInputLabels() {
    return this._inputLabels;
  }
  /**
   * Returns persisted input-data observable.
   */
  getInputDataObs() {
    return this._inputDataProm$;
  }
  /**
   * Returns input-chart id by general input type
   * @param {String} type - Genreal input type
   */
  getInputIdChartByType(type: string) {
    const inputTypes = this.getChartsConf().inputTypes;
    return inputTypes[type];
  }
  /**
   * Returns new output-input model data by sending it slider values from Viewer
   * page as form-data content type.
   * @param {Object} data - Persisted slider values.
   */
  getInputPModelData(data: ViewerModel): Observable<Response> {
    const url = SERVER.URL.BASE_SERVER_PY + SERVER.URL.SERVER_INPUT_PY;
    const chartConf = this.getChartsConf();
    const model = chartConf.model_function;
    const modelData = chartConf.model_data;
    const formData = new URLSearchParams();
    formData.append('d', JSON.stringify(data));
    formData.append('g', '');
    formData.append('m', model);
    formData.append('i_df', modelData);
    console.log(url, data, formData)
    return this.webService.post(url, formData)
      .map((res: Response) => {
        // console.log('res', res['_body'])
        return res.json();
      }).catch(this.webService.errorHandler);
  }
  /**
   * DEPRECATED. Returns max GDP value to be set in the X-coordinate of a Scorecard chart.
   */
  getMaxGDPCountryValue() {
    return this._maxGDPNum;
  }
  /**
   * DEPRECATED. Return set of max min Country GDP values to be set in a Scorecard chart.
   */
  getMaxMinGDPCountryValues() {
    return this._maxMinCountryXValues;
  }
  /**
   * Returns a set of countries by an specific scorecard policy name.
   * @param {String} policy -  Scorecard policy name.
   */
  getMetricAllCountriesSinglePolicy(policy) {
    const allCountriesPolicy = this._newPolicyGroupedByPolicyObj;
    return allCountriesPolicy[policy];
  }
  /**
   * Returns a set of scorecard policies by an specific country name.
   * @param countryName
   */
  getMetricAllPoliciesSingleCountry(countryName: string) {
    const allPoliciesCountry = this._newPolicyGroupedByCountryObj;
    return allPoliciesCountry[countryName];
  }
  /**
   * Returns output model data.
   */
  getOutputData() {
    return this._outputDomains;
  }
  /**
   * Returns persisted output-data observable
   */
  getOutputDataObs() {
    return this._outputDataProm$;
  }
  /**
   * Returns output-model country list.
   */
  getOutputDataUIList() {
    return this._outputUIList;
  }
  /**
   * /**
   * Returns output-model list.
   */
  getOutputList() {
    return this._outputList;
  }
  /**
   * Return Scorecard policy list data
   */
  getPolicyListData() {
    return this._policyInfoObj;
  }
  /**
   * DEPRECATED. Returns poloicy data grouped by region.
   */
  getRegionalPolicyData() {
    return this._regionalPoliciesInfoObj;
  }
  /**
   * Retrieves Scorecard policies data by their CSV files and encapsulates it in a observable promise data.
   */
  getScorecardData() {
    const url = SERVER.URL.BASE;
    const axfinUrl = url + SERVER.URL.AXFIN_DATA;
    const fapUrl = url + SERVER.URL.FAP_DATA;
    const farUrl = url + SERVER.URL.FAR_DATA;
    const kpUrl = url + SERVER.URL.KP_DATA;
    const pdsUrl = url + SERVER.URL.PDS_DATA;
    const propUrl = url + SERVER.URL.PROP_DATA;
    const shewUrl = url + SERVER.URL.SHEW_DATA;
    const socialUrl = url + SERVER.URL.SOCIAL_DATA;
    const tkUrl = url + SERVER.URL.TK_DATA;
    const vpUrl = url + SERVER.URL.VP_DATA;
    const vrUrl = url + SERVER.URL.VR_DATA;
    const chartConf = this.getChartsConf();
    const policyList = chartConf.policyList;
    const promisedData = new Promise((resolve, reject) => {
      d3Q.queue()
        .defer(d3.csv, axfinUrl)
        .defer(d3.csv, fapUrl)
        .defer(d3.csv, farUrl)
        .defer(d3.csv, kpUrl)
        .defer(d3.csv, pdsUrl)
        .defer(d3.csv, propUrl)
        .defer(d3.csv, shewUrl)
        .defer(d3.csv, socialUrl)
        .defer(d3.csv, tkUrl)
        .defer(d3.csv, vpUrl)
        .defer(d3.csv, vrUrl)
        .await((err, axfin, fap, far, kp, pdsPackage, propNonpoor, shew, socialP, tRebuildK, vp, vr) => {
          if (err) { reject(err); }
          const data = [axfin, fap, far, kp, pdsPackage, propNonpoor, shew, socialP, tRebuildK, vp, vr];
          resolve(data);
        });
    });
    this._scoreCardDataObs$ = Observable.fromPromise(promisedData);
  }
  /**
   * Returns scorecard data promise observable
   */
  getScoreCardDataObs() {
    return this._scoreCardDataObs$;
  }
  /**
   * Inits output-data default configuration
   */
  initOutputChartConf() {
    this.setOutputData();
  }
  /**
   * Inits scorecard-data default configuration
   */
  initScorecardChartConf() {
    this.getScorecardData();
  }
  /**
   * @event brush - This event is triggered when a D3 brush component is moved
   * from one side to another when a input chart has updated its data.
   * @param {String} containerId - input chart id.
   * @param {Object} input - Input-indicator model object.
   */
  _inputBrushMoveEv(containerId, input) {
    const me = this;
    return () => {
      const inputId = containerId.indexOf('1') >= 0 ? 'input1' : 'input2';
      const toUpd = me._inputConfig[input.key][inputId].forUpdate;
      jQuery('#' + containerId + ' svg#' + input.key + ' #mask-' + input.key).empty();
      const s = me._inputConfig[input.key][inputId].brush.extent();
      const clip = toUpd.b(toUpd.distribData, s[1]);
      const selected = toUpd.distribData.slice(0, clip);
      selected.push(s[1]);
      const mask = d3.select(`#${containerId} svg#${input.key} #mask-${input.key}`);
      mask.selectAll('#' + containerId + ' g#mask-' + input.key + '.mask')
        .data([science.stats.bandwidth.nrd0])
        .enter()
        .append('path')
        // .style('fill', '#50C4CF')
        .style('fill', '#e4e4e4')
        .style('opacity', '1')
        .attr('d', (d) => {
          return toUpd.a(toUpd.kde.bandwidth(d)(selected));
        });
      d3.select('#' + containerId + ' #' + input.key + ' g.resize.e path')
        .attr('d', 'M 0, 0 ' + ' L 0 ' + input.height);
      const span = jQuery('#' + containerId + ' #table-' + input.key + ' span.value');
      span.empty();
      span.html(() => {
        const persistedBrush = me._inputConfig[input.key][inputId].brush;
        const ext = +persistedBrush.extent()[1];
        const value = me.formatInputChartValues(ext, input, persistedBrush);
        return value;
      });
    };
  }
  /**
   * This method merges input-model data into a complete input-model data.
   * @param {Array} inputArr - Set of Input-indicator values.
   * @param {Object} _globalModelData - Global model object data.
   */
  private _populateInputDomains(inputArr, _globalModelData) {
    const inputIds = this.getChartsConf().inputs;
    const inputDomains = [];
    // this._globalModelData = _globalModelData;
    inputArr.forEach((val, index, arr) => {
      if (inputIds.indexOf(val.key) >= 0) {
        const inpObj: any = {};
        inpObj.key = val.key;
        inpObj.descriptor = val.descriptor;
        inpObj.distribGroupArr = [];
        inpObj.lower = +val.lower;
        inpObj.upper = +val.upper;
        inpObj.number_type = val.number_type;
        jQuery.each(_globalModelData, (ind, globalObj) => {
          if (!isNaN(globalObj[val.key])) {
            const value = +globalObj[val.key];
            const obj: any = {};
            if (inpObj.lower === 0 && inpObj.upper === 0) {
              obj.distribution = value;
              obj.group = globalObj['group_name'];
              inpObj.distribGroupArr.push(obj);
            } else if (value > inpObj.upper) {
              globalObj[val.key] = inpObj.upper;
              obj.distribution = inpObj.upper;
              obj.group = globalObj['group_name'];
              inpObj.distribGroupArr.push(obj);
            } else {
              obj.distribution = value;
              obj.group = globalObj['group_name'];
              inpObj.distribGroupArr.push(obj);
            }
            // obj.group = globalObj['group_name'];
            // inpObj.distribGroupArr.push(obj);
          }
        });
        this._sortByKey(inpObj.distribGroupArr, 'distribution');
        inputDomains.push(inpObj);
      }
    });
    return inputDomains;
  }
  /**
   * Retrieves input-model data from CSV file in order to saved into a input-model object data.
   * @param {Object} _globalModelData - Global model object data.
   */
  setInputData(_globalModelData: any) {
    const url = `${this._baseURL}${this._inputInfoURL}`;
    const promisedData = new Promise((resolve, reject) => {
      d3.csv(url, (err, data: any) => {
        if (err) { reject(err); }
        const inputDomainsArr = [];
        data.forEach((value) => {
          const inputObj = {};
          const descArr = this.parseDesc(value.descriptor);
          inputObj['key'] = value.key;
          inputObj['descriptor'] = descArr[0]; //value.descriptor;
          inputObj['info'] = descArr[1];

          inputObj['lower'] = +value.lower;
          inputObj['upper'] = +value.upper;
          inputObj['number_type'] = value.number_type;
          inputDomainsArr.push(inputObj);
          if (this._inputLabels == null) {
            this._inputLabels = {};
          }
          if (this._inputLabels[value.key] == null) {
            this._inputLabels[value.key] = {};
          }
          this._inputLabels[value.key].key = value.key;
          this._inputLabels[value.key].descriptor = descArr[0]; // value.descriptor;
          this._inputLabels[value.key].info =  descArr[1];
          this._inputLabels[value.key].lower = +value.lower;
          this._inputLabels[value.key].upper = +value.upper;
          this._inputLabels[value.key].number_type = value.number_type;
        });
        this._inputDomains = this._populateInputDomains(inputDomainsArr, _globalModelData);
        resolve(this._inputDomains);
      });
    });
    return promisedData;
    // this._inputDataProm$ = Observable.fromPromise(promisedData);
  }

  parseDesc(desc) {
    const arr = desc.split(' (');
    return [arr[0], (arr[1] || '').replace(')', '')];
  }

  /**
   * Retrieves output-model data from CSV file in order to saved into a output-model object data.
   */
  setOutputData() {
    const outputConf = this.getChartsConf().outputs;
    Object.keys(outputConf).forEach(key => {
      this._outputDomains[key] = outputConf[key];
      this._outputDomains[key]['domain'] = [];
      this._outputDomains[key]['group_name'] = [];
    });
    const url = `${this._baseURL}${this._outputDataURL}`;
    this._outputUIList = [];

    const promisedData = new Promise((resolve, reject) => {
      d3.csv(url, (err, data: any) => {
        if (err) { reject(err); }

        data.forEach((value, index, arr) => {
          for (const key in value) {
            if (value.hasOwnProperty(key)) {
              if (isFinite(value[key])) {
                value[key] = +value[key];
              }
              if (this._outputDomains.hasOwnProperty(key)) {
                this._outputDomains[key]['domain'].push(value[key]);
                this._outputDomains[key]['group_name'].push(value['group_name']);
              }
            }
          }
          if (!this._countryGroupData[value['group_name']]) {
            this._countryGroupData[value['group_name']] = value['group_name'];
          }
          this._globalModelData[value.id] = value;
          this._outputList.push({
            code: value.id,
            name: value.name,
            group: value.group_name
          });
          this._outputUIList.push(value.name);
        });
        resolve({
          _outputDomains: this._outputDomains,
          _globalModelData: this._globalModelData
        });
      });
    });
    this._outputDataProm$ = Observable.fromPromise(promisedData);
  }
  /**
   * Retrieves Scorecard data configuration in two main objects @public _newPolicyGroupedByCountryObj
   * and @public _newPolicyGroupedByPolicyObj to be displayed in its corresponding page.
   * @param {Object} data - Scorecard data to be used.
   */
  setPoliciesData(data) {
    // this._policyInfoObj = data;
    const chartConf = this.getChartsConf();
    const policyList = chartConf.policyList;
    const policyIds = policyList.map((val) => {
      return val.id;
    });
    let out;
    let key: any;
    let str;
    for (let i = 0; i < data.length; i++) {
      if (i === 0) { // initialize the country object.
        for (let k = 0; k < data[i].length; k++) {
          this._newPolicyGroupedByCountryObj[data[i][k][d3.keys(data[i][k])[0]]] = {}; // countryName = {}
        }
      }
      for (let j = 0; j < data[i].length; j++) {
        for (key in data[i][j]) {
          if (key === 'Asset losses label' || key === 'Wellbeing losses  label' ||
            key === 'Asset losses value' || key === 'Wellbeing losses value') {
            // skip it since new line characters are coming on certain headers
          } else {
            this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]] = {}; // countryName["axfin"] = {}
            break;
          }
        }
        this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]]['asset_losses_label'] = data[i][j]['Asset losses label'];
        this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]]
        ['wellbeing_losses_label'] = data[i][j]['Wellbeing losses  label'];

        this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]]['num_asset_losses_label'] = data[i][j]['Asset losses value'];
        this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]]
        ['num_wellbeing_losses_label'] = data[i][j]['Wellbeing losses value'];

        str = this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]]['asset_losses_label'];
        out = this.changeRelativeValue(str);
        this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]]['rel_asset_losses_label'] = out[0];
        this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]]['rel_num_asset_losses_label'] = out[1];

        str = this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]]['wellbeing_losses_label'];
        out = this.changeRelativeValue(str);
        this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]]['rel_wellbeing_losses_label'] = out[0];
        this._newPolicyGroupedByCountryObj[data[i][j][key]][policyIds[i]]['rel_num_wellbeing_losses_label'] = out[1];
      }
    }

    for (let i = 0; i < data.length; i++) {
      this._newPolicyGroupedByPolicyObj[policyIds[i]] = {}; // initialize the policy object. //axfin = {}
    }

    let idxPol = ''; // index for unique column name for that policy
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        for (key in data[i][j]) {
          if (key === 'Asset losses label' || key === 'Wellbeing losses  label' ||
            key === 'Asset losses value' || key === 'Wellbeing losses value') {
            // skip it since new line characters are coming on certain headers
          } else {
            this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][key]] = {}; // axfin["countryName"] = {}
            idxPol = key;
            break; // break once you find the main column
          }
        }
        for (key in data[i][j]) {
          if (key === 'Asset losses label') {
            this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][idxPol]]['asset_losses_label'] = data[i][j]['Asset losses label'];
            str = this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][idxPol]]['asset_losses_label'];
            out = this.changeRelativeValue(str);
            this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][idxPol]]['rel_asset_losses_label'] = out[0];
            this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][idxPol]]['rel_num_asset_losses_label'] = out[1];
          } else if (key === 'Wellbeing losses  label') {
            this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][idxPol]]
            ['wellbeing_losses_label'] = data[i][j]['Wellbeing losses  label'];
            str = this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][idxPol]]['wellbeing_losses_label'];
            out = this.changeRelativeValue(str);
            this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][idxPol]]['rel_wellbeing_losses_label'] = out[0];
            this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][idxPol]]['rel_num_wellbeing_losses_label'] = out[1];
          } else if (key === 'Asset losses value') {
            this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][idxPol]]
            ['num_asset_losses_label'] = data[i][j]['Asset losses value'];
          } else if (key === 'Wellbeing losses value') {
            this._newPolicyGroupedByPolicyObj[policyIds[i]][data[i][j][idxPol]]
            ['num_wellbeing_losses_label'] = data[i][j]['Wellbeing losses value'];
          }
        }
      }
    }
  }
  /**
   * Sorts an array given its element be set as a object.
   * @param array
   * @param key
   */
  private _sortByKey(array, key) {
    array.sort((a, b) => {
      const x = a[key]; const y = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }
  /**
   * Change Scorecard chart font-type labels in order to be recognized while being converted as base64 string.
   * @param isScoreCardList
   * @param isPDF
   */
  switchScoreCardChartFont(isScoreCardList, isPDF) {
    const chartId1 = isScoreCardList ? 'policy-list-1' : 'policy-measure-1';
    const chartId2 = isScoreCardList ? 'policy-list-2' : 'policy-measure-2';
    const chart1 = jQuery(`#${chartId1} svg`);
    const chart2 = jQuery(`#${chartId2} svg`);
    let fontFamilyTxt = 'Lato, Helvetica Neue, Helvetica, Arial, sans-serif';
    if (isPDF) {
      fontFamilyTxt = 'Arial';
    }
    chart1.find('text').css('font-family', fontFamilyTxt);
    chart2.find('text').css('font-family', fontFamilyTxt);
  }
  /**
   * Unsubscribes output data observable
   */
  unsubscribeOutputData() {
    this._outputDataSubs.unsubscribe();
  }
  /**
   * Updates input-indicator model chart, slider values and input chart values.
   * @param {String} containerId -  Input container element id
   * @param {Object} sliderValues - Input slider object model
   * @param {String} selectedId - Verifies whether a country iso code or global label is set
   * @param {String} groupName - Group name a country pertains or Global label is set.
   */
  updateInputCharts(containerId: string, sliderValues: any, selectedId?: string, groupName?: string) {
    const config = this._inputConfig;
    jQuery.each(config, (conf, inpObj) => {
      const ini = d3.select(`#${containerId} svg#` + conf + ' g.initial line');
      const iniEl = ini[0][0];
      if (iniEl || 1) {
        let model;
        const inputId = containerId.indexOf('1') >= 0 ? 'input1' : 'input2';
        const input = inpObj[inputId];
        if (selectedId === 'global') {
          const data: Array<number> = [];
          this._sortByKey(input.distribGroupArr, 'distribution');
          input.distribGroupArr.forEach(val => data.push(val.distribution));
          const globalData = d3.mean(data);
          model = {};
          model[conf] = globalData;
        } else {
          model = this._globalModelData[selectedId];
        }
        if (selectedId === 'global') {
          sliderValues[conf + '_display_value'] = this.formatInputChartValues(0, input);
          sliderValues[conf + '_baseline_value'] = this.formatInputChartValues(0, input);
          sliderValues[conf + '_difference_value'] = this.formatInputChartDifference(sliderValues[conf + '_default_value'] - 0, input);
          sliderValues[conf].value = 0;
          sliderValues[conf + '_value'] = 0;
          sliderValues[conf + '_original_value'] =
            sliderValues[conf + '_display_value'].replace('$', '').replace(',', '');
        } else {
          switch (conf) {
            case 'gamma_SP_cat_info__poor':
            case 'macro_tau_tax':
            case 'macro_borrow_abi':
            case 'macro_prepare_scaleup':
            case 'axfin_cat_info__poor':
            case 'axfin_cat_info__nonpoor':
            case 'v_cat_info__poor':
            case 'v_cat_info__nonpoor':
            case 'shew_for_hazard_ratio':
              model[conf] = model[conf] > 1 ? 1 : model[conf];
              model[conf] = model[conf] < 0 ? 0 : model[conf];
              break;
            default: break;
          }
          sliderValues[conf + '_display_value'] = this.formatInputChartValues(model[conf], input);
          sliderValues[conf + '_baseline_value'] = this.formatInputChartValues(model[conf], input);
          sliderValues[conf + '_default_value'] = model[conf];
          sliderValues[conf + '_difference_value'] = this.formatInputChartDifference(sliderValues[conf + '_default_value'] - model[conf], input);
          sliderValues[conf].value = model[conf];
          sliderValues[conf + '_value'] = model[conf] / (sliderValues[conf].max + sliderValues[conf].min) * 100;
          sliderValues[conf + '_original_value'] =
            ('' + sliderValues[conf + '_display_value']).replace('$', '').replace(',', '');
        }
        /*
        ini.attr('x1', function (d) {
          return input.x(+model[conf]);
        })
          .attr('y1', 0)
          .attr('x2', function (d) {
            return input.x(+model[conf]);
          })
          .attr('y2', input.height);
        // get the input config
        const brush = input.brush;
        const toUpd = input.forUpdate;
        // get the value of the current input from the model
        // and update the brush extent
        let extent = brush.extent()[1];
        if (groupName === 'GLOBAL' || !groupName) {
          extent = +model[conf];
        }
        brush.extent([0, extent]);
        const brushg = d3.selectAll(`#${containerId} svg#${conf} g.brush`);
        const me = this;
        brush.on('brush', me._inputBrushMoveEv.call(me, containerId, input));
        brushg.transition()
          .duration(750)
          .call(brush)
          .call(brush.event);

        brushg.style('pointer-events', 'none');
        const brushEl = brushg[0][0];
        // Will break app with phase 2 changes.
        brushEl.removeAllListeners();

        d3.selectAll(`#${containerId} g.brush > g.resize.w`).remove();
        */
      }
      // remove existing initial marker
    });
  }
  /**
   * Updates output-indicator model chart and its values
   * @param {String} containerId -  Output container element id
   * @param {String} selectedId - Verifies whether a country iso code or global label is set
   * @param {String} groupName - Group name a country pertains or Global label is set.
   */
  updateContents(first, second) {
    this.subscription();
    //chart 1
    const risk_to_assetts1 = jQuery(`#outputs-1 #risk_to_assets .text-number`);
    const resilience1 = jQuery(`#outputs-1 #resilience .text-number`);
    const risk1 = jQuery(`#outputs-1 #risk .text-number`);
    //chart 2
    const risk_to_assetts2 = jQuery(`#outputs-2 #risk_to_assets .text-number`);
    const resilience2 = jQuery(`#outputs-2 #resilience .text-number`);
    const risk2 = jQuery(`#outputs-2 #risk .text-number`);
    if (this.type !== 'tech') {
      if (risk_to_assetts1.contents().length > 1) {
        this.chart1Data.rta = risk_to_assetts1.contents()[0].nodeValue;
        this.chart1Data.res = resilience1.contents()[0].nodeValue;
        this.chart1Data.risk = risk1.contents()[0].nodeValue;
        this.chart2Data.rta = risk_to_assetts2.contents()[0].nodeValue;
        this.chart2Data.res = resilience2.contents()[0].nodeValue;
        this.chart2Data.risk = risk2.contents()[0].nodeValue;

        // console.log(risk_to_assetts1.contents());
        risk_to_assetts1.html(risk_to_assetts1.contents()[2].nodeValue);
        resilience1.html(resilience1.contents()[0].nodeValue);
        risk1.html(risk1.contents()[2].nodeValue);
        // chart 2
        risk_to_assetts2.html(risk_to_assetts2.contents()[2].nodeValue);
        resilience2.html(resilience2.contents()[0].nodeValue);
        risk2.html(risk2.contents()[2].nodeValue);
      }
    } else {
      //  console.log('estoy entrando al else');
      let dollarRTA1 = '$0';
      let percentage1 = '+0.00%';
      let dollarRISK1 = '$0';
      let dollarRTA2 = '$0';
      let percentage2 = '+0.00%';
      let dollarRISK2 = '$0';
      if (first === this.firstCountry) {
        if (this.chart1Data.rta) {
          dollarRTA1 = this.chart1Data.rta;
          percentage1 = this.chart1Data.res;
          dollarRISK1 = this.chart1Data.risk;
        }
        this.chart1Data.rta = '';
        this.chart1Data.res = '';
        this.chart1Data.risk = '';
      }
      if (second === this.secondCountry) {
        if (this.chart2Data.rta) {
          dollarRTA2 = this.chart2Data.rta;
          percentage2 = this.chart2Data.res;
          dollarRISK2 = this.chart2Data.risk;
        }
        this.chart2Data.rta = '';
        this.chart2Data.res = '';
        this.chart2Data.risk = '';
      }
      const contentRTA1 = `${dollarRTA1} <br /> ${risk_to_assetts1.contents()[0].nodeValue}`;
      const contentRES1 = `${percentage1} <br /> ${resilience1.contents()[0].nodeValue}`;
      const contentRISK1 = `${dollarRISK1} <br />${risk1.contents()[0].nodeValue}`;
      const contentRTA2 = `${dollarRTA2} <br /> ${risk_to_assetts2.contents()[0].nodeValue}`;
      const contentRES2 = `${percentage2} <br /> ${resilience2.contents()[0].nodeValue}`;
      const contentRISK2 = `${dollarRISK2} <br />${risk2.contents()[0].nodeValue}`;
      //console.log(contentRTA1);
      risk_to_assetts1.html(contentRTA1);
      resilience1.html(contentRES1);
      risk1.html(contentRISK1);
      risk_to_assetts2.html(contentRTA2);
      resilience2.html(contentRES2);
      risk2.html(contentRISK2);
    }
    this.firstCountry = first;
    this.secondCountry = second;
  }

  updateOutputCharts(containerId: string, selectedId?: any, groupName?: string, brush2?: boolean, tech?: boolean) {
    const domains = this.filterOutputDataByGroup(this._outputDomains, groupName);

    const me = this;
    jQuery.each(domains, (idx, outputData) => {
      const numericSection = containerId.substring(containerId.length - 1);
      const chartId = `output-${(idx === 'risk_to_assets') ? 'risk_to_assets' : idx}_${numericSection}`;

      const ini = d3.select(`#${containerId} svg#${idx} g.initial line`);

      const outputId = containerId.indexOf('1') >= 0 ? 'output1' : 'output2';
      const x = outputData[outputId].x;
      const height = outputData[outputId].height;
      let model;
      let avgDoll = 0;
      if (typeof selectedId === 'object') {
        model = selectedId['model'];
        avgDoll = Math.round((+model['macro_gdp_pc_pp']) * (+model['macro_pop']));
      } else if (selectedId === 'global') {
        const data: Array<number> = outputData.domain.sort((a, b) => {
          return a - b;
        });
        const globalData = d3.mean(data);
        model = {};
        model[idx] = globalData;
        avgDoll = this.calculateAVGGDPValue(idx);
      } else {
        model = this._globalModelData[selectedId];
        avgDoll = Math.round((+model['macro_gdp_pc_pp']) * (+model['macro_pop']));
      }

      // IS NOT VISIABLE. Am not sure if it has any use.
      ini.attr('x1', (d) => {
        return x(+model[idx]);
      })
        .attr('y1', 0)
        .attr('x2', (d) => {
          return x(+model[idx]);
        })
        .attr('y2', height);

      // get the input config
      const brush = outputData[outputId].brush;
      // get the value of the current input from the model
      // and update the brush extent
      let extent = brush.extent()[1];
      let oldExtent = outputData[outputId].default;
      // if (groupName === 'GLOBAL' || !groupName) {
      extent = +model[idx];
      // }

      brush.extent([0, extent]);
      const output = outputData;
      const precision = +output.precision;
      const numericValue = (brush.extent()[1] * 100).toFixed(precision);
      let oldValue = null;
      if (!brush2) {
        oldValue = (oldExtent * 100).toFixed(precision);
      }
      // This updates this._outputDomains[key]['chart'][containerId].
      const value = me.calculateGDPValues(containerId, idx, numericValue, avgDoll, precision, oldValue);
      const newChartId = chartId.slice(0, -2).replace('output-', '');

      jQuery(`#${containerId} #${chartId} .text-number`).html(value);
      // Hack for updating chart text on policy priority list
      jQuery(`#${containerId} #${newChartId} .text-number`).html(value);
      const brushg = d3.selectAll(`#${containerId} svg#${idx} g.brush`);
      const path = brushg.select('path');
      path.style('visibility', tech ? 'visible' : 'hidden');
      brushg.transition()
        .duration(750)
        .call(brush)
        .call(brush.event);

      // remove w resize extent handle
      d3.selectAll(`#${containerId} g.brush > g.resize.w`).remove();
      if (brush2) {
        outputData[outputId].default = extent;
        const brushg2 = d3.selectAll(`#${containerId} svg#${idx} g.brush2`);
        brushg2.transition()
          .duration(750)
          .call(brush)
          .call(brush.event);
        // remove w resize extent handle
        d3.selectAll(`#${containerId} g.brush2 > g.resize.w`).remove();
      }
    });
  }
}
