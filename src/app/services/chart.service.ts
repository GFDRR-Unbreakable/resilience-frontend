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
        outputMetricAvgInfo[group][`avg_${val}`] = outputMetricAvgInfo[group][`sum_${val}`] / outputMetricAvgInfo[group][`count${val}`];
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
    jQuery.each(filterInputType, (idx, input) => {
      const dataArr = [];
      for (let k = 0; k < input.distribGroupArr.length; k++) {
        dataArr.push(input.distribGroupArr[k]['distribution']);
      }
      const data = dataArr;

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

      // tr.append('td')
      //   .attr('width', '55%')
      //   .append('span')
      //   .attr('class', 'descriptor')
      //   .style('pointer-events', 'all')
      //   .text(input.descriptor);

      // tr.append('td')
      //   .attr('width', '15%')
      //   .append('span')
      //   .attr('class', 'value')
      //   .style('pointer-events', 'none')
        // .text(' ');

      // const td = tr.append('td')
      //   .attr('width', '30%')
      //   .style('pointer-events', 'none');

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

      const mask = svg.append('g')
        .attr('id', 'mask-' + input.key)
        .attr('class', 'mask');

      // add placeholder for initial model value
      const initial = svg.append('g')
        .attr('id', 'initial-' + input.key)
        .attr('class', 'initial')
        .append('line');

      input.forUpdate = {
        b,
        a,
        distribData: data,
        kde
      };

      const brush = d3.svg.brush()
        .x(x)
        .extent([0, d3.mean(data)])
        .on('brushstart', brushstart)
        .on('brushend', brushend);
      const me = this;
      brush.on('brush', me._inputBrushMoveEv.call(me, containerId, input, brush));
      // add the brush to the input config so
      // we can access it later
      input.brush = brush;
      input.x = x;
      input.width = width;
      input.height = height;
      this._inputConfig[input.key] = input;

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
        .attr('d', line);

      brushg.selectAll('#' + containerId + ' rect')
        .attr('height', height);

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
    let allData = [];
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
    let policyList;
    const globalObj = this.getGlobalModelData();
    if (isCountryListObject) {
      allData.forEach(val => {
        val.label = globalObj[val.id].name;
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

    const allValues = dkTotArr.concat(dWTotCurrencyArr);
    let maxValue = d3.max(allValues);
    maxValue = Math.round(maxValue / 1000000);
    const minValue = d3.min(allValues);
    const w = isCountryListPercentageBased ? 550 : 700;
    const h = isCountryListObject ? 10500 : 1000;
    const margin = {
      left: isCountryListPercentageBased ? 50 : 130,
      right: 50,
      bottom: 50,
      top: 5
    };
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;
    const spaceLblCh = 10;
    const xDomain = [];
    if (minValue > 0) {
      xDomain.push(-5, maxValue);
    }

    const xLane = d3.scale.linear()
      .domain(xDomain).nice()
      .range([0, width - margin.left - spaceLblCh - margin.right]);
    let yDomainList = isCountryListObject ? allData.map(val => val.label) : policyList.map(val => val.label);
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
      if (countryList['barType'] === '1' && countryList['sort'] === 'ASC') {
        allData.sort((a, b) => {
          return a.dWtot_currency - b.dWtot_currency;
        });
      } else if (countryList['barType'] === '2' && countryList['sort'] === 'ASC') {
        allData.sort((a, b) => {
          return a.dKtot - b.dKtot;
        });
      }
      if (countryList['barType'] === '1' && countryList['sort'] === 'DESC') {
        allData.sort((a, b) => {
          return b.dWtot_currency - a.dWtot_currency;
        });
      } else if (countryList['barType'] === '2' && countryList['sort'] === 'DESC') {
        allData.sort((a, b) => {
          return b.dKtot - a.dKtot;
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
            (isCountryListPercentageBased ? width / 2 : width / 3) + ', ' + (margin.bottom - spaceLblCh) + ')')
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
      yDomainList = isCountryListObject ? allData.map(val => val.label) : policyList.map(val => val.label);
      xLane.domain(xDomain).nice();
      yLane.domain(yDomainList);
      // Draw axes
      plotChartAxes(params);
      console.log(params.data);
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
        .style('fill', '#E7E9F0');
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
        .style('fill', '#E7E9F0');
      dataBars
        .selectAll('.bar-chart1')
        .transition()
        .duration(500)
        .ease('bounce')
        .attr('x', (d, i) => {
          let from = d.dWtot_currency / 1000000;
          if (d.dWtot_currency > 0) {
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
          let total = xLane(d.dWtot_currency / 1000000);
          let fromZero = 0;
          if (d.dWtot_currency > 0) {
            total = xLane(d.dWtot_currency / 1000000);
            fromZero = xLane(0);
          }
          return total - fromZero;
        })
        .attr('height', (d, i) => {
          return barHeight;
        })
        .attr('transform', 'translate(' + (margin.left + spaceLblCh) + ', 0)')
        .style('fill', '#0CBD8F');
      dataBars
        .selectAll('.bar-chart2')
        .transition()
        .duration(500)
        .ease('bounce')
        .attr('x', (d, i) => {
          let from = d.dKtot;
          if (d.dWtot_currency > 0) {
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
          let total = xLane(d.dKtot / 1000000);
          let fromZero = 0;
          if (d.dKtot > 0) {
            total = xLane(d.dKtot / 1000000);
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
          return width - 40;
        })
        .attr('y', (d, i) => {
          return yLane(d.label) + barHeight - spaceBars;
        })
        .style('fill', '#0CBD8F')
        .text((d) => {
          return Math.round(d.dWtot_currency / 1000000);
        });
      barLabels
        .selectAll('.labels2')
        .transition()
        .duration(500)
        .ease('bounce')
        .attr('x', (d, i) => {
          return width - 40;
        })
        .attr('y', (d, i) => {
          return yLane(d.label) + (barHeight * 2) + spaceBars;
        })
        .style('fill', '#C3D700')
        .text((d) => {
          return Math.round(d.dKtot / 1000000);
        });
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
        .attr('id', idx)
        .append('g')
        .attr('transform',
          'translate(' + margin.left + ',' + margin.top + ')')
        .style('pointer-events', 'none')
        .style('border-bottom', '1px solid lightgrey');
      // const gradient = svg.append('defs')
      //   .append('linearGradient')
      //   .attr('id', 'gradient-' + idx)
      //   .attr('x1', '0%')
      //   .attr('y1', '0%')
      //   .attr('x2', '100%')
      //   .attr('y2', '0%');
      // gradient.append('stop')
      //   .attr('offset', '0%')
      //   .attr('stop-color', s1)
      //   .attr('stop-opacity', 1);
      // gradient.append('stop')
      //   .attr('offset', '100%')
      //   .attr('stop-color', s2)
      //   .attr('stop-opacity', 1);
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
        // .style('fill', 'url(#gradient-' + idx + ')');
      // add placeholder for initial model value
      const initial = svg.append('g')
        .attr('id', 'initial-' + idx)
        .attr('class', 'initial')
        .append('line');

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
        .on('brushstart', brushstart)
        .on('brush', brushmove)
        .on('brushend', brushend);

      const textFn = () => {
        const percent = output.number_type === ('percent') ? ' %' : '';
        const precision = +output.precision;
        return (+brush.extent()[1] * 100).toFixed(precision) + percent;
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

      brushg.select('#' + containerId + ' #' + idx + ' g.resize.e').append('path')
        .attr('d', line)
        .style('pointer-events', 'none');

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
        filteredInputDomains[g]['distribGroupArr'] = [];
      }
    }
    for (const g in inputData) {
      if (inputData.hasOwnProperty(g)) {
        for (let m = 0; m < inputData[g]['distribGroupArr'].length; m++) {
          if (inputData[g]['distribGroupArr'][m]['group'] === groupName) {
            filteredInputDomains[g]['distribGroupArr'].push(inputData[g]['distribGroupArr'][m]);
          }
        }
      }
    }
    return filteredInputDomains;
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
  getInputData() {
    return this._inputDomains;
  }
  getInputDataObs() {
    return this._inputDataProm$;
  }
  getInputIdChartByType(type: string) {
    const inputType = {
      inputSoc: ['gamma_SP_cat_info__poor', 'macro_tau_tax', 'macro_borrow_abi', 'macro_prepare_scaleup', 'macro_T_rebuild_K'],
      inputEco: ['axfin_cat_info__poor', 'axfin_cat_info__nonpoor', 'k_cat_info__poor', 'k_cat_info__nonpoor'],
      inputVul: ['v_cat_info__poor', 'v_cat_info__nonpoor', 'shew_for_hazard_ratio'],
      inputExp: ['hazard_ratio_flood_poor', 'hazard_ratio_fa__flood', 'hazard_ratio_fa__earthquake', 'hazard_ratio_fa__tsunami',
        'hazard_ratio_fa__wind']
    };
    return inputType[type];
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
  _inputBrushMoveEv(containerId, input, brush) {
    return () => {
      if (brush) { input.brush = brush; }
      const toUpd = input.forUpdate;
      jQuery('#' + containerId + ' svg#' + input.key + ' #mask-' + input.key).empty();
      const s = input.brush.extent();
      const clip = toUpd.b(toUpd.distribData, s[1]);
      const selected = toUpd.distribData.slice(0, clip);
      selected.push(s[1]);
      const mask = d3.select(`#${containerId} svg#${input.key} #mask-${input.key}`);
      mask.selectAll('#' + containerId + ' g#mask-' + input.key + '.mask')
        .data([science.stats.bandwidth.nrd0])
        .enter()
        .append('path')
        .attr('d', (d) => {
          return toUpd.a(toUpd.kde.bandwidth(d)(selected));
        });
      d3.select('#' + containerId + ' #' + input.key + ' g.resize.e path')
        .attr('d', 'M 0, 0 ' + ' L 0 ' + input.height);
      const span = jQuery('#' + containerId + ' #table-' + input.key + ' span.value');
      span.empty();
      span.html(() => {
        const percent = input.number_type === ('percent' || 'small_percent') ? ' %' : '';
        let ext = +input.brush.extent()[1];
        if (percent !== '') {
          ext = +input.brush.extent()[1] * 100;
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
        if (selectedId === 'global') {
          const data: Array<number> = [];
          this._sortByKey(inpObj.distribGroupArr, 'distribution');
          inpObj.distribGroupArr.forEach(val => data.push(val.distribution));
          const globalData = d3.mean(data);
          model = {};
          model[conf] = globalData;
        } else {
          model = this._globalModelData[selectedId];
        }
        sliderValues[conf + '_display_value'] = model[conf];
        sliderValues[conf].value = model[conf];
        sliderValues[conf + '_value'] = model[conf] / (sliderValues[conf].max + sliderValues[conf].min) * 100;
        const input = inpObj;
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
        const extent = +model[conf];
        brush.extent([0, extent]);
        const brushg = d3.selectAll(`#${containerId} svg#${conf} g.brush`);
        const me = this;
        brush.on('brush', me._inputBrushMoveEv.call(me, containerId, input, brush));
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
      const percent = output.number_type === ('percent') ? ' %' : '';
      const precision = +output.precision;
      jQuery(`#${containerId} #${idx} .text-number`).html((brush.extent()[1] * 100).toFixed(precision) + percent);
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
