sed -i 's/registerType: '\''autoUpdate'\'',/registerType: '\''autoUpdate'\'',\n        workbox: {\n          maximumFileSizeToCacheInBytes: 5000000\n        },/g' vite.config.ts
