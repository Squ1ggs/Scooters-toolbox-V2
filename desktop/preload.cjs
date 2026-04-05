const { contextBridge } = require('electron');
const remoteConfig = require('./remote-config.cjs');

contextBridge.exposeInMainWorld('STX_DESKTOP', {
  siteBaseUrl: remoteConfig.siteBaseUrl
});
