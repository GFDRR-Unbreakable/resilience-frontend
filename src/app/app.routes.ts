import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { ScorecardComponent } from './components/scorecard/scorecard.component';
import { SpecificpolicymeasureComponent } from './components/specificpolicymeasure/specificpolicymeasure.component';
import { TechnicalmapComponent } from './components/technicalmap/technicalmap.component';
import { ViewerComponent } from './components/viewer/viewer.component';
import { LandingPageComponent } from './components/landing/landingpage.component';
import {PrivacyPolicyComponent} from "./privacy-policy.component";

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
  },
  {
    path: 'scorecard',
    component: ScorecardComponent
  }, {
    path: 'policytool',
    component: SpecificpolicymeasureComponent
  }, {
    path: 'technicalmap',
    component: TechnicalmapComponent
  }, {
    path: 'countrytool',
    component: ViewerComponent
  },
  {
    path: 'advancedtool',
    component: ViewerComponent
  },
  {
    path: 'privacy-notice',
    component: PrivacyPolicyComponent
  },
];

export const routing = RouterModule.forRoot(appRoutes);
