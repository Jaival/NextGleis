const { withAppBuildGradle } = require('expo/config-plugins');

// CMake/ninja on Windows cap object-file paths at ~250 chars. This repo's
// absolute path (deep under a git worktree dir) plus CMake's out-of-tree
// mirroring of node_modules' absolute source paths under .cxx/ blows past
// that limit for react-native-reanimated specifically, causing:
//   ninja: error: manifest 'build.ninja' still dirty after 100 tries
// Redirecting the CMake staging dir to a short, drive-root path removes one
// of the two copies of the long prefix from the generated object paths.
// No-op on non-Windows hosts (EAS cloud builds run on Linux and never hit this).
module.exports = function withShortCxxPath(config) {
  return withAppBuildGradle(config, (config) => {
    if (process.platform !== 'win32') return config;
    if (config.modResults.contents.includes('buildStagingDirectory')) return config;

    config.modResults.contents = config.modResults.contents.replace(
      /android \{\n/,
      'android {\n' +
        '    externalNativeBuild {\n' +
        '        cmake {\n' +
        '            buildStagingDirectory file("C:/rnb/nextgleis")\n' +
        '        }\n' +
        '    }\n',
    );

    return config;
  });
};
