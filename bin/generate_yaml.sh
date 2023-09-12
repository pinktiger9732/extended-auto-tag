#!/usr/bin/env bash

current_version() {
  if [ -v VERSION ]; then
    echo $VERSION
  else
    # The latest tag
    version=$(git tag | head -n 1)
    # What is the next pre number?
    number_file="tmp/$version" 
    if [ -f $number_file ]; then
      # Next number in sequence
      number=$(( $(head -n1 $number_file) + 1 ))
    else
      number=1
    fi
    # Update the number file
    echo $number > $number_file

    echo "${version}-pre${number}"
  fi
}

sed "s/VERSION/$(current_version)/" stubs/config.yml.stub > dist/config.yml
