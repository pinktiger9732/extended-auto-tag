#!/usr/bin/env bash

# Confirm we are in the right directory
if [ ! -r 'config.yml' ]; then
  echo "Install should be run from the stash root directory."
fi

# Create missing plugin directory.
[ ! -d 'plugins' ] && mkdir -p plugins

pushd plugins >/dev/null

curl -qOJL https://github.com/pinktiger9732/extended-auto-tag/releases/download/latest/extended-auto-tag.tar.gz
tar -xaf extended-auto-tag.tar.gz
rm extended-auto-tag.tar.gz

popd >/dev/null

echo "Installation complete!"
echo -e "\nRemember to reload plugins from the Settings > Plugins page.\n"
