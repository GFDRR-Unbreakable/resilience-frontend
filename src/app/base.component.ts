import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

export abstract class BaseComponent implements OnDestroy {
  protected subscriptions$: Subscription;
  constructor() {
    this.subscriptions$ = new Subscription();
  }

  ngOnDestroy() {
    this.subscriptions$.unsubscribe();
  }
}
