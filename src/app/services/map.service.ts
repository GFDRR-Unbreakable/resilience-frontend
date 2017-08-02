import { Injectable } from '@angular/core';
import { Map, MapboxOptions } from 'mapbox-gl';
import * as mapboxgl from 'mapbox-gl';
import VectorSource = mapboxgl.VectorSource;

@Injectable()
export class MapService {
  public token: String
    = 'pk.eyJ1IjoiZ2ZkcnItZGFzaGJvYXJkIiwiYSI6ImNqMnV3MWppdjAwMXUydmxhaG1weTZzaW8ifQ.drORihaTAcJEGLXFSKjvfQ';
  public map: Map;
  private _sourceId = 'dashboard';
  private _layerId = 'all-country';
  private _layerHoverId = 'all-country-hover';
  private _layerFillId = 'all-country-fill';
  private _layerSource = 'gfdrr2-5qf3ph';
  private _sourceMapUrl = 'mapbox://gfdrr-dashboard.0qa6vcac';
  private _MAX_COUNTRIES_SELECTED = 2;
  private _isoCodesArr = [];
  private _getViewerStyleConf = {
    asset: {
      property: '1_Assets',
      stops: [
        [0, '#deebf7'],
        [0.051, '#9ecae1'],
        [0.11, '#4292c6'],
        [0.151, '#2171b5'],
        [0.21, '#08306b'],
      ]
    },
    socio: {
      property: '2_SocEcon',
      stops: [
        [0, '#deebf7'],
        [0.21, '#9ecae1'],
        [0.41, '#4292c6'],
        [0.61, '#2171b5'],
        [0.81, '#08306b'],
      ]
    },
    well: {
      property: '3_WeBeing',
      stops: [
        [0, '#deebf7'],
        [0.11, '#9ecae1'],
        [0.21, '#4292c6'],
        [0.31, '#2171b5'],
        [0.41, '#08306b'],
      ]
    }
  };
  private _getViewerMapLegendConf = {
    asset: [
      [0, 5, '#deebf7'],
      [5, 10, '#9ecae1'],
      [10, 15, '#4292c6'],
      [15, 20, '#2171b5'],
      [20, 30, '#08306b'],
    ],
    socio: [
      [0, 20, '#deebf7'],
      [20, 40, '#9ecae1'],
      [40, 60, '#4292c6'],
      [60, 80, '#2171b5'],
      [80, 100, '#08306b'],
    ],
    well: [
      [0, 10, '#deebf7'],
      [10, 20, '#9ecae1'],
      [20, 30, '#4292c6'],
      [30, 40, '#2171b5'],
      [40, 50, '#08306b'],
    ]
  };
  constructor() {
    (mapboxgl as any).accessToken = this.token;
  }
  addBasemap() {
    this.map.addSource(this._sourceId, {
      type: 'vector',
      url: this._sourceMapUrl
    } as VectorSource);
    // Country-style-filtered layer
    this.addVectorFillFromUrl({
      id: this._sourceId,
      layer: this._layerSource
    }, {
      layerId: this._layerId,
      paint: {
        'fill-color': this.getMapPaintConf('socio'),
        'fill-opacity': 0.65
      }
    });
    this.addVectorFillFromUrl({
      id: this._sourceId,
      layer: this._layerSource
    }, {
      layerId: this._layerHoverId,
      paint: {
        'fill-color': '#ffe502',
        'fill-opacity': 1,
      },
      filter: ['==', 'ISO_Code', ''],
    });
    // Click-based country layer
    this.addVectorFillFromUrl({
      id: this._sourceId,
      layer: this._layerSource
    }, {
      layerId: this._layerFillId,
      paint: {
        'fill-color': '#FFFFFF',
        'fill-opacity': 0,
      }
    });
  }
  addStylesOnMapLoading(cb: Function) {
    this.map.on('style.load', cb);
  }
  addVectorLinesFromUrl(sourceParams: any, mapParams: any) {
    const params = this.getVectorLinesParams(sourceParams, mapParams);
    sourceParams = params.source;
    mapParams = params.map;
    if (sourceParams.hasSource) {
      this.map.addSource(sourceParams.id, {
        'type': 'vector',
        'url': sourceParams.url
      } as VectorSource) ;
    }
    const layerObj: mapboxgl.Layer = {
      'id': mapParams.layerId,
      'type': 'line',
      'interactive': true,
      'source': sourceParams.id,
      'source-layer': sourceParams.layer,
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-opacity': 1,
        'line-color': mapParams.color,
        'line-width': mapParams.lineWidth
      },
      'minzoom': mapParams.minZoom,
      'maxzoom': mapParams.maxZoom
    };
    if (mapParams.filter) {
      layerObj.filter = mapParams.filter;
    }
    this.map.addLayer(layerObj);
  }
  addVectorFillFromUrl(sourceParams: any, mapParams: any) {
    const params = this.getVectorFillParams(sourceParams, mapParams);
    sourceParams = params.source;
    mapParams = params.map;
    if (sourceParams.hasSource) {
      this.map.addSource(sourceParams.id, {
        'type': 'vector',
        'url': sourceParams.url
      } as VectorSource) ;
    }
    const layerObj: mapboxgl.Layer = {
      'id': mapParams.layerId,
      'type': 'fill',
      'interactive': true,
      'source': sourceParams.id,
      'source-layer': sourceParams.layer,
      'paint': mapParams.paint
    };
    if (mapParams.filter) {
      layerObj.filter = mapParams.filter;
    }
    this.map.addLayer(layerObj);
  }
  changeLayerStyle(params: any) {
    const styleProp = params.property;
    const layerStyle = this.getMapPaintConf(params.type);
    this.map.setPaintProperty(this._layerId, styleProp, layerStyle);
  }
  changeIsoCodeFilter(id?) {
    const arr = this._isoCodesArr;
    if (id) {
      const arrIndexId = arr.indexOf(id) >= 0 ? arr.indexOf(id) : -1;
      if (arrIndexId >= 0) {
        arr.splice(arrIndexId, 1);
      } else if (arr.length < this._MAX_COUNTRIES_SELECTED) {
        arr.push(id);
      }
    } else {
      this._isoCodesArr = [];
    }
  }
  createMap(mapId: string) {
    this.map = new Map({
      container: mapId,
      style: 'mapbox://styles/gfdrr-dashboard/cj59tfxrb686y2sp97c40f56d',
      center: [10, 35],
      minZoom: 1,
      zoom: 1
    });
  }
  getMap() {
    return this.map;
  }
  getMapPaintConf(type: string) {
    return this._getViewerStyleConf[type];
  }
  getMapLegendConf(type: string) {
    return this._getViewerMapLegendConf[type];
  }
  getVectorFillParams(sourceParams, mapParams) {
    const defaultSourceParams: any = {
      id: <string> null,
      layer: <string> null,
      hasSource: <boolean> false,
      url: <string> null
    };
    const defaultMapParams: any = {
      layerId: <string> null,
      filter: <any> null,
      paint: <any> null
    };
    return {
      source: Object.assign({}, defaultSourceParams, sourceParams),
      map: Object.assign({}, defaultMapParams, mapParams)
    };
  }
  getVectorLinesParams(sourceParams, mapParams) {
    const defaultSourceParams = {
      id: <string> null,
      layer: <string> null,
      hasSource: <boolean> false,
      url: <string> null
    };
    const defaultMapParams = {
      layerId: <string> null,
      filter: <any> null,
      maxZoom: <number> 20,
      minZoom: <number> 0,
      color: <string> 'black',
      lineWidth: <number> 1
    };
    return {
      source: Object.assign({}, defaultSourceParams, sourceParams),
      map: Object.assign({}, defaultMapParams, mapParams)
    };
  }
  getViewerFillLayer(): string {
    return this._layerFillId;
  }
  setMapFilterByISOCode(isoCode) {
    const defaultArr = ['in', 'ISO_Code'];
    this.changeIsoCodeFilter(isoCode);
    this.map.setFilter(this._layerHoverId, [...defaultArr, ...this._isoCodesArr]);
  }
  setMapFilterByISOCodes(isoCodes) {
    const defaultArr = ['in', 'ISO_Code'];
    this.map.setFilter(this._layerId, [...defaultArr, ...isoCodes]);
    this.map.setFilter(this._layerFillId, [...defaultArr, ...isoCodes]);
  }
  // EVENTS
  setClickFnMapEvent(cb: Function) {
    this.map.on('click', cb);
  }
}
