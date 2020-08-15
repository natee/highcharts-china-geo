/**
 * https://github.com/natee/utils
 * promisify.js 把非promise的回调函数A转成promise调用的函数B
 * A必须遵循：1. 回调函数在主函数中的参数位置必须是最后一个；2. 回调函数参数中的第一个参数必须是 error 。
 * @example
 * // 原有的callback调用
 * fs.readFile('test.js', function(err, data) {
 *   if (!err) {
 *     console.log(data);
 *   } else {
 *     console.log(err);
 *   }
 * });
 * 
 * // promisify后
 * var readFileAsync = promisify(fs.readFile);
 * readFileAsync('test.js').then(data => {
 *   console.log(data);
 * }, err => {
 *   console.log(err);
 * });
 */

const promisify = (func) => {
  return function (...args) {
    return new Promise((resolve, reject) => {

      // 第二个参数为原函数的回调函数
      func.apply(null, [...args, (err, data) => {
        return err ? reject(err) : resolve(data)
      }])
     });
  }
}

module.exports = promisify;