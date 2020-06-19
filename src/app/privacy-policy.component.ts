import { Component } from '@angular/core';
import { BaseComponent } from './base.component';
import { Title } from '@angular/platform-browser';

@Component({
  templateUrl: './privacy-policy.component.html'
})
export class PrivacyPolicyComponent extends BaseComponent {
  constructor(private titleService: Title) {
    super();
    this.titleService.setTitle('Privacy Notice');
  }
}
