import path from 'path'

module.exports = {
  file: {
    storeDir: path.join(__dirname, '../../assets'),
    singleLimit: 1024 * 1024 * 2,
    totalLimit: 1024 * 1024 * 20,
    nums: 10,
    exclude: []
    // include:[]
  }
}
