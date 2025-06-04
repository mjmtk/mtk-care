#https://mtkcare-backend-abbffge3c9gqcqhr.scm.newzealandnorth-01.azurewebsites.net/webssh/host

#((antenv) ) root@mtkcare-ba-bc9a4eff:/tmp/8dda371cac5577e# sed -i.bak 's/086c146e-0c4a-4bde-a657-30f24290aab0/1130ad2c-9c54-46f2-9302-bc5a2604d7ea/g' apps/users/fixtures/grouprolemapping.json 
#((antenv) ) root@mtkcare-ba-bc9a4eff:/tmp/8dda371cac5577e# python manage.py loaddata apps/users/fixtures/grouprolemapping.json 