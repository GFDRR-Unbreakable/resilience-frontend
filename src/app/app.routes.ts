import { Routes, RouterModule } from '@angular/router';
import {AboutComponent} from './components/about/about.component';
import {ContactComponent} from './components/contact/contact.component';
import {PolicyprioritylistComponent} from './components/policyprioritylist/policyprioritylist.component';
import {ScorecardComponent} from './components/scorecard/scorecard.component';
import {SpecificpolicymeasureComponent} from './components/specificpolicymeasure/specificpolicymeasure.component';
import {TechnicalmapComponent} from './components/technicalmap/technicalmap.component';
import {ViewerComponent} from './components/viewer/viewer.component';
import {LandingPageComponent} from './components/landing/landingpage.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
  }, {
    path: 'about',
    component: AboutComponent
  }, {
    path: 'contact',
    component: ContactComponent
  }, {
    path: 'policyprioritylist',
    component: PolicyprioritylistComponent
  }, {
    path: 'scorecard',
    component: ScorecardComponent
  }, {
    path: 'specificpolicymeasure',
    component: SpecificpolicymeasureComponent
  }, {
    path: 'technicalmap',
    component: TechnicalmapComponent
  }, {
    path: 'viewer',
    component: ViewerComponent
  }
];

export const routing = RouterModule.forRoot(appRoutes);
