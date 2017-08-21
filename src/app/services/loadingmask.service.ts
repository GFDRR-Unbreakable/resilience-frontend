import { Injectable } from '@angular/core';

@Injectable()
export class LoadingMaskService {

  public static count: number = 0;

  constructor() { }
  getLoadingMaskCount(): number {
    return LoadingMaskService.count;
  }
  showLoadingMask() {
    LoadingMaskService.count++;
  }
  hideLoadingMask() {
    LoadingMaskService.count--;
  }

}
