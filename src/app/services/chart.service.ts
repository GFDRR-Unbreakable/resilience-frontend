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
  private _baseURL = SERVER.URL.BASE;
  private _outputDataURL = SERVER.URL.OUTPUT_DATA;
  private _outputDomains: any = {};
  private _globalModelData: any = {};
  private _outputDataSubs: Subscription;
  public _outputUIList: Array<any> = [];
  public _outputList: Array<any> = [];
  constructor() { }
  createOutputChart(outputData: any, containerId: string, groupName?: string) {
    // this._outputDataSubs = this._outputDataProm$.subscribe(outputData => {
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
      'inputs': ['axfin_p', 'axfin_r', 'axhealth', 'finance_pre',
        'pe', 'plgp', 'prepare_scaleup', 'pv', 'rating', 'share1',
        'social_p', 'social_r', 'unemp', 'protection', 'fa', 'v'
      ],
      'inputs_info': 'inputs_info.csv',
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
              if (key === 'name' || key === 'id' || key === 'iso3' || key === 'original_country' || key === 'group_name') {
                //
              } else {
                value[key] = +value[key];
              }
              if (this._outputDomains.hasOwnProperty(key)) {
                this._outputDomains[key]['domain'].push(value[key]);
                this._outputDomains[key]['group_name'].push(value['group_name']);
              }
            }
          }
          this._globalModelData[value.iso3] = value;
          this._outputList.push({
            code: value.iso3,
            name: value.name
          });
          this._outputUIList.push(value.name);
        });
        resolve(this._outputDomains);
      });
    });
    this._outputDataProm$ = Observable.fromPromise(promisedData);
  }
  updateOutputCharts(containerId: string, selectedId?: string) {
    const domains = this._outputDomains;
    jQuery.each(domains, (idx, outputData) => {
      const ini = d3.select(`#${containerId} svg#${idx} g.initial line`);
      const x = domains[idx].x;
      const height = domains[idx].height;
      let model;
      if (selectedId) {
        model = this._globalModelData[selectedId];
      } else {
        const data: Array<number> = outputData.domain.sort((a, b) => {
          return a - b;
        });
        const globalData = d3.mean(data);
        model = {};
        model[idx] = globalData;
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
  unsubscribeOutputData() {
    this._outputDataSubs.unsubscribe();
  }
}
