#!/bin/sh
set -e

mongosh --host localhost -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin <<EOF
use report_migration
db.createUser({
  user: "$MONGO_APP_USERNAME",
  pwd: "$MONGO_APP_PASSWORD",
  roles: [
    {
      role: "readWrite",
      db: "report_migration"
    }
  ]
})
EOF
