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
  private _layerSource = 'CountryPolygons2017';
  private _sourceMapUrl = 'mapbox://gfdrr-dashboard.92jlkcug';
  private _MAX_COUNTRIES_SELECTED = 2;
  private _isoCodesArr = [];
  private _getViewerStyleConf = {
    asset: {
      property: '1_Assets',
      stops: [
        [0.00005, '#f1fbd5'],
        [0.00186, '#e4f9aa'],
        [0.00267, '#c3dd89'],
        [0.00506, '#8b9d61'],
        [0.00869, '#5c6642']
      ]
    },
    socio: {
      property: '2_SocEcon',
      stops: [
        [0, '#faddcd'],
        [0.21, '#f5b79a'],
        [0.41, '#f89e6c'],
        [0.61, '#b8754e'],
        [0.81, '#784d35']
      ]
    },
    well: {
      property: '3_WeBeing',
      stops: [
        [0.0001, '#c1e7ed'],
        [0.0032, '#82d0d6'],
        [0.0048, '#50c4ce'],
        [0.0077, '#358a91'],
        [0.0151, '#1d4c4f']
      ]
    }
  };
  private _getViewerMapLegendConf = {
    asset: [
      [0, 0.1, '#f1fbd5'],
      [0.1, 0.25, '#e4f9aa'],
      [0.25, 0.5, '#c3dd89'],
      [0.5, 1, '#8b9d61'],
      [1, 5, '#5c6642'],
      ['No data', '', '#f6f6f4']
    ],
    socio: [
      [0, 20, '#faddcd'],
      [20, 40, '#f5b79a'],
      [40, 60, '#f89e6c'],
      [60, 80, '#b8754e'],
      [80, 100, '#784d35'],
      ['No data', '', '#f6f6f4']
    ],
    well: [
      [0, 0.25, '#c1e7ed'],
      [0.25, 0.5, '#82d0d6'],
      [0.5, 0.75, '#50c4ce'],
      [0.75, 1.5, '#358a91'],
      [1.5, 10, '#1d4c4f'],
      ['No data', '', '#f6f6f4']
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
      filter: ['==', 'ISO_Codes', ''],
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
      // style: 'mapbox://styles/gfdrr-dashboard/cj59tfxrb686y2sp97c40f56d',
      style: 'mapbox://styles/gfdrr-dashboard/cj6qvntcf3umq2snyd8se5xir',
      center: [10, 35],
      zoom: 0.55
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
    const defaultArr = ['in', 'ISO_Codes'];
    this.changeIsoCodeFilter(isoCode);
    this.map.setFilter(this._layerHoverId, [...defaultArr, ...this._isoCodesArr]);
  }
  setMapFilterByISOCodes(isoCodes) {
    const defaultArr = ['in', 'ISO_Codes'];
    this.map.setFilter(this._layerId, [...defaultArr, ...isoCodes]);
    this.map.setFilter(this._layerFillId, [...defaultArr, ...isoCodes]);
  }
  // EVENTS
  setClickFnMapEvent(cb: Function) {
    this.map.on('click', cb);
  }
}
