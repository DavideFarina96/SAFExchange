#! /bin/bash

docker exec -i -t db /bin/bash -c 'mongodump -d eaglewebplatform --archive --gzip > dump_$(date +"%d-%m-%y_%H-%M").tar.gz ; exit'
#per fare il restore: mongorestore -d eaglewebplatform --gzip --archive < dump_file.tar.gz

cd ..
git pull
docker-compose build
docker-compose up