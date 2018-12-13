#!/usr/bin/python
# -*- coding: utf-8 -*-

import csv
import hashlib
from pymongo import MongoClient

def hash_password(password):
    return hashlib.sha256(password).hexdigest()

client = MongoClient('localhost', 27017)
db = client.eaglewebplatform
users = db.users

'''
columns in PersonnelEagle.csv: 
    NOME | COGNOME | EMAIL | TEAM | RUOLO1 | RUOLO2 | GRUPPI | TELEFONO

structure user table in DB:
    username: String,
    name: String,
    surname: String,
    workgroups: [String],
    team: String,
    role: String
'''

with open('PersonnelEagle.csv') as csvfile:
    readCSV = csv.reader(csvfile, delimiter=',')
    for row in readCSV:
        if row[0] == 'NOME':
            continue

        #crea array ruoli
        roles = [] 
        if row[4] != '':
            roles.append({"role": row[4],"of": row[3]})
        if row[5] != '':
            for group in row[6].split(","):
                roles.append({"role": row[5],"of": group})

        #crea array workgroups
        workgroups = []
        if row[6].split(",")[0] != '':
            workgroups += row[6].split(",")

        #create user
        user = {"name": row[0],
            "surname": row[1],
            "username": row[0].replace(" ","").lower() + "-" + row[1].replace(" ","").lower(),
            "password": hash_password(row[0].replace(" ","").lower() + "-" + row[1].replace(" ","").lower()),
            "email": row[2],
            "team": row[3],
            "roles": roles,
            "workgroups": workgroups
            }

        #insert user
        user_id = users.insert_one(user).inserted_id


#ADMIN USER
user = {"name": "admin",
            "surname": "admin",
            "username": "admin",
            "password": hash_password("admin"),
            "email": "admin@admin.it",
            "team": "DT",
            "roles": [{"role": "TL","of": "DT"},{"role": "TM","of": "AERODYNAMICS"}],
            "workgroups": ["AERODYNAMICS"]
            }
user_id = users.insert_one(user).inserted_id