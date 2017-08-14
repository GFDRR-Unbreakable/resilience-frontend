import {Injectable} from '@angular/core';
import {ConnectionBackend, Headers, Http, RequestOptions, RequestOptionsArgs, Response} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import {SERVER} from '../services/server.conf';

@Injectable()
export class WebService extends Http {

  constructor(
    backend: ConnectionBackend,
    defaultOptions: RequestOptions
  ) {
    super(backend, defaultOptions);
  }

  get(url: string, options?: RequestOptionsArgs): Observable<any> {
    const headerOptions = options || this.getDefaultFormOptions();
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

  private onFinally(): void {}

  private getServerURL(url: string) {
    return SERVER.URL.BASE + url;
  }

  getDefaultFormOptions() {
    const headers = new Headers({'Content-Type': 'application/x-www-form-urlencoded'});
    const options = new RequestOptions({headers: headers});
    return options;
  }

  getAuthHeaders(token?: string) {
    const sessionToken = window.sessionStorage.getItem('currentToken');
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (token ? token : sessionToken)
    });
    const options = new RequestOptions({ headers: headers });
    return options;
  }
  errorHandler(err) {
    return Observable.throw(err);
  }

}
