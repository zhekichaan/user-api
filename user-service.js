const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let mongoDBConnectionString = process.env.MONGO_URL;

let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  favourites: [String],
  history: [String],
});

let User;

async function connect() {
  if (mongoose.connection.readyState === 1) {
    // already connected?
    return;
  }
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once("connected", resolve);
      mongoose.connection.once("error", reject);
    });
    return;
  }
  await mongoose.connect(mongoDBConnectionString);
  User = mongoose.models.users || mongoose.model("users", userSchema);
}

module.exports.registerUser = async function (userData) {
  await connect();
  return new Promise(async function (resolve, reject) {
    if (userData.password != userData.password2) {
      reject("Passwords do not match");
    } else {
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash;

          let newUser = new User(userData);

          newUser
            .save()
            .then(() => {
              resolve("User " + userData.userName + " successfully registered");
            })
            .catch((err) => {
              if (err.code == 11000) {
                reject("User Name already taken");
              } else {
                reject("There was an error creating the user: " + err);
              }
            });
        })
        .catch((err) => reject(err));
    }
  });
};

module.exports.checkUser = async function (userData) {
  await connect();
  return new Promise(function (resolve, reject) {
    User.findOne({ userName: userData.userName })
      .exec()
      .then((user) => {
        bcrypt.compare(userData.password, user.password).then((res) => {
          if (res === true) {
            resolve(user);
          } else {
            reject("Incorrect password for user " + userData.userName);
          }
        });
      })
      .catch((err) => {
        reject("Unable to find user " + userData.userName);
      });
  });
};

module.exports.getFavourites = async function (id) {
  await connect();
  return new Promise(function (resolve, reject) {
    User.findById(id)
      .exec()
      .then((user) => {
        resolve(user.favourites);
      })
      .catch((err) => {
        reject(`Unable to get favourites for user with id: ${id}`);
      });
  });
};

module.exports.addFavourite = async function (id, favId) {
  await connect();
  return new Promise(function (resolve, reject) {
    User.findById(id)
      .exec()
      .then((user) => {
        if (user.favourites.length < 50) {
          User.findByIdAndUpdate(
            id,
            { $addToSet: { favourites: favId } },
            { new: true }
          )
            .exec()
            .then((user) => {
              resolve(user.favourites);
            })
            .catch((err) => {
              reject(`Unable to update favourites for user with id: ${id}`);
            });
        } else {
          reject(`Unable to update favourites for user with id: ${id}`);
        }
      });
  });
};

module.exports.removeFavourite = async function (id, favId) {
  await connect();
  return new Promise(function (resolve, reject) {
    User.findByIdAndUpdate(id, { $pull: { favourites: favId } }, { new: true })
      .exec()
      .then((user) => {
        resolve(user.favourites);
      })
      .catch((err) => {
        reject(`Unable to update favourites for user with id: ${id}`);
      });
  });
};

module.exports.getHistory = async function (id) {
  await connect();
  return new Promise(function (resolve, reject) {
    User.findById(id)
      .exec()
      .then((user) => {
        resolve(user.history);
      })
      .catch((err) => {
        reject(`Unable to get history for user with id: ${id}`);
      });
  });
};

module.exports.addHistory = async function (id, historyId) {
  await connect();
  return new Promise(function (resolve, reject) {
    User.findById(id)
      .exec()
      .then((user) => {
        if (user.favourites.length < 50) {
          User.findByIdAndUpdate(
            id,
            { $addToSet: { history: historyId } },
            { new: true }
          )
            .exec()
            .then((user) => {
              resolve(user.history);
            })
            .catch((err) => {
              reject(`Unable to update history for user with id: ${id}`);
            });
        } else {
          reject(`Unable to update history for user with id: ${id}`);
        }
      });
  });
};

module.exports.removeHistory = async function (id, historyId) {
  await connect();
  return new Promise(function (resolve, reject) {
    User.findByIdAndUpdate(id, { $pull: { history: historyId } }, { new: true })
      .exec()
      .then((user) => {
        resolve(user.history);
      })
      .catch((err) => {
        reject(`Unable to update history for user with id: ${id}`);
      });
  });
};
