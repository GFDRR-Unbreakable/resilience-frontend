/**
 * The Viewer data interface which determines what type of data will be the
 * text input fields on the Viewer/TechMap pages.
 */
export interface Viewer {
  firstCountry: string;
  secondCountry: string;
};
export interface ViewerGroup {
  firstCountryGroup: string;
  secondCountryGroup: string;
};
/**
 * The ViewerModel data interface which represents all indicators data + country properties
 * to be persisted/modified in the Viewer/TechMap pages.
 */
export interface ViewerModel {
  name: string;
  macro_gdp_pc_pp: number;
  macro_pop: number;
  macro_urbanization_rate: number;
  macro_prepare_scaleup: number;
  macro_borrow_abi: number;
  macro_avg_prod_k: number;
  macro_T_rebuild_K: number;
  macro_pi: number;
  macro_income_elast: number;
  macro_rho: number;
  macro_shareable: number;
  macro_max_increased_spending: number;
  macro_fa_glofris: number;
  macro_protection: number;
  macro_tau_tax: number;
  n_cat_info__nonpoor: number;
  n_cat_info__poor: number;
  c_cat_info__nonpoor: number;
  c_cat_info__poor: number;
  axfin_cat_info__nonpoor: number;
  axfin_cat_info__poor: number;
  gamma_SP_cat_info__nonpoor: number;
  gamma_SP_cat_info__poor: number;
  k_cat_info__nonpoor: number;
  k_cat_info__poor: number;
  fa_cat_info__nonpoor: number;
  fa_cat_info__poor: number;
  v_cat_info__nonpoor: number;
  v_cat_info__poor: number;
  shew_cat_info__nonpoor: number;
  shew_cat_info__poor: number;
  shew_for_hazard_ratio: number;
  hazard_ratio_fa__earthquake: number;
  hazard_ratio_fa__flood: number;
  hazard_ratio_fa__surge: number;
  hazard_ratio_fa__tsunami: number;
  hazard_ratio_fa__wind: number;
  hazard_ratio_flood_poor: number;
  ratio_surge_flood: number;
  risk: number;
  resilience: number;
  risk_to_assets: number;
  id: string;
  group_name: string;
};
