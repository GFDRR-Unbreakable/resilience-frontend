import { Injectable, Output } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/observable/fromPromise';
import * as d3 from 'd3/d3.js';
import * as science from 'science/index.js';
import {SERVER} from './server.conf';

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
  private _outputDataSubs: Subscription;
  public _outputUIList: Array<any> = [];
  public _outputList: Array<any> = [];
  constructor() { }
  createInputCharts(inputData: any, containerId: string, groupName?: string) {
    jQuery(`div#${containerId}`).empty();
    const inputTypeTxt = containerId.split('-')[0];
    const inputTypes = this.getInputIdChartByType(inputTypeTxt);
    const filterInputType = inputData.filter(val => {
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
      const width = 80 - margin.left - margin.right;
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
        .attr('width', '60%')
        .style('pointer-events', 'none');

        tr.append('td')
          .attr('width', '40%')
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
      brush.on('brush', this._inputBrushMoveEv(containerId, input, brush));
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
        // .call(brush.event);

      brushg.selectAll('#' + containerId + ' g.resize.w').remove();

      brushg.select('#' + containerId + ' #' + input.key + ' g.resize.e').append('path')
        .attr('d', line);

      brushg.selectAll('#' + containerId + ' rect')
        .attr('height', height);

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
        const input = config[id];
        // jQuery.event.trigger({
        //   type: 'inputchanged',
        //   input: input
        // });
      }
    });
  }
  createOutputChart(outputData: any, containerId: string, groupName?: string) {
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
      const width = 160 - margin.left - margin.right;
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
      const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient-' + idx)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', s1)
        .attr('stop-opacity', 1);
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', s2)
        .attr('stop-opacity', 1);
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
        })
        .style('fill', 'url(#gradient-' + idx + ')');
      // add placeholder for initial model value
      const initial = svg.append('g')
        .attr('id', 'initial-' + idx)
        .attr('class', 'initial')
        .append('line');

      const infoEl = tr.append('td')
        .attr('width', '100%');

      infoEl.append('p')
        .attr('class', 'text-results')
        .text(output.descriptor.toUpperCase());

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

      infoEl.append('p')
        .append('b')
        .attr('class', 'text-number')
        .text(() => {
          const percent = output.number_type === ('percent') ? ' %' : '';
          const precision = +output.precision;
          return (+brush.extent()[1] * 100).toFixed(precision) + percent;
        });

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
    console.log(filteredOutputDomains);
    return filteredOutputDomains;
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
        'macro_T_rebuild_K', 'shew_for_hazard_ratio', 'axfin_cat_info__poor', 'axfin_cat_info__nonpoor', 'k_cat_info__poor', 'k_cat_info__nonpoor',
        'hazard_ratio_flood_poor', 'hazard_ratio_fa__flood', 'v_cat_info__poor', 'v_cat_info__nonpoor', 'hazard_ratio_fa__earthquake', 'hazard_ratio_fa__tsunami', 'hazard_ratio_fa__wind'
      ],
      'inputs_info': 'inputs_info_wrapper.csv',
      'default_input': 'axfin_p',
      'default_output': 'resilience',
      'default_feature': 'AUS',
      'model_data': 'df.csv',
      'model_function': 'res_ind_lib.compute_resiliences',
      'pop': 'pop',
      'gdp': 'gdp_pc_pp',
      'map': {
        'width': 500,
        'height': 350
      }
    };
  }
  getInputDataObs() {
    return this._inputDataProm$;
  }
  getInputIdChartByType(type: string) {
    const inputType = {
      inputSoc: ['gamma_SP_cat_info__poor', 'macro_tau_tax', 'macro_borrow_abi', 'macro_prepare_scaleup'],
      inputEco: ['macro_T_rebuild_K', 'shew_for_hazard_ratio', 'axfin_cat_info__poor', 'axfin_cat_info__nonpoor', 'k_cat_info__poor', 'k_cat_info__nonpoor'],
      inputExp: ['hazard_ratio_flood_poor', 'hazard_ratio_fa__flood', 'v_cat_info__poor', 'v_cat_info__nonpoor', 'hazard_ratio_fa__earthquake', 'hazard_ratio_fa__tsunami', 'hazard_ratio_fa__wind']
    };
    return inputType[type];
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
  initOutputChartConf() {
    this.setOutputData();
  }
  private _inputBrushMoveEv(containerId: string, input: any, brush?: any) {
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
            //obj.group = globalObj['group_name'];
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
  private _sortByKey(array, key) {
    array.sort((a, b) => {
      const x = a[key]; const y = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }
  unsubscribeOutputData() {
    this._outputDataSubs.unsubscribe();
  }
  updateInputCharts(containerId: string, selectedId?: string, groupName?: string) {
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
        brush.on('brush', this._inputBrushMoveEv(containerId, input));
        brushg.transition()
          .duration(750)
          .call(brush)
          .call(brush.event);
        d3.selectAll(`#${containerId} g.brush > g.resize.w`).remove();
      }
      // remove existing initial marker
    });
  }
  updateOutputCharts(containerId: string, selectedId?: string, groupName?: string) {
    const domains = this.filterOutputDataByGroup(this._outputDomains, groupName);
    jQuery.each(domains, (idx, outputData) => {
      const ini = d3.select(`#${containerId} svg#${idx} g.initial line`);
      const x = domains[idx].x;
      const height = domains[idx].height;
      let model;
      if (selectedId === 'global') {
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
