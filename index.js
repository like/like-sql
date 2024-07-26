class LikeSQL {
  constructor (opts = {}) {
    this.charset = opts.charset
    this.collate = opts.collate
    this.engine = opts.engine
  }

  createDatabase (name, opts = {}) {
    const charset = (opts.charset || this.charset) ? ` DEFAULT CHARACTER SET ${opts.charset || this.charset}` : ''
    const collate = (opts.collate || this.collate) ? ` COLLATE ${opts.collate || this.collate}` : ''

    const sql = `CREATE DATABASE IF NOT EXISTS \`${name}\`${charset}${collate}` // + use placeholder for name

    return this._createDatabase ? this._createDatabase(sql) : [sql]
  }

  dropDatabase (name) {
    const sql = `DROP DATABASE IF EXISTS \`${name}\``

    return this._dropDatabase ? this._dropDatabase(sql) : [sql]
  }

  // + old code for creating table
  createTable (name, columns, options) {
    const database = (this.pool ? this.pool.pool.config.connectionConfig.database : this.connection.connection.config.database)

    // defaults
    let primaryKeys = []
    let { unique, index, engine, increment, charset, collate } = Object.assign({
      unique: {},
      index: {},
      engine: this.engine,
      increment: undefined,
      charset: this.charset,
      collate: this.collate
    }, options)

    // columns
    for (const colName in columns) {
      columns[colName] = LikeSQL.parseColumn(colName, columns[colName], primaryKeys)
    }
    columns = Object.values(columns).join(',\n')

    // primary keys
    if (primaryKeys.length) {
      primaryKeys = primaryKeys.map(colName => '`' + colName + '`').join(', ')
      primaryKeys = `,\n  PRIMARY KEY (${primaryKeys})`
    } else {
      primaryKeys = ''
    }

    // unique
    if (Object.keys(unique).length) {
      unique = LikeSQL.parseIndex('UNIQUE KEY', unique)
      unique = ',\n' + Object.values(unique).join(',\n')
    } else {
      unique = ''
    }

    // index
    if (Object.keys(index).length) {
      index = LikeSQL.parseIndex('INDEX', index)
      index = ',\n' + Object.values(index).join(',\n')
    } else {
      index = ''
    }

    // options
    engine = engine ? (' ENGINE=' + engine) : ''
    increment = increment !== undefined ? (' AUTO_INCREMENT=' + increment) : ''
    charset = charset ? (' CHARSET=' + charset) : ''
    collate = collate ? (' COLLATE=' + collate) : ''

    // create table
    const sql = `CREATE TABLE IF NOT EXISTS \`${database}\`.\`${name}\` (${columns}${primaryKeys}${unique}${index})${engine}${increment}${charset}${collate}`

    return this._createTable ? this._createTable(sql) : [sql]
  }

  dropTable (name) {
    const database = (this.pool ? this.pool.pool.config.connectionConfig.database : this.connection.connection.config.database)

    const sql = `DROP TABLE IF EXISTS \`${database}\`.\`${name}\``

    return this._dropTable ? this._dropTable(sql) : [sql]
  }

  insert (table, data, opts) {
    const ignore = (opts && opts.ignore) ? ' OR IGNORE' : ''
    const cols = Object.keys(data).map(c => '`' + c + '`').join(', ')
    const values = Object.values(data)
    const placeholders = Array(values.length).fill('?').join(', ')

    if (this.type === 'rqlite') {
      for (let i = 0; i < values.length; i++) {
        if (Buffer.isBuffer(values[i])) {
          values[i] = values[i].toString('hex')
        }
      }
    }

    const sql = `INSERT${ignore} INTO \`${table}\` (${cols}) VALUES (${placeholders})`

    return this._insert ? this._insert(sql, values) : [sql, values]
  }

  select (table, cols, find, ...values) {
    if (!cols) cols = ['*']

    cols = cols.map(c => (c === '*') ? c : ('`' + c + '`')).join(', ')
    find = LikeSQL.parseFind(find)

    const sql = `SELECT ${cols} FROM \`${table}\`${find}`

    return this._select ? this._select(sql, values) : [sql, values]
  }

  selectOne (table, cols, find, ...values) {
    if (!cols) cols = ['*']

    cols = cols.map(c => (c === '*') ? c : ('`' + c + '`')).join(', ')
    find = LikeSQL.parseFind(find)

    const sql = `SELECT ${cols} FROM \`${table}\`${find} LIMIT 1`

    return this._selectOne ? this._selectOne(sql, values) : [sql, values]
  }

  exists (table, find, ...values) {
    find = LikeSQL.parseFind(find)

    const sql = `SELECT EXISTS(SELECT 1 FROM \`${table}\`${find} LIMIT 1)`

    return this._exists ? this._exists(sql, values) : [sql, values]
  }

  count (table, find, ...values) {
    find = LikeSQL.parseFind(find)

    const sql = `SELECT COUNT(1) FROM \`${table}\`${find}`

    return this._count ? this._count(sql, values) : [sql, values]
  }

  update (table, data, find, ...values) {
    let set = []
    const arithmetic = Array.isArray(data)
    const dataRef = arithmetic ? data[0] : data
    for (const k in dataRef) {
      set.push('`' + k + '` = ' + (arithmetic ? dataRef[k] : '?'))
    }
    set = set.join(', ')
    find = LikeSQL.parseFind(find)
    values.unshift(...Object.values(arithmetic ? data.slice(1) : data))

    if (this.type === 'rqlite') {
      for (let i = 0; i < values.length; i++) {
        if (Buffer.isBuffer(values[i])) {
          values[i] = values[i].toString('hex')
        }
      }
    }

    const sql = `UPDATE \`${table}\` SET ${set}${find}`

    return this._update ? this._update(sql, values) : [sql, values]
  }

  delete (table, find, ...values) {
    find = LikeSQL.parseFind(find)

    const sql = `DELETE FROM \`${table}\`${find}`

    return this._delete ? this._delete(sql, values) : [sql, values]
  }

  // + old code for parsing column
  static parseColumn (name, value, primaryKeys) {
    // inline, for example { price: 'decimal(11,2) NOT NULL' }
    /*
    if (typeof value === 'string') {
      return `\`${name}\` ${value}` // disabled due complexity detecting primary keys, etc
    }
    */

    // object, for example { price: { type: 'decimal', length: [11, 2], required: true } }
    let { type, length, unsigned, collate, required, defaultt = value.default, increment, primary } = value
    // "default" is a keyword, it can't be a variable

    if (!type) {
      type = 'int'
    }

    if (length) {
      // multi length for DECIMAL(11,2), etc
      if (Array.isArray(length)) {
        // add quotes only on strings, support for ENUM('a', 'b')
        length = length.map(len => typeof len === 'string' ? `'${len}'` : len)
        // join lengths or values
        length = length.join(',')
      }
      length = ' (' + length + ')'
    } else {
      length = ''
    }

    unsigned = unsigned ? ' unsigned' : ''

    collate = collate ? (' COLLATE ' + collate) : ''

    required = required || primary ? ' NOT NULL' : ' NULL'

    if (typeof defaultt !== 'undefined' && !increment) {
      // strings have simple quotes
      if (typeof defaultt === 'string') {
        defaultt = `'${defaultt}'`
      }
      // it's just uppercase for null
      if (defaultt === null) {
        defaultt = 'NULL'
      }
      defaultt = ' DEFAULT ' + defaultt
    } else {
      defaultt = ''
    }

    increment = increment ? ' AUTO_INCREMENT' : ''

    // if, add to primary keys
    primary && primaryKeys.push(name)

    return `  \`${name}\` ${type}${length}${unsigned}${collate}${required}${defaultt}${increment}`
  }

  // + old code for parsing index
  static parseIndex (type, index) {
    for (const key in index) {
      let columns = index[key]

      // for example: ['fullname ASC', 'dni', 'birthdate DESC']
      columns = columns.map(column => {
        const [colName, order] = column.split(' ')
        return `\`${colName}\` ${order || 'ASC'}`
      }).join(', ')

      // INDEX `key1` (`fullname` ASC, `dni` ASC, `birthdate` DESC),
      index[key] = `  ${type} \`${key}\` (${columns})`
    }

    return index
  }

  // parseFind('id = ?') // WHERE id = ?
  // parseFind('LIMIT 1') // LIMIT 1
  static parseFind (find) {
    if (!find) return ''
    const known = ['ORDER BY', 'LIMIT', 'GROUP BY'].some(op => find.indexOf(op) === 0)
    return known ? (' ' + find) : (' WHERE ' + find)
  }
}

module.exports = LikeSQL
