import { Component } from '@angular/core';
import { NgcCookieConsentService } from 'ngx-cookieconsent';

@Component({
  selector: 'app-gdpr-banner',
  templateUrl: './gdpr-banner.component.html'
})
export class GdprBannerComponent {
  constructor(private ccService: NgcCookieConsentService) {
  }
}

