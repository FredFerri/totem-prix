var bcrypt = require('bcrypt');

exports.cryptPassword = function(password) {
  return new Promise(function(resolve, reject) {
     console.dir(password);
     bcrypt.genSalt(10, function(err, salt) {
      if (err) 
        reject(err);

      bcrypt.hash(password, salt, function(err, hash) {
        resolve(hash);
      });
    });
  })
};

exports.comparePassword = function(plainPass, hashword) {
  return new Promise(function(resolve, reject) {
    bcrypt.compare(plainPass, hashword, function(err, isPasswordMatch) {
      console.log(plainPass);
      console.log(hashword);
      console.log(isPasswordMatch);
      if (isPasswordMatch) {
        resolve(true);
      }
      else {
        resolve(false);
      }
    });
  })
};