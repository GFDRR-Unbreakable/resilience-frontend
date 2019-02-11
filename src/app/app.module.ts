import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {HttpModule, RequestOptions, XHRBackend} from '@angular/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MdSliderModule} from '@angular/material';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import 'hammerjs';

import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AboutComponent } from './components/about/about.component';
import { ViewerComponent } from './components/viewer/viewer.component';
import { TechnicalmapComponent } from './components/technicalmap/technicalmap.component';
import { ScorecardComponent } from './components/scorecard/scorecard.component';
import { ContactComponent } from './components/contact/contact.component';
import { SpecificpolicymeasureComponent } from './components/specificpolicymeasure/specificpolicymeasure.component';
import { PolicyprioritylistComponent } from './components/policyprioritylist/policyprioritylist.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoadingMaskComponent } from './components/loadingmask/loadingmask.component';
import { LandingPageComponent} from './components/landing/landingpage.component';

import {routing} from './app.routes';
import {store} from './app.store';
import {MapService} from './services/map.service';
import {ChartService} from './services/chart.service';
import {WebService} from './services/web.service';
import {LoadingMaskService} from './services/loadingmask.service';
export function httpServiceFactory(backend: XHRBackend, defaultOptions: RequestOptions, loadingMaskService: LoadingMaskService) {
  return new WebService(backend, defaultOptions, loadingMaskService);
}
import {FileService} from './services/files.service';

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
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgbModule.forRoot(),
    BrowserAnimationsModule,
    MdSliderModule,
    routing,
    store
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
export class AppModule { }
