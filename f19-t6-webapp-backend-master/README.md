# f19-t6-webapp-backend

# Install Nodejs
```
1. sudo apt update
2. sudo apt install npm
```
# Install PostgreSQL and pgadmin
```
MAC-OS
1. brew install postgresql
2. pg_ctl -D /usr/local/var/postgres start && brew services start postgresql
3. To check version : postgres -V

4.To enter postgres command line:
  psql postgres


Command to view table 'users' from database 'public' :
  To enter postgres command prompt: psql postgres
  To switch to Database: \c public
  To show tables : SELECT * FROM public.users;

LINUX
```
# Start Node server
```

1. cd ~/f19-t6-webapp-backend/webapp
2. run command --> npm install - to install dependencies
3. run command --> npm start - to start node server
```

