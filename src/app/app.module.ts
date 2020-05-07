import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule, RequestOptions, XHRBackend} from '@angular/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MdSliderModule} from '@angular/material';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import 'hammerjs';

import {AppComponent} from './app.component';
import {NavbarComponent} from './components/navbar/navbar.component';
import {AboutComponent} from './components/about/about.component';
import {ViewerComponent} from './components/viewer/viewer.component';
import {TechnicalmapComponent} from './components/technicalmap/technicalmap.component';
import {ScorecardComponent} from './components/scorecard/scorecard.component';
import {ContactComponent} from './components/contact/contact.component';
import {SpecificpolicymeasureComponent} from './components/specificpolicymeasure/specificpolicymeasure.component';
import {PolicyprioritylistComponent} from './components/policyprioritylist/policyprioritylist.component';
import {FooterComponent} from './components/footer/footer.component';
import {LoadingMaskComponent} from './components/loadingmask/loadingmask.component';
import {LandingPageComponent} from './components/landing/landingpage.component';

import {routing} from './app.routes';
import {store} from './app.store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {MapService} from './services/map.service';
import {ChartService} from './services/chart.service';
import {WebService} from './services/web.service';
import {LoadingMaskService} from './services/loadingmask.service';

export function httpServiceFactory(backend: XHRBackend, defaultOptions: RequestOptions, loadingMaskService: LoadingMaskService) {
  return new WebService(backend, defaultOptions, loadingMaskService);
}

import {FileService} from './services/files.service';
import {ScatterGaugeComponent} from './components/scatter-gauge/scatter-gauge.component';
import {GaugeComponent} from './components/gauge/gauge.component';
import {SwitchComponent} from './components/switch/switch.component';
import {GaugeDisplayComponent} from './components/gauge-display/gauge-display.component';
import {IndicatorTabsComponent} from './components/indicator-tabs/indicator-tabs.component';
import {PolicyListChartComponent} from './components/policy-list-chart/policy-list-chart.component';
import {AnalyticalToolComponent} from './components/analytical-tool/analytical-tool.component';
import {CalloutComponent} from './components/callout/callout.component';
import {SliderTabsComponent} from './components/slider-tabs/slider-tabs.component';
import {PrintComponent} from './components/print/print.component';
import {SpecificPolicyListChartComponent} from './components/specific-policy-list-chart/specific-policy-list-chart.component';

import smartquotes from 'smartquotes';
import { DisclaimerComponent } from './components/disclaimer/disclaimer.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    AboutComponent,
    ViewerComponent,
    TechnicalmapComponent,
    ScorecardComponent,
    ContactComponent,
    SpecificpolicymeasureComponent,
    PolicyprioritylistComponent,
    FooterComponent,
    LoadingMaskComponent,
    LandingPageComponent,
    ScatterGaugeComponent,
    GaugeComponent,
    SwitchComponent,
    GaugeDisplayComponent,
    IndicatorTabsComponent,
    PolicyListChartComponent,
    AnalyticalToolComponent,
    CalloutComponent,
    SliderTabsComponent,
    PrintComponent,
    SpecificPolicyListChartComponent,
    DisclaimerComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgbModule.forRoot(),
    BrowserAnimationsModule,
    MdSliderModule,
    routing,
    store,
    StoreDevtoolsModule.instrumentOnlyWithExtension({
      maxAge: 5
    })
  ],
  providers: [
    LoadingMaskService,
    {
      provide: WebService,
      useFactory: httpServiceFactory,
      deps: [XHRBackend, RequestOptions, LoadingMaskService]
    },
    MapService,
    ChartService,
    FileService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    smartquotes().listen();
  }
}
