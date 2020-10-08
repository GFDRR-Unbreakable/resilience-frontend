/**
 * Created by joel on 7/20/17.
 */
/**
 * Constant variable which saves server default data configuration like Server Urls and endpoints.
 */
export const SERVER = {
  URL: {
    // Local backend endpoints
    // BASE_SERVER: 'http://localhost:9090/',
    // Dev backend endpoints
    // BASE_SERVER: 'http://18.191.153.87:9090/',
    // Prod backend endpoints
    BASE_SERVER: 'http://localhost:9090/',
    // Local python endpoints
    // BASE_SERVER_PY: 'http://gfdrr-py.local/',
    // Dev python endpoints
    // BASE_SERVER_PY: 'http://18.191.153.87:9091/',
    // Prod python endpoints
    BASE_SERVER_PY: 'https://unbreakable.gfdrr.org:9091/',
    SERVER_API: 'api/',
    SERVER_DOWNLOADPDF: 'pdf',
    SERVER_DOWNLOADSCPDF: 'sc_pdf',
    SERVER_DOWNLOADCSV: 'csv',
    // SERVER_PYDATA: 'data/',
    SERVER_INPUT_PY: 'model_adapter.py',
    SERVER_SCORECARD_PY: 'model_scorecard_adapter.py',
    // OUTPUT_DATA: 'output_data'
    BASE: '/assets/data/',
    AXFIN_DATA: 'axfin.csv',
    FAP_DATA: 'fap.csv',
    FAR_DATA: 'far.csv',
    KP_DATA: 'kp.csv',
    PDS_DATA: 'PDSpackage.csv',
    PROP_DATA: 'prop_nonpoor.csv',
    SHEW_DATA: 'shew.csv',
    SOCIAL_DATA: 'social_p.csv',
    TK_DATA: 'T_rebuild_K.csv',
    VP_DATA: 'vp.csv',
    VR_DATA: 'vr.csv',
    INPUT_MODEL: 'model_adapter.py',
    OUTPUT_DATA: 'all_countries_data.csv',
    INPUTS_INFO: 'inputs_info_wrapper.csv'
  }
};
