import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

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

import {routing} from './app.routes';
import {store} from './app.store';
import {MapService} from './services/map.service';
import {ChartService} from './services/chart.service';

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
    FooterComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgbModule.forRoot(),
    routing,
    store
  ],
  providers: [
    MapService,
    ChartService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
