import { Injectable } from '@angular/core';

@Injectable()
export class LoadingMaskService {

  public static count: number = 0;

  constructor() { }
  /**
   * Returns the current counter number.
   */
  getLoadingMaskCount(): number {
    return LoadingMaskService.count;
  }
  /**
   * Increments the counter number by one.
   */
  showLoadingMask() {
    LoadingMaskService.count++;
  }
  /**
   * Decrements the counter number by one.
   */
  hideLoadingMask() {
    LoadingMaskService.count--;
  }

}
