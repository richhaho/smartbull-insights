#!/usr/bin/env bash

ALL_DBS='???'
echo $ALL_DBS
echo "choose source db:"
for dbname in $ALL_DBS ; do echo $dbname ; done;

now=$(date +"%m_%d_%Y")
now_s=$(date +"%s")


read -p "->" read_dbname

import_db() {
    local dbname=$1
    local lean=$2

    if [[ $ALL_DBS =~ $dbname ]]; then
        read -p "$dbname pw->" pw

        if [[ -n "${pw/[ ]*\n/}" ]]
        then
            #execute if the the variable is not empty and contains non space characters
            folder_name="$HOME/sbdb/prod_"$dbname"_"$now"_"$now_s
            echo "backing up...."
            local excludeCollections='';
            local restore_cmd=''
            if [[ $lean == 'lean' ]]; then
                excludeCollections='--excludeCollection system.users --excludeCollection emailresults --excludeCollection investors'
                restore_cmd="mongorestore  --db smartbull --quiet $folder_name/$dbname"
            else
                restore_cmd="mongorestore  --db smartbull --drop $folder_name/$dbname"
                excludeCollections='--excludeCollection system.users'
            fi
            mongodump --host lamppost.17.mongolayer.com --port 10035  --authenticationDatabase $dbname --username sb --password $pw --db $dbname $excludeCollections --out $folder_name
            echo "restoring.... ( $restore_cmd )"
            $restore_cmd
            echo "removing users (restart env to recreate properly for dev)"
            mongo localhost/smartbull --eval "db.users.drop()"

            echo "done, imported to local. also, db backup is in $folder_name."
        else
            #execute if the variable is empty or contains only spaces
            echo "skipping $dbname"
        fi

    else
        echo "$dbname is no good"
    fi
}

if [[ $read_dbname == 'all' ]]; then
    for dbname in $ALL_DBS; do import_db $dbname lean ; done
else
    import_db $read_dbname xxx
fi

