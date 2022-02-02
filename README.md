# like-sql

Simple SQL query builder

![](https://img.shields.io/npm/v/like-sql.svg) ![](https://img.shields.io/npm/dt/like-sql.svg) ![](https://img.shields.io/badge/tested_with-tape-e683ff.svg) ![](https://img.shields.io/github/license/LuKks/like-sql.svg)

```javascript
const SQL = require('like-sql')

const builder = new SQL()

// CREATE DATABASE IF NOT EXISTS `myapp`
const [sql] = builder.createDatabase('myapp')

// DROP DATABASE IF EXISTS `myapp`
const [sql] = builder.dropDatabase('myapp')

// INSERT INTO `ips` (`addr`, `hits`) VALUES (?, ?)
const [sql, values] = builder.insert('ips', { addr: req.ip, hits: 0 })

// SELECT `addr`, `hits` FROM `ips` WHERE addr = ?
const [sql, values] = builder.select('ips', ['addr', 'hits'], 'addr = ?', req.ip)

// SELECT `addr`, `hits` FROM `ips` WHERE addr = ? LIMIT 1
const [sql, values] = builder.selectOne('ips', ['addr', 'hits'], 'addr = ?', req.ip)

// SELECT EXISTS(SELECT 1 FROM `ips` WHERE addr = ? LIMIT 1)
const [sql, values] = builder.exists('ips', 'addr = ?', req.ip)

// SELECT COUNT(1) FROM `ips` WHERE addr = ?
const [sql, values] = builder.count('ips', 'addr = ?', req.ip)

// UPDATE `ips` SET `hits` = ? WHERE addr = ? LIMIT 1
const [sql, values] = builder.update('ips', { hits: 1 }, 'addr = ? LIMIT 1', req.ip)

// UPDATE `ips` SET `hits` = hits + ? WHERE addr = ?
const [sql, values] = builder.update('ips', [{ hits: 'hits + ?' }, 1], 'addr = ?', req.ip)

// DELETE FROM `ips` WHERE addr = ? LIMIT 1
const [sql, values] = builder.delete('ips', 'addr = ? LIMIT 1', req.ip)
```

Extends:
```javascript
const SQL = require('like-sql')

class MySQL extends SQL {
  constructor (opts = {}) {
    super(opts)
    this.pool = mysql2.createPool(...)
  }

  async _insert (sql, values) {
    const [res] = await this.pool.execute(sql, values)
    return res.insertId
  }

  async _select (sql, values) {
    ...
  }

  async _selectOne (sql, values) {
    ...
  }

  // ...
}

const db = new MySQL()

const id = await db.insert('ips', { addr: req.ip, hits: 0 })
```

## Install
```
npm i like-sql
```

## Tests
```
npm run test
```

## License
Code released under the [MIT License](https://github.com/LuKks/like-sql/blob/master/LICENSE).
