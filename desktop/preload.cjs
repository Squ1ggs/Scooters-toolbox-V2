const { contextBridge } = require('electron');
const remoteConfig = require('./remote-config.cjs');

contextBridge.exposeInMainWorld('STX_DESKTOP', {
  isDesktop: true,
  disableRemoteTelemetry: true,
  disableRemoteSerialization: true,
  siteBaseUrl: remoteConfig.siteBaseUrl
});
