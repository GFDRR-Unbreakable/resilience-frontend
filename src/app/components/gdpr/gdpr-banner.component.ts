import { Component } from '@angular/core';
import { BaseComponent } from '../../base.component';
import {NgcCookieConsentService, NgcStatusChangeEvent} from "ngx-cookieconsent";

@Component({
  selector: 'app-gdpr-banner',
  templateUrl: './gdpr-banner.component.html'
})
export class GdprBannerComponent extends BaseComponent {
  constructor(private ccService: NgcCookieConsentService) {
    super();
  }
}
