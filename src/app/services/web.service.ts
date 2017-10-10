import {Injectable} from '@angular/core';
import {ConnectionBackend, Headers, Http, RequestOptions, RequestOptionsArgs, Response} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import {SERVER} from '../services/server.conf';
import {LoadingMaskService} from '../services/loadingmask.service';

/**
 * This service is using the same angular http API code with some code customizations
 */
@Injectable()
export class WebService extends Http {

  constructor(
    backend: ConnectionBackend,
    defaultOptions: RequestOptions,
    private loadingMaskService: LoadingMaskService
  ) {
    super(backend, defaultOptions);
  }

  get(url: string, options?: RequestOptionsArgs): Observable<any> {
    const headerOptions = options || this.getDefaultFormOptions();
    this.interceptRequest();
    return super.get(url, headerOptions)
      .catch(this.onCatch)
      .do((res: Response) => {
        this.onSubscribeSuccess(res);
      }, (error: any) => {
        this.onSubscribeError(error);
      })
      .finally(() => {
        this.onFinally();
      });
  }

  post(url: string, body: any, options?: RequestOptionsArgs): Observable<any> {
    const headerOptions = options || this.getDefaultFormOptions();
    this.interceptRequest();
    return super.post(url, body, headerOptions)
      .catch(this.onCatch)
      .do((res: Response) => {
        this.onSubscribeSuccess(res);
      }, (error: any) => {
        this.onSubscribeError(error);
      })
      .finally(() => {
        this.onFinally();
      });
  }

  put(url: string, body: any, options?: RequestOptionsArgs): Observable<any> {
    const headerOptions = options || this.getDefaultFormOptions();
    this.interceptRequest();
    return super.put(url, body, headerOptions)
      .catch(this.onCatch)
      .do((res: Response) => {
        this.onSubscribeSuccess(res);
      }, (error: any) => {
        this.onSubscribeError(error);
      })
      .finally(() => {
        this.onFinally();
      });
  }
  delete(url: string, options?: RequestOptionsArgs): Observable<any> {
    const headerOptions = options || this.getDefaultFormOptions();
    this.interceptRequest();
    return super.delete(url, headerOptions)
      .catch(this.onCatch)
      .do((res: Response) => {
        this.onSubscribeSuccess(res);
      }, (error: any) => {
        this.onSubscribeError(error);
      })
      .finally(() => {
        this.onFinally();
      });
  }

  private onCatch(error: any, caught: Observable<any>) {
    return Observable.throw(error);
  }

  private onSubscribeSuccess(res: Response): void {}

  private onSubscribeError(res: any): void {}
  /**
   * Whenever HTTP request is finished the UI loading mask is hidden
   */
  private onFinally(): void {
    this.loadingMaskService.hideLoadingMask();
  }

  private getServerURL(url: string) {
    return SERVER.URL.BASE + url;
  }
  /**
   * Returns form-data like Content-Type Header option.
   */
  getJSONOptions() {
    const headers = new Headers({'Content-Type': 'application/json'});
    const options = new RequestOptions({headers: headers});
    return options;
  }
   /**
   * Returns JSON like Content-Type Header option.
   */
  getDefaultFormOptions() {
    const headers = new Headers({'Content-Type': 'application/x-www-form-urlencoded'});
    const options = new RequestOptions({headers: headers});
    return options;
  }
  /**
   * Returns ContentType and Authorization Header options. 
   * @param {String} token - Token to be saved in session storage. 
   */
  getAuthHeaders(token?: string) {
    const sessionToken = window.sessionStorage.getItem('currentToken');
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (token ? token : sessionToken)
    });
    const options = new RequestOptions({ headers: headers });
    return options;
  }
  /**
   * Whenever HTTP request is made a UI loading mask is shown
   */
  interceptRequest() {
    this.loadingMaskService.showLoadingMask();
  }
  errorHandler(err) {
    return Observable.throw(err);
  }

}
