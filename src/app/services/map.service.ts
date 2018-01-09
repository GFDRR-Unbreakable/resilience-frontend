import { Injectable } from '@angular/core';
import { Map, MapboxOptions } from 'mapbox-gl';
import * as mapboxgl from 'mapbox-gl';
import VectorSource = mapboxgl.VectorSource;

@Injectable()
export class MapService {
  /**
   * Public and private variables are set here to be used along with the Mapbox-gl library.
   */
  public token: String
    = 'pk.eyJ1IjoiZ3NkcG0iLCJhIjoiY2lqbmN5eG9mMDBndHVmbTU5Mmg1djF6MiJ9.QqFCD7tcmccysN8GUClW8w';
  public map: Map;
  private _sourceId = 'dashboard';
  private _layerId = 'all-country';
  private _layerHoverId = 'all-country-hover';
  private _layerFillId = 'all-country-fill';
  private _layerSource = 'WB_Country_Polygons_2017-cn19j7';
  private _sourceMapUrl = 'mapbox://gfdrr-dashboard.3ed32cju';
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
  /**
   * Set mapboxgl accestoken when this service is initialized by a component.
   */
  constructor() {
    (mapboxgl as any).accessToken = this.token;
  }
  /**
   * Appends base-layers on the map chart, these includes the root-layer and hovering-layer.
   */
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
        'fill-color': this.getMapPaintConf('well'),
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
  /**
   * This method listens the UI @event style.load from mapbox-gl library and invokes passed
   * function callback
   * @param {Function} cb - Anonymous custom function to be invoked when this event is happening on the map. 
   */
  addStylesOnMapLoading(cb: Function) {
    this.map.on('style.load', cb);
  }
  /**
   * Appends vector-lines layer to contrast country geometry limitation in its base-layer.
   * @param {Object} sourceParams - Source params to be used in the layer configuration
   * @param {Object} mapParams - Map params to be used in the layer configuration
   */
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
  /**
   * Appends vector-fill layer to contrast country geometry selection in its base-layer.
   * @param {Object} sourceParams - Source params to be used in the layer configuration
   * @param {Object} mapParams - Map params to be used in the layer configuration
   */
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
  /**
   * Modifies layer styles like background-color when layers are being changed according the indicators.
   * @param {Object} params - Style related properties to be set.
   */
  changeLayerStyle(params: any) {
    const styleProp = params.property;
    const layerStyle = this.getMapPaintConf(params.type);
    this.map.setPaintProperty(this._layerId, styleProp, layerStyle);
  }
  /**
   * Modifies Isocode private array according to passed id.
   * @param {Number} id - Id to be pushed or popped from the Isocode private array.
   */
  changeIsoCodeFilter(id?) {
    const arr = this._isoCodesArr;
    if (id) {
      const arrIndexId = arr.indexOf(id) >= 0 ? arr.indexOf(id) : -1;
      if (arrIndexId >= 0) {
        arr.splice(arrIndexId, 1);
      } else {
        if (arr.length >= this._MAX_COUNTRIES_SELECTED) {
          arr.shift();
        }
        arr.push(id);
      }
    } else {
      this._isoCodesArr = [];
    }
  }
  /**
   * Plots a map chart given a mapId passed as argument.
   * @param {String} mapId - HTML container Id which map chart will be plotted on the page. 
   */
  createMap(mapId: string) {
    this.map = new Map({
      container: mapId,
      preserveDrawingBuffer: true,
      style: 'mapbox://styles/gsdpm/cir6ljf470006bsmehhstmxeh',
      center: [10, 35],
      zoom: 0.55,
      maxZoom: 4.6,
      maxBounds: [[-180, -80], [180, 80]]
    });
  }
  /**
   * Returns the mapbox-gl created map configuration object.
   */
  getMap() {
    return this.map;
  }
  /**
   * Returns style configuration for selected-indicator (basemap) layer.
   * @param {String} type - Indicator name
   */
  getMapPaintConf(type: string) {
    return this._getViewerStyleConf[type];
  }
  /**
   * Returns style configuration for selected-indicator legend UI component.
   * @param {String} type - Indicator name
   */
  getMapLegendConf(type: string) {
    return this._getViewerMapLegendConf[type];
  }
  /**
   * Merges new Vector-fill object params with default ones and returns them into another object
   * @param {Object} sourceParams - Source params to be used in the layer configuration
   * @param {Object} mapParams - Map params to be used in the layer configuration
   */
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
  /**
   * Merges new Vector-lines object params with default ones and returns them into another object
   * @param {Object} sourceParams - Source params to be used in the layer configuration
   * @param {Object} mapParams - Map params to be used in the layer configuration
   */
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
  /**
   * Returns Fill-layer name.
   */
  getViewerFillLayer(): string {
    return this._layerFillId;
  }
  /**
   * Changes map filtering ISO-code for Filled-layer in order to show a country-selection-like functionality on the map.
   * @param {String} isoCode - Country Iso-code 
   */
  setMapFilterByISOCode(isoCode) {
    const defaultArr = ['in', 'ISO_Code'];
    this.changeIsoCodeFilter(isoCode);
    this.map.setFilter(this._layerHoverId, [...defaultArr, ...this._isoCodesArr]);
  }
  /**
   * Changes map filtering ISO-code for existing and non-existing countries in order to
   * show a country-selection-like functionality on the map. 
   * @param {Array[String]} isoCodes - Set of country iso-codes.
   */
  setMapFilterByISOCodes(isoCodes) {
    const defaultArr = ['in', 'ISO_Code', 'XXX'];
    this.map.setFilter(this._layerId, [...defaultArr, ...isoCodes]);
    this.map.setFilter(this._layerFillId, [...defaultArr, ...isoCodes]);
  }
  /**
   * This method listens @event click from the mapbox-gl map chart and invokes passed
   * function callback
   * @param {Function} cb - Anonymous custom function to be invoked when this event is happening on the map.
   */
  setClickFnMapEvent(cb: Function) {
    this.map.on('click', cb);
  }
  /**
   * This method listens @event mousemove from the mapbox-gl map chart and invokes passed
   * function callback
   * @param {Function} cb - Anonymous custom function to be invoked when this event is happening on the map.
   */
  setHoverFnMapEvent(cb: Function) {
    this.map.on('mousemove', cb);
  }
}
