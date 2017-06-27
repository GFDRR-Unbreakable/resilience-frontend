import { ResilienceFrontendPage } from './app.po';

describe('resilience-frontend App', () => {
  let page: ResilienceFrontendPage;

  beforeEach(() => {
    page = new ResilienceFrontendPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
