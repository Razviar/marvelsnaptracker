module.exports = {
  packagerConfig: {
    icon: require('path').resolve(__dirname, 'src/statics/icon'),
    appBundleId: 'com.mtgarenapro.marvelsnaptracker',
    appCategoryType: 'public.app-category.entertainment',
    osxSign: {
      hardenedRuntime: true,
      'gatekeeper-assess': false,
      entitlements: 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
      'signature-flags': 'library',
    },
    osxNotarize: {
      appBundleId: 'com.mtgarenapro.marvelsnaptracker',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
    },
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      platforms: ['darwin', 'win32'],
      config: {
        repository: {
          owner: 'Razviar',
          name: 'snaptracker',
        },
        prerelease: false,
        draft: false,
      },
    },
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'marvelsnaptracker',
        iconUrl: 'https://marvelsnap.pro/snap/icon.ico',
        signWithParams: '/sha1 13f0485857babe3350c094db5d424bea8307c0af /t http://timestamp.sectigo.com /fd SHA256',
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        name: 'marvelsnaptracker',
        overwrite: true,
        background: './dmg-background.tiff',
        icon: './src/statics/icon.icns',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        devServer: {hot: false, liveReload: false},
        mainConfig: './webpack.main.config.js',
        devContentSecurityPolicy: "'*'",
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/windows/home/home.html',
              js: './src/windows/home/home.ts',
              preload: {
                js: './src/windows/preload.js',
              },
              name: 'home_window',
            },
            {
              html: './src/windows/overlay/overlay.html',
              js: './src/windows/overlay/overlay.ts',
              preload: {
                js: './src/windows/preload.js',
              },
              name: 'overlay_window',
            },
          ],
        },
      },
    },
  ],
};
