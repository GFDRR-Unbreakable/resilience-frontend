import { Component } from '@angular/core';
import { BaseComponent } from './base.component';
import { Title } from '@angular/platform-browser';

@Component({
  templateUrl: './cookie-policy.component.html'
})
export class CookiePolicyComponent extends BaseComponent {
  constructor(private titleService: Title) {
    super();
    this.titleService.setTitle('Cookie Policy');
  }
}
