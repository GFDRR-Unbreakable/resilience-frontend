import { Routes, RouterModule } from '@angular/router';
import {AboutComponent} from './components/about/about.component';
import {ContactComponent} from './components/contact/contact.component';
import {ScorecardComponent} from './components/scorecard/scorecard.component';
import {TechnicalmapComponent} from './components/technicalmap/technicalmap.component';
import {ViewerComponent} from './components/viewer/viewer.component';

export const appRoutes: Routes = [
  {
    path: 'about',
    component: AboutComponent
  }, {
    path: 'contact',
    component: ContactComponent
  }, {
    path: 'scorecard',
    component: ScorecardComponent
  }, {
    path: 'technicalmap',
    component: TechnicalmapComponent
  }, {
    path: 'viewer',
    component: ViewerComponent
  }
];

export const routing = RouterModule.forRoot(appRoutes);
