# Bun API with MariaDB

A simple Bun API application and MariaDB, containerized with Docker.


## Technology Stack

**Bun Container: FROM oven/bun:1**
- OS Alpine Linux 3.20.6
- Bun: 1.2.18
- MariaDB: 3.4.5

**MariaDB Container: FROM mariadb:lts-ubi9**
- OS Red Hat Enterprise Linux: 9.6 (Plow)
- MariaDB: 11.8.2

**Adminer Container: FROM adminer:5-standalone**
- OS Alpine Linux: 3.22.1
- Adminer: 5.3.0

**Grafana/k6 Container: FROM grafana/k6:1.1.0**
- OS Alpine Linux: 3.22.0
- grafana/k6: 1.1.0


## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/opsnoopop/api_bun_mariadb.git
```

### 2. Navigate to Project Directory
```bash
cd api_bun_mariadb
```

### 3. Start the Application
```bash
docker compose up -d --build
```

### 4. Create table users
```bash
docker exec -i container_mariadb mariadb -u'testuser' -p'testpass' testdb -e "
CREATE TABLE testdb.users (
  user_id INT NOT NULL AUTO_INCREMENT ,
  username VARCHAR(50) NOT NULL ,
  email VARCHAR(100) NOT NULL ,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  PRIMARY KEY (user_id)
) ENGINE = InnoDB;"
```


## API Endpoints

### Health Check
- **URL:** http://localhost:3001/
- **Method:** GET
- **Response:**
```json
{
  "message": "Hello World from Bun"
}
```

### Create user
- **URL:** http://localhost:3001/users
- **Method:** POST
- **Request**
```json
{
  "username":"optest",
  "email":"opsnoopop@hotmail.com"
}
```
- **Response:**
```json
{
  "message":"User created successfully",
  "user_id":1
}
```

### Get user
- **URL:** http://localhost:3001/users/1
- **Method:** GET
- **Response:**
```json
{
  "user_id":1,
  "username":"optest",
  "email":"opsnoopop@hotmail.com"
}
```

## Test Performance by sysbench

### sysbench e.g
```bash
...
oltp_read_write prepare # สร้าง table
oltp_read_write run     # อ่าน เขียน พร้อมกัน
oltp_read_only run      # อ่าน อย่างเดียว
oltp_write_only run     # เขียน อย่างเดียว
oltp_update_index run   # update index
oltp_point_select run   # query แบบเลือก row เดียว
oltp_delete run         # delete rows
oltp_read_write cleanup # ลบ table
```

### sysbench prepare
```bash
docker run \
--name container_ubuntu_tool \
--rm \
-it \
--network global_bun \
opsnoopop/ubuntu-tool:1.0 \
sysbench \
--threads=2 \
--time=10 \
--db-driver="mysql" \
--mysql-host="container_mariadb" \
--mysql-port=3306 \
--mysql-user="testuser" \
--mysql-password="testpass" \
--mysql-db="testdb" \
--tables=10 \
--table-size=10000 \
oltp_read_write prepare
```

### sysbench test
```bash
docker run \
--name container_ubuntu_tool \
--rm \
-it \
--network global_bun \
opsnoopop/ubuntu-tool:1.0 \
sysbench \
--threads=2 \
--time=10 \
--db-driver="mysql" \
--mysql-host="container_mariadb" \
--mysql-port=3306 \
--mysql-user="testuser" \
--mysql-password="testpass" \
--mysql-db="testdb" \
--tables=10 \
--table-size=10000 \
oltp_read_write run
```


## Test Performance by grafana/k6

### grafana/k6 test Health Check
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_bun \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_bun_health_check.js
```

### grafana/k6 test Insert Create user
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_bun \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_bun_create_user.js
```

### grafana/k6 test Select Get user by id
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_bun \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_bun_get_user_by_id.js
```

### check entrypoint grafana/k6
```bash
docker run \
--name container_k6 \
--rm \
-it \
--entrypoint \
/bin/sh grafana/k6:1.1.0
```


## Stop the Application

### Truncate table users
```bash
docker exec -i container_mariadb mariadb -u'testuser' -p'testpass' testdb -e "
Truncate testdb.users;
"
```

### Delete table users
```bash
docker exec -i container_mariadb mariadb -u'testuser' -p'testpass' testdb -e "
DELETE FROM testdb.users;
"
```

### Stop the Application
```bash
docker compose down
```