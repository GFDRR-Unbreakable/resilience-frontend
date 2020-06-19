import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  templateUrl: './privacy-policy.component.html'
})
export class PrivacyPolicyComponent {
  constructor(private titleService: Title) {
    this.titleService.setTitle('Privacy Notice');
  }
}
