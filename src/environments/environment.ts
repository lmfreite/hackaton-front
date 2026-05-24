export const environment = {
  production: false,
  // En desarrollo las peticiones van a /api/... y el dev server las
  // proxea a api-nexo.stampedev.cloud, evitando el CORS del navegador.
  apiBaseUrl: '',
};
