import { Component, OnInit, Input } from '@angular/core';
import {ChartService} from '../../services/chart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-policy-list-chart',
  templateUrl: './policy-list-chart.component.html',
  styleUrls: ['./policy-list-chart.component.css']
})
export class PolicyListChartComponent implements OnInit {
  private getScorecardDataSubs: Subscription;
  private chartCreated: boolean = false;

  chartId = `policy-list-chart-${ (Math.random() + '').replace('.', '') }`;

  @Input() countryName: string = '';
  @Input() type: 'absolute' | 'relative' = 'absolute';

  constructor(private chartService: ChartService) {

  }

  ngOnInit() {
    this.setScorecardChartConf();
  }

  ngOnChanges() {
    if (this.countryName.length) {
      if (this.chartCreated) {
        this.createChart();
      }
    }
  }

  ngOnDestroy() {
    this.getScorecardDataSubs.unsubscribe();
  }
  setScorecardChartConf() {
    this.chartService.initScorecardChartConf();
    this.getScorecardDataSubs = this.chartService.getScoreCardDataObs().subscribe(data => {
      this.chartService.setPoliciesData(data);

      // @TODO: SET COUNTRY BASED ON URL.

      function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
      };

      /*this.policyModel.firstCountry = getUrlParameter('country');
      const fromListFilter = this.countryListComp.filter(
        val => val.name.toLowerCase() === this.policyModel.firstCountry.toLowerCase());
      // console.log(this.countryListComp);
      this._filterCountryByInput(fromListFilter, 0, this.policyModel.firstCountry);
      // console.log("HI", this.policyModel);
      this.store.dispatch({type: PolicyAction.EDIT_POLICY_FIELDS, payload: this.policyModel});*/
      this.createChart()
    });
  }

  createChart() {
    const data = this.chartService
    .getMetricAllPoliciesSingleCountry(this.countryName);

    if (!data) {
      return;
    }
    const opts = {
      isNew: !this.chartCreated,
      chartType: this.type,
      type: 'policyList'
    };
    this.chartCreated = true;
    this.chartService.createPolicyListChart(data, this.chartId, opts);
  }
}
