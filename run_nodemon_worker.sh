#!/usr/bin/env bash

[[ ! $NVM_DIR ]] && export NVM_DIR="/Users/$USER/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm

#for c9
[ -f /home/$USER/set_locale.sh ] && . /home/$USER/set_locale.sh

nvm use 8.11.1
nodemon worker.js -e js,hbs,html
