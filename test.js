const tape = require('tape')
const SQL = require('./')

tape('createDatabase()', async function (t) {
  const builder = new SQL()

  const output = builder.createDatabase('myapp')
  t.deepEqual(output, ['CREATE DATABASE IF NOT EXISTS `myapp`'])

  const output2 = builder.createDatabase('myapp', { charset: 'utf8' })
  t.deepEqual(output2, ['CREATE DATABASE IF NOT EXISTS `myapp` DEFAULT CHARACTER SET utf8'])

  const output3 = builder.createDatabase('myapp', { collate: 'utf8mb4_general_ci' })
  t.deepEqual(output3, ['CREATE DATABASE IF NOT EXISTS `myapp` COLLATE utf8mb4_general_ci'])

  const output4 = builder.createDatabase('myapp', { charset: 'utf8', collate: 'utf8mb4_general_ci' })
  t.deepEqual(output4, ['CREATE DATABASE IF NOT EXISTS `myapp` DEFAULT CHARACTER SET utf8 COLLATE utf8mb4_general_ci'])
})

tape('createDatabase() with options', async function (t) {
  const builder = new SQL({ charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' })

  const output = builder.createDatabase('myapp')
  t.deepEqual(output, ['CREATE DATABASE IF NOT EXISTS `myapp` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'])

  const output2 = builder.createDatabase('myapp', { charset: 'utf8' })
  t.deepEqual(output2, ['CREATE DATABASE IF NOT EXISTS `myapp` DEFAULT CHARACTER SET utf8 COLLATE utf8mb4_unicode_ci'])

  const output3 = builder.createDatabase('myapp', { collate: 'utf8mb4_general_ci' })
  t.deepEqual(output3, ['CREATE DATABASE IF NOT EXISTS `myapp` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci'])

  const output4 = builder.createDatabase('myapp', { charset: 'utf8', collate: 'utf8mb4_general_ci' })
  t.deepEqual(output4, ['CREATE DATABASE IF NOT EXISTS `myapp` DEFAULT CHARACTER SET utf8 COLLATE utf8mb4_general_ci'])
})

tape('dropDatabase()', async function (t) {
  const builder = new SQL()

  const [sql] = builder.dropDatabase('myapp')
  t.deepEqual(sql, 'DROP DATABASE IF EXISTS `myapp`')
})

/*
tape('createTable()', async function (t) {
  const builder = new SQL()

})

tape('dropTable()', async function (t) {
  const builder = new SQL()

  const [sql] = builder.dropTable('users')
  t.deepEqual(sql, 'DROP TABLE IF EXISTS `users`')
})
*/

tape('insert()', async function (t) {
  const builder = new SQL()

  const output = builder.insert('users', { username: 'joe', password: '123' })
  t.deepEqual(output, ['INSERT INTO `users` (`username`, `password`) VALUES (?, ?)', ['joe', '123']])

  const output2 = builder.insert('users', { username: 'joe', password: '123' }, { ignore: true })
  t.deepEqual(output2, ['INSERT OR IGNORE INTO `users` (`username`, `password`) VALUES (?, ?)', ['joe', '123']])
})

tape('select()', async function (t) {
  const builder = new SQL()

  const output = builder.select('users')
  t.deepEqual(output, ['SELECT * FROM `users`', []])

  const output2 = builder.select('users', ['username'])
  t.deepEqual(output2, ['SELECT `username` FROM `users`', []])

  const output3 = builder.select('users', ['username'], 'LIMIT 1')
  t.deepEqual(output3, ['SELECT `username` FROM `users` LIMIT 1', []])

  const output4 = builder.select('users', ['password'], 'username = ?', 'joe')
  t.deepEqual(output4, ['SELECT `password` FROM `users` WHERE username = ?', ['joe']])

  const output5 = builder.select('users', ['*'], 'ORDER BY username ASC')
  t.deepEqual(output5, ['SELECT * FROM `users` ORDER BY username ASC', []])

  const output6 = builder.select('users', ['*'], 'ORDER BY username ASC LIMIT 1')
  t.deepEqual(output6, ['SELECT * FROM `users` ORDER BY username ASC LIMIT 1', []])

  const output7 = builder.select('users', ['*'], 'username = ? ORDER BY username ASC LIMIT 2', 'joe')
  t.deepEqual(output7, ['SELECT * FROM `users` WHERE username = ? ORDER BY username ASC LIMIT 2', ['joe']])

  const output8 = builder.select('users', ['*'], 'username = ?', 'random-username')
  t.deepEqual(output8, ['SELECT * FROM `users` WHERE username = ?', ['random-username']])

  const output9 = builder.select('users', ['*'], 'username LIKE ?', 'b%')
  t.deepEqual(output9, ['SELECT * FROM `users` WHERE username LIKE ?', ['b%']])
})

tape('selectOne()', async function (t) {
  const builder = new SQL()

  const output = builder.selectOne('users', ['*'], 'username = ?', 'joe')
  t.deepEqual(output, ['SELECT * FROM `users` WHERE username = ? LIMIT 1', ['joe']])

  const output2 = builder.selectOne('users', ['*'], 'ORDER BY username ASC')
  t.deepEqual(output2, ['SELECT * FROM `users` ORDER BY username ASC LIMIT 1', []])

  const output3 = builder.selectOne('users', ['*'], 'username = ? ORDER BY username ASC', 'joe')
  t.deepEqual(output3, ['SELECT * FROM `users` WHERE username = ? ORDER BY username ASC LIMIT 1', ['joe']])

  const output4 = builder.selectOne('users', ['*'], 'username = ?', 'random-username')
  t.deepEqual(output4, ['SELECT * FROM `users` WHERE username = ? LIMIT 1', ['random-username']])
})

tape('exists()', async function (t) {
  const builder = new SQL()

  const output = builder.exists('users', 'username = ?', 'joe')
  t.deepEqual(output, ['SELECT EXISTS(SELECT 1 FROM `users` WHERE username = ? LIMIT 1)', ['joe']])
})

tape('count()', async function (t) {
  const builder = new SQL()

  const output = builder.count('users')
  t.deepEqual(output, ['SELECT COUNT(1) FROM `users`', []])

  const output2 = builder.count('users', 'username = ?', 'joe')
  t.deepEqual(output2, ['SELECT COUNT(1) FROM `users` WHERE username = ?', ['joe']])
})

tape('update()', async function (t) {
  const builder = new SQL()

  const output = builder.update('users', { username: 'alice' })
  t.deepEqual(output, ['UPDATE `users` SET `username` = ?', ['alice']])

  const output2 = builder.update('users', { username: 'alice' }, 'LIMIT 1')
  t.deepEqual(output2, ['UPDATE `users` SET `username` = ? LIMIT 1', ['alice']])

  const output3 = builder.update('users', { username: 'alice' }, 'username = ?', 'bob')
  t.deepEqual(output3, ['UPDATE `users` SET `username` = ? WHERE username = ?', ['alice', 'bob']])
})

tape('update() with arithmetic', async function (t) {
  const builder = new SQL()

  const output = builder.update('users', [{ count: 'count + ?' }, 1], 'username = ?', 'bob')
  t.deepEqual(output, ['UPDATE `users` SET `count` = count + ? WHERE username = ?', [1, 'bob']])
})

tape('delete()', async function (t) {
  const builder = new SQL()

  const output = builder.delete('users')
  t.deepEqual(output, ['DELETE FROM `users`', []])

  const output2 = builder.delete('users', 'LIMIT 1')
  t.deepEqual(output2, ['DELETE FROM `users` LIMIT 1', []])

  const output3 = builder.delete('users', 'username = ?', 'bob')
  t.deepEqual(output3, ['DELETE FROM `users` WHERE username = ?', ['bob']])
})
