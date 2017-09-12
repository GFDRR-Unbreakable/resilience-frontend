import { Injectable, Output } from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/observable/fromPromise';
import * as d3 from 'd3/d3.js';
import * as science from 'science/index.js';
import {SERVER} from './server.conf';
import {WebService} from '../services/web.service';
import {ViewerModel} from '../store/model/viewer.model';
import {URLSearchParams} from '@angular/http';

@Injectable()
export class ChartService {
  private _outputDataProm$: Observable<any>;
  private _inputDataProm$: Observable<any>;
  private _baseURL = SERVER.URL.BASE;
  private _outputDataURL = SERVER.URL.OUTPUT_DATA;
  private _inputInfoURL = SERVER.URL.INPUTS_INFO;
  private _inputDomains: any;
  private _inputConfig: any = {};
  private _outputDomains: any = {};
  private _globalModelData: any = {};
  private _countryGroupData: any = {};
  private _policyInfoObj: any = null;
  private _regionalPoliciesInfoObj: any = {};
  private _outputDataSubs: Subscription;
  public _outputUIList: Array<any> = [];
  public _outputList: Array<any> = [];
  private _scoreCardDataObs$: Observable<any>;
  constructor(private webService: WebService) { }
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
        outputMetricAvgInfo[group][`avg_${val}`] = outputMetricAvgInfo[group][`sum_${val}`] / outputMetricAvgInfo[group][`count_${val}`];
      });
    });
    return outputMetricAvgInfo;
  }
  createInputCharts(inputData: any, containerId: string, sliderValues: any, groupName?: string) {
    jQuery(`div#${containerId}`).empty();
    const filteredInputData = this.filterInputDataByGroup(inputData, groupName);
    const inputTypeTxt = containerId.split('-')[0];
    const inputTypes = this.getInputIdChartByType(inputTypeTxt);
    const filterInputType = filteredInputData.filter(val => {
      return inputTypes.filter(type => {
        return val.key === type;
      })[0];
    });
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
      sliderValues[input.key + '_display_value'] = dataMean;
      if (sliderValues[input.key]) {
        sliderValues[input.key].value = dataMean;
        sliderValues[input.key + '_value'] = dataMean / (sliderValues[input.key].max + sliderValues[input.key].min) * 100;
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
      const width = 50 - margin.left - margin.right;
      const height = 35 - margin.top - margin.bottom;

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
        .attr('class', 'table table-responsive')
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
        .style('stroke', '#000')
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
        .style('fill', '#E6E8EF');

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
        .style('stroke', '#7D8F8F')
        .style('pointer-events', 'none');

      brushg.selectAll('#' + containerId + ' rect')
        .attr('height', height);

      brushg.select('rect.extent')
        .style('fill-opacity', '0')
        .style('shape-rendering', 'crispEdges');

      brushg.style('pointer-events', 'none');
      const brushEl = brushg[0][0];
      brushEl.removeAllListeners();

      const self = this;
      function brushstart() {
        svg.classed('selecting-input', true);
      }
      function brushend() {
        // if (d3.event.sourceEvent) {
        //   // source is a MouseEvent
        //   // user is updating the input manually
        //   const node = d3.select(d3.event.sourceEvent.target).node();
        //   const s = jQuery(node).closest('svg');
        //   const id = jQuery(s).attr('id');
        //   // redraw the input plot
        //   if (id) {
        //     _redrawInputPlot.call(self, id);
        //   } else {
        //     console.warn('Cant get input id from:' + node);
        //   }
        // }
        svg.classed('selecting-input', !d3.event.target.empty());
      }
      function _redrawInputPlot(id) {
        const config = this._inputConfig;
        const inputD = config[id];
        // jQuery.event.trigger({
        //   type: 'inputchanged',
        //   input: input
        // });
      }
    });
  }
  createPolicyListChart(policyListData: any, containerId: string, countryList: any) {
    // jQuery(`div#${containerId}`).empty();
    // d3.select(`div#${containerId}`).remove();
    const dkTotArr = [];
    const dWTotCurrencyArr = [];
    const dKTotPercentageArr = [];
    const dWTotPercentageArr = [];
    let allData = [];
    const isPolicyListObject = typeof countryList === 'object' && countryList['type'] === 'policyList';
    const isCountryListObject = typeof countryList === 'object' &&
      (countryList['type'] === 'million' || countryList['type'] === 'percentage');
    const isCountryListCurrencyBased = isCountryListObject && countryList['type'] === 'million';
    const isCountryListPercentageBased = isCountryListObject && countryList['type'] === 'percentage';

    jQuery.each(policyListData, (idx, polData) => {
      dkTotArr.push(polData.dKtot);
      dWTotCurrencyArr.push(polData.dWtot_currency);
      allData.push({
        id: idx,
        dKtot: polData.dKtot,
        dWtot_currency: polData.dWtot_currency
      });
    });
    const aMillion = 1000000;
    let policyList;
    const globalObj = this.getGlobalModelData();
    if (isCountryListObject) {
      const dataClone = [];
      allData.forEach(val => {
        if (!globalObj[val.id]) {
          val.label = val.id + ' AVERAGE';
        } else {
          val.label = globalObj[val.id].name;
        }
      });
      if (allData[0].id !== 'GLOBAL') {
        let regionName;
        const regionList = {};
        for (const key in globalObj) {
          if (globalObj.hasOwnProperty(key) ) {
            if (!regionName && globalObj[key]['group_name'] === allData[0].id) {
              regionName = allData[0].id;
            }
            if (globalObj[key]['group_name'] === regionName && !regionList[key]) {
              regionList[key] = key;
            }
          }
        }
        dataClone.push(allData[0]);
        for (let i = 1; i < allData.length; i++) {
          if (allData[i].id === regionList[allData[i].id]) {
            dataClone.push(allData[i]);
          }
        }
        allData = dataClone;
      }
      if (isCountryListPercentageBased) {
        let macroGDPSum = 0;
        allData.forEach((val, idx) => {
          if (idx > 0) {
            macroGDPSum += globalObj[val.id]['macro_gdp_pc_pp'];
          }
        });
        const macroGDPAvg = macroGDPSum / (allData.length - 1);
        allData[0].dKTotPercentage = Math.round(((allData[0].dKtot / aMillion) * 100) / macroGDPAvg);
        allData[0].dWTotPercentage = Math.round(((allData[0].dWtot_currency / aMillion) * 100) / macroGDPAvg);
        allData.forEach((val, idx) => {
          if (idx > 0) {
            const countryGDP = globalObj[val.id]['macro_gdp_pc_pp'];
            val.dKTotPercentage = Math.round(((val.dKtot / aMillion) * 100) / countryGDP);
            val.dWTotPercentage = Math.round(((val.dWtot_currency / aMillion) * 100) / countryGDP);
            dKTotPercentageArr.push(val.dKTotPercentage);
            dWTotPercentageArr.push(val.dWTotPercentage);
          }
        });
      }
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

    const allValues = isCountryListPercentageBased ? dKTotPercentageArr.concat(dWTotPercentageArr) : dkTotArr.concat(dWTotCurrencyArr);
    let maxValue = d3.max(allValues);
    maxValue = isCountryListPercentageBased ? maxValue : Math.round(maxValue / aMillion);
    const minValue = d3.min(allValues);
    const recalculateChartHeight = () => {
      const region = allData[0].id;
      if (region === 'GLOBAL') {
        return 10500;
      } else if (region === 'Europe & Central Asia') {
        return 3500;
      } else if (region === 'Sub-Saharan Africa') {
        return 3000;
      } else if (region === 'Latin America & Caribbean') {
        return 1700;
      } else if (region === 'East Asia & Pacific') {
        return 1400;
      } else if (region === 'South Asia') {
        return 600;
      } else if (region === 'North America') {
        return 320;
      } else if (region === 'Middle East & North Africa') {
        return 920;
      }
    };
    const w = isCountryListPercentageBased ? 530 : (isPolicyListObject ? 800 : 700);
    const h = isCountryListObject ? recalculateChartHeight() : 1000;
    const margin = {
      left: isCountryListPercentageBased ? 50 : (isPolicyListObject ? 170 : 130),
      right: 60,
      bottom: 50,
      top: 5
    };
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;
    const spaceLblCh = 10;
    const xDomain = [];
    if (minValue > 0) {
      xDomain.push(-5, maxValue);
    } else {
      xDomain.push(0, maxValue);
    }

    const xLane = d3.scale.linear()
      .domain(xDomain).nice()
      .range([0, width - margin.left - spaceLblCh - margin.right]);
    let yDomainList = allData.map(val => val.label);
    const yLane = d3.scale.ordinal()
      .domain(yDomainList)
      .rangeBands([0, height]);

    const xAxis = d3.svg.axis()
      .scale(xLane)
      .orient('bottom');
    const yAxis = d3.svg.axis()
      .scale(yLane)
      .orient('left');
    if (isCountryListPercentageBased) {
      yAxis.tickFormat('');
    }
    const yRightAx = d3.svg.axis()
      .scale(yLane)
      .orient('right');

    const xGridLines = d3.svg.axis()
      .scale(xLane)
      .tickSize(-height, 0, 0)
      .tickFormat('')
      .orient('bottom');
    // Add SVG element
    let laneChart;
    if (isNewChart) {
      laneChart = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    } else {
      laneChart = d3.select(`#${containerId} svg`);
      if (height !== laneChart.attr('height')) {
        laneChart.attr('height', height);
      }
    }

    // Label wrap text function
    const textWrap = (text, txtWidth) => {
      text.each(function() {
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
          return isCountryListPercentageBased ? a.dWTotPercentage - b.dWTotPercentage : a.dWtot_currency - b.dWtot_currency;
        });
      } else if (countryList['barType'] === '2' && countryList['sort'] === 'Ascending') {
        allData.sort((a, b) => {
          return isCountryListPercentageBased ? a.dKTotPercentage - b.dKTotPercentage : a.dKtot - b.dKtot;
        });
      }
      if (countryList['barType'] === '1' && countryList['sort'] === 'Descending') {
        allData.sort((a, b) => {
          return isCountryListPercentageBased ? b.dWTotPercentage - a.dWTotPercentage : b.dWtot_currency - a.dWtot_currency;
        });
      } else if (countryList['barType'] === '2' && countryList['sort'] === 'Descending') {
        allData.sort((a, b) => {
          return isCountryListPercentageBased ? b.dKTotPercentage - a.dKTotPercentage : b.dKtot - a.dKtot;
        });
      }
      if ((countryList['barType'] === '1' || countryList['barType'] === '2') && countryList['sort'] === 'NORMAL') {
        allData = allDataClone;
      }
    }

    const plotChartAxes = (params) => {
      const yLabelPos = isCountryListObject ? -25 : -40;
      if (isNewChart) {
        // Adding lane lines
        laneChart.append('g')
          .call(params.gridLines.x)
          .classed('lanes', true)
          .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ',' + (height - margin.bottom) + ')');
        // Adding X axis
        laneChart.append('g')
          .classed('x-axis', true)
          .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', ' + (height - margin.bottom) + ')')
          .call(params.axis.x);
        // Adding x axis descriptive label
        const xDescLabel = isCountryListPercentageBased ?
          'Percent % of Country GDP' : 'US$, millions per year';
        laneChart.select('.x-axis')
          .append('text')
          .classed('x-axis-lb', true)
          .attr('x', 0)
          .attr('y', 0)
          .style('text-anchor', 'middle')
          .attr('transform', 'translate(' +
            (isCountryListPercentageBased ? width / 2.5 : width / 3) + ', ' + (margin.bottom - spaceLblCh) + ')')
          .text(xDescLabel);
        // Adding y axis labels
        laneChart.append('g')
          .classed('y-axis', true)
          .attr('transform', 'translate(' + margin.left + ', ' + yLabelPos + ')')
          .call(params.axis.y);
        laneChart.select('.y-axis')
          .selectAll('.tick text')
          .call(textWrap, margin.left);
      } else {
        // Update lane lines
        laneChart.selectAll('g.lanes')
          .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ',' + (height - margin.bottom) + ')')
          .call(params.gridLines.x);
        // Update x-axis labels
        laneChart.selectAll('g.x-axis')
          .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', ' + (height - margin.bottom) + ')')
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
          .style('text-anchor', 'middle');
      }
    };

    const plotChart = (params) => {
      // Update domain
      yDomainList = params.data.map(val => val.label);
      // xLane.domain(xDomain).nice();
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
        dataBars  = laneChart.append('g')
          .classed('bar-charts', true);
         // Add right y-position bar labels container
        barLabels = laneChart.append('g')
          .classed('bar-labels', true);
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
        let value: any = Math.round(data / aMillion);
        const aThousand = 1000;
        if (value >= aThousand && value % aThousand !== 0) {
          value = (value / aThousand).toString().replace('.', ',');
        }
        return value;
      };
      eBar
        .selectAll('.empty-bar1')
        .transition()
        .duration(500)
        .ease('bounce')
        .attr('x', (d, i) => {
          return 0;
        })
        .attr('y', (d, i) => {
          return yLane(d.label);
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
        .style('fill', '#485050');
      eBar
        .selectAll('.empty-bar2')
        .transition()
        .duration(500)
        .ease('bounce')
        .attr('x', (d, i) => {
          return 0;
        })
        .attr('y', (d, i) => {
          return yLane(d.label) + barHeight + spaceBars;
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
        .style('fill', '#485050');
      dataBars
        .selectAll('.bar-chart1')
        .transition()
        .duration(500)
        .ease('bounce')
        .attr('x', (d, i) => {
          const data = isCountryListPercentageBased ? d.dWTotPercentage : d.dWtot_currency;
          let from = isCountryListPercentageBased ? data : data / aMillion;
          if (data > 0) {
            from = 0;
          }
          return xLane(from);
        })
        .attr('y', (d, i) => {
          return yLane(d.label);
        })
        .attr('rx', 10)
        .attr('ry', 30)
        .attr('width', (d) => {
          const data = isCountryListPercentageBased ? d.dWTotPercentage : d.dWtot_currency;
          const total = xLane(isCountryListPercentageBased ? data : data / aMillion);
          let fromZero = 0;
          if (data > 0) {
            fromZero = xLane(0);
          }
          return total - fromZero;
        })
        .attr('height', (d, i) => {
          return barHeight;
        })
        .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', 0)')
        .style('fill', '#6DCCDC');
      dataBars
        .selectAll('.bar-chart2')
        .transition()
        .duration(500)
        .ease('bounce')
        .attr('x', (d, i) => {
          let from = isCountryListPercentageBased ? d.dKTotPercentage : d.dKtot;
          if (from > 0) {
            from = 0;
          }
          return xLane(from);
        })
        .attr('y', (d, i) => {
          return yLane(d.label) + barHeight + spaceBars;
        })
        .attr('rx', 10)
        .attr('ry', 30)
        .attr('width', (d) => {
          const data = isCountryListPercentageBased ? d.dKTotPercentage : d.dKtot;
          const total = xLane(isCountryListPercentageBased ? data : data / aMillion);
          let fromZero = 0;
          if (data > 0) {
            fromZero = xLane(0);
          }
          return total - fromZero;
        })
        .attr('height', (d, i) => {
          return barHeight;
        })
        .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', 0)')
        .style('fill', '#C3D700');
      barLabels
        .selectAll('.labels1')
        .transition()
        .duration(500)
        .ease('bounce')
        .attr('x', (d, i) => {
          return width - 50;
        })
        .attr('y', (d, i) => {
          return yLane(d.label) + barHeight - spaceBars;
        })
        .style('fill', '#6DCCDC')
        .text((d) => {
          const data = isCountryListPercentageBased ? d.dWTotPercentage + '%' : '$' + formatNumericData(d.dWtot_currency);
          return data;
        });
      barLabels
        .selectAll('.labels2')
        .transition()
        .duration(500)
        .ease('bounce')
        .attr('x', (d, i) => {
          return width - 50;
        })
        .attr('y', (d, i) => {
          return yLane(d.label) + (barHeight * 2) + spaceBars;
        })
        .style('fill', '#C3D700')
        .text((d) => {
          const data = isCountryListPercentageBased ? d.dKTotPercentage + '%' : '$' + formatNumericData(d.dKtot);
          return data;
        });
    };
    plotChart({
      data: allData,
      axis: {
        x: xAxis,
        y: yAxis
      },
      gridLines: {
          x: xGridLines
      }
    });

  }
  createOutputChart(outputData: any, containerId: string, groupName?: string, isScoreCardPage?: boolean) {
    jQuery(`div#${containerId}`).empty();
    const finalOutput = this.filterOutputDataByGroup(outputData, groupName);
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
        .attr('class', 'col-sm-4')
        .attr('data-output', idx)
        .attr('data-output-title', output.descriptor)
        .style('pointer-events', 'all')
        .on('click', () => {
          // TODO verify if this event will be needed
          const divEl = jQuery(`div#${containerId}`).find('div')[0];
          const chloroplethField = divEl.getAttribute('data-output');
          const chloroplethTitle = divEl.getAttribute('data-output-title');
          // jQuery.event.trigger({
          //   type: 'mapselect',
          //   chloropleth_field: chloroplethField,
          //   chloropleth_title: chloroplethTitle
          // });
        });
      const table = div.append('table')
        .attr('width', '100%')
        .attr('class', 'table table-responsive')
        .attr('id', 'table-' + idx);
      const tr = table.append('tr');
      const td = tr.append('td')
        .attr('width', '100%');
      const svg = td.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        // xmlns="http://www.w3.org/2000/svg"
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
        .style('stroke', '#000')
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
        .style('fill', '#5E6A6A');
      // add placeholder for initial model value
      const initial = svg.append('g')
        .attr('id', 'initial-' + idx)
        .attr('class', 'initial')
        .append('line');
      // Add manually chart styles to be integrated when converting to base64 string
      svg.selectAll('g.initial line')
        .style('fill', 'none')
        .style('stroke', '#2f4f4f')
        .style('stroke-width', '2px')
        .style('opacity', '0.8');

      let infoEl;
      if (!isScoreCardPage) {
        infoEl = tr.append('td')
          .attr('width', '100%');
        infoEl.append('p')
          .attr('class', 'text-results')
          .text(output.descriptor.toUpperCase());
      } else {
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
        .x(x)
        .extent([0, d3.mean(data)])
        // .on('brushstart', brushstart)
        .on('brush', brushmove)
        // .on('brushend', brushend);

      const textFn = () => {
        const isSocioEcoKey = idx === 'resilience' ? ' %' : ' % of GDP per Year';
        const percent = output.number_type === ('percent') ? isSocioEcoKey : '';
        const precision = +output.precision;
        const numericValue = (+brush.extent()[1] * 100).toFixed(precision);
        const value = numericValue + percent;
        this._outputDomains[idx]['chart'][containerId] = numericValue;
        return value;
      };

      if (!isScoreCardPage) {
        infoEl.append('p')
        .attr('class', 'text-results')
        .append('b')
        .attr('class', 'text-number')
        .text(textFn);
      } else {
        infoEl.select('div.box-text-results')
          .append('p')
          .attr('class', 'scorecard-text-result')
          .append('b')
          .attr('class', 'text-number')
          .text(textFn);
      }

      // keep a reference to the brush for the output domain
      this._outputDomains[idx].brush = brush;
      this._outputDomains[idx].x = x;
      this._outputDomains[idx].height = height;

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
        .style('fill', '#666')
        .style('fill-opacity', '0.8')
        .style('stroke-width', '4px')
        .style('stroke', '#C3D700')
        .style('pointer-events', 'none');
      // Add manually chart styles to be integrated when converting to base64 string
      brushg.select('rect.extent')
        .style('fill-opacity', '0')
        .style('shape-rendering', 'crispEdges');

      brushg.selectAll('#' + containerId + ' rect')
        .attr('height', height)
        .style('pointer-events', 'none');
    });
  }
  filterOutputDataByGroup(outputData, groupName: string) {
    if (groupName === 'GLOBAL' || !groupName) {
      return outputData;
    }
    const filteredOutputDomains = jQuery.extend(true, {}, outputData);
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
  filterInputDataByGroup(inputData, groupName?: string) {
    if (groupName === 'GLOBAL' || !groupName) {
      return inputData;
    }
    const filteredInputDomains = jQuery.extend(true, [], inputData);

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
  formatSVGChartBase64Strings(chartId, isFromOutputChart, inChartId?) {
    const id1 = isFromOutputChart ? 'outputs-1' : `${chartId}-1`;
    const id2 = isFromOutputChart ? 'outputs-2' : `${chartId}-2`;
    const chartCtn1 = jQuery(`#${id1}`);
    const chartCtn2 = jQuery(`#${id2}`);
    const chart1 = chartCtn1.find('svg');
    const chart2 = chartCtn2.find('svg');
    const filterFn = (idx, svg) => {
      const id = isFromOutputChart ? chartId : inChartId;
      return svg.id === id;
    };
    const ch1 = chart1.filter(filterFn)[0];
    const ch2 = chart2.filter(filterFn)[0];
    const svgPrefixStr = "data:image/svg+xml;base64,";
    const ch1XMLStr = new XMLSerializer().serializeToString(ch1);
    const ch1Fmt = window.btoa(ch1XMLStr);
    const ch1Str = svgPrefixStr + ch1Fmt;
    const ch2XMLStr = new XMLSerializer().serializeToString(ch2);
    const ch2Fmt = window.btoa(ch2XMLStr);
    const ch2Str = svgPrefixStr + ch2Fmt;
    return {
      chart1: <string> ch1Str,
      chart2: <string> ch2Str
    };
  }
  getGlobalModelData() {
    return this._globalModelData;
  }
  getChartsConf() {
    return {
      'outputs': {
        'risk_to_assets': {
          'descriptor': 'Risk to assets',
          'gradient': ['#f0f9e8', '#08589e'],
          'number_type': 'percent',
          'precision': 3
        },
        'resilience': {
          'descriptor': 'Socio-economic capacity',
          'gradient': ['#990000', '#fef0d9'],
          'number_type': 'percent',
          'precision': 2
        },
        'risk': {
          'descriptor': 'Risk to well-being',
          'gradient': ['#edf8fb', '#6e016b'],
          'number_type': 'percent',
          'precision': 3
        }
      },
      'inputs': ['gamma_SP_cat_info__poor', 'macro_tau_tax', 'macro_borrow_abi', 'macro_prepare_scaleup',
        'macro_T_rebuild_K', 'shew_for_hazard_ratio', 'axfin_cat_info__poor', 'axfin_cat_info__nonpoor',
        'k_cat_info__poor', 'k_cat_info__nonpoor', 'hazard_ratio_flood_poor', 'hazard_ratio_fa__flood',
        'v_cat_info__poor', 'v_cat_info__nonpoor', 'hazard_ratio_fa__earthquake', 'hazard_ratio_fa__tsunami', 'hazard_ratio_fa__wind'
      ],
      'inputTypes' : {
        'inputSoc': ['gamma_SP_cat_info__poor', 'macro_tau_tax', 'macro_borrow_abi', 'macro_prepare_scaleup', 'macro_T_rebuild_K'],
        'inputEco': ['axfin_cat_info__poor', 'axfin_cat_info__nonpoor', 'k_cat_info__poor', 'k_cat_info__nonpoor'],
        'inputVul': ['v_cat_info__poor', 'v_cat_info__nonpoor', 'shew_for_hazard_ratio'],
        'inputExp': ['hazard_ratio_flood_poor', 'hazard_ratio_fa__flood', 'hazard_ratio_fa__earthquake', 'hazard_ratio_fa__tsunami',
          'hazard_ratio_fa__wind']
      },
      'policyList': [
        {'id': '_exp095', 'label': 'Reduce vulnerability of the poor by 5% of their current exposure', 'mapping': 'v_cat_info__poor'},
        {'id': '_exr095', 'label': 'Reduce vulnerability of the rich by 5% of their current exposure', 'mapping': 'v_cat_info__nonpoor'},
        {'id': '_pcinc_p_110', 'label': 'Increase income of the poor by 10%', 'mapping': 'k_cat_info__poor'},
        {'id': '_soc133', 'label': 'Increase social transfers to poor BY one third', 'mapping': 'gamma_SP_cat_info__poor'},
        {'id': '_rec067', 'label': 'Decrease reconstruction time by 1/3', 'mapping': 'macro_T_rebuild_K'},
        {'id': '_ew100', 'label': 'Increase access to early warnings to 100%', 'mapping': 'shew_for_hazard_ratio'},
        {'id': '_vul070p', 'label': 'Decrease vulnerability of poor by 30%', 'mapping': 'v_cat_info__poor'},
        {'id': '_vul070', 'label': 'Reduce vulnerability of the rich by 5% of their current exposure', 'mapping': 'v_cat_info__nonpoor'},
        {'id': 'optionsPDS', 'label': 'Postdisaster support package', 'mapping': 'optionPDS'},
        {'id': 'optionFee', 'label': 'Develop market insurance', 'mapping': 'optionFee'},
        {'id': 'axfin', 'label': 'Universal access to finance', 'mapping': 'axfin'}
      ],
      'policyMetrics': ['dK', 'dKtot', 'dWpc_currency', 'dWtot_currency'],
      'inputs_info': 'inputs_info_wrapper.csv',
      'default_input': 'axfin_p',
      'default_output': 'resilience',
      'default_feature': 'AUS',
      'model_data': 'df_for_wrapper.csv',
      'model_scp_data': 'df_for_wrapper_scp.csv',
      'model_function': 'res_ind_lib.compute_resilience_from_packed_inputs',
      'policy_model_fn': 'res_ind_lib_big.compute_resilience_from_adjusted_inputs_for_pol',
      'pop': 'pop',
      'gdp': 'gdp_pc_pp',
      'map': {
        'width': 500,
        'height': 350
      }
    };
  }
  getCountryGroupData() {
    return this._countryGroupData;
  }
  getInputDataObj() {
    return this._inputConfig;
  }
  getInputData() {
    return this._inputDomains;
  }
  getInputDataObs() {
    return this._inputDataProm$;
  }
  getInputIdChartByType(type: string) {
    const inputTypes = this.getChartsConf().inputTypes;
    return inputTypes[type];
  }
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
    return this.webService.post(url, formData).map((res: Response) => res.json()).catch(this.webService.errorHandler);
  }
  getMetricAllCountriesSinglePolicy(policy) {
    const outputInfo = {};
    const chartConf = this.getChartsConf();
    const outputMetric = chartConf.policyMetrics;
    for (const key  in this._globalModelData) {
      if (this._globalModelData.hasOwnProperty(key)) {
        outputInfo[key] = {};
        outputMetric.forEach(val => {
          outputInfo[key][val] = 0.0;
        });
      }
    }
    const policyList = chartConf.policyList;
    const selectedPol = policyList.map((val, idx) => {
      if (val.id === policy) {
        return idx;
      }
    }).filter(isFinite)[0];
    const policyListData = this._policyInfoObj.data[selectedPol];
    for (const key in this._globalModelData) {
      if (this._globalModelData.hasOwnProperty(key)) {
        for (const key2 in policyListData['id']) {
          if (policyListData['id'].hasOwnProperty(key2) && policyListData['id'][key2] === this._globalModelData[key]['id']) {
            outputMetric.forEach(val => {
              outputInfo[key][val] = policyListData[val][key2];
            });
          }
        }
      }
    }
    return outputInfo;
  }
  getMetricAllPoliciesSingleCountry(countryCode: string) {
    const countryName = this._globalModelData[countryCode]['name'];
    const output = {};
    const chartConf = this.getChartsConf();
    const outputMetric = chartConf.policyMetrics;
    const policyList = chartConf.policyList;
    policyList.forEach((pol) => {
      output[pol.id] = {};
      outputMetric.forEach((met) => {
        output[pol.id][met] = {};
      });
    });
    const policyListData = this._policyInfoObj.data;
    policyListData.forEach((pol, idxP) => {
      jQuery.each(pol, (idx, prop) => {
        if (output[policyList[idxP].id].hasOwnProperty(idx) && prop.hasOwnProperty(countryName)) {
          output[policyList[idxP].id][idx] = prop[countryName];
        }
      });
    });
    return output;
  }
  getOutputData() {
    return this._outputDomains;
  }
  getOutputDataObs() {
    return this._outputDataProm$;
  }
  getOutputDataUIList() {
    return this._outputUIList;
  }
  getOutputList() {
    return this._outputList;
  }
  getPolicyListData() {
    return this._policyInfoObj;
  }
  getRegionalPolicyData() {
    return this._regionalPoliciesInfoObj;
  }
  getScorecardData() {
    const url = SERVER.URL.BASE_SERVER_PY + SERVER.URL.SERVER_SCORECARD_PY;
    const chartConf = this.getChartsConf();
    const policyList = chartConf.policyList;
    const policyListStr = policyList.map((val) => {
      return val.id;
    }).join(', ');
    const socialCol = policyList.filter((val) => {
      return val.id === '_soc133';
    })[0].mapping;
    const formData = new URLSearchParams();
    formData.append('pol_m', chartConf.policy_model_fn);
    formData.append('pol_str_arr', policyListStr);
    formData.append('i_df', chartConf.model_scp_data);
    formData.append('social_col', socialCol);
    this._scoreCardDataObs$ = this.webService.post(url, formData).map((res: Response) => res.json()).catch(this.webService.errorHandler);
  }
  getScoreCardDataObs() {
    return this._scoreCardDataObs$;
  }
  initOutputChartConf() {
    this.setOutputData();
  }
  initScorecardChartConf() {
    this.getScorecardData();
  }
  _inputBrushMoveEv(containerId, input) {
    const me = this;
    return () => {
      const inputId = containerId.indexOf('1') >= 0 ? 'input1' : 'input2';
      const toUpd =  me._inputConfig[input.key][inputId].forUpdate;
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
          .style('fill', '#50C4CF')
          .style('opacity', '1')
          .attr('d', (d) => {
            return toUpd.a(toUpd.kde.bandwidth(d)(selected));
          });
      d3.select('#' + containerId + ' #' + input.key + ' g.resize.e path')
        .attr('d', 'M 0, 0 ' + ' L 0 ' + input.height);
      const span = jQuery('#' + containerId + ' #table-' + input.key + ' span.value');
      span.empty();
      span.html(() => {
        const percent = input.number_type === ('percent' || 'small_percent') ? ' %' : '';
        const persistedBrush = me._inputConfig[input.key][inputId].brush;
        let ext = +persistedBrush.extent()[1];
        if (percent !== '') {
          ext = +persistedBrush.extent()[1] * 100;
          return ext.toFixed(1) + percent;
        }
        return ext.toFixed(3);
      });
    };
  }
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
  setInputData(_globalModelData: any) {
    const url = `${this._baseURL}${this._inputInfoURL}`;
    const promisedData = new Promise((resolve, reject) => {
      d3.csv(url, (err, data: any) => {
        if (err) { reject(err); }
        const inputDomainsArr = [];
        data.forEach((value) => {
          const inputObj = {};
          inputObj['key'] = value.key;
          inputObj['descriptor'] = value.descriptor;
          inputObj['lower'] = +value.lower;
          inputObj['upper'] = +value.upper;
          inputObj['number_type'] = value.number_type;
          inputDomainsArr.push(inputObj);
        });
        this._inputDomains = this._populateInputDomains(inputDomainsArr, _globalModelData);
        resolve(this._inputDomains);
      });
    });
    return promisedData;
    // this._inputDataProm$ = Observable.fromPromise(promisedData);
  }
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
  setPoliciesData(data) {
    this._policyInfoObj = data;
    const chartConf = this.getChartsConf();
    const policyList = chartConf.policyList;
    const policyIds = policyList.map((val) => {
      return val.id;
    });
    policyIds.forEach((val) => {
      this._regionalPoliciesInfoObj[val] = this._calculateRegionalAvgSinglePolicy(val);
    });
  }
  private _sortByKey(array, key) {
    array.sort((a, b) => {
      const x = a[key]; const y = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }
  unsubscribeOutputData() {
    this._outputDataSubs.unsubscribe();
  }
  updateInputCharts(containerId: string, sliderValues: any, selectedId?: string, groupName?: string) {
    const config = this._inputConfig;
    jQuery.each(config, (conf, inpObj) => {
      const ini = d3.select(`#${containerId} svg#` + conf + ' g.initial line');
      const iniEl = ini[0][0];
      if (iniEl) {
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
        sliderValues[conf + '_display_value'] = model[conf];
        sliderValues[conf].value = model[conf];
        sliderValues[conf + '_value'] = model[conf] / (sliderValues[conf].max + sliderValues[conf].min) * 100;
        ini.attr('x1', function(d) {
            return input.x(+model[conf]);
          })
          .attr('y1', 0)
          .attr('x2', function(d) {
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
        brushEl.removeAllListeners();

        d3.selectAll(`#${containerId} g.brush > g.resize.w`).remove();
      }
      // remove existing initial marker
    });
  }
  updateOutputCharts(containerId: string, selectedId?: any, groupName?: string) {
    const domains = this.filterOutputDataByGroup(this._outputDomains, groupName);
    jQuery.each(domains, (idx, outputData) => {
      const ini = d3.select(`#${containerId} svg#${idx} g.initial line`);
      const x = domains[idx].x;
      const height = domains[idx].height;
      let model;
      if (typeof selectedId === 'object') {
        model = selectedId['model'];
      } else if (selectedId === 'global') {
        const data: Array<number> = outputData.domain.sort((a, b) => {
          return a - b;
        });
        const globalData = d3.mean(data);
        model = {};
        model[idx] = globalData;
      } else {
         model = this._globalModelData[selectedId];
      }
      ini.attr('x1', (d) => {
          return x(+model[idx]);
        })
        .attr('y1', 0)
        .attr('x2', (d) => {
          return x(+model[idx]);
        })
        .attr('y2', height);
      // get the input config
      const brush = domains[idx].brush;
      // get the value of the current input from the model
      // and update the brush extent
      const extent = +model[idx];
      brush.extent([0, extent]);
      const output = domains[idx];
      const isSocioEcoKey = idx === 'resilience' ? ' %' : ' % of GDP per Year';
      const percent = output.number_type === ('percent') ? isSocioEcoKey : '';
      const precision = +output.precision;
      const numericValue = (brush.extent()[1] * 100).toFixed(precision);
      const value = numericValue + percent;
      this._outputDomains[idx]['chart'][containerId] = numericValue;
      jQuery(`#${containerId} #${idx} .text-number`).html(value);
      const brushg = d3.selectAll(`#${containerId} svg#${idx} g.brush`);
      brushg.transition()
        .duration(750)
        .call(brush)
        .call(brush.event);
      // remove w resize extent handle
      d3.selectAll(`#${containerId} g.brush > g.resize.w`).remove();
    });
  }
}
