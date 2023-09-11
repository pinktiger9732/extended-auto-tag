#!/usr/bin/env bash

version=v0.0.1

# Confirm we are in the right directory
if [ ! -r 'config.yml' ]; then
  echo "Install should be run from the stash root directory."
fi

# Create missing plugin directory.
[ ! -d 'plugins' ] && mkdir -p plugins

pushd plugins >/dev/null

wget --quiet --no-clobber --progress=bar --show-progress http://code.home-server.lan/pinktiger9732/extended-auto-tag/archive/$version.tar.gz
tar -xaf $version.tar.gz
rm $version.tar.gz

popd >/dev/null

echo "Installation complete!"
echo -e "\nRemember to reload plugins from the Settings > Plugins page.\n"
